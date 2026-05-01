/**
 * Admin Reporting and Export Router
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  getFinancialReport,
  getDelinquencyReport,
  getBankReconciliationReport,
  getMonthlySummaryReport,
  getAnnualSummaryReport,
  exportToCSV,
} from "@/server/_core/admin-reports-db";

export const adminReportsRouter = router({
  /**
   * Get financial report for period
   */
  getFinancialReport: publicProcedure
    .input(
      z.object({
        dataInicio: z.date(),
        dataFim: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await getFinancialReport(input.dataInicio, input.dataFim);
    }),

  /**
   * Get delinquency report
   */
  getDelinquencyReport: publicProcedure.query(async () => {
    return await getDelinquencyReport();
  }),

  /**
   * Get bank reconciliation report
   */
  getBankReconciliationReport: publicProcedure
    .input(
      z.object({
        dataInicio: z.date(),
        dataFim: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await getBankReconciliationReport(input.dataInicio, input.dataFim);
    }),

  /**
   * Get monthly summary report
   */
  getMonthlySummaryReport: publicProcedure
    .input(
      z.object({
        ano: z.number(),
        mes: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      return await getMonthlySummaryReport(input.ano, input.mes);
    }),

  /**
   * Get annual summary report
   */
  getAnnualSummaryReport: publicProcedure
    .input(z.object({ ano: z.number() }))
    .query(async ({ input }) => {
      return await getAnnualSummaryReport(input.ano);
    }),

  /**
   * Export data to CSV
   */
  exportToCSV: publicProcedure
    .input(
      z.object({
        tipo: z.enum(["pagamentos", "despesas", "moradores", "inadimplencia"]),
        filtros: z.record(z.any()).optional(),
      })
    )
    .query(async ({ input }) => {
      return await exportToCSV(input.tipo, input.filtros);
    }),
});
