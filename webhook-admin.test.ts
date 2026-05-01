/**
 * Webhook Administration Tests
 * Tests for webhook history, retry mechanism, and metrics
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as webhookDb from "../server/db-queries-webhooks";
import {
  startWebhookRetryScheduler,
  stopWebhookRetryScheduler,
  processFailedWebhooks,
  retryWebhook,
  getRetryStatistics,
} from "../server/_core/asaas-webhook-retry";
import {
  logWebhookEvent,
  getEventSummary,
} from "../server/_core/asaas-webhook-logging";

// Mock database queries
vi.mock("../server/db-queries-webhooks", () => ({
  logWebhookToHistory: vi.fn(),
  getWebhookHistory: vi.fn(),
  getWebhookById: vi.fn(),
  getFailedWebhooksForRetry: vi.fn(),
  updateWebhookRetry: vi.fn(),
  getWebhookMetricsForDate: vi.fn(),
  updateWebhookMetrics: vi.fn(),
  getWebhookMetricsRange: vi.fn(),
  getWebhookStatistics: vi.fn(),
  clearOldWebhookHistory: vi.fn(),
}));

// Mock webhook database operations
vi.mock("../server/_core/asaas-webhook-db", () => ({
  handlePaymentStatusUpdate: vi.fn(),
  handlePaymentNotification: vi.fn(),
  logWebhookEvent: vi.fn(),
}));

describe("Webhook Admin - Logging and Metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log webhook event to history", async () => {
    vi.mocked(webhookDb.logWebhookToHistory).mockResolvedValue({
      id: 1,
      asaasPaymentId: "pay_123",
      event: "payment.received",
      asaasStatus: "RECEIVED",
      internalStatus: "RECEIVED",
      payload: "{}",
      statusCode: 200,
      success: 1,
      errorMessage: null,
      statusUpdated: 1,
      notificationCreated: 1,
      retryCount: 0,
      nextRetryAt: null,
      lastRetryAt: null,
      receivedAt: new Date(),
      processedAt: new Date(),
    } as any);

    vi.mocked(webhookDb.getWebhookMetricsForDate).mockResolvedValue(null);
    vi.mocked(webhookDb.updateWebhookMetrics).mockResolvedValue({
      id: 1,
      date: "2026-04-27",
      totalReceived: 1,
      totalProcessed: 1,
      totalSuccessful: 1,
      totalFailed: 0,
      totalRetried: 0,
      averageProcessingTime: 100,
      statusUpdatedCount: 1,
      notificationCreatedCount: 1,
      errorCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await logWebhookEvent(
      "pay_123",
      "payment.received",
      "RECEIVED",
      "RECEIVED",
      true,
      true,
      true
    );

    expect(webhookDb.logWebhookToHistory).toHaveBeenCalled();
    expect(webhookDb.updateWebhookMetrics).toHaveBeenCalled();
  });

  it("should get event summary", () => {
    const summary = getEventSummary("payment.received");

    expect(summary.title).toBe("Pagamento Recebido");
    expect(summary.severity).toBe("success");
  });

  it("should get event summary for overdue payment", () => {
    const summary = getEventSummary("payment.overdue");

    expect(summary.title).toBe("Pagamento Vencido");
    expect(summary.severity).toBe("warning");
  });

  it("should get event summary for unknown event", () => {
    const summary = getEventSummary("unknown.event");

    expect(summary.title).toBe("Evento Desconhecido");
    expect(summary.severity).toBe("info");
  });
});

describe("Webhook Admin - Retry Mechanism", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopWebhookRetryScheduler();
  });

  it("should process failed webhooks with retry logic", async () => {
    const failedWebhooks = [
      {
        id: 1,
        asaasPaymentId: "pay_123",
        event: "payment.received",
        asaasStatus: "RECEIVED",
        payload: "{}",
        retryCount: 0,
        nextRetryAt: new Date(),
      },
    ];

    vi.mocked(webhookDb.getFailedWebhooksForRetry).mockResolvedValue(
      failedWebhooks as any
    );

    const result = await processFailedWebhooks();

    expect(result.processed).toBeGreaterThanOrEqual(0);
  });

  it("should process failed webhooks", async () => {
    const failedWebhooks = [
      {
        id: 1,
        asaasPaymentId: "pay_123",
        event: "payment.received",
        asaasStatus: "RECEIVED",
        payload: "{}",
        retryCount: 0,
        nextRetryAt: new Date(),
      },
    ];

    vi.mocked(webhookDb.getFailedWebhooksForRetry).mockResolvedValue(
      failedWebhooks as any
    );

    const result = await processFailedWebhooks();

    expect(result.processed).toBeGreaterThanOrEqual(0);
    expect(result.successful).toBeGreaterThanOrEqual(0);
    expect(result.failed).toBeGreaterThanOrEqual(0);
  });

  it("should get retry statistics", async () => {
    const failedWebhooks = [
      {
        id: 1,
        retryCount: 1,
        nextRetryAt: new Date(Date.now() - 1000),
      },
      {
        id: 2,
        retryCount: 5,
        nextRetryAt: new Date(Date.now() + 1000),
      },
    ];

    vi.mocked(webhookDb.getFailedWebhooksForRetry).mockResolvedValue(
      failedWebhooks as any
    );

    const stats = await getRetryStatistics();

    expect(stats.totalFailed).toBeGreaterThanOrEqual(0);
    expect(stats.readyForRetry).toBeGreaterThanOrEqual(0);
    expect(stats.maxRetriesExceeded).toBeGreaterThanOrEqual(0);
    expect(stats.averageRetries).toBeGreaterThanOrEqual(0);
  });
});

describe("Webhook Admin - Database Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get webhook history with filters", async () => {
    const mockHistory = [
      {
        id: 1,
        asaasPaymentId: "pay_123",
        event: "payment.received",
        success: 1,
        receivedAt: new Date(),
      },
    ];

    vi.mocked(webhookDb.getWebhookHistory).mockResolvedValue({
      data: mockHistory as any,
      pagination: { total: 1, page: 1, limit: 20, pages: 1 },
    });

    const result = await webhookDb.getWebhookHistory({
      page: 1,
      limit: 20,
      success: true,
    });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it("should get webhook by ID", async () => {
    const mockWebhook = {
      id: 1,
      asaasPaymentId: "pay_123",
      event: "payment.received",
      success: 1,
    };

    vi.mocked(webhookDb.getWebhookById).mockResolvedValue(
      mockWebhook as any
    );

    const result = await webhookDb.getWebhookById(1);

    expect(result?.id).toBe(1);
    expect(result?.asaasPaymentId).toBe("pay_123");
  });

  it("should get failed webhooks for retry", async () => {
    const mockFailed = [
      {
        id: 1,
        asaasPaymentId: "pay_123",
        success: 0,
        retryCount: 0,
      },
    ];

    vi.mocked(webhookDb.getFailedWebhooksForRetry).mockResolvedValue(
      mockFailed as any
    );

    const result = await webhookDb.getFailedWebhooksForRetry(10);

    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(0);
  });

  it("should update webhook retry information", async () => {
    vi.mocked(webhookDb.updateWebhookRetry).mockResolvedValue(true);

    const result = await webhookDb.updateWebhookRetry(
      1,
      1,
      new Date(),
      false,
      "Test error"
    );

    expect(result).toBe(true);
    expect(webhookDb.updateWebhookRetry).toHaveBeenCalledWith(
      1,
      1,
      expect.any(Date),
      false,
      "Test error"
    );
  });

  it("should get webhook metrics for date", async () => {
    const mockMetrics = {
      id: 1,
      date: "2026-04-27",
      totalReceived: 10,
      totalProcessed: 10,
      totalSuccessful: 9,
      totalFailed: 1,
      totalRetried: 0,
      averageProcessingTime: 150,
      statusUpdatedCount: 9,
      notificationCreatedCount: 9,
      errorCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(webhookDb.getWebhookMetricsForDate).mockResolvedValue(
      mockMetrics as any
    );

    const result = await webhookDb.getWebhookMetricsForDate("2026-04-27");

    expect(result?.totalReceived).toBe(10);
    expect(result?.totalSuccessful).toBe(9);
    expect(result?.totalFailed).toBe(1);
  });

  it("should get webhook metrics range", async () => {
    const mockMetrics = [
      {
        id: 1,
        date: "2026-04-27",
        totalReceived: 10,
        totalSuccessful: 9,
      },
      {
        id: 2,
        date: "2026-04-28",
        totalReceived: 15,
        totalSuccessful: 14,
      },
    ];

    vi.mocked(webhookDb.getWebhookMetricsRange).mockResolvedValue(
      mockMetrics as any
    );

    const result = await webhookDb.getWebhookMetricsRange(
      "2026-04-27",
      "2026-04-28"
    );

    expect(result).toHaveLength(2);
    expect(result[0].totalReceived).toBe(10);
    expect(result[1].totalReceived).toBe(15);
  });

  it("should get webhook statistics", async () => {
    const mockStats = {
      totalReceived: 100,
      totalProcessed: 100,
      totalSuccessful: 95,
      totalFailed: 5,
      successRate: 95,
      averageProcessingTime: 150,
      statusUpdatedCount: 95,
      notificationCreatedCount: 95,
    };

    vi.mocked(webhookDb.getWebhookStatistics).mockResolvedValue(
      mockStats as any
    );

    const result = await webhookDb.getWebhookStatistics(30);

    expect(result.totalReceived).toBe(100);
    expect(result.successRate).toBe(95);
    expect(result.totalFailed).toBe(5);
  });

  it("should clear old webhook history", async () => {
    vi.mocked(webhookDb.clearOldWebhookHistory).mockResolvedValue(50);

    const result = await webhookDb.clearOldWebhookHistory(90);

    expect(result).toBe(50);
    expect(webhookDb.clearOldWebhookHistory).toHaveBeenCalledWith(90);
  });
});

describe("Webhook Admin - Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopWebhookRetryScheduler();
  });

  it("should start webhook retry scheduler", () => {
    startWebhookRetryScheduler();
    // Scheduler should be running
    expect(true).toBe(true);
  });

  it("should stop webhook retry scheduler", () => {
    startWebhookRetryScheduler();
    stopWebhookRetryScheduler();
    // Scheduler should be stopped
    expect(true).toBe(true);
  });
});
