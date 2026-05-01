---
name: asaas-webhook-integration
description: Implement real-time payment status synchronization with Asaas webhooks. Use for integrating Asaas payment processing, setting up webhook handlers, creating admin dashboards for webhook management, and enabling automatic payment status updates in your database.
---

# Asaas Webhook Integration Skill

## Overview

This skill provides a complete workflow for integrating Asaas payment webhooks into your application. It covers API integration, webhook handling, database synchronization, and admin dashboard creation.

## When to Use

Use this skill when:
- Integrating Asaas payment processing into your app
- Setting up real-time payment status updates via webhooks
- Building admin dashboards for webhook management
- Implementing retry logic for failed webhooks
- Need to track payment events and create notifications

## Quick Start

### 1. Generate Boilerplate

```bash
python /home/ubuntu/skills/asaas-webhook-integration/scripts/generate_asaas_boilerplate.py /path/to/project
```

This creates:
- `server/_core/asaas-adapter.ts` - Switches between real/mock clients
- `server/_core/asaas-webhook-handler.ts` - Processes webhook events
- `server/_core/asaas-webhook-endpoint.ts` - HTTP endpoint for webhooks
- `.env.example` - Environment variable template

### 2. Implement Real Client

Create `server/_core/asaas-real.ts` with actual API calls. See `references/integration-workflow.md` for details.

### 3. Implement Database Operations

Create `server/_core/asaas-webhook-db.ts` to update your database with payment status changes.

### 4. Register Webhook Endpoint

In your Express app:

```typescript
import webhookRouter from "./server/_core/asaas-webhook-endpoint";
app.use("/api", webhookRouter);
```

### 5. Configure Environment

Set in `.env`:

```
ASAAS_API_KEY=aac_test_...
ASAAS_WEBHOOK_SECRET=your_secret_...
ASAAS_BASE_URL=https://sandbox.asaas.com/v3
WEBHOOK_URL=https://yourdomain.com/api/webhooks/asaas
```

### 6. Test Webhook

Use Asaas dashboard to trigger test webhook.

## Architecture

### Adapter Pattern

Switch between real and mock clients based on environment:

```typescript
export function getAsaasClient(): AsaasClient {
  const apiKey = process.env.ASAAS_API_KEY;
  if (apiKey && apiKey.startsWith("aac_")) {
    return new AsaasRealClient(apiKey);
  }
  return new AsaasMockClient();
}
```

**Benefits**: Test without API calls, easy switching to production, deterministic mock behavior.

### Webhook Flow

```
Asaas → POST /webhooks/asaas
  ↓
Validate signature
  ↓
Parse event
  ↓
Process event
  ├─ Extract IDs
  ├─ Map status
  ├─ Update database
  └─ Create notification
  ↓
Log result
  ↓
Return 200 OK
```

## Implementation Steps

### Step 1: API Integration (1-2 hours)

1. Run: `generate_asaas_boilerplate.py`
2. Implement `AsaasRealClient` with API calls
3. Create `AsaasMockClient` for testing
4. Test both with unit tests

### Step 2: Webhook Infrastructure (1-2 hours)

1. Implement webhook handler
2. Create HTTP endpoint
3. Add signature validation
4. Test with curl/Postman

### Step 3: Database Integration (1-2 hours)

1. Create webhook history table
2. Create metrics table
3. Implement update functions
4. Add logging/notification

### Step 4: Admin Dashboard (2-3 hours)

1. Create dashboard component
2. Add search functionality
3. Implement retry system
4. Add status badges

### Step 5: Testing & Deployment (1-2 hours)

1. Write comprehensive tests
2. Test in sandbox environment
3. Register webhook with Asaas
4. Deploy to production
5. Monitor initial events

## Webhook Events

| Event | Trigger | Action |
|-------|---------|--------|
| `payment.received` | Payment received | Update status to RECEIVED |
| `payment.updated` | Status changed | Update payment record |
| `payment.confirmed` | Payment confirmed | Update status to CONFIRMED |
| `payment.overdue` | Payment overdue | Mark as overdue, send reminder |
| `payment.deleted` | Payment cancelled | Update status to CANCELLED |

## Status Mapping

```
Asaas Status → Internal Status
PENDING → pending
RECEIVED → received
CONFIRMED → confirmed
OVERDUE → overdue
CANCELLED → cancelled
REFUNDED → refunded
RECEIVED_IN_CASH → received
CHARGEBACK → chargeback
```

## Security

1. **Validate Signatures**: Always verify HMAC-SHA256
2. **Use HTTPS**: Encrypt webhook traffic
3. **Rotate Secrets**: Change webhook secret regularly
4. **Rate Limit**: Prevent abuse
5. **Log Everything**: Audit trail for compliance
6. **Error Handling**: Don't leak sensitive data
7. **Access Control**: Admin-only endpoints
8. **Input Validation**: Sanitize all inputs

## Error Handling

### Webhook Validation Fails

```typescript
if (!validateWebhookSignature(body, signature, secret)) {
  console.warn("Invalid signature");
  return res.status(401).json({ error: "Invalid signature" });
}
```

### Database Update Fails

Implement retry logic with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: 5 seconds
Attempt 3: 15 seconds
Attempt 4: 1 hour
Attempt 5: 4 hours
Attempt 6: 24 hours
```

## Testing

### Unit Tests

```typescript
describe("Asaas API", () => {
  it("should create customer", async () => {
    const result = await asaasClient.createCustomer({...});
    expect(result.id).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe("Webhook Integration", () => {
  it("should process payment.received event", async () => {
    const result = await processWebhookEvent("payment.received", {...});
    expect(result.success).toBe(true);
  });
});
```

## Monitoring

### Key Metrics

- Webhook success rate
- Average processing time
- Error rate by type
- Retry success rate
- Database update latency

### Alerts

- Success rate < 90%
- Processing time > 5 seconds
- Error rate > 5%
- Database connection failures

## Troubleshooting

### Webhook Not Received

1. Verify webhook URL is public
2. Check firewall rules
3. Verify webhook registered in Asaas
4. Check logs for registration errors
5. Test with Asaas dashboard trigger

### Signature Validation Fails

1. Verify webhook secret is correct
2. Check signature calculation
3. Ensure raw body used (not parsed)
4. Verify HMAC algorithm (SHA256)
5. Check timestamp validation

### Database Updates Fail

1. Check database connection
2. Verify payment exists
3. Check transaction isolation
4. Review error logs
5. Implement retry logic

## References

- **API Reference**: See `references/asaas-api-reference.md`
- **Integration Workflow**: See `references/integration-workflow.md`
- **Boilerplate Generator**: `scripts/generate_asaas_boilerplate.py`

## Example Implementation

See `/home/ubuntu/gestao-condominio-rua/` for complete working example:

- `server/_core/asaas-real.ts` - Real API client
- `server/_core/asaas-webhook-handler.ts` - Webhook handler
- `server/_core/asaas-webhook-db.ts` - Database operations
- `app/(tabs)/webhook-dashboard.tsx` - Admin dashboard
- `tests/asaas-real-api.test.ts` - API tests

## Next Steps

After implementing basic webhook integration:

1. **Admin Dashboard**: Create UI for webhook management
2. **Retry System**: Implement automatic retry with backoff
3. **Search & Export**: Add search and CSV export
4. **Monitoring**: Set up alerts and dashboards
5. **Analytics**: Track payment patterns and trends
