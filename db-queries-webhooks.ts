/**
 * Webhook History and Metrics Database Queries
 * Handles logging and tracking of webhook events
 */

import { getDb } from "./db";
import {
  webhookHistory,
  webhookMetrics,
  type InsertWebhookHistoryRecord,
  type WebhookHistoryRecord,
  type WebhookMetrics,
} from "../drizzle/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";

/**
 * Log webhook event to history
 */
export async function logWebhookToHistory(
  data: InsertWebhookHistoryRecord
): Promise<WebhookHistoryRecord | null> {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook DB] Database not available");
    return null;
  }

  try {
    const result = await db.insert(webhookHistory).values(data);
    console.log(`[Webhook DB] Logged webhook event: ${data.event} for payment ${data.asaasPaymentId}`);
    return {
      ...data,
      id: result[0] as any,
      receivedAt: data.receivedAt || new Date(),
      processedAt: data.processedAt || new Date(),
    } as WebhookHistoryRecord;
  } catch (error: any) {
    console.error(`[Webhook DB] Error logging webhook:`, error);
    return null;
  }
}

/**
 * Get webhook history with filters
 */
export async function getWebhookHistory(filtros?: {
  asaasPaymentId?: string;
  event?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook DB] Database not available");
    return { data: [], pagination: { total: 0, page: 1, limit: 10 } };
  }

  try {
    const conditions = [];

    if (filtros?.asaasPaymentId) {
      conditions.push(eq(webhookHistory.asaasPaymentId, filtros.asaasPaymentId));
    }
    if (filtros?.event) {
      conditions.push(eq(webhookHistory.event, filtros.event));
    }
    if (filtros?.success !== undefined) {
      conditions.push(eq(webhookHistory.success, filtros.success ? 1 : 0));
    }
    if (filtros?.startDate) {
      conditions.push(gte(webhookHistory.receivedAt, filtros.startDate));
    }
    if (filtros?.endDate) {
      conditions.push(lte(webhookHistory.receivedAt, filtros.endDate));
    }

    const page = filtros?.page || 1;
    const limit = filtros?.limit || 20;
    const offset = (page - 1) * limit;

    let query: any = db.select().from(webhookHistory);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const total = await db
      .select()
      .from(webhookHistory)
      .then((rows: any) => rows.length);

    const data = await query
      .orderBy(desc(webhookHistory.receivedAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    console.error(`[Webhook DB] Error fetching webhook history:`, error);
    return { data: [], pagination: { total: 0, page: 1, limit: 10 } };
  }
}

/**
 * Get webhook by ID
 */
export async function getWebhookById(id: number): Promise<WebhookHistoryRecord | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(webhookHistory)
      .where(eq(webhookHistory.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error: any) {
    console.error(`[Webhook DB] Error fetching webhook:`, error);
    return null;
  }
}

/**
 * Get failed webhooks for retry
 */
export async function getFailedWebhooksForRetry(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const result = await db
      .select()
      .from(webhookHistory)
      .where(
        and(
          eq(webhookHistory.success, 0),
          lte(webhookHistory.nextRetryAt, now)
        )
      )
      .orderBy(webhookHistory.nextRetryAt)
      .limit(limit);

    return result;
  } catch (error: any) {
    console.error(`[Webhook DB] Error fetching failed webhooks:`, error);
    return [];
  }
}

/**
 * Update webhook retry information
 */
export async function updateWebhookRetry(
  webhookId: number,
  retryCount: number,
  nextRetryAt?: Date,
  success?: boolean,
  errorMessage?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: any = {
      retryCount,
      lastRetryAt: new Date(),
    };

    if (nextRetryAt) {
      updateData.nextRetryAt = nextRetryAt;
    }

    if (success !== undefined) {
      updateData.success = success ? 1 : 0;
    }

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    await db
      .update(webhookHistory)
      .set(updateData)
      .where(eq(webhookHistory.id, webhookId));

    console.log(`[Webhook DB] Updated webhook ${webhookId} retry info`);
    return true;
  } catch (error: any) {
    console.error(`[Webhook DB] Error updating webhook retry:`, error);
    return false;
  }
}

