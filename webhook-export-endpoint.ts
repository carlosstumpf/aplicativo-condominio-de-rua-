/**
 * Webhook Export Endpoint
 * tRPC procedures for exporting webhook data
 */

import { z } from "zod";
import { protectedProcedure } from "../_core/trpc";
import {
  webhooksToCSV,
  createExportSummary,
  getExportStatistics,
  formatFileSize,
  calculateCSVSize,
} from "./webhook-csv-export";
import { searchWebhooks } from "./webhook-search";
import { db } from "./db";
import { webhookHistory } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

/**
 * Export webhook search results as CSV
 */
export const exportWebhookSearchResults = protectedProcedure
  .input(
    z.object({
      query: z.string().min(3).max(100),
      type: z.enum(["payment", "customer", "all"]).default("all"),
      dateFormat: z.enum(["ISO", "BR", "US"]).default("ISO"),
      delimiter: z.enum([",", ";", "\t"]).default(";"),
      includeErrors: z.boolean().default(true),
      includePayload: z.boolean().default(false),
      limit: z.number().default(1000),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log("[Webhook Export] Starting export for query:", input.query);

      // Search webhooks
      const results = await searchWebhooks(input.query, input.type, {
        limit: input.limit,
      });

      if (results.length === 0) {
        return {
          success: false,
          error: "Nenhum webhook encontrado para exportar",
          data: null,
        };
      }

      // Generate CSV
      const csv = webhooksToCSV(results as any, {
        dateFormat: input.dateFormat as "ISO" | "BR" | "US",
        delimiter: input.delimiter as "," | ";" | "\t",
        includeErrors: input.includeErrors,
        includePayload: input.includePayload,
      });

      // Calculate statistics
      const summary = createExportSummary(results as any);
      const statistics = getExportStatistics(results as any);
      const fileSize = calculateCSVSize(results as any, {
        dateFormat: input.dateFormat as "ISO" | "BR" | "US",
      });

      console.log(`[Webhook Export] Export successful. Records: ${results.length}, Size: ${formatFileSize(fileSize)}`);

      return {
        success: true,
        data: {
          csv,
          filename: `webhooks_${new Date().toISOString().split("T")[0]}.csv`,
          summary,
          statistics,
          fileSize: formatFileSize(fileSize),
          recordCount: results.length,
        },
      };
    } catch (error) {
      console.error("[Webhook Export] Error exporting webhooks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao exportar webhooks",
        data: null,
      };
    }
  });

/**
 * Export all webhooks with optional filters
 */
export const exportAllWebhooks = protectedProcedure
  .input(
    z.object({
      status: z.enum(["success", "failed", "all"]).default("all"),
      dateRange: z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
        .optional(),
      dateFormat: z.enum(["ISO", "BR", "US"]).default("ISO"),
      delimiter: z.enum([",", ";", "\t"]).default(";"),
      includeErrors: z.boolean().default(true),
      limit: z.number().default(5000),
    })
  )
  .mutation(async ({ input }) => {
    try {
      console.log("[Webhook Export] Starting bulk export");

      let query = db.select().from(webhookHistory);

      // Apply status filter
      if (input.status === "success") {
        query = query.where(sql`${webhookHistory.success} = 1`);
      } else if (input.status === "failed") {
        query = query.where(sql`${webhookHistory.success} = 0`);
      }

      // Apply date range filter
      if (input.dateRange?.from) {
        query = query.where(sql`${webhookHistory.receivedAt} >= ${input.dateRange.from}`);
      }
      if (input.dateRange?.to) {
        query = query.where(sql`${webhookHistory.receivedAt} <= ${input.dateRange.to}`);
      }

      // Apply limit
      const results = await query.limit(input.limit);

      if (results.length === 0) {
        return {
          success: false,
          error: "Nenhum webhook encontrado para exportar",
          data: null,
        };
      }

      // Generate CSV
      const csv = webhooksToCSV(results as any, {
        dateFormat: input.dateFormat as "ISO" | "BR" | "US",
        delimiter: input.delimiter as "," | ";" | "\t",
        includeErrors: input.includeErrors,
      });

      // Calculate statistics
      const summary = createExportSummary(results as any);
      const statistics = getExportStatistics(results as any);
      const fileSize = calculateCSVSize(results as any, {
        dateFormat: input.dateFormat as "ISO" | "BR" | "US",
      });

      console.log(`[Webhook Export] Bulk export successful. Records: ${results.length}`);

      return {
        success: true,
        data: {
          csv,
          filename: `webhooks_all_${new Date().toISOString().split("T")[0]}.csv`,
          summary,
          statistics,
          fileSize: formatFileSize(fileSize),
          recordCount: results.length,
        },
      };
    } catch (error) {
      console.error("[Webhook Export] Error exporting all webhooks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao exportar webhooks",
        data: null,
      };
    }
  });

/**
 * Get export preview
 */
export const getExportPreview = protectedProcedure
  .input(
    z.object({
      query: z.string().min(3).max(100),
      type: z.enum(["payment", "customer", "all"]).default("all"),
      limit: z.number().default(100),
    })
  )
  .query(async ({ input }) => {
    try {
      console.log("[Webhook Export] Getting export preview");

      const results = await searchWebhooks(input.query, input.type, {
        limit: input.limit,
      });

      const summary = createExportSummary(results as any);
      const statistics = getExportStatistics(results as any);

      return {
        success: true,
        data: {
          recordCount: results.length,
          summary,
          statistics,
          preview: results.slice(0, 5), // Show first 5 records
        },
      };
    } catch (error) {
      console.error("[Webhook Export] Error getting export preview:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao obter preview",
        data: null,
      };
    }
  });

/**
 * Get export statistics
 */
export const getExportStats = protectedProcedure
  .input(
    z.object({
      dateRange: z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
        .optional(),
    })
  )
  .query(async ({ input }) => {
    try {
      console.log("[Webhook Export] Getting export statistics");

      let query = db.select().from(webhookHistory);

      if (input.dateRange?.from) {
        query = query.where(sql`${webhookHistory.receivedAt} >= ${input.dateRange.from}`);
      }
      if (input.dateRange?.to) {
        query = query.where(sql`${webhookHistory.receivedAt} <= ${input.dateRange.to}`);
      }

      const results = await query;

      if (results.length === 0) {
        return {
          success: true,
          data: {
            totalRecords: 0,
            summary: null,
            statistics: null,
          },
        };
      }

      const summary = createExportSummary(results as any);
      const statistics = getExportStatistics(results as any);

      return {
        success: true,
        data: {
          totalRecords: results.length,
          summary,
          statistics,
        },
      };
    } catch (error) {
      console.error("[Webhook Export] Error getting statistics:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao obter estatísticas",
        data: null,
      };
    }
  });
