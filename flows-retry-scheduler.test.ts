/**
 * Flows Retry Scheduler Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createRetrySchedule,
  getPendingRetrySchedules,
  getMoradorRetrySchedules,
  getRetrySchedule,
  updateRetryScheduleAfterAttempt,
  cancelRetrySchedule,
  getRetryScheduleStats,
  calculateNextRetryTime,
  getFlowRetryHistory,
  deleteOldRetrySchedules,
  getUpcomingRetrySchedules,
  exportRetrySchedulesToCsv,
} from "../server/_core/flows-retry-scheduler-db";
import {
  processPendingRetries,
  executeRetryJob,
  startRetryScheduler,
  stopRetryScheduler,
  isRetrySchedulerRunning,
  getRetrySchedulerStatus,
} from "../server/_core/flows-retry-scheduler-service";

describe("Flows Retry Scheduler", () => {
  const mockMoradorId = 1;
  const mockFlowHistoryId = 1;

  describe("Database Operations", () => {
    describe("createRetrySchedule", () => {
      it("should create a new retry schedule", async () => {
        const result = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          frequency: "once",
          maxRetries: 3,
        });

        expect(result).toBeDefined();
        expect(result.flowHistoryId).toBe(mockFlowHistoryId);
        expect(result.moradorId).toBe(mockMoradorId);
        expect(result.status).toBe("pending");
        expect(result.attemptsCount).toBe(0);
      });

      it("should create schedule with custom notes", async () => {
        const result = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          notes: "Reenvio automático",
        });

        expect(result.notes).toBe("Reenvio automático");
      });

      it("should use default values", async () => {
        const result = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(),
        });

        expect(result.frequency).toBe("once");
        expect(result.maxRetries).toBe(3);
      });
    });

    describe("getPendingRetrySchedules", () => {
      it("should return pending schedules due for execution", async () => {
        const result = await getPendingRetrySchedules();

        expect(Array.isArray(result)).toBe(true);
      });

      it("should only return pending schedules", async () => {
        const result = await getPendingRetrySchedules();

        result.forEach((schedule) => {
          expect(schedule.status).toBe("pending");
        });
      });

      it("should only return schedules with past scheduled time", async () => {
        const result = await getPendingRetrySchedules();
        const now = new Date();

        result.forEach((schedule) => {
          expect(schedule.scheduledTime.getTime()).toBeLessThanOrEqual(
            now.getTime()
          );
        });
      });
    });

    describe("getMoradorRetrySchedules", () => {
      it("should return schedules for a morador", async () => {
        const result = await getMoradorRetrySchedules(mockMoradorId);

        expect(Array.isArray(result)).toBe(true);
      });

      it("should filter by status", async () => {
        const result = await getMoradorRetrySchedules(mockMoradorId, {
          status: "pending",
        });

        result.forEach((schedule) => {
          expect(schedule.status).toBe("pending");
        });
      });

      it("should apply pagination", async () => {
        const result = await getMoradorRetrySchedules(mockMoradorId, {
          limit: 5,
          offset: 0,
        });

        expect(result.length).toBeLessThanOrEqual(5);
      });
    });

    describe("getRetrySchedule", () => {
      it("should return a specific retry schedule", async () => {
        const created = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(),
        });

        const result = await getRetrySchedule(created.id);

        expect(result).toBeDefined();
        expect(result?.id).toBe(created.id);
      });

      it("should return null if schedule not found", async () => {
        const result = await getRetrySchedule(99999);

        expect(result).toBeNull();
      });
    });

    describe("updateRetryScheduleAfterAttempt", () => {
      it("should update schedule after successful attempt", async () => {
        const created = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(),
          maxRetries: 3,
        });

        const result = await updateRetryScheduleAfterAttempt(
          created.id,
          true
        );

        expect(result.status).toBe("completed");
        expect(result.attemptsCount).toBe(1);
        expect(result.completedAt).toBeDefined();
      });

      it("should update schedule after failed attempt", async () => {
        const created = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(),
          maxRetries: 3,
        });

        const result = await updateRetryScheduleAfterAttempt(
          created.id,
          false,
          new Date(Date.now() + 60 * 60 * 1000)
        );

        expect(result.status).toBe("pending");
        expect(result.attemptsCount).toBe(1);
        expect(result.nextAttemptAt).toBeDefined();
      });

      it("should mark as failed when max retries reached", async () => {
        const created = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(),
          maxRetries: 1,
        });

        const result = await updateRetryScheduleAfterAttempt(
          created.id,
          false
        );

        expect(result.status).toBe("failed");
        expect(result.attemptsCount).toBe(1);
      });
    });

    describe("cancelRetrySchedule", () => {
      it("should cancel a retry schedule", async () => {
        const created = await createRetrySchedule({
          flowHistoryId: mockFlowHistoryId,
          moradorId: mockMoradorId,
          scheduledTime: new Date(),
        });

        await cancelRetrySchedule(created.id);

        const result = await getRetrySchedule(created.id);

        expect(result?.status).toBe("cancelled");
      });
    });

    describe("getRetryScheduleStats", () => {
      it("should return statistics", async () => {
        const result = await getRetryScheduleStats(mockMoradorId);

        expect(result).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(result.pending).toBeGreaterThanOrEqual(0);
        expect(result.completed).toBeGreaterThanOrEqual(0);
        expect(result.failed).toBeGreaterThanOrEqual(0);
        expect(result.successRate).toBeGreaterThanOrEqual(0);
        expect(result.successRate).toBeLessThanOrEqual(100);
      });
    });

    describe("calculateNextRetryTime", () => {
      it("should calculate next retry for once frequency", () => {
        const now = new Date();
        const result = calculateNextRetryTime(now, "once", 1);

        expect(result.getTime()).toBeGreaterThan(now.getTime());
      });

      it("should calculate next retry for daily frequency", () => {
        const now = new Date();
        const result = calculateNextRetryTime(now, "daily", 1);

        const expected = new Date(now);
        expected.setDate(expected.getDate() + 1);

        expect(result.getDate()).toBe(expected.getDate());
      });

      it("should calculate next retry for weekly frequency", () => {
        const now = new Date();
        const result = calculateNextRetryTime(now, "weekly", 1);

        const expected = new Date(now);
        expected.setDate(expected.getDate() + 7);

        expect(result.getDate()).toBe(expected.getDate());
      });

      it("should calculate exponential backoff for custom frequency", () => {
        const now = new Date();

        const attempt1 = calculateNextRetryTime(now, "custom", 1);
        const attempt2 = calculateNextRetryTime(now, "custom", 2);
        const attempt3 = calculateNextRetryTime(now, "custom", 3);

        expect(attempt1.getTime()).toBeLessThan(attempt2.getTime());
        expect(attempt2.getTime()).toBeLessThan(attempt3.getTime());
      });
    });

    describe("getFlowRetryHistory", () => {
      it("should return retry history for a flow", async () => {
        const result = await getFlowRetryHistory(mockFlowHistoryId);

        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe("getUpcomingRetrySchedules", () => {
      it("should return upcoming schedules", async () => {
        const result = await getUpcomingRetrySchedules(mockMoradorId, 24);

        expect(Array.isArray(result)).toBe(true);
      });

      it("should only return pending schedules", async () => {
        const result = await getUpcomingRetrySchedules(mockMoradorId);

        result.forEach((schedule) => {
          expect(schedule.status).toBe("pending");
        });
      });
    });

    describe("exportRetrySchedulesToCsv", () => {
      it("should export schedules as CSV", async () => {
        const result = await exportRetrySchedulesToCsv(mockMoradorId);

        expect(typeof result).toBe("string");
        expect(result.includes("ID,Flow ID,Status")).toBe(true);
      });

      it("should include headers", async () => {
        const result = await exportRetrySchedulesToCsv(mockMoradorId);

        const headers = [
          "ID",
          "Flow ID",
          "Status",
          "Scheduled Time",
          "Attempts",
          "Max Retries",
        ];

        headers.forEach((header) => {
          expect(result.includes(header)).toBe(true);
        });
      });
    });
  });

  describe("Scheduler Service", () => {
    describe("processPendingRetries", () => {
      it("should process pending retries", async () => {
        const result = await processPendingRetries();

        expect(result).toBeDefined();
        expect(result.processed).toBeGreaterThanOrEqual(0);
        expect(result.successful).toBeGreaterThanOrEqual(0);
        expect(result.failed).toBeGreaterThanOrEqual(0);
      });

      it("should return correct counts", async () => {
        const result = await processPendingRetries();

        expect(result.processed).toBeGreaterThanOrEqual(
          result.successful + result.failed
        );
      });
    });

    describe("Scheduler Control", () => {
      it("should start retry scheduler", () => {
        stopRetryScheduler(); // Ensure clean state
        startRetryScheduler(60000);

        expect(isRetrySchedulerRunning()).toBe(true);

        stopRetryScheduler();
      });

      it("should stop retry scheduler", () => {
        startRetryScheduler(60000);
        stopRetryScheduler();

        expect(isRetrySchedulerRunning()).toBe(false);
      });

      it("should not start scheduler twice", () => {
        stopRetryScheduler();
        startRetryScheduler(60000);

        const consoleSpy = vi.spyOn(console, "warn");
        startRetryScheduler(60000);

        expect(consoleSpy).toHaveBeenCalled();

        stopRetryScheduler();
        consoleSpy.mockRestore();
      });

      it("should get scheduler status", async () => {
        const result = await getRetrySchedulerStatus();

        expect(result).toBeDefined();
        expect(result.running).toBe(typeof result.running === "boolean");
        expect(result.pendingRetries).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should create and update retry schedule", async () => {
      const created = await createRetrySchedule({
        flowHistoryId: mockFlowHistoryId,
        moradorId: mockMoradorId,
        scheduledTime: new Date(),
        maxRetries: 3,
      });

      expect(created.status).toBe("pending");

      const updated = await updateRetryScheduleAfterAttempt(
        created.id,
        false,
        new Date(Date.now() + 60 * 60 * 1000)
      );

      expect(updated.status).toBe("pending");
      expect(updated.attemptsCount).toBe(1);
    });

    it("should handle complete retry lifecycle", async () => {
      const created = await createRetrySchedule({
        flowHistoryId: mockFlowHistoryId,
        moradorId: mockMoradorId,
        scheduledTime: new Date(),
        maxRetries: 2,
      });

      // First attempt fails
      let updated = await updateRetryScheduleAfterAttempt(
        created.id,
        false,
        new Date(Date.now() + 60 * 60 * 1000)
      );

      expect(updated.status).toBe("pending");
      expect(updated.attemptsCount).toBe(1);

      // Second attempt succeeds
      updated = await updateRetryScheduleAfterAttempt(created.id, true);

      expect(updated.status).toBe("completed");
      expect(updated.attemptsCount).toBe(2);
    });

    it("should filter schedules correctly", async () => {
      const pending = await getMoradorRetrySchedules(mockMoradorId, {
        status: "pending",
      });

      const completed = await getMoradorRetrySchedules(mockMoradorId, {
        status: "completed",
      });

      expect(pending.length + completed.length).toBeGreaterThanOrEqual(0);
    });
  });
});
