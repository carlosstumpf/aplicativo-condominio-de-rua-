# Webhook Database Integration

## Overview

This document describes how Asaas webhooks automatically update payment status in the database and create notifications for moradores.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Asaas Payment Gateway                                       │
│ (Sends webhook events)                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/webhooks/asaas                                    │
│ (asaas-webhook-endpoint.ts)                                 │
│ - Validates HMAC signature                                  │
│ - Parses webhook payload                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Webhook Handler (asaas-webhook-handler.ts)                  │
│ - Maps Asaas status to internal status                      │
│ - Calls database handlers                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────────┐ ┌──────────┐ ┌──────────┐
   │ Update DB  │ │ Create   │ │ Log      │
   │ Status     │ │ Notif.   │ │ Event    │
   └────────────┘ └──────────┘ └──────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Database (asaas-webhook-db) │
        │ - cobrancas table           │
        │ - notificacoes table        │
        │ - webhook logs              │
        └─────────────────────────────┘
```

## Database Operations

### 1. Payment Status Update

**File**: `server/_core/asaas-webhook-db.ts`

**Function**: `handlePaymentStatusUpdate(asaasPaymentId, asaasStatus, paymentData)`

**Process**:
1. Lookup cobranca by Asaas payment ID
2. Map Asaas status to internal status using `mapAsaasStatusToCobrancaStatus()`
3. Compare with current status
4. Update only if status has changed
5. Return success/error result

**Status Mapping**:
| Asaas Status | Internal Status | Description |
|--------------|-----------------|-------------|
| PENDING | PENDING | Awaiting payment |
| CONFIRMED | PENDING | Confirmed but not received |
| RECEIVED | RECEIVED | Payment received successfully |
| OVERDUE | OVERDUE | Payment overdue |
| REFUNDED | CANCELLED | Payment refunded |
| DELETED | CANCELLED | Payment cancelled |
| CHARGEBACK_REQUESTED | OVERDUE | Chargeback requested |
| CHARGEBACK_DISPUTE | OVERDUE | Chargeback in dispute |
| CHARGEBACK_REVERSAL | RECEIVED | Chargeback reversed |

### 2. Notification Creation

**Function**: `handlePaymentNotification(asaasPaymentId, event, paymentData)`

**Process**:
1. Lookup cobranca by Asaas payment ID
2. Lookup morador by cobranca.moradorId
3. Skip if morador has no associated user
4. Determine notification type and content based on event
5. Create notification in database
6. Return success/error result

**Event-to-Notification Mapping**:

| Event | Type | Title | Message |
|-------|------|-------|---------|
| payment.received | PAGAMENTO | Pagamento Confirmado | Payment confirmed successfully |
| payment.confirmed | PAGAMENTO | Pagamento Confirmado | Payment confirmed |
| payment.pending | PAGAMENTO | Cobrança Pendente | Charge awaiting payment |
| payment.overdue | VENCIMENTO | Cobrança Vencida | Charge overdue |
| payment.refunded | PAGAMENTO | Pagamento Reembolsado | Payment refunded |
| payment.deleted | PAGAMENTO | Cobrança Cancelada | Charge cancelled |
| payment.chargeback_requested | PAGAMENTO | Chargeback Solicitado | Chargeback requested |
| payment.chargeback_dispute | PAGAMENTO | Chargeback em Disputa | Chargeback in dispute |
| payment.chargeback_reversal | PAGAMENTO | Chargeback Revertido | Chargeback reversed |

### 3. Webhook Event Logging

**Function**: `logWebhookEvent(event, asaasPaymentId, status, details)`

**Process**:
1. Log webhook event to console with timestamp
2. Include event details for audit trail
3. TODO: Implement database logging for webhook events

## Webhook Flow

### Step 1: Webhook Reception
```typescript
POST /api/webhooks/asaas
{
  "event": "payment.received",
  "payment": {
    "id": "pay_123456",
    "customer": "cus_789",
    "value": 15000,
    "status": "RECEIVED",
    "dueDate": "2026-05-15",
    ...
  },
  "timestamp": 1234567890
}
```

### Step 2: Signature Validation
- Extract signature from `X-Asaas-Signature` header
- Validate using HMAC-SHA256 with webhook secret
- Return 401 if signature invalid

### Step 3: Payload Processing
- Parse and validate webhook payload structure
- Extract payment ID and status
- Map Asaas status to internal status

### Step 4: Database Updates
1. **Update Payment Status**:
   ```typescript
   const result = await handlePaymentStatusUpdate(
     paymentId,
     asaasStatus,
     paymentData
   );
   ```

2. **Create Notification**:
   ```typescript
   const result = await handlePaymentNotification(
     paymentId,
     event,
     paymentData
   );
   ```

3. **Log Event**:
   ```typescript
   await logWebhookEvent(event, paymentId, status, paymentData);
   ```

### Step 5: Response
- Always return HTTP 200 to prevent Asaas retries
- Include processing result in response body

## Error Handling

### Cobranca Not Found
- Log warning with payment ID
- Return success: false with error message
- Webhook still returns HTTP 200

### Morador Not Found
- Log warning with morador ID
- Return success: false with error message

### Morador Without User
- Log warning (not an error)
- Return success: true with notification: null
- No notification created (morador not linked to user account)

### Database Errors
- Log error with full error message
- Return success: false with error details
- Webhook still returns HTTP 200

## Testing

### Unit Tests
Location: `tests/asaas-webhook-db.test.ts`

**Coverage**:
- Status mapping (all Asaas statuses)
- Payment status updates
- Notification creation
- Error handling
- Complete webhook processing
- Notification message formatting

**Run Tests**:
```bash
pnpm test asaas-webhook-db
```

### Manual Testing

**Test Endpoint**:
```bash
POST /api/webhooks/test
```

This endpoint creates a test webhook payload and processes it through the same pipeline.

**Example Response**:
```json
{
  "success": true,
  "event": "payment.received",
  "paymentId": "pay_test_123",
  "statusUpdated": "RECEIVED",
  "notificationCreated": true
}
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ASAAS_API_KEY` | Asaas API key | Yes (for real API) |
| `ASAAS_WEBHOOK_SECRET` | Webhook signature secret | Yes (for production) |
| `ASAAS_ENVIRONMENT` | `production` or `sandbox` | No (defaults to sandbox) |

### Webhook Registration

Use the tRPC router to register webhooks:

```typescript
// Register webhook
await client.webhooks.register.mutate({
  url: "https://your-domain.com/api/webhooks/asaas",
  events: [
    "payment.received",
    "payment.overdue",
    "payment.refunded",
    "payment.deleted",
    "payment.chargeback_requested",
    "payment.chargeback_dispute",
    "payment.chargeback_reversal"
  ]
});

