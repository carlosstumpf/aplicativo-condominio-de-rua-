# Webhook Admin Dashboard - Quick Start

## What Was Built

A complete webhook administration system with:
- **Real-time metrics dashboard** showing webhook statistics
- **Webhook history viewer** with filtering and pagination
- **Automatic retry mechanism** with exponential backoff
- **Manual retry functionality** for failed webhooks
- **tRPC API endpoints** for all operations
- **17 comprehensive tests** covering all features

## Quick Access

### Screens
1. **Webhook Dashboard** (`app/(tabs)/webhook-dashboard.tsx`)
   - View real-time metrics
   - Monitor retry statistics
   - Process failed webhooks

2. **Webhook History** (`app/(tabs)/webhook-history.tsx`)
   - View all webhook events
   - Filter by status
   - Manually retry failed webhooks

### Database Tables
- `webhookHistory` - Stores all webhook events
- `webhookMetrics` - Aggregated daily statistics

## Key Features

### 1. Metrics Dashboard
```
Recebidos: 100          Processados: 100
Sucesso: 95             Falhas: 5
Taxa de Sucesso: 95%    Tempo Médio: 150ms
Status Atualizados: 95  Notificações: 95
```

### 2. Retry Management
```
Falhadas: 5             Prontas para Retry: 2
Máx. Tentativas: 1      Média de Tentativas: 1.4
```

### 3. Webhook History
- Paginated list of all webhook events
- Filter: Todos | Sucesso | Falhas
- Details: Event, Status, Timestamps, Error Messages
- Action: Retry failed webhooks

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `webhookAdmin.getStatistics` | Get metrics for date range |
| `webhookAdmin.getHistory` | Get webhook events with filters |
| `webhookAdmin.getRetryStatistics` | Get retry attempt stats |
| `webhookAdmin.retryWebhook` | Manually retry a webhook |
| `webhookAdmin.processFailedWebhooks` | Process all failed webhooks |
| `webhookAdmin.getEventsSummary` | Get event type summary |
| `webhookAdmin.clearOldHistory` | Delete old webhook records |

## Retry Logic

### Automatic Retries
- Runs every minute in background
- Exponential backoff: 5m → 15m → 1h → 4h → 24h
- Maximum 5 attempts per webhook
- Automatic status updates and notifications

### Manual Retries
- Click "Tentar Novamente" on failed webhook
- Immediate processing
- Result shown to user
- If still failing, next retry scheduled

## Database Queries

### Get Failed Webhooks
```typescript
const failed = await webhookDb.getFailedWebhooksForRetry(10);
```

### Get Metrics
```typescript
const metrics = await webhookDb.getWebhookStatistics(30);
```

### Get History
```typescript
const history = await webhookDb.getWebhookHistory({
  page: 1,
  limit: 20,
  success: true,
});
```

## Testing

### Run Tests
```bash
pnpm test webhook-admin
```

### Expected Output
```
✓ tests/webhook-admin.test.ts (17 tests)
Tests  365 passed | 1 skipped (366)
```

## Monitoring

### Success Rate
- Target: > 95%
- Alert if: < 90%

### Average Processing Time
- Target: < 500ms
- Alert if: > 1000ms

### Failed Webhooks
- Target: < 5%
- Alert if: > 10 in 1 hour

## Common Tasks

### View Dashboard
1. Navigate to Webhook Dashboard screen
2. See real-time metrics
3. Check retry statistics
4. Process failed webhooks if needed

### Find Failed Webhook
1. Go to Webhook History
2. Click "Falhas" filter
3. Scroll to find webhook
4. Click "Tentar Novamente"

### Clear Old History
```typescript
await webhookDb.clearOldWebhookHistory(90);
```

### Get Event Summary
```typescript
const summary = await client.webhookAdmin.getEventsSummary.query();
```

## File Structure

```
server/
  ├── _core/
  │   ├── asaas-webhook-logging.ts      # Logging & metrics
  │   ├── asaas-webhook-retry.ts        # Retry mechanism
  │   └── asaas-webhook-db.ts           # Database operations
  ├── db-queries-webhooks.ts             # Webhook queries
  └── routers/
      └── webhook-admin.ts               # tRPC endpoints

app/(tabs)/
  ├── webhook-dashboard.tsx              # Metrics dashboard
  └── webhook-history.tsx                # Event history

drizzle/
  └── schema.ts                          # Database tables

tests/
  └── webhook-admin.test.ts              # 17 unit tests
```

## Configuration

### Retry Settings
```typescript
const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 60000; // 1 minute
```

### Backoff Schedule
```typescript
const delays = [5, 15, 60, 240, 1440]; // minutes
```

## Troubleshooting

### Webhooks Not Retrying
1. Check if scheduler is running
2. Verify database connection
3. Check next retry time in DB

### High Failure Rate
1. Review error messages
2. Check webhook payload format
3. Verify morador records exist

### Slow Processing
1. Check database performance
2. Monitor server resources
3. Review webhook payload size

## Next Steps

1. **Add to Tab Navigation**: Include webhook screens in app tabs
2. **Set Up Alerts**: Configure email/SMS for webhook failures
3. **Monitor Metrics**: Track success rate and processing times
4. **Regular Maintenance**: Clear old history monthly
5. **Optimize**: Review and improve retry strategy

## Integration Example

### Add to Tab Navigation
```typescript
// app/(tabs)/_layout.tsx
<Tabs.Screen
  name="webhook-dashboard"
  options={{
    title: "Webhooks",
    tabBarIcon: ({ color }) => <IconSymbol name="webhook" color={color} />,
  }}
/>

<Tabs.Screen
  name="webhook-history"
  options={{
    title: "Histórico",
    tabBarIcon: ({ color }) => <IconSymbol name="history" color={color} />,
  }}
/>
```

### Use tRPC Endpoints
```typescript
import { trpc } from "@/lib/trpc";

// Get metrics
const metrics = await trpc.webhookAdmin.getStatistics.useQuery({ days: 30 });

// Get history
const history = await trpc.webhookAdmin.getHistory.useQuery({
  page: 1,
  limit: 20,
});

// Retry webhook
await trpc.webhookAdmin.retryWebhook.useMutation({
  webhookId: 123,
});
```

## Performance Metrics

- **Dashboard Load Time**: < 500ms
- **History Query Time**: < 1000ms
- **Webhook Processing**: < 500ms
- **Retry Check Interval**: 60 seconds
- **Database Queries**: Optimized with indexes

## Security

- ✅ Protected endpoints (admin only)
- ✅ Input validation on all endpoints
- ✅ Parameterized database queries
- ✅ Error message sanitization
- ✅ Rate limiting ready

## Support

For issues:
1. Check `docs/WEBHOOK_ADMIN_DASHBOARD.md` for detailed docs
2. Review test cases in `tests/webhook-admin.test.ts`
3. Check logs in `server/_core/asaas-webhook-logging.ts`

## Version

- **v1.0.0** (2026-04-27)
  - Initial release
  - Metrics dashboard
  - History viewer
  - Retry mechanism
  - 17 unit tests
