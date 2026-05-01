# Webhook Administration Dashboard

## Overview

The Webhook Administration Dashboard provides comprehensive monitoring, management, and troubleshooting tools for Asaas webhook events. It includes real-time metrics, retry management, and detailed event history.

## Features

### 1. **Real-Time Metrics Dashboard**
- **Webhooks Recebidos**: Total webhooks received in the last 30 days
- **Webhooks Processados**: Successfully processed webhooks
- **Taxa de Sucesso**: Percentage of successful webhook processing
- **Tempo Médio**: Average processing time in milliseconds
- **Status Atualizados**: Count of payment status updates
- **Notificações Criadas**: Count of notifications created

### 2. **Retry Management**
- **Webhooks Falhados**: Total failed webhooks
- **Prontos para Retry**: Webhooks ready for automatic retry
- **Máx. Tentativas**: Webhooks that exceeded maximum retries
- **Média de Tentativas**: Average retry attempts per webhook
- **Processar Falhados**: One-click button to manually process failed webhooks

### 3. **Webhook History**
- **Detailed Event Log**: View all webhook events with full details
- **Filter by Status**: Show all, successful, or failed webhooks
- **Pagination**: Navigate through webhook history
- **Manual Retry**: Retry individual failed webhooks
- **Error Messages**: View detailed error information

### 4. **Automatic Retry Mechanism**
- **Exponential Backoff**: 5m → 15m → 1h → 4h → 24h
- **Maximum Retries**: 5 attempts per webhook
- **Background Scheduler**: Automatic retry processing every minute
- **Status Tracking**: Monitor retry attempts and next retry time

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Webhook Admin Dashboard (React Components)          │
│ - webhook-dashboard.tsx (metrics)                   │
│ - webhook-history.tsx (event history)               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ tRPC Router (webhook-admin.ts)                      │
│ - getStatistics()                                   │
│ - getHistory()                                      │
│ - getRetryStatistics()                              │
│ - retryWebhook()                                    │
│ - processFailedWebhooks()                           │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐
   │ Logging │ │ Retry    │ │ Database │
   │ Module  │ │ Scheduler│ │ Queries  │
   └─────────┘ └──────────┘ └──────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Database Tables             │
        │ - webhookHistory            │
        │ - webhookMetrics            │
        └─────────────────────────────┘
```

## Database Schema

### webhookHistory Table
```sql
CREATE TABLE webhookHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asaasPaymentId VARCHAR(100) NOT NULL,
  event VARCHAR(50) NOT NULL,
  asaasStatus VARCHAR(50) NOT NULL,
  internalStatus ENUM('PENDING', 'RECEIVED', 'OVERDUE', 'CANCELLED') NOT NULL,
  payload TEXT NOT NULL,
  statusCode INT DEFAULT 200,
  success INT DEFAULT 1,
  errorMessage TEXT,
  statusUpdated INT DEFAULT 0,
  notificationCreated INT DEFAULT 0,
  retryCount INT DEFAULT 0,
  nextRetryAt TIMESTAMP,
  lastRetryAt TIMESTAMP,
  receivedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### webhookMetrics Table
```sql
CREATE TABLE webhookMetrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date VARCHAR(10) NOT NULL UNIQUE,
  totalReceived INT DEFAULT 0,
  totalProcessed INT DEFAULT 0,
  totalSuccessful INT DEFAULT 0,
  totalFailed INT DEFAULT 0,
  totalRetried INT DEFAULT 0,
  averageProcessingTime INT DEFAULT 0,
  statusUpdatedCount INT DEFAULT 0,
  notificationCreatedCount INT DEFAULT 0,
  errorCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Components

### 1. Webhook Dashboard (`webhook-dashboard.tsx`)

**Purpose**: Display real-time metrics and statistics

**Features**:
- Metrics cards with color-coded values
- Retry statistics
- Process failed webhooks button
- Refresh control
- Information panel with retry logic explanation

**Usage**:
```tsx
import WebhookDashboard from "@/app/(tabs)/webhook-dashboard";

// Add to tab navigation
<Tabs.Screen
  name="webhook-dashboard"
  options={{
    title: "Webhooks",
    tabBarIcon: ({ color }) => <IconSymbol name="webhook" color={color} />,
  }}
/>
```

### 2. Webhook History (`webhook-history.tsx`)

**Purpose**: View and manage webhook event history

**Features**:
- Paginated list of webhook events
- Filter by status (all, success, failed)
- Detailed event information
- Manual retry button
- Error message display
- Timestamp display

**Usage**:
```tsx
import WebhookHistory from "@/app/(tabs)/webhook-history";

// Add to tab navigation
<Tabs.Screen
  name="webhook-history"
  options={{
    title: "Histórico",
    tabBarIcon: ({ color }) => <IconSymbol name="history" color={color} />,
  }}
