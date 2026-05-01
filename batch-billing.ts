/**
 * Batch Billing Router
 * tRPC endpoints for batch billing operations
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  startBatchBillingJob,
  getBatchBillingProgress,
  cancelBatchBillingJob,
  getBatchBillingJobStats,
  validateBatchBillingData,
  formatBatchBillingJob,
} from "@/server/_core/batch-billing-service";
import {
  parseCSVContent,
  generateCSVTemplate,
  exportImportResultsToCSV,
  formatCSVImportResult,
} from "@/server/_core/batch-billing-csv-import";
import {
  createBatchBillingJob,
  getBatchBillingJob,
  getAllBatchBillingJobs,
  getBatchBillingItems,
  exportBatchBillingToCSV,
} from "@/server/_core/batch-billing-db";

export const batchBillingRouter = router({
  /**
   * Create batch billing job
   */
  createBatch: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        description: z.string().min(1, "Descrição é obrigatória"),
        dueDate: z.date().refine((date) => date > new Date(), "Data deve ser no futuro"),
        amount: z.number().positive("Valor deve ser maior que zero"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate input
        const validation = validateBatchBillingData(input);
        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }

        // Get user ID from context (assuming authenticated)
        const userId = ctx.user?.id || 0;

        // Start batch job
        const progress = await startBatchBillingJob({
          ...input,
          createdBy: userId,
        });

        return {
          success: true,
          jobId: progress.jobId,
          progress,
        };
      } catch (error) {
        throw new Error(
          `Failed to create batch: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get batch progress
   */
  getProgress: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      try {
        const progress = getBatchBillingProgress(input.jobId);
        if (!progress) {
          throw new Error(`Batch job ${input.jobId} not found`);
        }
        return progress;
      } catch (error) {
        throw new Error(
          `Failed to get progress: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get batch details
   */
  getBatch: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      try {
        const batch = await getBatchBillingJob(input.jobId);
        if (!batch) {
          throw new Error(`Batch job ${input.jobId} not found`);
        }
        return batch;
      } catch (error) {
        throw new Error(
          `Failed to get batch: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get all batches
   */
  listBatches: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const batches = await getAllBatchBillingJobs({
          status: input.status,
          limit: input.limit,
          offset: input.offset,
        });
        return batches;
      } catch (error) {
        throw new Error(
          `Failed to list batches: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get batch statistics
   */
  getStats: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await getBatchBillingJobStats(input.jobId);
        return stats;
      } catch (error) {
        throw new Error(
          `Failed to get stats: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get batch items
   */
  getItems: publicProcedure
    .input(
      z.object({
        jobId: z.number(),
        status: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const items = await getBatchBillingItems(input.jobId, {
          status: input.status,
          limit: input.limit,
          offset: input.offset,
        });
        return items;
      } catch (error) {
        throw new Error(
          `Failed to get items: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Cancel batch job
   */
  cancelBatch: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await cancelBatchBillingJob(input.jobId);
        return { success: true };
      } catch (error) {
        throw new Error(
          `Failed to cancel batch: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Export batch to CSV
   */
  exportToCSV: publicProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input }) => {
      try {
        const csv = await exportBatchBillingToCSV(input.jobId);
        return {
          success: true,
          csv,
          filename: `batch-billing-${input.jobId}-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        throw new Error(
          `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Parse CSV import
   */
  parseCSV: publicProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = parseCSVContent(input.content);
        return {
          success: true,
          result,
          message: formatCSVImportResult(result),
        };
      } catch (error) {
        throw new Error(
          `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get CSV template
   */
  getCSVTemplate: publicProcedure.query(async () => {
    try {
      const template = generateCSVTemplate();
      return {
        success: true,
        template,
        filename: "batch-billing-template.csv",
      };
    } catch (error) {
      throw new Error(
        `Failed to get template: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Create batch from CSV
   */
  createFromCSV: publicProcedure
    .input(
      z.object({
        csvContent: z.string(),
        batchName: z.string(),
        batchDescription: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Parse CSV
        const parseResult = parseCSVContent(input.csvContent);

        if (parseResult.validRows === 0) {
          throw new Error("Nenhuma linha válida encontrada no CSV");
        }

        // TODO: Create batch with CSV data
        // This would require additional implementation to handle multiple different
        // due dates and amounts from the CSV

        return {
          success: true,
          message: `Importação iniciada: ${parseResult.validRows} linhas válidas`,
          parseResult,
        };
      } catch (error) {
        throw new Error(
          `Failed to create from CSV: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
