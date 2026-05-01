/**
 * Webhook Selective Retry Module
 * Handle retrying webhooks filtered by type
 */

import { db } from "../_core/db";
import { webhookHistory } from "../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { asaasAdapter } from "./asaas-adapter";

export type WebhookType = string;

interface SelectiveRetryOptions {
  types?: WebhookType[];
  maxRetries?: number;
  limit?: number;
}

interface SelectiveRetryResult {
  processed: number;
  failed: number;
  skipped: number;
  errors: Array<{
    webhookId: number;
    error: string;
  }>;
}

/**
 * Get failed webhooks filtered by type
 */
export async function getFailedWebhooksByType(
  types?: WebhookType[],
  limit = 100
): Promise<
  Array<{
    id: number;
    event: string;
    payload: string;
    retryCount: number;
  }>
> {
  try {
    const conditions = [eq(webhookHistory.status, "failed")];

    if (types && types.length > 0) {
      conditions.push(inArray(webhookHistory.event, types));
    }

    const failed = await db
      .select({
        id: webhookHistory.id,
        event: webhookHistory.event,
        payload: webhookHistory.payload,
        retryCount: webhookHistory.retryCount,
      })
      .from(webhookHistory)
      .where(and(...conditions))
      .limit(limit);

    return failed;
  } catch (error) {
    console.error("[Webhook Selective Retry] Error fetching failed webhooks:", error);
    return [];
  }
}

/**
 * Get failure count by type
 */
