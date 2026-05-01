/**
 * tRPC Router - Baileys WhatsApp
 * Operações de WhatsApp via Baileys com suporte a QR Code
 */

import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import {
  getBaileysService,
  initializeBaileysService,
  type MenuOption,
} from "@/server/_core/baileys-service";

export const baileysRouter = router({
  /**
   * Inicializar conexão com WhatsApp
   */
  connect: publicProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const service = initializeBaileysService(input.phoneNumber);
        const connected = await service.connect();

        if (connected) {
          return {
            success: true,
            message: "Conectando ao WhatsApp...",
            status: service.getStatus(),
          };
        } else {
          return {
            success: false,
            message: "Falha ao conectar ao WhatsApp",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao conectar",
        };
      }
    }),

  /**
   * Obter QR Code
   */
  getQRCode: publicProcedure.query(async () => {
    try {
      const service = getBaileysService();
      const qrCode = service.getQRCode();

      if (qrCode) {
        return {
          success: true,
          qrCode: qrCode.qrCode,
          timestamp: qrCode.timestamp,
          connected: qrCode.connected,
        };
      } else {
        return {
          success: false,
          message: "Nenhum QR Code disponível",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao obter QR Code",
      };
    }
  }),

  /**
   * Desconectar do WhatsApp
   */
  disconnect: publicProcedure.mutation(async () => {
    try {
      const service = getBaileysService();
      await service.disconnect();

      return {
        success: true,
        message: "Desconectado do WhatsApp",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao desconectar",
      };
    }
  }),

  /**
   * Obter status de conexão
   */
  getStatus: publicProcedure.query(async () => {
    try {
      const service = getBaileysService();
      const status = service.getStatus();

      return {
        success: true,
        status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao obter status",
      };
    }
  }),

  /**
   * Testar conexão
   */
  testConnection: publicProcedure.mutation(async () => {
    try {
      const service = getBaileysService();
      const result = await service.testConnection();

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao testar conexão",
      };
    }
  }),

  /**
   * Enviar mensagem de texto
   */
  sendMessage: publicProcedure
    .input(
      z.object({
        to: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();
        const result = await service.sendMessage(input.to, input.text);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
        };
      }
    }),

  /**
   * Enviar menu interativo
   */
  sendMenu: publicProcedure
    .input(
      z.object({
        to: z.string(),
        title: z.string(),
        options: z.array(
          z.object({
            number: z.number(),
            label: z.string(),
            action: z.string(),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();
        const result = await service.sendMenu(input.to, input.title, input.options);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao enviar menu",
        };
      }
    }),

  /**
   * Registrar resposta automática
   */
  registerAutoReply: publicProcedure
    .input(
      z.object({
        trigger: z.string(),
        menu: z.array(
          z.object({
            number: z.number(),
            label: z.string(),
            action: z.string(),
            description: z.string().optional(),
          })
        ),
        timeout: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();
        service.registerAutoReply({
          trigger: input.trigger,
          menu: input.menu,
          timeout: input.timeout,
        });

        return {
          success: true,
          message: `Auto-reply registrada para: "${input.trigger}"`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao registrar auto-reply",
        };
      }
    }),

  /**
   * Remover resposta automática
   */
  removeAutoReply: publicProcedure
    .input(z.object({ trigger: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();
        service.removeAutoReply(input.trigger);

        return {
          success: true,
          message: `Auto-reply removida: "${input.trigger}"`,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao remover auto-reply",
        };
      }
    }),

  /**
   * Enviar mensagem de pagamento
   */
  sendPaymentMessage: publicProcedure
    .input(
      z.object({
        to: z.string(),
        moradorName: z.string(),
        amount: z.number(),
        dueDate: z.string(),
        pixKey: z.string().optional(),
        barcodeUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();

        const message = `
Olá ${input.moradorName}!

Sua mensalidade de R$ ${input.amount.toFixed(2)} vence em ${input.dueDate}.

${input.pixKey ? `Chave PIX: ${input.pixKey}` : ""}
${input.barcodeUrl ? `Código de barras: ${input.barcodeUrl}` : ""}

Clique aqui para pagar: [Link de Pagamento]
        `.trim();

        const result = await service.sendMessage(input.to, message);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao enviar mensagem de pagamento",
        };
      }
    }),

  /**
   * Enviar menu de pagamento
   */
  sendPaymentMenu: publicProcedure
    .input(
      z.object({
        to: z.string(),
        moradorName: z.string(),
        amount: z.number(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();

        const options: MenuOption[] = [
          {
            number: 1,
            label: "Pagar com PIX",
            action: "payment_pix",
            description: "Escaneie o QR Code",
          },
          {
            number: 2,
            label: "Pagar com Boleto",
            action: "payment_boleto",
            description: "Copie o código de barras",
          },
          {
            number: 3,
            label: "Falar com Admin",
            action: "contact_admin",
            description: "Enviar mensagem",
          },
        ];

        const title = `Pagamento - ${input.moradorName}\nR$ ${input.amount.toFixed(2)} - Vence: ${input.dueDate}`;

        const result = await service.sendMenu(input.to, title, options);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao enviar menu de pagamento",
        };
      }
    }),

  /**
   * Enviar em lote
   */
  sendBulk: publicProcedure
    .input(
      z.object({
        recipients: z.array(
          z.object({
            to: z.string(),
            text: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getBaileysService();
        const results = [];

        for (const recipient of input.recipients) {
          const result = await service.sendMessage(recipient.to, recipient.text);
          results.push({
            to: recipient.to,
            ...result,
          });
        }

        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;

        return {
          success: failureCount === 0,
          total: results.length,
          successCount,
          failureCount,
          results,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao enviar em lote",
        };
      }
    }),
});