/**
 * Get webhook metrics for a date
 */
export async function getWebhookMetricsForDate(date: string): Promise<WebhookMetrics | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(webhookMetrics)
      .where(eq(webhookMetrics.date, date))
      .limit(1);

    return result[0] || null;
  } catch (error: any) {
    console.error(`[Webhook DB] Error fetching metrics:`, error);
    return null;
  }
}

/**
 * Update or create webhook metrics
 */
export async function updateWebhookMetrics(
  date: string,
  updates: Partial<Omit<WebhookMetrics, "id" | "date" | "createdAt" | "updatedAt">>
): Promise<WebhookMetrics | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const existing = await getWebhookMetricsForDate(date);

    if (existing) {
      await db
        .update(webhookMetrics)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(webhookMetrics.date, date));

      return {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };
    } else {
      const result = await db.insert(webhookMetrics).values({
        date,
        ...updates,
      } as any);

      return {
        id: result[0] as any,
        date,
        ...updates,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WebhookMetrics;
    }
  } catch (error: any) {
    console.error(`[Webhook DB] Error updating metrics:`, error);
    return null;
  }
}

/**
 * Get webhook metrics for date range
 */
export async function getWebhookMetricsRange(
  startDate: string,
  endDate: string
): Promise<WebhookMetrics[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(webhookMetrics)
      .where(
        and(
          gte(webhookMetrics.date, startDate),
          lte(webhookMetrics.date, endDate)
        )
      )
      .orderBy(webhookMetrics.date);

    return result;
  } catch (error: any) {
    console.error(`[Webhook DB] Error fetching metrics range:`, error);
    return [];
  }
}

/**
 * Get webhook statistics
 */
export async function getWebhookStatistics(days: number = 30) {
  const db = await getDb();
  if (!db) {
    return {
      totalReceived: 0,
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      statusUpdatedCount: 0,
      notificationCreatedCount: 0,
    };
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select()
      .from(webhookHistory)
      .where(gte(webhookHistory.receivedAt, startDate));

    const totalReceived = result.length;
    const totalProcessed = result.filter((r: any) => r.processedAt).length;
    const totalSuccessful = result.filter((r: any) => r.success === 1).length;
    const totalFailed = result.filter((r: any) => r.success === 0).length;
    const statusUpdatedCount = result.filter((r: any) => r.statusUpdated === 1).length;
    const notificationCreatedCount = result.filter((r: any) => r.notificationCreated === 1).length;

    const processingTimes = result
      .filter((r: any) => r.receivedAt && r.processedAt)
      .map(
        (r: any) =>
          new Date(r.processedAt).getTime() - new Date(r.receivedAt).getTime()
      );

    const averageProcessingTime =
      processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a: number, b: number) => a + b, 0) / processingTimes.length)
        : 0;

    return {
      totalReceived,
      totalProcessed,
      totalSuccessful,
      totalFailed,
      successRate: totalProcessed > 0 ? Math.round((totalSuccessful / totalProcessed) * 100) : 0,
      averageProcessingTime,
      statusUpdatedCount,
      notificationCreatedCount,
    };
  } catch (error: any) {
    console.error(`[Webhook DB] Error calculating statistics:`, error);
    return {
      totalReceived: 0,
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      statusUpdatedCount: 0,
      notificationCreatedCount: 0,
    };
  }
}

/**
 * Clear old webhook history (retention policy)
 */
export async function clearOldWebhookHistory(daysToKeep: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await db
      .delete(webhookHistory)
      .where(lte(webhookHistory.receivedAt, cutoffDate));

    console.log(`[Webhook DB] Cleared webhook history older than ${daysToKeep} days`);
    return 1;
  } catch (error: any) {
    console.error(`[Webhook DB] Error clearing old webhook history:`, error);
    return 0;
  }
}
