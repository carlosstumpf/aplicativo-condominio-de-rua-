/**
 * Admin Expense Tracking Router
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  createExpenseCategory,
  getExpenseCategories,
  createExpense,
  updateExpense,
  getExpense,
  getExpenses,
  addExpenseDocument,
  getExpenseDocuments,
  deleteExpenseDocument,
  getExpenseStatistics,
} from "@/server/_core/admin-expenses-db";

export const adminExpensesRouter = router({
  /**
   * Create expense category
   */
  createCategory: publicProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        cor: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await createExpenseCategory(input);
    }),

  /**
   * Get all expense categories
   */
  getCategories: publicProcedure.query(async () => {
    return await getExpenseCategories();
  }),

  /**
   * Create expense
   */
  create: publicProcedure
    .input(
      z.object({
        titulo: z.string().min(1),
        descricao: z.string().optional(),
        valor: z.number().positive(),
        categoria: z.number(),
        data: z.date(),
        dataVencimento: z.date().optional(),
        fornecedor: z.string().optional(),
        referencia: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createExpense(input);
    }),

  /**
   * Update expense
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        valor: z.number().positive().optional(),
        categoria: z.number().optional(),
        data: z.date().optional(),
        dataVencimento: z.date().optional(),
        status: z.enum(["pendente", "paga", "cancelada"]).optional(),
        fornecedor: z.string().optional(),
        referencia: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateExpense(id, data);
    }),

  /**
   * Get expense by ID
   */
  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await getExpense(input.id);
  }),

  /**
   * Get expenses with filters
   */
  list: publicProcedure
    .input(
      z.object({
        categoria: z.number().optional(),
        status: z.enum(["pendente", "paga", "cancelada"]).optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        fornecedor: z.string().optional(),
        busca: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getExpenses(input);
    }),

  /**
   * Add document to expense
   */
  addDocument: publicProcedure
    .input(
      z.object({
        despesaId: z.number(),
        nomeArquivo: z.string(),
        tipoArquivo: z.string(),
        urlArquivo: z.string(),
        tamanho: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await addExpenseDocument(input);
    }),

  /**
   * Get documents for expense
   */
  getDocuments: publicProcedure
    .input(z.object({ despesaId: z.number() }))
    .query(async ({ input }) => {
      return await getExpenseDocuments(input.despesaId);
    }),

  /**
   * Delete document
   */
  deleteDocument: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteExpenseDocument(input.id);
    }),

  /**
   * Get expense statistics
   */
  getStatistics: publicProcedure
    .input(
      z.object({
        categoria: z.number().optional(),
        status: z.enum(["pendente", "paga", "cancelada"]).optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
        fornecedor: z.string().optional(),
        busca: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getExpenseStatistics(input);
    }),
});
