# Webhook Selective Retry Documentation

## Overview

The Webhook Selective Retry feature allows administrators to filter and retry failed webhooks by type, enabling targeted recovery of specific webhook categories without affecting others.

## Webhook Types

### Payment Webhooks
- `payment.created` - Pagamento criado no Asaas
- `payment.updated` - Pagamento atualizado
- `payment.confirmed` - Pagamento confirmado
- `payment.received` - Pagamento recebido
- `payment.overdue` - Pagamento vencido
- `payment.deleted` - Pagamento deletado
- `payment.restored` - Pagamento restaurado
- `payment.refunded` - Pagamento reembolsado

### Notification Webhooks
- `notification.sent` - Notificação enviada
- `notification.failed` - Notificação falhou

### Status Webhooks
- `status.update` - Atualização de status

### Error Webhooks
- `error.occurred` - Erro ocorreu

## Features

### 1. Type-Based Filtering

Filter failed webhooks by category or individual type:

```typescript
// Filter by category
const paymentFailures = await getFailureCountByType(["payment.received", "payment.updated"]);

// Or use category helper
const allPaymentTypes = Object.values(WEBHOOK_TYPES).filter(
  (type) => WEBHOOK_TYPE_TO_CATEGORY[type] === "payments"
);
```

### 2. Failure Counting

Get failure counts by webhook type:

```typescript
const failuresByType = await getFailureCountByType();
// Returns: { "payment.received": 5, "notification.sent": 2, ... }

const byCategory = await getFailureCountByType(["payment.received", "payment.updated"]);
// Returns: { "payment.received": 5, "payment.updated": 3 }
```

### 3. Selective Retry

Retry only specific webhook types:

```typescript
const result = await retryFailedWebhooksByType({
  types: ["payment.received", "payment.updated"],
  maxRetries: 5,
  limit: 100,
});

// Result:
// {
//   processed: 8,
//   failed: 0,
//   skipped: 0,
//   errors: []
// }
```

### 4. Retry Statistics

Get detailed statistics by webhook type:

```typescript
const stats = await getRetryStatisticsByType(["payment.received"]);

// Returns:
// {
//   byType: {
//     "payment.received": {
//       total: 10,
//       readyForRetry: 7,
//       maxRetriesExceeded: 3,
//       averageRetries: 1.2
//     }
//   },
//   overall: {
//     total: 10,
//     readyForRetry: 7,
//     maxRetriesExceeded: 3,
//     averageRetries: 1.2
//   }
// }
```

## UI Components

### WebhookTypeFilter

Main filter component for selecting webhook types:

```tsx
import { WebhookTypeFilter } from "@/components/webhook-type-filter";

function MyComponent() {
  const [selectedTypes, setSelectedTypes] = useState<WebhookType[]>([]);

  return (
    <WebhookTypeFilter
      selectedTypes={selectedTypes}
      onSelectionChange={setSelectedTypes}
      layout="horizontal" // or "vertical"
      showCategories={true} // Show category tabs instead of individual types
    />
  );
}
```

**Props:**
- `selectedTypes` - Array of selected webhook types
- `onSelectionChange` - Callback when selection changes
- `layout` - "horizontal" (scrollable) or "vertical" (full width)
- `showCategories` - Show category tabs or individual types

### WebhookSelectiveRetryPanel

Full panel for selective retry with filtering:

```tsx
import { WebhookSelectiveRetryPanel } from "@/components/webhook-selective-retry-panel";

function Dashboard() {
  const [failuresByType, setFailuresByType] = useState({});
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async (types: WebhookType[]) => {
    setIsRetrying(true);
    try {
      await trpc.webhookAdmin.retryByType.mutate({ types });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <WebhookSelectiveRetryPanel
      failuresByType={failuresByType}
      onRetry={handleRetry}
      isRetrying={isRetrying}
      compact={false} // Show full panel
    />
  );
}
```

**Props:**
- `failuresByType` - Object with failure counts by type
- `onRetry` - Async callback to execute retry
- `isRetrying` - Whether retry is in progress
- `compact` - Show as compact button or full panel

### WebhookTypeFilterButton

Compact filter button:

```tsx
import { WebhookTypeFilterButton } from "@/components/webhook-type-filter";

function Header() {
  const [selectedTypes, setSelectedTypes] = useState<WebhookType[]>([]);

  return (
    <WebhookTypeFilterButton
      selectedTypes={selectedTypes}
      onPress={() => {
        // Show filter modal
      }}
      count={5} // Number of failures for selected types
    />
  );
}
```

## Backend Integration

### Add Selective Retry Endpoint to tRPC Router

