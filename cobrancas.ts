import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import * as asaas from "../services/asaas-integration";

export const cobrancasRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        mesReferencia: z.string().optional(),
        tipo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.getCobrancas(input);
    }),

  getByAsaasId: protectedProcedure
    .input(z.object({ asaasPaymentId: z.string() }))
    .query(async ({ input }) => {
      return await db.getCobrancaByAsaasId(input.asaasPaymentId);
    }),

  /**
   * Create a cobranca with REAL Asaas integration.
   * Flow:
   * 1. Find/create customer in Asaas using morador data
   * 2. Create payment (PIX or BOLETO) in Asaas
   * 3. Fetch PIX QR Code or Boleto URL
   * 4. Save everything to the local database
   */
  create: protectedProcedure
    .input(
      z.object({
        moradorId: z.number(),
        tipo: z.enum(["PIX", "BOLETO"]),
        mesReferencia: z.string(),
        valor: z.number(),
        vencimento: z.string(),
        descricao: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Get morador data
      const morador = await db.getMoradorById(input.moradorId);
      if (!morador) {
        return { success: false, error: "Morador nao encontrado." };
      }

      // 2. Check if Asaas is configured
      const configured = await asaas.isAsaasConfigured();
      if (!configured) {
        // Fallback: save locally without Asaas (mock mode)
        const localId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await db.createCobranca({
          moradorId: input.moradorId,
          telefone: morador.telefone,
          asaasPaymentId: localId,
          tipo: input.tipo,
          mesReferencia: input.mesReferencia,
          valor: input.valor,
          vencimento: input.vencimento,
          descricao: input.descricao || `Mensalidade ${input.mesReferencia}`,
          status: "PENDING",
        });
        return {
          success: true,
          mode: "local",
          message: "Cobranca criada localmente (Asaas nao configurado).",
          paymentId: localId,
        };
      }

      // 3. Find or create customer in Asaas
      // Validate CPF: must be 11 digits and not all zeros
      const cpfDigits = (morador.cpf || "").replace(/\D/g, "");
      const isValidCpf = cpfDigits.length === 11 && cpfDigits !== "00000000000";
      if (!isValidCpf) {
        return {
          success: false,
          error: `CPF inválido para o morador "${morador.nomeCompleto}". Acesse Configurações > Moradores e atualize o CPF do morador para gerar PIX/Boleto.`,
        };
      }

      const customerResult = await asaas.findOrCreateCustomer({
        name: morador.nomeCompleto,
        cpfCnpj: cpfDigits,
        phone: morador.telefone,
      });

      if (!customerResult.success || !customerResult.customerId) {
        return { success: false, error: customerResult.error || "Erro ao criar cliente no Asaas." };
      }

      // 4. Create payment in Asaas
      const paymentResult = await asaas.createPayment({
        customerId: customerResult.customerId,
        billingType: input.tipo,
        value: input.valor / 100, // Convert from cents to reais
        dueDate: input.vencimento,
        description: input.descricao || `Mensalidade ${input.mesReferencia} - ${morador.nomeCompleto}`,
        externalReference: `${input.moradorId}_${input.mesReferencia}`,
      });

      if (!paymentResult.success || !paymentResult.paymentId) {
        return { success: false, error: paymentResult.error || "Erro ao criar pagamento no Asaas." };
      }

      // 5. Get PIX QR Code or Boleto info
      let pixQrCode: string | null = null;
      let pixCopyPaste: string | null = null;
      let boletoUrl: string | null = null;
      let boletoBarCode: string | null = null;

      // Fetch payment details with PIX/Boleto data using asaas-integration
      try {
        if (input.tipo === "PIX") {
          const pixResult = await asaas.getPixQrCode(paymentResult.paymentId);
          if (!pixResult.success || !pixResult.copyPaste) {
            return { success: false, error: `Falha ao gerar PIX: ${pixResult.error || "QR Code nao disponivel"}` };
          }
          pixQrCode = pixResult.qrCode || null;
          pixCopyPaste = pixResult.copyPaste;
        } else {
          const boletoResult = await asaas.getBoletoInfo(paymentResult.paymentId);
          if (!boletoResult.success || !boletoResult.barCode) {
            return { success: false, error: `Falha ao gerar Boleto: ${boletoResult.error || "Linha digitavel nao disponivel"}` };
          }
          boletoUrl = boletoResult.url || null;
          boletoBarCode = boletoResult.barCode;
        }
      } catch (error: any) {
        console.error(`[CobrancasRouter] Error fetching PIX/Boleto:`, error.message);
        return { success: false, error: `Erro ao buscar dados de pagamento: ${error.message}` };
      }

      // 6. Save to local database with all Asaas data
      await db.createCobranca({
        moradorId: input.moradorId,
        telefone: morador.telefone,
        asaasPaymentId: paymentResult.paymentId,
        tipo: input.tipo,
        mesReferencia: input.mesReferencia,
        valor: input.valor,
        vencimento: input.vencimento,
        descricao: input.descricao || `Mensalidade ${input.mesReferencia}`,
        status: "PENDING",
      });

      // 7. Update the record with PIX/Boleto data
      const dbConn = await getDb();
      if (dbConn) {
        await dbConn.execute(
          sql`UPDATE cobrancas SET 
            pixQrCode = ${pixQrCode},
            pixCopyPaste = ${pixCopyPaste},
            boletoUrl = ${boletoUrl},
            boletoBarCode = ${boletoBarCode},
            asaasCustomerId = ${customerResult.customerId}
          WHERE asaasPaymentId = ${paymentResult.paymentId}`
        );
      }

      return {
        success: true,
        mode: "asaas",
        message: `Cobranca ${input.tipo} criada com sucesso via Asaas!`,
        paymentId: paymentResult.paymentId,
        invoiceUrl: paymentResult.invoiceUrl,
        pixQrCode,
        pixCopyPaste,
        boletoUrl,
        boletoBarCode,
      };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ asaasPaymentId: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      return await db.updateCobrancaStatus(input.asaasPaymentId, input.status);
    }),

  getPorMes: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      return await db.getCobrancasPorMes(input.mesReferencia);
    }),

  /**
   * Get PIX QR Code for a payment (real Asaas or cached)
   */
  getPixQrCode: protectedProcedure
    .input(z.object({ asaasPaymentId: z.string() }))
    .query(async ({ input }) => {
      // First check if we have cached data in DB
      const dbConn = await getDb();
      if (dbConn) {
        const rows = await dbConn.execute(
          sql`SELECT pixQrCode, pixCopyPaste FROM cobrancas WHERE asaasPaymentId = ${input.asaasPaymentId} LIMIT 1`
        );
        const results = (rows as any)[0] as any[];
        if (results && results.length > 0 && results[0].pixQrCode) {
          return {
            success: true,
            qrCode: results[0].pixQrCode,
            copyPaste: results[0].pixCopyPaste,
          };
        }
      }

      // If not cached, fetch from Asaas
      const result = await asaas.getPixQrCode(input.asaasPaymentId);
      if (result.success && result.qrCode) {
        // Cache it
        if (dbConn) {
          await dbConn.execute(
            sql`UPDATE cobrancas SET pixQrCode = ${result.qrCode}, pixCopyPaste = ${result.copyPaste || null} WHERE asaasPaymentId = ${input.asaasPaymentId}`
          );
        }
      }
      return result;
    }),

  /**
   * Get Boleto URL and barcode (real Asaas or cached)
   */
  getBankSlipUrl: protectedProcedure
    .input(z.object({ asaasPaymentId: z.string() }))
    .query(async ({ input }) => {
      // First check if we have cached data in DB
      const dbConn = await getDb();
      if (dbConn) {
        const rows = await dbConn.execute(
          sql`SELECT boletoUrl, boletoBarCode FROM cobrancas WHERE asaasPaymentId = ${input.asaasPaymentId} LIMIT 1`
        );
        const results = (rows as any)[0] as any[];
        if (results && results.length > 0 && results[0].boletoUrl) {
          return {
            success: true,
            url: results[0].boletoUrl,
            barCode: results[0].boletoBarCode,
          };
        }
      }

      // If not cached, fetch from Asaas
      const result = await asaas.getBoletoInfo(input.asaasPaymentId);
      if (result.success && result.url) {
        // Cache it
        if (dbConn) {
          await dbConn.execute(
            sql`UPDATE cobrancas SET boletoUrl = ${result.url}, boletoBarCode = ${result.barCode || null} WHERE asaasPaymentId = ${input.asaasPaymentId}`
          );
        }
      }
      return result;
    }),

  /**
   * Recreate a cobranca with real Asaas ID (for local_* payments)
   * This deletes the old local payment and creates a new one with a real Asaas ID
   */
  recreateWithAsaasId: protectedProcedure
    .input(z.object({ asaasPaymentId: z.string() }))
    .mutation(async ({ input }) => {
      // Only allow recreation of local payments
      if (!input.asaasPaymentId.startsWith("local_")) {
        return { success: false, error: "Apenas pagamentos locais (local_*) podem ser recriados." };
      }

      // Get the old cobranca data
      const oldCobranca = await db.getCobrancaByAsaasId(input.asaasPaymentId);
      if (!oldCobranca) {
        return { success: false, error: "Cobranca nao encontrada." };
      }

      // Get morador data
      const morador = await db.getMoradorById(oldCobranca.moradorId || 0);
      if (!morador) {
        return { success: false, error: "Morador nao encontrado." };
      }

      // Check if Asaas is configured
      const configured = await asaas.isAsaasConfigured();
      if (!configured) {
        return { success: false, error: "Asaas nao esta configurado." };
      }

      // Validate CPF
      const cpfDigits = (morador.cpf || "").replace(/\D/g, "");
      const isValidCpf = cpfDigits.length === 11 && cpfDigits !== "00000000000";
      if (!isValidCpf) {
        return {
          success: false,
          error: `CPF inválido para o morador "${morador.nomeCompleto}". Acesse Configurações > Moradores e atualize o CPF.`,
        };
      }

      // Find or create customer in Asaas
      const customerResult = await asaas.findOrCreateCustomer({
        name: morador.nomeCompleto,
        cpfCnpj: cpfDigits,
        phone: morador.telefone,
      });

      if (!customerResult.success || !customerResult.customerId) {
        return { success: false, error: customerResult.error || "Erro ao criar cliente no Asaas." };
      }

      // Create payment in Asaas
      const paymentResult = await asaas.createPayment({
        customerId: customerResult.customerId,
        billingType: oldCobranca.tipo as "PIX" | "BOLETO",
        value: oldCobranca.valor / 100, // Convert from cents to reais
        dueDate: oldCobranca.vencimento,
        description: oldCobranca.descricao || `Mensalidade ${oldCobranca.mesReferencia}`,
        externalReference: `${oldCobranca.moradorId}_${oldCobranca.mesReferencia}`,
      });

      if (!paymentResult.success || !paymentResult.paymentId) {
        return { success: false, error: paymentResult.error || "Erro ao criar pagamento no Asaas." };
      }

      // Get PIX QR Code or Boleto info
      let pixQrCode: string | null = null;
      let pixCopyPaste: string | null = null;
      let boletoUrl: string | null = null;
      let boletoBarCode: string | null = null;

      if (oldCobranca.tipo === "PIX") {
        const pixResult = await asaas.getPixQrCode(paymentResult.paymentId);
        if (pixResult.success) {
          pixQrCode = pixResult.qrCode || null;
          pixCopyPaste = pixResult.copyPaste || null;
        }
      } else {
        const boletoResult = await asaas.getBoletoInfo(paymentResult.paymentId);
        if (boletoResult.success) {
          boletoUrl = boletoResult.url || null;
          boletoBarCode = boletoResult.barCode || null;
        }
      }

      // Delete old cobranca
      const dbConn = await getDb();
      if (dbConn) {
        await dbConn.execute(
          sql`DELETE FROM cobrancas WHERE asaasPaymentId = ${input.asaasPaymentId}`
        );
      }

      // Create new cobranca with real Asaas ID
      await db.createCobranca({
        moradorId: oldCobranca.moradorId || 0,
        telefone: morador.telefone,
        asaasPaymentId: paymentResult.paymentId,
        tipo: oldCobranca.tipo,
        mesReferencia: oldCobranca.mesReferencia,
        valor: oldCobranca.valor,
        vencimento: oldCobranca.vencimento,
        descricao: oldCobranca.descricao,
        status: "PENDING",
      });

      // Update with PIX/Boleto data
      if (dbConn) {
        await dbConn.execute(
          sql`UPDATE cobrancas SET 
            pixQrCode = ${pixQrCode},
            pixCopyPaste = ${pixCopyPaste},
            boletoUrl = ${boletoUrl},
            boletoBarCode = ${boletoBarCode},
            asaasCustomerId = ${customerResult.customerId}
          WHERE asaasPaymentId = ${paymentResult.paymentId}`
        );
      }

      return {
        success: true,
        message: `Cobranca recriada com sucesso! ID antigo: ${input.asaasPaymentId} → ID novo: ${paymentResult.paymentId}`,
        oldPaymentId: input.asaasPaymentId,
        newPaymentId: paymentResult.paymentId,
        pixQrCode,
        pixCopyPaste,
        boletoUrl,
        boletoBarCode,
      };
    }),

  /**
   * Sync payment status from Asaas
   */
  syncStatus: protectedProcedure
    .input(z.object({ asaasPaymentId: z.string() }))
    .mutation(async ({ input }) => {
      // Skip local-only payments
      if (input.asaasPaymentId.startsWith("local_")) {
        return { success: true, status: "PENDING", message: "Pagamento local (sem Asaas)." };
      }

      const result = await asaas.getPaymentStatus(input.asaasPaymentId);
      if (result.success && result.status) {
        // Map Asaas status to our internal status
        const statusMap: Record<string, string> = {
          PENDING: "PENDING",
          RECEIVED: "RECEIVED",
          CONFIRMED: "RECEIVED",
          OVERDUE: "OVERDUE",
          REFUNDED: "CANCELLED",
          DELETED: "CANCELLED",
          RECEIVED_IN_CASH: "RECEIVED",
        };
        const internalStatus = statusMap[result.status] || "PENDING";
        await db.updateCobrancaStatus(input.asaasPaymentId, internalStatus);
        return { success: true, status: internalStatus, asaasStatus: result.status };
      }
      return { success: false, error: result.error };
    }),

  /**
   * Send PIX or Boleto to morador via WhatsApp
   * Sends formatted message with payment details
   */
  sendViaWhatsApp: protectedProcedure
    .input(
      z.object({
        asaasPaymentId: z.string(),
        moradorId: z.number(),
        telefone: z.string(),
        tipo: z.enum(["PIX", "BOLETO"]),
        valor: z.number(),
        pixCopyPaste: z.string().optional(),
        boletoBarCode: z.string().optional(),
        boletoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { sendWhatsAppMessage, getConnectionStatus } = await import("../_core/whatsapp-baileys");
        
        // Check WhatsApp connection
        const status = getConnectionStatus();
        if (!status.connected) {
          return { 
            success: false, 
            error: "WhatsApp não está conectado. Escaneie o QR Code no painel de controle." 
          };
        }
        
        // Get morador name
        const morador = await db.getMoradorById(input.moradorId);
        if (!morador) {
          return { success: false, error: "Morador nao encontrado." };
        }

        // Format currency
        const formatarMoeda = (valor: number) =>
          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

        // Build message based on payment type
        let message = `📋 *Cobrança Gerada*\n\n`;
        message += `Olá ${morador.nomeCompleto}!\n\n`;
        message += `Sua cobrança foi gerada com sucesso.\n\n`;
        message += `*Valor:* ${formatarMoeda(input.valor)}\n`;
        message += `*ID:* ${input.asaasPaymentId}\n\n`;

        if (input.tipo === "PIX" && input.pixCopyPaste) {
          message += `*📱 PIX (Copia e Cola)*\n`;
          message += `\`\`\`\n${input.pixCopyPaste}\n\`\`\`\n\n`;
          message += `Copie o código acima e cole no seu app de banco para pagar.\n`;
        } else if (input.tipo === "BOLETO" && input.boletoBarCode) {
          message += `*📄 Boleto*\n`;
          message += `Código de Barras:\n`;
          message += `\`\`\`\n${input.boletoBarCode}\n\`\`\`\n\n`;
          if (input.boletoUrl) {
            message += `Link para imprimir: ${input.boletoUrl}\n\n`;
          }
          message += `Copie o código acima e pague no seu banco.\n`;
        }

        message += `\n*Dúvidas?* Digite *5* para ver seu histórico ou *9* para falar com a administração.`;

        // Send message with retry logic
        let retries = 3;
        let lastError: any = null;
        
        while (retries > 0) {
          try {
            await sendWhatsAppMessage(input.telefone, message);
            console.log(`[sendViaWhatsApp] Message sent successfully to ${input.telefone}`);
            return {
              success: true,
              message: `Mensagem enviada para ${input.telefone}`,
            };
          } catch (error: any) {
            lastError = error;
            retries--;
            if (retries > 0) {
              console.log(`[sendViaWhatsApp] Retry ${4 - retries}/3 for ${input.telefone}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        throw lastError;
      } catch (error: any) {
        console.error("[sendViaWhatsApp] Error:", error);
        return {
          success: false,
          error: error?.message || "Erro ao enviar mensagem WhatsApp. Verifique se o WhatsApp está conectado.",
        };
      }
    }),
});
