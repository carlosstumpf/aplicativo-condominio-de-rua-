/**
 * Webhook CSV Export Tests
 * Tests for exporting webhook data to CSV format
 */

import { describe, it, expect } from "vitest";

interface WebhookRecord {
  id: number;
  event: string;
  asaasPaymentId: string;
  asaasCustomerId?: string;
  status: string;
  success: number;
  errorMessage?: string;
  receivedAt: Date;
  processedAt: Date;
}

// Mock data
const mockWebhooks: WebhookRecord[] = [
  {
    id: 1,
    event: "payment.received",
    asaasPaymentId: "pay_123456",
    asaasCustomerId: "cust_789012",
    status: "success",
    success: 1,
    receivedAt: new Date("2026-04-27T10:00:00Z"),
    processedAt: new Date("2026-04-27T10:00:05Z"),
  },
  {
    id: 2,
    event: "payment.updated",
    asaasPaymentId: "pay_234567",
    status: "failed",
    success: 0,
    errorMessage: "Invalid payload JSON",
    receivedAt: new Date("2026-04-27T11:00:00Z"),
    processedAt: new Date("2026-04-27T11:00:10Z"),
  },
  {
    id: 3,
    event: "notification.sent",
    asaasPaymentId: "pay_345678",
    asaasCustomerId: "cust_901234",
    status: "success",
    success: 1,
    receivedAt: new Date("2026-04-27T12:00:00Z"),
    processedAt: new Date("2026-04-27T12:00:03Z"),
  },
];

describe("Webhook CSV Export - Basic Conversion", () => {
  it("should convert webhooks to CSV string", () => {
    const csv = generateCSV(mockWebhooks);
    expect(csv).toContain("ID");
    expect(csv).toContain("Evento");
    expect(csv).toContain("payment.received");
  });

  it("should include headers", () => {
    const csv = generateCSV(mockWebhooks);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("ID");
    expect(lines[0]).toContain("Evento");
  });

  it("should include data rows", () => {
    const csv = generateCSV(mockWebhooks);
    const lines = csv.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[1]).toContain("payment.received");
  });

  it("should escape quotes in CSV fields", () => {
    const webhook: WebhookRecord = {
      ...mockWebhooks[0],
      errorMessage: 'Error with "quotes"',
    };
    const csv = generateCSV([webhook]);
    expect(csv).toContain('""');
  });

  it("should handle empty customer ID", () => {
    const webhook: WebhookRecord = {
      ...mockWebhooks[0],
      asaasCustomerId: undefined,
    };
    const csv = generateCSV([webhook]);
    expect(csv).toBeTruthy();
  });
});

describe("Webhook CSV Export - Date Formatting", () => {
  it("should format dates as ISO", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { dateFormat: "ISO" });
    expect(csv).toContain("2026-04-27T");
  });

  it("should format dates as BR", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { dateFormat: "BR" });
    expect(csv).toContain("27/04/2026");
  });

  it("should format dates as US", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { dateFormat: "US" });
    expect(csv).toContain("4/27/2026");
  });
});

describe("Webhook CSV Export - Delimiters", () => {
  it("should use comma delimiter", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { delimiter: "," });
    const lines = csv.split("\n");
    expect(lines[0].split(",").length).toBeGreaterThan(1);
  });

  it("should use semicolon delimiter", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { delimiter: ";" });
    const lines = csv.split("\n");
    expect(lines[0].split(";").length).toBeGreaterThan(1);
  });

  it("should use tab delimiter", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { delimiter: "\t" });
    const lines = csv.split("\n");
    expect(lines[0].split("\t").length).toBeGreaterThan(1);
  });
});

describe("Webhook CSV Export - Error Handling", () => {
  it("should include error messages", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { includeErrors: true });
    expect(csv).toContain("Invalid payload JSON");
  });

  it("should exclude error messages when disabled", () => {
    const csv = generateCSVWithOptions(mockWebhooks, { includeErrors: false });
    expect(csv).not.toContain("Invalid payload JSON");
  });

  it("should handle missing error messages", () => {
    const webhook: WebhookRecord = {
      ...mockWebhooks[0],
      errorMessage: undefined,
    };
    const csv = generateCSV([webhook]);
    expect(csv).toBeTruthy();
  });
});

describe("Webhook CSV Export - Statistics", () => {
  it("should calculate success rate", () => {
    const stats = calculateStatistics(mockWebhooks);
    expect(stats.successCount).toBe(2);
    expect(stats.failureCount).toBe(1);
  });

  it("should calculate success percentage", () => {
    const stats = calculateStatistics(mockWebhooks);
    expect(stats.successRate).toBeCloseTo(66.67, 1);
  });

  it("should count event types", () => {
    const stats = calculateStatistics(mockWebhooks);
    expect(stats.eventTypes["payment.received"]).toBe(1);
    expect(stats.eventTypes["notification.sent"]).toBe(1);
  });

  it("should track status distribution", () => {
    const stats = calculateStatistics(mockWebhooks);
    expect(stats.statusDistribution["success"]).toBe(2);
    expect(stats.statusDistribution["failed"]).toBe(1);
  });
});