export async function getFailureCountByType(
  types?: WebhookType[]
): Promise<Record<string, number>> {
  try {
    const conditions = [eq(webhookHistory.status, "failed")];

    if (types && types.length > 0) {
      conditions.push(inArray(webhookHistory.event, types));
    }

    const failed = await db
      .select({
        event: webhookHistory.event,
      })
      .from(webhookHistory)
      .where(and(...conditions));

    const counts: Record<string, number> = {};
    failed.forEach((record) => {
      counts[record.event] = (counts[record.event] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error("[Webhook Selective Retry] Error counting failures by type:", error);
    return {};
  }
}

/**
 * Retry failed webhooks filtered by type
 */
export async function retryFailedWebhooksByType(
  options: SelectiveRetryOptions = {}
): Promise<SelectiveRetryResult> {
  const { types, maxRetries = 5, limit = 100 } = options;

  console.log("[Webhook Selective Retry] Starting selective retry", {
    types: types?.length || "all",
    limit,
  });

  const result: SelectiveRetryResult = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get failed webhooks
    const failedWebhooks = await getFailedWebhooksByType(types, limit);

    if (failedWebhooks.length === 0) {
      console.log("[Webhook Selective Retry] No failed webhooks found");
      return result;
    }

    // Process each webhook
    for (const webhook of failedWebhooks) {
      try {
        // Check retry limit
        if (webhook.retryCount >= maxRetries) {
          console.log(`[Webhook Selective Retry] Webhook ${webhook.id} exceeded max retries`);
          result.skipped++;
          continue;
        }

        // Parse payload
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(webhook.payload);
        } catch (e) {
          console.error(`[Webhook Selective Retry] Failed to parse payload for webhook ${webhook.id}`);
          result.errors.push({
            webhookId: webhook.id,
            error: "Invalid payload JSON",
          });
          result.failed++;
          continue;
        }

        // Retry webhook based on type
        let retrySuccess = false;
        if (webhook.event.startsWith("payment.")) {
          // Retry payment webhook
          const asaasPaymentId = payload.asaasPaymentId as string;
          if (asaasPaymentId) {
            try {
              const payment = await asaasAdapter.getPayment(asaasPaymentId);
              if (payment) {
                retrySuccess = true;
              }
            } catch (e) {
              console.error(`[Webhook Selective Retry] Failed to retry payment webhook ${webhook.id}:`, e);
            }
          }
        } else if (webhook.event.startsWith("notification.")) {
          // Retry notification webhook
          retrySuccess = true; // Notifications are typically fire-and-forget
        } else if (webhook.event.startsWith("status.")) {
          // Retry status update webhook
          retrySuccess = true;
        }

        if (retrySuccess) {
          // Update webhook status
          await db
            .update(webhookHistory)
            .set({
              retryCount: webhook.retryCount + 1,
              status: "pending",
              lastRetryAt: new Date(),
            })
            .where(eq(webhookHistory.id, webhook.id));

          result.processed++;
          console.log(
            `[Webhook Selective Retry] Successfully retried webhook ${webhook.id} (${webhook.event})`
          );
        } else {
          result.failed++;
          result.errors.push({
            webhookId: webhook.id,
            error: "Retry operation failed",
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          webhookId: webhook.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(`[Webhook Selective Retry] Error processing webhook ${webhook.id}:`, error);
      }
    }

    console.log("[Webhook Selective Retry] Selective retry completed", result);
    return result;
  } catch (error) {
    console.error("[Webhook Selective Retry] Fatal error during selective retry:", error);
    throw error;
  }
}

/**
 * Get retry statistics by type
 */
export async function getRetryStatisticsByType(
  types?: WebhookType[]
): Promise<{
  byType: Record<
    string,
    {
      total: number;
      readyForRetry: number;
      maxRetriesExceeded: number;
      averageRetries: number;
    }
  >;
  overall: {
    total: number;
    readyForRetry: number;
    maxRetriesExceeded: number;
    averageRetries: number;
  };
}> {
  try {
    const conditions = [eq(webhookHistory.status, "failed")];

    if (types && types.length > 0) {
      conditions.push(inArray(webhookHistory.event, types));
    }

    const failed = await db
      .select({
        event: webhookHistory.event,
        retryCount: webhookHistory.retryCount,
        nextRetryAt: webhookHistory.nextRetryAt,
      })
      .from(webhookHistory)
      .where(and(...conditions));

    const now = new Date();
    const byType: Record<
      string,
      {
        total: number;
        readyForRetry: number;
        maxRetriesExceeded: number;
        averageRetries: number;
      }
    > = {};

    let overallTotal = 0;
    let overallReadyForRetry = 0;
    let overallMaxRetriesExceeded = 0;
    let totalRetries = 0;

    failed.forEach((record) => {
      const isReadyForRetry = !record.nextRetryAt || record.nextRetryAt <= now;
      const isMaxRetriesExceeded = record.retryCount >= 5;

      if (!byType[record.event]) {
        byType[record.event] = {
          total: 0,
          readyForRetry: 0,
          maxRetriesExceeded: 0,
          averageRetries: 0,
        };
      }

      byType[record.event].total++;
      if (isReadyForRetry) byType[record.event].readyForRetry++;
      if (isMaxRetriesExceeded) byType[record.event].maxRetriesExceeded++;

      overallTotal++;
      if (isReadyForRetry) overallReadyForRetry++;
      if (isMaxRetriesExceeded) overallMaxRetriesExceeded++;
      totalRetries += record.retryCount;
    });

    // Calculate averages
    Object.keys(byType).forEach((type) => {
      const typeRecords = failed.filter((r) => r.event === type);
      byType[type].averageRetries =
        typeRecords.length > 0
          ? typeRecords.reduce((sum, r) => sum + r.retryCount, 0) / typeRecords.length
          : 0;
    });

    return {
      byType,
      overall: {
        total: overallTotal,
        readyForRetry: overallReadyForRetry,
        maxRetriesExceeded: overallMaxRetriesExceeded,
        averageRetries: overallTotal > 0 ? totalRetries / overallTotal : 0,
      },
    };
  } catch (error) {
    console.error("[Webhook Selective Retry] Error getting retry statistics:", error);
    return {
      byType: {},
      overall: {
        total: 0,
        readyForRetry: 0,
        maxRetriesExceeded: 0,
        averageRetries: 0,
      },
    };
  }
}
