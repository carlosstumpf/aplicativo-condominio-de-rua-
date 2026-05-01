/**
 * Flows Retry Scheduler Database Operations
 * Handles scheduling, managing, and tracking automatic retries for failed flows
 */

import { db } from "./db";
import { flowsRetrySchedules, flowsHistory } from "@/drizzle/schema";
import { eq, and, lt, gte, desc } from "drizzle-orm";

export type RetryScheduleStatus = "pending" | "completed" | "cancelled" | "failed";
export type RetryFrequency = "once" | "daily" | "weekly" | "custom";

export interface CreateRetryScheduleInput {
  flowHistoryId: number;
  moradorId: number;
  scheduledTime: Date;
  frequency?: RetryFrequency;
  maxRetries?: number;
  notes?: string;
}

export interface RetrySchedule {
  id: number;
  flowHistoryId: number;
  moradorId: number;
  scheduledTime: Date;
  frequency: RetryFrequency;
  maxRetries: number;
  attemptsCount: number;
  status: RetryScheduleStatus;
  createdAt: Date;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  completedAt?: Date;
  notes?: string;
}

/**
 * Create a new retry schedule for a failed flow
 */
export async function createRetrySchedule(
  input: CreateRetryScheduleInput
): Promise<RetrySchedule> {
  const [schedule] = await db
    .insert(flowsRetrySchedules)
    .values({
      flowHistoryId: input.flowHistoryId,
      moradorId: input.moradorId,
      scheduledTime: input.scheduledTime,
      frequency: input.frequency || "once",
      maxRetries: input.maxRetries || 3,
      attemptsCount: 0,
      status: "pending",
      createdAt: new Date(),
      notes: input.notes,
    })
    .returning();

  return schedule as RetrySchedule;
}

/**
 * Get all pending retry schedules
 */
export async function getPendingRetrySchedules(): Promise<RetrySchedule[]> {
  const now = new Date();

  const schedules = await db
    .select()
    .from(flowsRetrySchedules)
    .where(
      and(
        eq(flowsRetrySchedules.status, "pending"),
        lte(flowsRetrySchedules.scheduledTime, now)
      )
    )
    .orderBy(flowsRetrySchedules.scheduledTime)
    .limit(100);

  return schedules as RetrySchedule[];
}

/**
 * Get retry schedules for a specific morador
 */
export async function getMoradorRetrySchedules(
  moradorId: number,
  filters?: {
    status?: RetryScheduleStatus;
    limit?: number;
    offset?: number;
  }
): Promise<RetrySchedule[]> {
  let query = db
    .select()
    .from(flowsRetrySchedules)
    .where(eq(flowsRetrySchedules.moradorId, moradorId));

  if (filters?.status) {
    query = query.where(eq(flowsRetrySchedules.status, filters.status));
  }

  query = query.orderBy(desc(flowsRetrySchedules.scheduledTime));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  const schedules = await query;
  return schedules as RetrySchedule[];
}

/**
 * Get a specific retry schedule
 */
export async function getRetrySchedule(
  scheduleId: number
): Promise<RetrySchedule | null> {
  const [schedule] = await db
    .select()
    .from(flowsRetrySchedules)
    .where(eq(flowsRetrySchedules.id, scheduleId));

  return (schedule as RetrySchedule) || null;
}

/**
 * Update retry schedule after an attempt
 */
export async function updateRetryScheduleAfterAttempt(
  scheduleId: number,
  success: boolean,
  nextScheduledTime?: Date
): Promise<RetrySchedule> {
  const schedule = await getRetrySchedule(scheduleId);

  if (!schedule) {
    throw new Error("Retry schedule not found");
  }

  const newAttemptsCount = schedule.attemptsCount + 1;
  const isMaxRetriesReached = newAttemptsCount >= schedule.maxRetries;

  let newStatus: RetryScheduleStatus = "pending";
  if (success) {
    newStatus = "completed";
  } else if (isMaxRetriesReached) {
    newStatus = "failed";
  }

  const [updated] = await db
    .update(flowsRetrySchedules)
    .set({
      attemptsCount: newAttemptsCount,
      status: newStatus,
      lastAttemptAt: new Date(),
      nextAttemptAt: nextScheduledTime,
      completedAt: success ? new Date() : undefined,
    })
    .where(eq(flowsRetrySchedules.id, scheduleId))
    .returning();

  return updated as RetrySchedule;
}

/**
 * Cancel a retry schedule
 */
export async function cancelRetrySchedule(scheduleId: number): Promise<void> {
  await db
    .update(flowsRetrySchedules)
    .set({
      status: "cancelled",
    })
    .where(eq(flowsRetrySchedules.id, scheduleId));
}

/**
 * Get retry schedule statistics for a morador
 */