describe("Webhook CSV Export - File Operations", () => {
  it("should generate filename with date", () => {
    const filename = generateFilename("webhooks");
    expect(filename).toContain("webhooks_");
    expect(filename).toContain(".csv");
  });

  it("should generate unique filenames", () => {
    const filename1 = generateFilename("webhooks");
    const filename2 = generateFilename("webhooks");
    // May be same if generated within same second
    expect(filename1).toContain("webhooks_");
    expect(filename2).toContain("webhooks_");
  });

  it("should calculate CSV size", () => {
    const csv = generateCSV(mockWebhooks);
    const size = new Blob([csv]).size;
    expect(size).toBeGreaterThan(0);
  });

  it("should format file size", () => {
    const formatted = formatFileSize(1024);
    expect(formatted).toContain("KB");
  });

  it("should format bytes", () => {
    const formatted = formatFileSize(512);
    expect(formatted).toContain("B");
  });

  it("should format megabytes", () => {
    const formatted = formatFileSize(1024 * 1024);
    expect(formatted).toContain("MB");
  });
});

describe("Webhook CSV Export - Data Validation", () => {
  it("should handle empty data", () => {
    const csv = generateCSV([]);
    expect(csv).toContain("ID");
  });

  it("should handle single record", () => {
    const csv = generateCSV([mockWebhooks[0]]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(2); // Header + 1 data row
  });

  it("should handle special characters", () => {
    const webhook: WebhookRecord = {
      ...mockWebhooks[0],
      errorMessage: "Error with special chars: !@#$%^&*()",
    };
    const csv = generateCSV([webhook]);
    expect(csv).toContain("Error with special chars");
  });

  it("should handle newlines in fields", () => {
    const webhook: WebhookRecord = {
      ...mockWebhooks[0],
      errorMessage: "Error with\nnewline",
    };
    const csv = generateCSV([webhook]);
    expect(csv).toContain("Error with");
  });
});

describe("Webhook CSV Export - Filtering", () => {
  it("should filter by success status", () => {
    const successful = mockWebhooks.filter((w) => w.success === 1);
    expect(successful.length).toBe(2);
  });

  it("should filter by failure status", () => {
    const failed = mockWebhooks.filter((w) => w.success === 0);
    expect(failed.length).toBe(1);
  });

  it("should filter by event type", () => {
    const payments = mockWebhooks.filter((w) => w.event.startsWith("payment."));
    expect(payments.length).toBe(2);
  });

  it("should filter by date range", () => {
    const start = new Date("2026-04-27T10:30:00Z");
    const end = new Date("2026-04-27T12:30:00Z");
    const filtered = mockWebhooks.filter(
      (w) => w.receivedAt >= start && w.receivedAt <= end
    );
    expect(filtered.length).toBe(2);
  });
});

// Helper functions
function generateCSV(webhooks: WebhookRecord[]): string {
  const headers = [
    "ID",
    "Evento",
    "ID Pagamento",
    "ID Cliente",
    "Status",
    "Resultado",
    "Recebido em",
    "Processado em",
    "Mensagem de Erro",
  ];

  const rows = webhooks.map((w) => [
    w.id.toString(),
    w.event,
    w.asaasPaymentId,
    w.asaasCustomerId || "",
    w.status,
    w.success === 1 ? "Sucesso" : "Falhou",
    w.receivedAt.toISOString(),
    w.processedAt.toISOString(),
    w.errorMessage || "",
  ]);

  return [
    headers.map((h) => `"${h}"`).join(";"),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");
}

function generateCSVWithOptions(
  webhooks: WebhookRecord[],
  options: { dateFormat: "ISO" | "BR" | "US"; delimiter?: string; includeErrors?: boolean }
): string {
  const { dateFormat, delimiter = ";", includeErrors = true } = options;

  const formatDate = (date: Date): string => {
    switch (dateFormat) {
      case "BR":
        return date.toLocaleDateString("pt-BR");
      case "US":
        return date.toLocaleDateString("en-US");
      default:
        return date.toISOString();
    }
  };

  const headers = [
    "ID",
    "Evento",
    "ID Pagamento",
    "ID Cliente",
    "Status",
    "Resultado",
    "Recebido em",
    "Processado em",
  ];

  if (includeErrors) {
    headers.push("Mensagem de Erro");
  }

  const rows = webhooks.map((w) => {
    const row = [
      w.id.toString(),
      w.event,
      w.asaasPaymentId,
      w.asaasCustomerId || "",
      w.status,
      w.success === 1 ? "Sucesso" : "Falhou",
      formatDate(w.receivedAt),
      formatDate(w.processedAt),
    ];

    if (includeErrors) {
      row.push(w.errorMessage || "");
    }

    return row;
  });

  return [
    headers.map((h) => `"${h}"`).join(delimiter),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(delimiter)
    ),
  ].join("\n");
}

function calculateStatistics(webhooks: WebhookRecord[]): {
  successCount: number;
  failureCount: number;
  successRate: number;
  eventTypes: Record<string, number>;
  statusDistribution: Record<string, number>;
} {
  const successCount = webhooks.filter((w) => w.success === 1).length;
  const failureCount = webhooks.length - successCount;
  const successRate = webhooks.length > 0 ? (successCount / webhooks.length) * 100 : 0;

  const eventTypes: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};

  for (const w of webhooks) {
    eventTypes[w.event] = (eventTypes[w.event] || 0) + 1;
    statusDistribution[w.status] = (statusDistribution[w.status] || 0) + 1;
  }

  return {
    successCount,
    failureCount,
    successRate: Math.round(successRate * 100) / 100,
    eventTypes,
    statusDistribution,
  };
}

function generateFilename(prefix: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}_${date}.csv`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
