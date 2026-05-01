import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";

export const despesasRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        categoria: z.string().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const filtros: any = {
          page: input.page,
          limit: input.limit,
        };
        if (input.categoria && input.categoria !== "todos") filtros.categoria = input.categoria;
        if (input.dataInicio) filtros.dataInicio = new Date(input.dataInicio);
        if (input.dataFim) filtros.dataFim = new Date(input.dataFim);

        const result = await db.getDespesas(filtros);
        return {
          success: true,
          data: Array.isArray(result) ? result : (result as any)?.data || [],
          pagination: !Array.isArray(result) ? (result as any)?.pagination : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to list expenses";
        throw new Error(message);
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        categoria: z.enum(["MANUTENCAO", "LIMPEZA", "SEGURANCA", "UTILIDADES", "OUTROS"]),
        descricao: z.string().min(5).max(200),
        valor: z.number().positive(),
        data: z.string(),
        comprovante: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const despesa = await db.createDespesa({
          categoria: input.categoria,
          descricao: input.descricao,
          valor: input.valor,
          comprovante: input.comprovante,
        });
        return {
          success: true,
          despesa,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create expense";
        throw new Error(message);
      }
    }),

  getPorMes: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await db.getDespesasPorMes(input.mesReferencia);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get expenses by month";
        throw new Error(message);
      }
    }),

  getPorCategoria: protectedProcedure
    .input(z.object({ mesReferencia: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await db.getDespesasPorCategoria(input.mesReferencia);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get expenses by category";
        throw new Error(message);
      }
    }),

  getStatistics: protectedProcedure
    .input(
      z.object({
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const filtros: any = {};
        if (input.dataInicio) filtros.dataInicio = new Date(input.dataInicio);
        if (input.dataFim) filtros.dataFim = new Date(input.dataFim);

        const despesas = await db.getDespesas(filtros);
        const despesasList = Array.isArray(despesas) ? despesas : (despesas as any)?.data || [];

        const stats = {
          total: despesasList.reduce((sum: number, d: any) => sum + (d.valor || 0), 0),
          byCategory: {
            MANUTENCAO: despesasList
              .filter((d: any) => d.categoria === "MANUTENCAO")
              .reduce((sum: number, d: any) => sum + (d.valor || 0), 0),
            LIMPEZA: despesasList
              .filter((d: any) => d.categoria === "LIMPEZA")
              .reduce((sum: number, d: any) => sum + (d.valor || 0), 0),
            SEGURANCA: despesasList
              .filter((d: any) => d.categoria === "SEGURANCA")
              .reduce((sum: number, d: any) => sum + (d.valor || 0), 0),
            UTILIDADES: despesasList
              .filter((d: any) => d.categoria === "UTILIDADES")
              .reduce((sum: number, d: any) => sum + (d.valor || 0), 0),
            OUTROS: despesasList
              .filter((d: any) => d.categoria === "OUTROS")
              .reduce((sum: number, d: any) => sum + (d.valor || 0), 0),
          },
          count: despesasList.length,
        };

        return {
          success: true,
          stats,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get statistics";
        throw new Error(message);
      }
    }),
});
