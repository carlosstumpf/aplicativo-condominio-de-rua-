import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";

export const relatoriosRouter = router({
  resumoMes: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      return await db.getResumoMes(input.mesReferencia);
    }),

  /**
   * Get summary for a date range (startDate to endDate)
   */
  resumoPeriodo: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      return await db.getResumoPeriodo(input.startDate, input.endDate);
    }),

  despesasPorCategoria: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      return await db.getDespesasPorCategoria(input.mesReferencia);
    }),

  /**
   * Get expenses by category for a date range
   */
  despesasCategoriaPeriodo: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      return await db.getDespesasCategoriaPeriodo(input.startDate, input.endDate);
    }),

  prestaçãoDeContas: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      const resumo = await db.getResumoMes(input.mesReferencia);
      const despesasCategoria = await db.getDespesasPorCategoria(input.mesReferencia);
      const cobrancas = await db.getCobrancasPorMes(input.mesReferencia);
      const despesas = await db.getDespesasPorMes(input.mesReferencia);

      return {
        resumo,
        despesasCategoria,
        cobrancas,
        despesas,
      };
    }),

  /**
   * Get statement of accounts for a date range
   */
  prestaçãoDeContasPeriodo: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      const resumo = await db.getResumoPeriodo(input.startDate, input.endDate);
      const despesasCategoria = await db.getDespesasCategoriaPeriodo(input.startDate, input.endDate);
      const cobrancas = await db.getCobrancasPeriodo(input.startDate, input.endDate);
      const despesas = await db.getDespesasPeriodo(input.startDate, input.endDate);

      return {
        resumo,
        despesasCategoria,
        cobrancas,
        despesas,
      };
    }),
});