```typescript
// server/routers/webhook-admin.ts

export const webhookAdminRouter = router({
  // ... existing endpoints

  retryByType: protectedProcedure
    .input(
      z.object({
        types: z.array(z.string()).optional(),
        maxRetries: z.number().default(5),
        limit: z.number().default(100),
      })
    )
    .mutation(async ({ input }) => {
      return retryFailedWebhooksByType({
        types: input.types as WebhookType[],
        maxRetries: input.maxRetries,
        limit: input.limit,
      });
    }),

  getFailuresByType: protectedProcedure
    .input(
      z.object({
        types: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      return getFailureCountByType(input.types as WebhookType[]);
    }),

  getStatisticsByType: protectedProcedure
    .input(
      z.object({
        types: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      return getRetryStatisticsByType(input.types as WebhookType[]);
    }),
});
```

## Usage Examples

### Example 1: Retry Only Payment Webhooks

```typescript
// Get payment webhook failures
const paymentFailures = await getFailureCountByType([
  "payment.received",
  "payment.updated",
  "payment.confirmed",
]);

// Retry only payment webhooks
const result = await retryFailedWebhooksByType({
  types: ["payment.received", "payment.updated", "payment.confirmed"],
});

console.log(`Retried ${result.processed} payment webhooks`);
```

### Example 2: Retry Notifications Only

```typescript
const result = await retryFailedWebhooksByType({
  types: ["notification.sent", "notification.failed"],
});
```

### Example 3: Get Statistics for Specific Type

```typescript
const stats = await getRetryStatisticsByType(["payment.received"]);

console.log(`Payment Received Webhooks:`);
console.log(`- Total: ${stats.byType["payment.received"].total}`);
console.log(`- Ready for Retry: ${stats.byType["payment.received"].readyForRetry}`);
console.log(`- Max Retries Exceeded: ${stats.byType["payment.received"].maxRetriesExceeded}`);
```

## Best Practices

### 1. Filter by Category First

Start with category filters (Payments, Notifications, Status, Errors) before drilling down to specific types.

### 2. Check Retry Limits

Always verify retry count before retrying to avoid exceeding max attempts:

```typescript
const stats = await getRetryStatisticsByType();
console.log(`${stats.overall.maxRetriesExceeded} webhooks exceeded max retries`);
```

### 3. Batch Retries

For large numbers of failed webhooks, use the `limit` parameter to batch process:

```typescript
// Process 100 at a time
await retryFailedWebhooksByType({
  types: ["payment.received"],
  limit: 100,
});
```

### 4. Monitor Success Rate

Track success rate by type to identify problematic webhook types:

```typescript
const stats = await getRetryStatisticsByType();
const successRate = (
  (stats.overall.total - stats.overall.maxRetriesExceeded) /
  stats.overall.total
) * 100;
```

## Error Handling

The selective retry system handles errors gracefully:

```typescript
const result = await retryFailedWebhooksByType({
  types: ["payment.received"],
});

if (result.errors.length > 0) {
  console.error("Retry errors:", result.errors);
  // {
  //   webhookId: 123,
  //   error: "Invalid payload JSON"
  // }
}
```

## Performance Considerations

- **Filtering**: O(n) where n is number of failed webhooks
- **Retry Execution**: O(m) where m is number of selected webhooks
- **Statistics**: O(n) with single database query

For optimal performance:
- Use category filters when possible
- Limit retry batch size to 100-500 webhooks
- Schedule retries during off-peak hours

## Troubleshooting

### No Webhooks Found for Type

Verify the webhook type is correct:

```typescript
// Check available types
console.log(Object.values(WEBHOOK_TYPES));

// Verify type exists in failures
const failures = await getFailureCountByType();
console.log(Object.keys(failures));
```

### Max Retries Exceeded

Check retry count before retrying:

```typescript
const stats = await getRetryStatisticsByType();
console.log(`Max retries exceeded: ${stats.overall.maxRetriesExceeded}`);

// Increase max retries if needed
await retryFailedWebhooksByType({
  maxRetries: 10, // Increase from default 5
});
```

### Retry Failed

Check error details:

```typescript
const result = await retryFailedWebhooksByType({
  types: ["payment.received"],
});

result.errors.forEach((error) => {
  console.error(`Webhook ${error.webhookId}: ${error.error}`);
});
```

## Related Features

- [Webhook Admin Dashboard](./WEBHOOK_ADMIN_DASHBOARD.md)
- [Webhook Status Badges](./WEBHOOK_BADGE_ALERTS.md)
- [Quick Retry](./WEBHOOK_QUICK_RETRY.md)
- [Database Integration](./WEBHOOK_DATABASE_INTEGRATION.md)