// List registered webhooks
const webhooks = await client.webhooks.list.query();

// Get webhook status
const status = await client.webhooks.getStatus.query();

// Delete webhook
await client.webhooks.delete.mutate({ webhookId: "webhook_123" });
```

## Monitoring

### Logs

All webhook operations are logged with prefixes:
- `[Webhook DB]` - Database operations
- `[Asaas Webhook]` - Webhook endpoint operations
- `[Webhook Event Log]` - Event logging

### Example Log Output

```
[Webhook DB] Updated payment pay_123 status: PENDING → RECEIVED
[Webhook DB] Created notification for user 10: Pagamento Confirmado
[Webhook Event Log] Event: payment.received, Payment: pay_123, Status: RECEIVED
```

### Metrics to Monitor

1. **Webhook Success Rate**: Percentage of webhooks processed successfully
2. **Notification Creation Rate**: Percentage of webhooks that create notifications
3. **Status Update Latency**: Time between webhook receipt and database update
4. **Error Rate**: Percentage of failed webhook processing

## Troubleshooting

### Webhook Not Received

1. Check webhook registration:
   ```bash
   GET /api/webhooks/status
   ```

2. Verify webhook URL is publicly accessible

3. Check Asaas webhook logs in dashboard

### Status Not Updated

1. Verify cobranca exists with correct asaasPaymentId
2. Check database connection
3. Review logs for error messages

### Notification Not Created

1. Verify morador exists and is linked to user account
2. Check notification type is valid (PAGAMENTO, VENCIMENTO, CHAMADO)
3. Review logs for error messages

### Signature Validation Failed

1. Verify webhook secret is correct
2. Check that signature header is being sent
3. Ensure payload hasn't been modified

## Future Enhancements

1. **Webhook Event Logging**: Store webhook events in database for audit trail
2. **Retry Logic**: Implement exponential backoff for failed database operations
3. **Batch Processing**: Process multiple webhooks in batch for performance
4. **Webhook Delivery Confirmation**: Confirm webhook delivery to Asaas
5. **Real-time Updates**: Push notification updates to connected clients via WebSocket
6. **Webhook Replay**: Ability to replay failed webhooks from dashboard

## References

- [Asaas Webhook Documentation](https://docs.asaas.com/reference/webhooks)
- [Asaas Payment Status](https://docs.asaas.com/reference/payment-status)
- [Database Schema](../drizzle/schema.ts)
- [Webhook Handler](./asaas-webhook-handler.ts)
- [Webhook Database Operations](./asaas-webhook-db.ts)
