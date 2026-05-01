/**
 * Payment Resend tRPC Router
 * Provides API endpoints for manual payment resending
 */

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  obterHistoricoReenviosMorador,
  obterEstatisticasReenvios,
  obterReenviosRecentes,
  obterReenviosFalhados,
  obterReenviosPorAdmin,
} from "../_core/payment-resend-db";
import {
  reenviarPagamentoWhatsApp,
  reenviarPagamentoEmail,
  reenviarPagamentoSMS,
  reenviarPagamentoApp,
  obterHistoricoReenviosComDetalhes,
  reenviarPagamentosEmLote,
} from "../_core/payment-resend-service";

export const paymentResendRouter = router({
  /**
   * Resend payment via WhatsApp
   */
  resendViaWhatsApp: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        moradorId: z.number(),
        asaasPaymentId: z.string(),
        numeroWhatsapp: z.string(),
        flowId: z.string(),
        motivo: z.string().optional(),
        adminId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await reenviarPagamentoWhatsApp(input);
    }),

  /**
   * Resend payment via Email
   */
  resendViaEmail: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        moradorId: z.number(),
        asaasPaymentId: z.string(),
        email: z.string().email(),
        motivo: z.string().optional(),
        adminId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await reenviarPagamentoEmail(input);
    }),

  /**
   * Resend payment via SMS
   */
  resendViaSMS: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        moradorId: z.number(),
        asaasPaymentId: z.string(),
        telefone: z.string(),
        motivo: z.string().optional(),
        adminId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await reenviarPagamentoSMS(input);
    }),

  /**
   * Resend payment via App
   */
  resendViaApp: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        moradorId: z.number(),
        asaasPaymentId: z.string(),
        motivo: z.string().optional(),
        adminId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await reenviarPagamentoApp(input);
    }),

  /**
   * Get resend history for morador
   */
  getMoradorResendHistory: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        moradorId: z.number(),
        status: z.string().optional(),
        canal: z.string().optional(),
        limite: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await obterHistoricoReenviosMorador(
        input.condominioId,
        input.moradorId,
        {
          status: input.status,
          canal: input.canal,
          limite: input.limite,
        }
      );
    }),

  /**
   * Get resend history for payment
   */
  getPaymentResendHistory: publicProcedure
    .input(
      z.object({
        asaasPaymentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await obterHistoricoReenviosComDetalhes(input.asaasPaymentId);
    }),

  /**
   * Get resend statistics
   */
  getResendStatistics: publicProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return await obterEstatisticasReenvios(input.condominioId);
    }),

  /**
   * Get recent resends
   */
  getRecentResends: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        limite: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await obterReenviosRecentes(input.condominioId, input.limite);
    }),

  /**
   * Get failed resends for retry
   */
  getFailedResends: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        limite: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await obterReenviosFalhados(input.condominioId, input.limite);
    }),

  /**
   * Get resends by admin
   */
  getResendsByAdmin: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        adminId: z.number(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        limite: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await obterReenviosPorAdmin(input.condominioId, input.adminId, {
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        limite: input.limite,
      });
    }),

  /**
   * Bulk resend payments
   */
  bulkResend: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        pagamentos: z.array(
          z.object({
            moradorId: z.number(),
            asaasPaymentId: z.string(),
            numeroWhatsapp: z.string(),
            flowId: z.string(),
          })
        ),
        adminId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await reenviarPagamentosEmLote(
        input.condominioId,
        input.pagamentos,
        input.adminId
      );
    }),
});
