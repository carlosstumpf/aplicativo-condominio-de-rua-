import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";
import { z } from "zod";
import { generatePrestacaoContasHTML, formatCurrency, formatDate } from "../services/prestacao-contas-pdf";

export const prestacaoContasRouter = router({
  /**
   * Generate Prestação de Contas for a specific month
   */
  gerarMes: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      try {
        const resumo = await db.getResumoMes(input.mesReferencia);
        const despesasCategoria = await db.getDespesasPorCategoria(input.mesReferencia);
        const cobrancas = await db.getCobrancasPorMes(input.mesReferencia);
        const despesas = await db.getDespesasPorMes(input.mesReferencia);
        const moradores = await db.getMoradores();
        const inadimplentes = await db.getInadimplentes();

        const data = {
          periodo: {
            mes: input.mesReferencia,
            dataInicio: `${input.mesReferencia}-01`,
            dataFim: `${input.mesReferencia}-28`, // Simplified, should calculate last day
          },
          resumo: resumo || {
            saldoAnterior: 0,
            receitas: 0,
            despesas: 0,
            saldoAtual: 0,
          },
          despesasCategoria: despesasCategoria || [],
          despesas: despesas || [],
          cobrancas: cobrancas || [],
          moradores: {
            total: moradores?.length || 0,
            emAtraso: inadimplentes?.length || 0,
          },
        };

        const html = generatePrestacaoContasHTML(data);

        return {
          success: true,
          html,
          data,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao gerar prestação de contas",
        };
      }
    }),

  /**
   * Generate Prestação de Contas for a date range
   */
  gerarPeriodo: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      try {
        const resumo = await db.getResumoPeriodo(input.startDate, input.endDate);
        const despesasCategoria = await db.getDespesasCategoriaPeriodo(input.startDate, input.endDate);
        const cobrancas = await db.getCobrancasPeriodo(input.startDate, input.endDate);
        const despesas = await db.getDespesasPeriodo(input.startDate, input.endDate);
        const moradores = await db.getMoradores();
        const inadimplentes = await db.getInadimplentes();

        // Extract month from startDate for display
        const [year, month] = input.startDate.split("-");
        const displayMonth = `${month}/${year}`;

        const data = {
          periodo: {
            mes: displayMonth,
            dataInicio: input.startDate,
            dataFim: input.endDate,
          },
          resumo: resumo || {
            saldoAnterior: 0,
            receitas: 0,
            despesas: 0,
            saldoAtual: 0,
          },
          despesasCategoria: despesasCategoria || [],
          despesas: despesas || [],
          cobrancas: cobrancas || [],
          moradores: {
            total: moradores?.length || 0,
            emAtraso: inadimplentes?.length || 0,
          },
        };

        const html = generatePrestacaoContasHTML(data);

        return {
          success: true,
          html,
          data,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao gerar prestação de contas",
        };
      }
    }),
});