/>
```

## API Endpoints

### `webhookAdmin.getStatistics`
Get webhook statistics for a date range

**Input**:
```typescript
{ days: number } // default: 30
```

**Output**:
```typescript
{
  totalReceived: number;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  successRate: number;
  averageProcessingTime: number;
  statusUpdatedCount: number;
  notificationCreatedCount: number;
}
```

### `webhookAdmin.getHistory`
Get webhook event history with filters

**Input**:
```typescript
{
  page: number;
  limit: number;
  asaasPaymentId?: string;
  event?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
}
```

**Output**:
```typescript
{
  data: WebhookHistoryRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

### `webhookAdmin.getRetryStatistics`
Get retry attempt statistics

**Output**:
```typescript
{
  totalFailed: number;
  readyForRetry: number;
  maxRetriesExceeded: number;
  averageRetries: number;
}
```

### `webhookAdmin.retryWebhook`
Manually retry a specific webhook

**Input**:
```typescript
{ webhookId: number }
```

**Output**:
```typescript
{
  success: boolean;
  message: string;
}
```

### `webhookAdmin.processFailedWebhooks`
Process all failed webhooks immediately

**Output**:
```typescript
{
  processed: number;
  successful: number;
  failed: number;
}
```

## Retry Mechanism

### Exponential Backoff Schedule
| Attempt | Delay | Total Time |
|---------|-------|-----------|
| 1st | 5 minutes | 5m |
| 2nd | 15 minutes | 20m |
| 3rd | 1 hour | 1h 20m |
| 4th | 4 hours | 5h 20m |
| 5th | 24 hours | 29h 20m |

### Retry Flow
1. Webhook fails to process
2. System calculates next retry time
3. Webhook record updated with retry info
4. Scheduler checks every minute for ready webhooks
5. Failed webhooks are retried automatically
6. If successful, webhook marked as complete
7. If still failing, next retry scheduled
8. After 5 attempts, webhook marked as permanently failed

### Manual Retry
Users can manually retry failed webhooks:
1. Click "Tentar Novamente" button on failed webhook
2. System immediately attempts to process webhook
3. Result displayed to user
4. If still failing, next retry scheduled

## Monitoring

### Key Metrics to Track
- **Success Rate**: Should be > 95%
- **Average Processing Time**: Should be < 500ms
- **Failed Webhooks**: Should be < 5% of total
- **Retry Success Rate**: Should be > 80%

### Alerts
Consider setting up alerts for:
- Success rate drops below 90%
- More than 10 webhooks fail in an hour
- Average processing time exceeds 1000ms
- Webhooks exceed maximum retries

## Troubleshooting

### High Failure Rate
1. Check database connection
2. Review error messages in webhook history
3. Check payment data format
4. Verify morador records exist
5. Check user associations

### Slow Processing
1. Check database query performance
2. Monitor server CPU and memory
3. Check network latency to Asaas
4. Review webhook payload size

### Webhooks Not Retrying
1. Verify retry scheduler is running
2. Check next retry time in database
3. Review retry statistics
4. Check error logs

### Notifications Not Created
1. Verify morador has associated user
2. Check notification type is valid
3. Review error messages
4. Check notification permissions

## Best Practices

### 1. Regular Monitoring
- Check dashboard daily
- Review failure patterns
- Monitor success rate trends

### 2. Proactive Maintenance
- Process failed webhooks manually if needed
- Clear old history monthly (90+ days)
- Review and optimize retry strategy

### 3. Error Handling
- Document common error patterns
- Create runbooks for common issues
- Set up automated alerts

### 4. Performance Optimization
- Monitor processing times
- Optimize database queries
- Consider caching metrics

## Configuration

### Environment Variables
```bash
# Webhook retry scheduler
WEBHOOK_RETRY_INTERVAL=60000  # Check every minute
WEBHOOK_MAX_RETRIES=5         # Maximum retry attempts
```

### Database Maintenance
```sql
-- Clear webhooks older than 90 days
DELETE FROM webhookHistory 
WHERE receivedAt < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Archive old metrics
DELETE FROM webhookMetrics 
WHERE date < DATE_SUB(CURDATE(), INTERVAL 180 DAY);
```

## Future Enhancements

1. **Advanced Filtering**: Filter by date range, payment amount, etc.
2. **Export Functionality**: Export webhook history to CSV/Excel
3. **Webhook Replay**: Ability to replay webhooks from dashboard
4. **Real-time Updates**: WebSocket updates for live metrics
5. **Alerting**: Email/SMS alerts for webhook failures
6. **Webhook Simulation**: Test webhook processing with sample data
7. **Performance Analytics**: Detailed performance metrics and graphs
8. **Webhook Validation**: Validate webhook signatures and payloads

## Testing

### Unit Tests
```bash
pnpm test webhook-admin
```

### Manual Testing
1. Navigate to Webhook Dashboard
2. Verify metrics display correctly
3. Check retry statistics
4. Test manual retry functionality
5. Filter webhook history
6. Verify pagination works

### Integration Testing
1. Trigger test webhook from Asaas
2. Verify webhook is logged
3. Check metrics are updated
4. Verify notifications are created
5. Test retry mechanism

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review webhook logs
3. Check database records
4. Contact support with webhook ID

## Version History

- **v1.0.0** (2026-04-27): Initial implementation
  - Metrics dashboard
  - Webhook history viewer
  - Retry mechanism
  - tRPC API endpoints
  - 17 unit tests
  - Full documentation
