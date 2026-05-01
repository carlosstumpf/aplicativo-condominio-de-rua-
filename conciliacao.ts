import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";

export const conciliacaoRouter = router({
  /**
   * List bank statements with reconciliation status
   */
  listExtratos: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.enum(["todos", "conciliado", "pendente", "discrepancia"]).optional(),
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

        if (input.status && input.status !== "todos") filtros.status = input.status;
        if (input.dataInicio) filtros.dataInicio = new Date(input.dataInicio);
        if (input.dataFim) filtros.dataFim = new Date(input.dataFim);

        const result = await db.getExtratos(filtros);
        return {
          success: true,
          data: Array.isArray(result) ? result : (result as any)?.data || [],
          pagination: !Array.isArray(result) ? (result as any)?.pagination : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to list statements";
        throw new Error(message);
      }
    }),

  /**
   * Upload and parse bank statement
   */
  uploadExtrato: protectedProcedure
    .input(
      z.object({
        nomeArquivo: z.string(),
        conteudo: z.string(),
        banco: z.enum(["ITAU", "BRADESCO", "CAIXA", "SANTANDER", "OUTRO"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const extrato = await db.createExtrato({
          nomeArquivo: input.nomeArquivo,
          conteudo: input.conteudo,
          banco: input.banco,
          dataUpload: new Date(),
          status: "pendente",
        });

        return {
          success: true,
          extrato,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to upload statement";
        throw new Error(message);
      }
    }),

  /**
   * Get reconciliation suggestions (automatic matching)
   */
  getReconciliationSuggestions: protectedProcedure
    .input(z.object({ extratoId: z.number() }))
    .query(async ({ input }) => {
      try {
        const suggestions = await db.getReconciliationSuggestions(input.extratoId);
        return {
          success: true,
          suggestions,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get suggestions";
        throw new Error(message);
      }
    }),

  /**
   * Reconcile a transaction
   */
  reconcile: protectedProcedure
    .input(
      z.object({
        extratoId: z.number(),
        linhaId: z.number(),
        tipo: z.enum(["cobranca", "despesa"]),
        referenceId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const reconciliation = await db.createReconciliation({
          extratoId: input.extratoId,
          linhaId: input.linhaId,
          tipo: input.tipo,
          referenceId: input.referenceId,
          dataConciliacao: new Date(),
        });

        return {
          success: true,
          reconciliation,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reconcile";
        throw new Error(message);
      }
    }),

  /**
   * Get reconciliation summary
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const summary = await db.getReconciliationSummary({
          dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
        });

        return {
          success: true,
          summary,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get summary";
        throw new Error(message);
      }
    }),

  /**
   * Get discrepancies
   */
  getDiscrepancies: protectedProcedure
    .input(
      z.object({
        extratoId: z.number().optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const discrepancies = await db.getDiscrepancies({
          extratoId: input.extratoId,
          dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
        });

        return {
          success: true,
          discrepancies,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get discrepancies";
        throw new Error(message);
      }
    }),

  /**
   * Get unreconciled transactions
   */
  getUnreconciled: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(["cobranca", "despesa", "ambos"]).optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const unreconciled = await db.getUnreconciledTransactions({
          tipo: input.tipo,
          dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
        });

        return {
          success: true,
          unreconciled,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get unreconciled";
        throw new Error(message);
      }
    }),

  /**
   * Mark extrato as reconciled
   */
  markAsReconciled: protectedProcedure
    .input(z.object({ extratoId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await db.markExtratoAsReconciled(input.extratoId);
        return {
          success: true,
          result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to mark as reconciled";
        throw new Error(message);
      }
    }),

  /**
   * Get reconciliation history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const history = await db.getReconciliationHistory({
          page: input.page,
          limit: input.limit,
        });

        return {
          success: true,
          data: Array.isArray(history) ? history : (history as any)?.data || [],
          pagination: !Array.isArray(history) ? (history as any)?.pagination : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get history";
        throw new Error(message);
      }
    }),
});
