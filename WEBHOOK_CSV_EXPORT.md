# Webhook CSV Export Documentation

## Overview

The Webhook CSV Export feature allows administrators to export webhook search results and historical data in CSV format for external analysis, reporting, and integration with other tools.

## Features

### 1. Search Results Export

Export filtered webhook search results directly:

```
Search for: pay_123
Results: 15 webhooks
Export: 📥 Exportar CSV
```

### 2. Bulk Export

Export all webhooks with optional filters:

- By status (Success, Failed, All)
- By date range
- By webhook type

### 3. Customizable Format

Choose export format options:

- **Date Format**: ISO, BR (dd/mm/yyyy), US (mm/dd/yyyy)
- **Delimiter**: Comma, Semicolon, Tab
- **Content**: Include/exclude error messages and payloads

### 4. Export Statistics

Get summary statistics before exporting:

- Total records
- Success/failure counts
- Event type distribution
- Error type breakdown

## UI Components

### Export Button

Simple button to export current search results:

```tsx
import { WebhookExportButton } from "@/components/webhook-export-button";

function SearchResults() {
  const [data, setData] = useState([]);

  return (
    <WebhookExportButton
      data={data}
      label="📥 Exportar CSV"
      onExportComplete={(filename) => {
        console.log(`Exported: ${filename}`);
      }}
      onError={(error) => {
        console.error(`Export failed: ${error}`);
      }}
    />
  );
}
```

**Props:**
- `data` - Array of webhook records to export
- `label` - Button text (default: "📥 Exportar CSV")
- `compact` - Show as compact icon button (default: false)
- `disabled` - Disable button (default: false)
- `onExportComplete` - Callback when export succeeds
- `onError` - Callback when export fails

### Export Options Modal

Advanced export settings:

```tsx
import { WebhookExportOptions } from "@/components/webhook-export-button";

function ExportPanel() {
  const [data, setData] = useState([]);

  return (
    <WebhookExportOptions
      data={data}
      onExportComplete={(filename) => {
        console.log(`Exported: ${filename}`);
      }}
      onError={(error) => {
        console.error(`Export failed: ${error}`);
      }}
      onClose={() => {
        // Close modal
      }}
    />
  );
}
```

## CSV Format

### Default Columns

| Column | Description |
|--------|-------------|
| ID | Webhook record ID |
| Evento | Event type (payment.received, etc.) |
| ID Pagamento | Asaas payment ID |
| ID Cliente | Asaas customer ID |
| Status | Current status |
| Resultado | Success or Failed |
| Recebido em | Timestamp received |
| Processado em | Timestamp processed |
| Mensagem de Erro | Error message (if failed) |

### Example CSV

```csv
"ID";"Evento";"ID Pagamento";"ID Cliente";"Status";"Resultado";"Recebido em";"Processado em";"Mensagem de Erro"
"1";"payment.received";"pay_123456";"cust_789012";"success";"Sucesso";"2026-04-27T10:00:00Z";"2026-04-27T10:00:05Z";""
"2";"payment.updated";"pay_234567";"";"failed";"Falhou";"2026-04-27T11:00:00Z";"2026-04-27T11:00:10Z";"Invalid payload JSON"
```

## Backend Integration

### Export Endpoints

```typescript
// Export search results
async function exportWebhookSearchResults(
  query: string,
  type: "payment" | "customer" | "all",
  options?: {
    dateFormat?: "ISO" | "BR" | "US";
    delimiter?: "," | ";";
    includeErrors?: boolean;
    includePayload?: boolean;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: {
    csv: string;
    filename: string;
    summary: ExportSummary;
    statistics: ExportStatistics;
    fileSize: string;
    recordCount: number;
  };
  error?: string;
}>

// Export all webhooks with filters
async function exportAllWebhooks(
  options?: {
    status?: "success" | "failed" | "all";
    dateRange?: { from?: Date; to?: Date };
    dateFormat?: "ISO" | "BR" | "US";
    delimiter?: "," | ";";
    includeErrors?: boolean;
    limit?: number;
  }
): Promise<{
  success: boolean;
  data?: {
    csv: string;
    filename: string;
    summary: ExportSummary;
    statistics: ExportStatistics;
    fileSize: string;
    recordCount: number;
  };
  error?: string;
}>

// Get export preview
async function getExportPreview(
  query: string,
  type: "payment" | "customer" | "all",
  limit?: number
): Promise<{
  success: boolean;
  data?: {
    recordCount: number;
    summary: ExportSummary;
    statistics: ExportStatistics;
    preview: WebhookRecord[];
  };
  error?: string;
}>

// Get export statistics
async function getExportStats(
  dateRange?: { from?: Date; to?: Date }
): Promise<{
  success: boolean;
  data?: {
    totalRecords: number;
    summary: ExportSummary;
    statistics: ExportStatistics;
  };
  error?: string;
}>
```

### tRPC Integration

