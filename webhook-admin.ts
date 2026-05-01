/**
 * Webhook Administration Router
 * tRPC endpoints for managing webhooks, viewing history, and monitoring metrics
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as webhookDb from "../db-queries-webhooks";
import {
  manualRetryWebhook,
  getRetryStatistics,
  processFailedWebhooks,
} from "../_core/asaas-webhook-retry";
import { getWebhookStatistics } from "../db-queries-webhooks";

export const webhookAdminRouter = router({
  /**
   * Get webhook history with filters
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        asaasPaymentId: z.string().optional(),
        event: z.string().optional(),
        success: z.boolean().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await webhookDb.getWebhookHistory({
          page: input.page,
          limit: input.limit,
          asaasPaymentId: input.asaasPaymentId,
          event: input.event,
          success: input.success,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          success: true,
          data: result.data,
          pagination: result.pagination,
        };
      } catch (error: any) {
        throw new Error(`Failed to get webhook history: ${error.message}`);
      }
    }),

  /**
   * Get webhook details by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const webhook = await webhookDb.getWebhookById(input.id);

        if (!webhook) {
          throw new Error(`Webhook ${input.id} not found`);
        }

        // Parse payload if it's a string
        let payload = webhook.payload;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }

        return {
          success: true,
          data: {
            ...webhook,
            payload,
          },
        };
      } catch (error: any) {
        throw new Error(`Failed to get webhook: ${error.message}`);
      }
    }),

  /**
   * Get failed webhooks ready for retry
   */
  getFailedWebhooks: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      try {
        const webhooks = await webhookDb.getFailedWebhooksForRetry(input.limit);

        return {
          success: true,
          data: webhooks,
          count: webhooks.length,
        };
      } catch (error: any) {
        throw new Error(`Failed to get failed webhooks: ${error.message}`);
      }
    }),

  /**
   * Manually retry a webhook
   */
  retryWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await manualRetryWebhook(input.webhookId);

        return {
          success: result.success,
          message: result.message,
        };
      } catch (error: any) {
        throw new Error(`Failed to retry webhook: ${error.message}`);
      }
    }),

  /**
   * Process all failed webhooks immediately
   */
  processFailedWebhooks: protectedProcedure.mutation(async () => {
    try {
      const result = await processFailedWebhooks();

      return {
        success: true,
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
      };
    } catch (error: any) {
      throw new Error(`Failed to process webhooks: ${error.message}`);
    }
  }),

  /**
   * Get webhook statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      try {
        const stats = await getWebhookStatistics(input.days);

        return {
          success: true,
          data: stats,
        };
      } catch (error: any) {
        throw new Error(`Failed to get statistics: ${error.message}`);
      }
    }),

  /**
   * Get retry statistics
   */
  getRetryStatistics: protectedProcedure.query(async () => {
    try {
      const stats = await getRetryStatistics();

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      throw new Error(`Failed to get retry statistics: ${error.message}`);
    }
  }),

  /**
   * Get metrics for date range
   */
  getMetricsRange: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ input }) => {
      try {
        const metrics = await webhookDb.getWebhookMetricsRange(
          input.startDate,
          input.endDate
        );

        return {
          success: true,
          data: metrics,
        };
      } catch (error: any) {
        throw new Error(`Failed to get metrics: ${error.message}`);
      }
    }),

  /**
   * Get metrics for specific date
   */
  getMetricsForDate: protectedProcedure
    .input(z.object({ date: z.string() })) // YYYY-MM-DD
    .query(async ({ input }) => {
      try {
        const metrics = await webhookDb.getWebhookMetricsForDate(input.date);

        return {
          success: true,
          data: metrics,
        };
      } catch (error: any) {
        throw new Error(`Failed to get metrics: ${error.message}`);
      }
    }),

  /**
   * Get webhook events summary
   */
  getEventsSummary: protectedProcedure.query(async () => {
    try {
      const result = await webhookDb.getWebhookHistory({
        limit: 1000,
      });

      // Group by event
      const eventCounts: Record<string, number> = {};
      const eventSuccess: Record<string, number> = {};

      for (const webhook of result.data) {
        const event = webhook.event;
        eventCounts[event] = (eventCounts[event] || 0) + 1;
        if (webhook.success === 1) {
          eventSuccess[event] = (eventSuccess[event] || 0) + 1;
        }
      }

      const summary = Object.entries(eventCounts).map(([event, count]) => ({
        event,
        total: count,
        successful: eventSuccess[event] || 0,
        failed: count - (eventSuccess[event] || 0),
        successRate:
          count > 0
            ? Math.round(((eventSuccess[event] || 0) / count) * 100)
            : 0,
      }));

      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      throw new Error(`Failed to get events summary: ${error.message}`);
    }
  }),

  /**
   * Clear old webhook history
   */
  clearOldHistory: protectedProcedure
    .input(z.object({ daysToKeep: z.number().default(90) }))
    .mutation(async ({ input }) => {
      try {
        const deleted = await webhookDb.clearOldWebhookHistory(input.daysToKeep);

        return {
          success: true,
          message: `Deleted ${deleted} old webhook records`,
          deleted,
        };
      } catch (error: any) {
        throw new Error(`Failed to clear history: ${error.message}`);
      }
    }),
});
