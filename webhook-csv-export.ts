/**
 * Webhook CSV Export Module
 * Export webhook data to CSV format for external analysis
 */

export interface WebhookRecord {
  id: number;
  event: string;
  asaasPaymentId: string;
  asaasCustomerId?: string;
  status: string;
  success: number;
  errorMessage?: string;
  receivedAt: Date;
  processedAt: Date;
  payload?: string;
  retryCount?: number;
}

export interface ExportOptions {
  /**
   * Include payload in export
   */
  includePayload?: boolean;
  /**
   * Include error messages
   */
  includeErrors?: boolean;
  /**
   * Date format (ISO, US, BR)
   */
  dateFormat?: "ISO" | "US" | "BR";
  /**
   * Delimiter (comma, semicolon, tab)
   */
  delimiter?: "," | ";" | "\t";
  /**
   * Include headers
   */
  includeHeaders?: boolean;
}

/**
 * Format date based on locale
 */
function formatDate(date: Date, format: "ISO" | "US" | "BR" = "ISO"): string {
  const d = new Date(date);

  switch (format) {
    case "BR":
      return d.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    case "US":
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    case "ISO":
    default:
      return d.toISOString();
  }
}

/**
 * Escape CSV field (handle quotes and commas)
 */
function escapeCSVField(field: string | number | undefined | null): string {
  if (field === null || field === undefined) {
    return "";
  }

  const str = String(field);

  // If field contains comma, quote, or newline, wrap in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert webhook record to CSV row
 */
function webhookToCSVRow(
  record: WebhookRecord,
  options: ExportOptions = {}
): string[] {
  const { dateFormat = "ISO", includePayload = false, includeErrors = true } = options;

  const row = [
    record.id.toString(),
    record.event,
    record.asaasPaymentId,
    record.asaasCustomerId || "",
    record.status,
    record.success === 1 ? "Sucesso" : "Falhou",
    formatDate(record.receivedAt, dateFormat),
    formatDate(record.processedAt, dateFormat),
  ];

  if (includeErrors && record.errorMessage) {
    row.push(record.errorMessage);
  }

  if (includePayload && record.payload) {
    row.push(record.payload);
  }

  if (record.retryCount !== undefined) {
    row.push(record.retryCount.toString());
  }

  return row;
}

/**
 * Get CSV headers
 */
function getCSVHeaders(options: ExportOptions = {}): string[] {
  const { includePayload = false, includeErrors = true } = options;

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

  if (includePayload) {
    headers.push("Payload");
  }

  headers.push("Tentativas de Reenvio");

  return headers;
}

/**
 * Convert webhook records to CSV string
 */
export function webhooksToCSV(
  records: WebhookRecord[],
  options: ExportOptions = {}
): string {
  const {
    delimiter = ",",
    includeHeaders = true,
    dateFormat = "ISO",
    includePayload = false,
    includeErrors = true,
  } = options;

  const lines: string[] = [];

  // Add headers
  if (includeHeaders) {
    const headers = getCSVHeaders({ includePayload, includeErrors });
    const headerRow = headers.map((h) => escapeCSVField(h)).join(delimiter);
    lines.push(headerRow);
  }

  // Add data rows
  for (const record of records) {
    const row = webhookToCSVRow(record, {
      dateFormat,
      includePayload,
      includeErrors,
    });
    const csvRow = row.map((field) => escapeCSVField(field)).join(delimiter);
    lines.push(csvRow);
  }

  return lines.join("\n");
}

/**
 * Generate CSV file blob
 */
export function generateCSVBlob(
  records: WebhookRecord[],
  options: ExportOptions = {}
): Blob {
  const csv = webhooksToCSV(records, options);
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

/**
 * Generate CSV download URL
 */
export function generateCSVDownloadURL(
  records: WebhookRecord[],
  options: ExportOptions = {}
): string {
  const blob = generateCSVBlob(records, options);
  return URL.createObjectURL(blob);
}

/**
 * Generate CSV filename with timestamp
 */
export function generateCSVFilename(prefix: string = "webhooks"): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const time = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${prefix}_${timestamp}_${time}.csv`;
}

/**
 * Create CSV export summary
 */
export function createExportSummary(records: WebhookRecord[]): {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  dateRange: { from: Date; to: Date };
} {
  const successCount = records.filter((r) => r.success === 1).length;
  const failureCount = records.length - successCount;
  const successRate = records.length > 0 ? (successCount / records.length) * 100 : 0;

  const dates = records.map((r) => new Date(r.receivedAt).getTime());
  const from = new Date(Math.min(...dates));
  const to = new Date(Math.max(...dates));

  return {
    totalRecords: records.length,
    successCount,
    failureCount,
    successRate: Math.round(successRate * 100) / 100,
    dateRange: { from, to },
  };
}

/**
 * Validate CSV export options
 */
export function validateExportOptions(options: ExportOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.dateFormat && !["ISO", "US", "BR"].includes(options.dateFormat)) {
    errors.push("Invalid dateFormat. Must be ISO, US, or BR");
  }

  if (options.delimiter && ![",", ";", "\t"].includes(options.delimiter)) {
    errors.push("Invalid delimiter. Must be comma, semicolon, or tab");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse CSV string back to records (for testing)
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const record: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || "";
    }

    records.push(record);
  }

  return records;
}

/**
 * Calculate CSV file size
 */
export function calculateCSVSize(records: WebhookRecord[], options: ExportOptions = {}): number {
  const csv = webhooksToCSV(records, options);
  return new Blob([csv]).size;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Get export statistics
 */
export function getExportStatistics(records: WebhookRecord[]): {
  totalEvents: number;
  eventTypes: Record<string, number>;
  statusDistribution: Record<string, number>;
  errorTypes: Record<string, number>;
} {
  const eventTypes: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};
  const errorTypes: Record<string, number> = {};

  for (const record of records) {
    // Count event types
    eventTypes[record.event] = (eventTypes[record.event] || 0) + 1;

    // Count status distribution
    statusDistribution[record.status] = (statusDistribution[record.status] || 0) + 1;

    // Count error types
    if (record.errorMessage) {
      const errorType = record.errorMessage.split(":")[0];
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    }
  }

  return {
    totalEvents: records.length,
    eventTypes,
    statusDistribution,
    errorTypes,
  };
}