export async function getRetryScheduleStats(moradorId: number) {
  const schedules = await getMoradorRetrySchedules(moradorId);

  const stats = {
    total: schedules.length,
    pending: schedules.filter((s) => s.status === "pending").length,
    completed: schedules.filter((s) => s.status === "completed").length,
    failed: schedules.filter((s) => s.status === "failed").length,
    cancelled: schedules.filter((s) => s.status === "cancelled").length,
    successRate:
      schedules.length > 0
        ? Math.round(
            (schedules.filter((s) => s.status === "completed").length /
              schedules.length) *
              100
          )
        : 0,
  };

  return stats;
}

/**
 * Calculate next retry time based on frequency
 */
export function calculateNextRetryTime(
  currentTime: Date,
  frequency: RetryFrequency,
  attemptNumber: number
): Date {
  const next = new Date(currentTime);

  switch (frequency) {
    case "once":
      // No next retry
      return new Date(currentTime.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year in future
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "custom":
      // Exponential backoff: 5min, 15min, 1h, 4h, 24h
      const backoffMinutes = [5, 15, 60, 240, 1440];
      const minutes = backoffMinutes[Math.min(attemptNumber - 1, 4)];
      next.setMinutes(next.getMinutes() + minutes);
      break;
  }

  return next;
}

/**
 * Get retry schedules due for execution
 */
export async function getRetrySchedulesDue(
  limit: number = 50
): Promise<(RetrySchedule & { flowHistory: any })[]> {
  const now = new Date();

  const schedules = await db
    .select({
      schedule: flowsRetrySchedules,
      flowHistory: flowsHistory,
    })
    .from(flowsRetrySchedules)
    .leftJoin(
      flowsHistory,
      eq(flowsRetrySchedules.flowHistoryId, flowsHistory.id)
    )
    .where(
      and(
        eq(flowsRetrySchedules.status, "pending"),
        lte(flowsRetrySchedules.scheduledTime, now)
      )
    )
    .orderBy(flowsRetrySchedules.scheduledTime)
    .limit(limit);

  return schedules.map((s) => ({
    ...(s.schedule as RetrySchedule),
    flowHistory: s.flowHistory,
  }));
}

/**
 * Bulk update retry schedules status
 */
export async function bulkUpdateRetrySchedules(
  scheduleIds: number[],
  status: RetryScheduleStatus
): Promise<void> {
  if (scheduleIds.length === 0) return;

  await db
    .update(flowsRetrySchedules)
    .set({
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    })
    .where(
      and(
        eq(flowsRetrySchedules.status, "pending"),
        // Use IN clause for multiple IDs
      )
    );
}

/**
 * Get retry schedule history for a flow
 */
export async function getFlowRetryHistory(
  flowHistoryId: number
): Promise<RetrySchedule[]> {
  const schedules = await db
    .select()
    .from(flowsRetrySchedules)
    .where(eq(flowsRetrySchedules.flowHistoryId, flowHistoryId))
    .orderBy(desc(flowsRetrySchedules.createdAt));

  return schedules as RetrySchedule[];
}

/**
 * Delete old completed retry schedules (older than 90 days)
 */
export async function deleteOldRetrySchedules(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date(
    Date.now() - daysOld * 24 * 60 * 60 * 1000
  );

  const result = await db
    .delete(flowsRetrySchedules)
    .where(
      and(
        eq(flowsRetrySchedules.status, "completed"),
        lt(flowsRetrySchedules.completedAt || new Date(), cutoffDate)
      )
    );

  return result.rowsAffected || 0;
}

/**
 * Get upcoming retry schedules for a morador
 */
export async function getUpcomingRetrySchedules(
  moradorId: number,
  hoursAhead: number = 24
): Promise<RetrySchedule[]> {
  const now = new Date();
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const schedules = await db
    .select()
    .from(flowsRetrySchedules)
    .where(
      and(
        eq(flowsRetrySchedules.moradorId, moradorId),
        eq(flowsRetrySchedules.status, "pending"),
        gte(flowsRetrySchedules.scheduledTime, now),
        lte(flowsRetrySchedules.scheduledTime, future)
      )
    )
    .orderBy(flowsRetrySchedules.scheduledTime);

  return schedules as RetrySchedule[];
}

/**
 * Export retry schedules as CSV
 */
export async function exportRetrySchedulesToCsv(
  moradorId: number,
  filters?: {
    status?: RetryScheduleStatus;
  }
): Promise<string> {
  const schedules = await getMoradorRetrySchedules(moradorId, filters);

  const headers = [
    "ID",
    "Flow ID",
    "Status",
    "Scheduled Time",
    "Attempts",
    "Max Retries",
    "Last Attempt",
    "Next Attempt",
    "Created At",
  ];

  const rows = schedules.map((s) => [
    s.id,
    s.flowHistoryId,
    s.status,
    s.scheduledTime.toISOString(),
    s.attemptsCount,
    s.maxRetries,
    s.lastAttemptAt?.toISOString() || "",
    s.nextAttemptAt?.toISOString() || "",
    s.createdAt.toISOString(),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

  return csv;
}