```typescript
// server/routers/webhook-admin.ts

export const webhookAdminRouter = router({
  // ... existing endpoints

  exportSearchResults: protectedProcedure
    .input(
      z.object({
        query: z.string().min(3).max(100),
        type: z.enum(["payment", "customer", "all"]).default("all"),
        dateFormat: z.enum(["ISO", "BR", "US"]).default("ISO"),
        delimiter: z.enum([",", ";", "\t"]).default(";"),
        includeErrors: z.boolean().default(true),
        limit: z.number().default(1000),
      })
    )
    .mutation(exportWebhookSearchResults),

  exportAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["success", "failed", "all"]).default("all"),
        dateRange: z
          .object({
            from: z.date().optional(),
            to: z.date().optional(),
          })
          .optional(),
        dateFormat: z.enum(["ISO", "BR", "US"]).default("ISO"),
        delimiter: z.enum([",", ";", "\t"]).default(";"),
        includeErrors: z.boolean().default(true),
        limit: z.number().default(5000),
      })
    )
    .mutation(exportAllWebhooks),

  getExportPreview: protectedProcedure
    .input(
      z.object({
        query: z.string().min(3).max(100),
        type: z.enum(["payment", "customer", "all"]).default("all"),
        limit: z.number().default(100),
      })
    )
    .query(getExportPreview),

  getExportStats: protectedProcedure
    .input(
      z.object({
        dateRange: z
          .object({
            from: z.date().optional(),
            to: z.date().optional(),
          })
          .optional(),
      })
    )
    .query(getExportStats),
});
```

## Usage Examples

### Example 1: Export Search Results

```typescript
const results = await api.webhookAdmin.exportSearchResults.mutate({
  query: "pay_123",
  type: "payment",
  dateFormat: "BR",
  delimiter: ";",
  includeErrors: true,
});

if (results.success) {
  console.log(`Exported ${results.data.recordCount} records`);
  console.log(`File size: ${results.data.fileSize}`);
  console.log(`Success rate: ${results.data.statistics.successRate}%`);
}
```

### Example 2: Export All Failed Webhooks

```typescript
const results = await api.webhookAdmin.exportAll.mutate({
  status: "failed",
  dateFormat: "ISO",
  delimiter: ",",
  includeErrors: true,
  limit: 5000,
});

if (results.success) {
  // Download CSV
  const blob = new Blob([results.data.csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = results.data.filename;
  link.click();
}
```

### Example 3: Get Export Preview

```typescript
const preview = await api.webhookAdmin.getExportPreview.query({
  query: "pay_",
  type: "payment",
  limit: 100,
});

if (preview.success) {
  console.log(`Found ${preview.data.recordCount} records`);
  console.log(`Success count: ${preview.data.summary.successCount}`);
  console.log(`Failure count: ${preview.data.summary.failureCount}`);
  console.log(`First 5 records:`, preview.data.preview);
}
```

### Example 4: Get Statistics

```typescript
const stats = await api.webhookAdmin.getExportStats.query({
  dateRange: {
    from: new Date("2026-04-01"),
    to: new Date("2026-04-30"),
  },
});

if (stats.success) {
  console.log(`Total records: ${stats.data.totalRecords}`);
  console.log(`Success rate: ${stats.data.summary.successRate}%`);
  console.log(`Event types:`, stats.data.statistics.eventTypes);
}
```

## Date Formats

### ISO Format (Default)

```
2026-04-27T10:00:00Z
```

### Brazilian Format (BR)

```
27/04/2026 10:00
```

### US Format

```
4/27/2026 10:00 AM
```

## Delimiters

| Delimiter | Use Case |
|-----------|----------|
| `,` (Comma) | Excel, Google Sheets |
| `;` (Semicolon) | European Excel, some systems |
| `\t` (Tab) | Text editors, data analysis |

## Performance

- **Export Time**: ~100ms for 1000 records
- **File Size**: ~50KB per 1000 records (with errors)
- **Memory**: Streaming for large exports
- **Limit**: 5000 records per export (configurable)

## Best Practices

### 1. Preview Before Export

Always preview results before exporting:

```typescript
const preview = await api.webhookAdmin.getExportPreview.query({
  query: "pay_",
  type: "payment",
});

if (preview.data.recordCount > 1000) {
  // Warn user about large export
}
```

### 2. Choose Right Delimiter

- Use `;` for European systems
- Use `,` for US/UK systems
- Use `\t` for data analysis tools

### 3. Include Error Messages

Always include error messages for troubleshooting:

```typescript
const results = await api.webhookAdmin.exportSearchResults.mutate({
  // ...
  includeErrors: true,
});
```

### 4. Use Date Filters

Filter by date range to reduce file size:

```typescript
const results = await api.webhookAdmin.exportAll.mutate({
  dateRange: {
    from: new Date("2026-04-01"),
    to: new Date("2026-04-30"),
  },
});
```

### 5. Handle Large Exports

For exports > 1000 records, show progress:

```typescript
const results = await api.webhookAdmin.exportAll.mutate({
  limit: 5000,
});

console.log(`Exporting ${results.data.recordCount} records...`);
```

## Troubleshooting

### Export Failed

**Problem**: Export returns error.

**Solutions**:
1. Check query format (min 3 chars)
2. Verify date range is valid
3. Check file size limit
4. Try reducing limit parameter

### Large File Size

**Problem**: CSV file is too large.

**Solutions**:
1. Use date range filters
2. Filter by status (failed only)
3. Reduce limit parameter
4. Exclude error messages/payloads

### Wrong Date Format

**Problem**: Dates appear incorrectly in Excel.

**Solutions**:
1. Use `;` delimiter for European Excel
2. Try different dateFormat option
3. Manually format column in Excel
4. Use ISO format for compatibility

### Special Characters Broken

**Problem**: Special characters display incorrectly.

**Solutions**:
1. Ensure CSV is UTF-8 encoded
2. Try different delimiter
3. Open in text editor first
4. Check system locale settings

## Related Features

- [Webhook Search](./WEBHOOK_SEARCH.md)
- [Webhook Admin Dashboard](./WEBHOOK_ADMIN_DASHBOARD.md)
- [Selective Retry](./WEBHOOK_SELECTIVE_RETRY.md)
- [Status Badges](./WEBHOOK_BADGE_ALERTS.md)
