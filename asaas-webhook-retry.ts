/**
 * Asaas Webhook Retry Mechanism
 * Handles retry logic with exponential backoff for failed webhooks
 */

import {
  getFailedWebhooksForRetry,
  updateWebhookRetry,
  getWebhookById,
} from "../db-queries-webhooks";
import {
  handlePaymentStatusUpdate,
  handlePaymentNotification,
  logWebhookEvent as logDbWebhookEvent,
} from "./asaas-webhook-db";
import {
  calculateNextRetryTime,
  logWebhookRetry,
} from "./asaas-webhook-logging";

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 60000; // Check every minute

let retryInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start webhook retry scheduler
 */
export function startWebhookRetryScheduler(): void {
  if (retryInterval) {
    console.log("[Webhook Retry] Retry scheduler already running");
    return;
  }

  console.log("[Webhook Retry] Starting webhook retry scheduler");

  retryInterval = setInterval(async () => {
    try {
      await processFailedWebhooks();
    } catch (error: any) {
      console.error("[Webhook Retry] Error in retry scheduler:", error);
    }
  }, RETRY_INTERVAL_MS);
}

/**
 * Stop webhook retry scheduler
 */
export function stopWebhookRetryScheduler(): void {
  if (retryInterval) {
    clearInterval(retryInterval);
    retryInterval = null;
    console.log("[Webhook Retry] Webhook retry scheduler stopped");
  }
}

/**
 * Process failed webhooks that are ready for retry
 */
export async function processFailedWebhooks(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  try {
    const failedWebhooks = await getFailedWebhooksForRetry(10);

    if (failedWebhooks.length === 0) {
      return { processed: 0, successful: 0, failed: 0 };
    }

    console.log(`[Webhook Retry] Processing ${failedWebhooks.length} failed webhooks`);

    let successful = 0;
    let failed = 0;

    for (const webhook of failedWebhooks) {
      const result = await retryWebhook(webhook);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    console.log(
      `[Webhook Retry] Processed ${failedWebhooks.length} webhooks - Success: ${successful}, Failed: ${failed}`
    );

    return {
      processed: failedWebhooks.length,
      successful,
      failed,
    };
  } catch (error: any) {
    console.error("[Webhook Retry] Error processing failed webhooks:", error);
    return { processed: 0, successful: 0, failed: 0 };
  }
}

/**
 * Retry a single webhook
 */
export async function retryWebhook(webhook: any): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { id, asaasPaymentId, event, asaasStatus, payload, retryCount } = webhook;

    console.log(
      `[Webhook Retry] Retrying webhook ${id} (attempt ${retryCount + 1}/${MAX_RETRIES})`
    );

    // Parse payload
    let paymentData: any = {};
    try {
      paymentData = typeof payload === "string" ? JSON.parse(payload) : payload;
    } catch (e) {
      console.warn("[Webhook Retry] Could not parse webhook payload");
    }

    // Attempt to update payment status
    const statusResult = await handlePaymentStatusUpdate(
      asaasPaymentId,
      asaasStatus,
      paymentData
    );

    // Attempt to create notification
    const notificationResult = await handlePaymentNotification(
      asaasPaymentId,
      event,
      paymentData
    );

    const success = statusResult.success && notificationResult.success;
    const newRetryCount = retryCount + 1;

    if (success) {
      // Update webhook as successful
      await updateWebhookRetry(id, newRetryCount, undefined, true);
      await logWebhookRetry(id, newRetryCount, true);

      console.log(
        `[Webhook Retry] Webhook ${id} retry successful on attempt ${newRetryCount}`
      );

      return { success: true };
    } else {
      // Check if we should retry again
      if (newRetryCount < MAX_RETRIES) {
        const nextRetryAt = calculateNextRetryTime(newRetryCount);
        const errorMsg = `Status update: ${statusResult.error || "OK"}, Notification: ${notificationResult.error || "OK"}`;

        await updateWebhookRetry(id, newRetryCount, nextRetryAt, false, errorMsg);
        await logWebhookRetry(id, newRetryCount, false, errorMsg);

        console.log(
          `[Webhook Retry] Webhook ${id} retry failed, scheduled next retry at ${nextRetryAt}`
        );

        return { success: false, error: "Retry scheduled" };
      } else {
        // Max retries exceeded
        const errorMsg = `Max retries (${MAX_RETRIES}) exceeded`;
        await updateWebhookRetry(id, newRetryCount, undefined, false, errorMsg);
        await logWebhookRetry(id, newRetryCount, false, errorMsg);

        console.error(
          `[Webhook Retry] Webhook ${id} max retries exceeded, giving up`
        );

        return { success: false, error: errorMsg };
      }
    }
  } catch (error: any) {
    console.error(`[Webhook Retry] Error retrying webhook:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Manually retry a specific webhook
 */
export async function manualRetryWebhook(webhookId: number): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const webhook = await getWebhookById(webhookId);

    if (!webhook) {
      return {
        success: false,
        message: `Webhook ${webhookId} not found`,
      };
    }

    if (webhook.retryCount >= MAX_RETRIES) {
      return {
        success: false,
        message: `Webhook has exceeded maximum retries (${MAX_RETRIES})`,
      };
    }

    const result = await retryWebhook(webhook);

    return {
      success: result.success,
      message: result.success
        ? `Webhook ${webhookId} retried successfully`
        : `Webhook ${webhookId} retry failed: ${result.error}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error retrying webhook: ${error.message}`,
    };
  }
}

/**
 * Get retry statistics
 */
export async function getRetryStatistics(): Promise<{
  totalFailed: number;
  readyForRetry: number;
  maxRetriesExceeded: number;
  averageRetries: number;
}> {
  try {
    const failedWebhooks = await getFailedWebhooksForRetry(1000);

    const readyForRetry = failedWebhooks.filter(
      (w: any) => w.nextRetryAt && new Date(w.nextRetryAt) <= new Date()
    ).length;

    const maxRetriesExceeded = failedWebhooks.filter(
      (w: any) => w.retryCount >= MAX_RETRIES
    ).length;

    const averageRetries =
      failedWebhooks.length > 0
        ? Math.round(
            failedWebhooks.reduce((sum: number, w: any) => sum + w.retryCount, 0) /
              failedWebhooks.length
          )
        : 0;

    return {
      totalFailed: failedWebhooks.length,
      readyForRetry,
      maxRetriesExceeded,
      averageRetries,
    };
  } catch (error: any) {
    console.error("[Webhook Retry] Error getting retry statistics:", error);
    return {
      totalFailed: 0,
      readyForRetry: 0,
      maxRetriesExceeded: 0,
      averageRetries: 0,
    };
  }
}
