/**
 * Asaas Webhook Logging and Metrics
 * Logs webhook events and collects metrics for dashboard
 */

import {
  logWebhookToHistory,
  updateWebhookMetrics,
  getWebhookMetricsForDate,
} from "../db-queries-webhooks";
import { type InsertWebhookHistoryRecord } from "../../drizzle/schema";

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Calculate next retry time with exponential backoff
 */
export function calculateNextRetryTime(retryCount: number): Date {
  // Exponential backoff: 5 min, 15 min, 1 hour, 4 hours, 24 hours
  const delays = [5, 15, 60, 240, 1440]; // minutes
  const delayMinutes = delays[Math.min(retryCount, delays.length - 1)];
  const nextRetry = new Date();
  nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
  return nextRetry;
}

/**
 * Log webhook event and update metrics
 */
export async function logWebhookEvent(
  asaasPaymentId: string,
  event: string,
  asaasStatus: string,
  internalStatus: string,
  success: boolean,
  statusUpdated: boolean,
  notificationCreated: boolean,
  errorMessage?: string,
  payload?: any
): Promise<void> {
  try {
    const now = new Date();
    const date = formatDate(now);

    // Log to webhook history
    const webhookRecord: InsertWebhookHistoryRecord = {
      asaasPaymentId,
      event,
      asaasStatus,
      internalStatus: internalStatus as any,
      payload: JSON.stringify(payload || {}),
      statusCode: 200,
      success: success ? 1 : 0,
      errorMessage: errorMessage || null,
      statusUpdated: statusUpdated ? 1 : 0,
      notificationCreated: notificationCreated ? 1 : 0,
      retryCount: 0,
      nextRetryAt: success ? null : calculateNextRetryTime(0),
      lastRetryAt: null,
      receivedAt: now,
      processedAt: now,
    };

    await logWebhookToHistory(webhookRecord);

    // Update metrics
    const metrics = await getWebhookMetricsForDate(date);

    const updates: any = {
      totalReceived: (metrics?.totalReceived || 0) + 1,
      totalProcessed: (metrics?.totalProcessed || 0) + 1,
      totalSuccessful: (metrics?.totalSuccessful || 0) + (success ? 1 : 0),
      totalFailed: (metrics?.totalFailed || 0) + (success ? 0 : 1),
      statusUpdatedCount: (metrics?.statusUpdatedCount || 0) + (statusUpdated ? 1 : 0),
      notificationCreatedCount:
        (metrics?.notificationCreatedCount || 0) + (notificationCreated ? 1 : 0),
      errorCount: (metrics?.errorCount || 0) + (errorMessage ? 1 : 0),
    };

    await updateWebhookMetrics(date, updates);

    console.log(
      `[Webhook Logging] Logged event: ${event} for payment ${asaasPaymentId} - Success: ${success}`
    );
  } catch (error: any) {
    console.error(`[Webhook Logging] Error logging webhook event:`, error);
  }
}

/**
 * Log webhook retry attempt
 */
export async function logWebhookRetry(
  webhookId: number,
  retryCount: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    const now = new Date();
    const date = formatDate(now);

    // Update metrics for retry
    const metrics = await getWebhookMetricsForDate(date);

    const updates: any = {
      totalRetried: (metrics?.totalRetried || 0) + 1,
      totalSuccessful: (metrics?.totalSuccessful || 0) + (success ? 1 : 0),
      totalFailed: (metrics?.totalFailed || 0) + (success ? 0 : 1),
    };

    if (errorMessage) {
      updates.errorCount = (metrics?.errorCount || 0) + 1;
    }

    await updateWebhookMetrics(date, updates);

    console.log(
      `[Webhook Logging] Logged retry: webhook ${webhookId}, attempt ${retryCount}, success: ${success}`
    );
  } catch (error: any) {
    console.error(`[Webhook Logging] Error logging webhook retry:`, error);
  }
}

/**
 * Get webhook event summary
 */
export function getEventSummary(event: string): {
  title: string;
  description: string;
  severity: "info" | "warning" | "error" | "success";
} {
  const summaries: Record<
    string,
    { title: string; description: string; severity: "info" | "warning" | "error" | "success" }
  > = {
    "payment.received": {
      title: "Pagamento Recebido",
      description: "Pagamento foi recebido com sucesso",
      severity: "success",
    },
    "payment.confirmed": {
      title: "Pagamento Confirmado",
      description: "Pagamento foi confirmado",
      severity: "success",
    },
    "payment.pending": {
      title: "Pagamento Pendente",
      description: "Pagamento está aguardando processamento",
      severity: "info",
    },
    "payment.overdue": {
      title: "Pagamento Vencido",
      description: "Prazo de pagamento foi excedido",
      severity: "warning",
    },
    "payment.refunded": {
      title: "Pagamento Reembolsado",
      description: "Pagamento foi reembolsado",
      severity: "info",
    },
    "payment.deleted": {
      title: "Pagamento Cancelado",
      description: "Pagamento foi cancelado",
      severity: "warning",
    },
    "payment.chargeback_requested": {
      title: "Chargeback Solicitado",
      description: "Cliente solicitou chargeback",
      severity: "error",
    },
    "payment.chargeback_dispute": {
      title: "Chargeback em Disputa",
      description: "Chargeback está em disputa",
      severity: "error",
    },
    "payment.chargeback_reversal": {
      title: "Chargeback Revertido",
      description: "Chargeback foi revertido",
      severity: "success",
    },
  };

  return (
    summaries[event] || {
      title: "Evento Desconhecido",
      description: `Evento: ${event}`,
      severity: "info",
    }
  );
}
