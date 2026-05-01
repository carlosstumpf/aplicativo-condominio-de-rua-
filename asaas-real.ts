/**
 * tRPC Router - Asaas Real Integration
 * Integração real com API Asaas para PIX e Boleto
 */

import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import {
  getAsaasService,
  initializeAsaasService,
} from "@/server/_core/asaas-real-service";
import { getMessageProcessor } from "@/server/_core/message-processor";

export const asaasRealRouter = router({
  /**
   * Inicializar Asaas com chave API
   */
  initialize: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        environment: z.enum(["production", "sandbox"]).default("sandbox"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        initializeAsaasService({
          apiKey: input.apiKey,
          environment: input.environment,
        });

        return {
          success: true,
          message: "Asaas inicializado com sucesso",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao inicializar",
        };
      }
    }),

  /**
   * Testar conexão com Asaas
   */
  testConnection: publicProcedure.mutation(async () => {
    try {
      const asaas = getAsaasService();
      const result = await asaas.testConnection();

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao testar conexão",
      };
    }
  }),

  /**
   * Criar ou obter cliente
   */
  getOrCreateCustomer: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        cpfCnpj: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const asaas = getAsaasService();
        const result = await asaas.getOrCreateCustomer(input);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar cliente",
        };
      }
    }),

  /**
   * Criar cobrança PIX
   */
  createPixCharge: publicProcedure
    .input(
      z.object({
        customerId: z.string(),
        moradorPhone: z.string(),
        moradorName: z.string(),
        value: z.number(),
        dueDate: z.string(), // YYYY-MM-DD
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const asaas = getAsaasService();
        const processor = getMessageProcessor();

        // Criar cobrança no Asaas
        const result = await asaas.createPixCharge({
          customerId: input.customerId,
          value: input.value,
          dueDate: input.dueDate,
          description: input.description,
          externalReference: input.moradorPhone,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        // Adicionar aos pagamentos pendentes
        processor.addPendingPayment({
          moradorPhone: input.moradorPhone,
          moradorName: input.moradorName,
          amount: input.value,
          dueDate: input.dueDate,
          pixKey: result.charge?.pixKey,
          asaasPaymentId: result.charge?.id,
        });

        return {
          success: true,
          charge: result.charge,
          pixQrCode: result.pixQrCode,
          pixKey: result.pixKey,
          message: "Cobrança PIX criada com sucesso",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar cobrança PIX",
        };
      }
    }),

  /**
   * Criar cobrança Boleto
   */
  createBoletoCharge: publicProcedure
    .input(
      z.object({
        customerId: z.string(),
        moradorPhone: z.string(),
        moradorName: z.string(),
        value: z.number(),
        dueDate: z.string(), // YYYY-MM-DD
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const asaas = getAsaasService();
        const processor = getMessageProcessor();

        // Criar cobrança no Asaas
        const result = await asaas.createBoletoCharge({
          customerId: input.customerId,
          value: input.value,
          dueDate: input.dueDate,
          description: input.description,
          externalReference: input.moradorPhone,
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        // Adicionar aos pagamentos pendentes
        processor.addPendingPayment({
          moradorPhone: input.moradorPhone,
          moradorName: input.moradorName,
          amount: input.value,
          dueDate: input.dueDate,
          barcodeUrl: result.charge?.bankSlipUrl,
          asaasPaymentId: result.charge?.id,
        });

        return {
          success: true,
          charge: result.charge,
          barCode: result.barCode,
          bankSlipUrl: result.bankSlipUrl,
          message: "Cobrança Boleto criada com sucesso",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar cobrança Boleto",
        };
      }
    }),

  /**
   * Obter cobrança
   */
  getCharge: publicProcedure
    .input(z.object({ chargeId: z.string() }))
    .query(async ({ input }) => {
      try {
        const asaas = getAsaasService();
        const result = await asaas.getCharge(input.chargeId);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao obter cobrança",
        };
      }
    }),

  /**
   * Listar cobranças de um cliente
   */
  listCharges: publicProcedure
    .input(
      z.object({
        customerId: z.string(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const asaas = getAsaasService();
        const result = await asaas.listCharges(input.customerId, input.limit);

        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao listar cobranças",
        };
      }
    }),

  /**
   * Criar fluxo completo: Cliente + Cobrança PIX
   */
  createPixFlow: publicProcedure
    .input(
      z.object({
        moradorName: z.string(),
        moradorEmail: z.string().email(),
        moradorPhone: z.string(),
        moradorCpf: z.string().optional(),
        value: z.number(),
        dueDate: z.string(), // YYYY-MM-DD
      })
    )
    .mutation(async ({ input }) => {
      try {
        const asaas = getAsaasService();

        // Passo 1: Criar ou obter cliente
        const customerResult = await asaas.getOrCreateCustomer({
          name: input.moradorName,
          email: input.moradorEmail,
          phone: input.moradorPhone,
          cpfCnpj: input.moradorCpf,
        });

        if (!customerResult.success) {
          return {
            success: false,
            error: `Erro ao criar cliente: ${customerResult.error}`,
          };
        }

        // Passo 2: Criar cobrança PIX
        const chargeResult = await asaas.createPixCharge({
          customerId: customerResult.customerId!,
          value: input.value,
          dueDate: input.dueDate,
          description: "Mensalidade do Condomínio",
          externalReference: input.moradorPhone,
        });

        if (!chargeResult.success) {
          return {
            success: false,
            error: `Erro ao criar cobrança: ${chargeResult.error}`,
          };
        }

        // Passo 3: Adicionar aos pagamentos pendentes
        const processor = getMessageProcessor();
        processor.addPendingPayment({
          moradorPhone: input.moradorPhone,
          moradorName: input.moradorName,
          amount: input.value,
          dueDate: input.dueDate,
          pixKey: chargeResult.charge?.pixKey,
          asaasPaymentId: chargeResult.charge?.id,
        });

        return {
          success: true,
          customerId: customerResult.customerId,
          charge: chargeResult.charge,
          pixQrCode: chargeResult.pixQrCode,
          pixKey: chargeResult.pixKey,
          message: "Fluxo PIX completo realizado com sucesso",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao executar fluxo PIX",
        };
      }
    }),

  /**
   * Criar fluxo completo: Cliente + Cobrança Boleto
   */
  createBoletoFlow: publicProcedure
    .input(
      z.object({
        moradorName: z.string(),
        moradorEmail: z.string().email(),
        moradorPhone: z.string(),
        moradorCpf: z.string().optional(),
        value: z.number(),
        dueDate: z.string(), // YYYY-MM-DD
      })
    )
    .mutation(async ({ input }) => {
      try {
        const asaas = getAsaasService();

        // Passo 1: Criar ou obter cliente
        const customerResult = await asaas.getOrCreateCustomer({
          name: input.moradorName,
          email: input.moradorEmail,
          phone: input.moradorPhone,
          cpfCnpj: input.moradorCpf,
        });

        if (!customerResult.success) {
          return {
            success: false,
            error: `Erro ao criar cliente: ${customerResult.error}`,
          };
        }

        // Passo 2: Criar cobrança Boleto
        const chargeResult = await asaas.createBoletoCharge({
          customerId: customerResult.customerId!,
          value: input.value,
          dueDate: input.dueDate,
          description: "Mensalidade do Condomínio",
          externalReference: input.moradorPhone,
        });

        if (!chargeResult.success) {
          return {
            success: false,
            error: `Erro ao criar cobrança: ${chargeResult.error}`,
          };
        }

        // Passo 3: Adicionar aos pagamentos pendentes
        const processor = getMessageProcessor();
        processor.addPendingPayment({
          moradorPhone: input.moradorPhone,
          moradorName: input.moradorName,
          amount: input.value,
          dueDate: input.dueDate,
          barcodeUrl: chargeResult.charge?.bankSlipUrl,
          asaasPaymentId: chargeResult.charge?.id,
        });

        return {
          success: true,
          customerId: customerResult.customerId,
          charge: chargeResult.charge,
          barCode: chargeResult.barCode,
          bankSlipUrl: chargeResult.bankSlipUrl,
          message: "Fluxo Boleto completo realizado com sucesso",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao executar fluxo Boleto",
        };
      }
    }),
});
