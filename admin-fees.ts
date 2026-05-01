/**
 * Admin Monthly Fee Management Router
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  getMensalidadeAtual,
  setMensalidade,
  updateMensalidade,
  getMensalidadeHistorico,
  applyBatchFeeChange,
  getAllMensalidades,
  getFeeStatistics,
  getFeeChangeHistory,
} from "@/server/_core/admin-fees-db";

export const adminFeesRouter = router({
  /**
   * Get current monthly fee for a resident
   */
  getCurrent: publicProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(async ({ input }) => {
      const fee = await getMensalidadeAtual(input.moradorId);
      return fee || null;
    }),

  /**
   * Set monthly fee for a resident
   */
  set: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        valor: z.number().positive("Valor deve ser positivo"),
        dataVencimento: z.date(),
        tipoUnidade: z.enum(["apartamento", "sala_comercial", "garagem", "outro"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await setMensalidade(input);
      return result || { error: "Erro ao definir mensalidade" };
    }),

  /**
   * Update monthly fee for a resident
   */
  update: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        novoValor: z.number().positive("Valor deve ser positivo"),
        motivo: z.string().optional(),
        adminId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateMensalidade(
        input.moradorId,
        input.novoValor,
        input.motivo,
        input.adminId
      );
    }),

  /**
   * Get fee history for a resident
   */
  getHistory: publicProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(async ({ input }) => {
      return await getMensalidadeHistorico(input.moradorId);
    }),

  /**
   * Apply batch fee change
   */
  applyBatch: publicProcedure
    .input(
      z.object({
        moradores: z.array(z.number()),
        novoValor: z.number().positive().optional(),
        percentualAumento: z.number().optional(),
        motivo: z.string().optional(),
        adminId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.novoValor && input.percentualAumento === undefined) {
        return {
          success: false,
          processados: 0,
          erros: input.moradores.length,
          detalhes: input.moradores.map((id) => ({
            moradorId: id,
            sucesso: false,
            erro: "Deve informar novoValor ou percentualAumento",
          })),
        };
      }

      return await applyBatchFeeChange({
        moradores: input.moradores,
        novoValor: input.novoValor,
        percentualAumento: input.percentualAumento,
        motivo: input.motivo,
        adminId: input.adminId,
      });
    }),

  /**
   * Get all residents with current fees
   */
  getAll: publicProcedure.query(async () => {
    return await getAllMensalidades();
  }),

  /**
   * Get fee statistics
   */
  getStatistics: publicProcedure.query(async () => {
    return await getFeeStatistics();
  }),

  /**
   * Get fee change history for audit
   */
  getChangeHistory: publicProcedure
    .input(
      z.object({
        adminId: z.number().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getFeeChangeHistory(input.adminId, input.dataInicio, input.dataFim);
    }),
});
