/**
 * tRPC Router - WhatsApp + Asaas Integration
 */

import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import { getWhatsAppAsaasHandler } from "@/server/_core/whatsapp-asaas-handler";

export const whatsappAsaasRouter = router({
  /**
   * Processar mensagem de morador
   */
  handleMoradorMessage: publicProcedure
    .input(
      z.object({
        moradorPhone: z.string(),
        moradorName: z.string(),
        moradorEmail: z.string().email(),
        moradorCpf: z.string().optional(),
        messageText: z.string(),
        paymentValue: z.number(),
        paymentDueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const handler = getWhatsAppAsaasHandler();
        const result = await handler.handleMoradorMessage(input);

        return result;
      } catch (error) {
        return {
          success: false,
          action: "error",
          message: error instanceof Error ? error.message : "Erro ao processar mensagem",
        };
      }
    }),

  /**
   * Processar confirmação de pagamento
   */
  handlePaymentConfirmation: publicProcedure
    .input(
      z.object({
        chargeId: z.string(),
        moradorPhone: z.string(),
        moradorName: z.string(),
        value: z.number(),
        paymentMethod: z.enum(["PIX", "BOLETO"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const handler = getWhatsAppAsaasHandler();
        const result = await handler.handlePaymentConfirmation(input);

        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao processar confirmação",
        };
      }
    }),

  /**
   * Enviar menu inicial
   */
  sendInitialMenu: publicProcedure
    .input(
      z.object({
        moradorPhone: z.string(),
        moradorName: z.string(),
        pendingValue: z.number(),
        dueDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const handler = getWhatsAppAsaasHandler();
        const result = await handler.sendInitialMenu(input);

        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao enviar menu",
        };
      }
    }),

  /**
   * Enviar lembrete de pagamento
   */
  sendPaymentReminder: publicProcedure
    .input(
      z.object({
        moradorPhone: z.string(),
        moradorName: z.string(),
        value: z.number(),
        dueDate: z.string(),
        daysUntilDue: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const handler = getWhatsAppAsaasHandler();
        const result = await handler.sendPaymentReminder(input);

        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erro ao enviar lembrete",
        };
      }
    }),

  /**
   * Testar integração
   */
  testIntegration: publicProcedure.mutation(async () => {
    try {
      const handler = getWhatsAppAsaasHandler();

      // Simular mensagem de teste
      const result = await handler.handleMoradorMessage({
        moradorPhone: "+5521987654321",
        moradorName: "João Silva",
        moradorEmail: "joao@example.com",
        messageText: "1",
        paymentValue: 500.0,
        paymentDueDate: "2026-04-30",
      });

      return {
        success: true,
        message: "Teste realizado com sucesso",
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao testar integração",
      };
    }
  }),
});
