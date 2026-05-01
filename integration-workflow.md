# Asaas Webhook Integration Workflow

## Overview

This workflow guides implementing real-time payment status synchronization with Asaas webhooks.

## Phase 1: API Integration Layer

### Step 1.1: Create Adapter Pattern

Implement adapter to switch between real and mock implementations:

```typescript
// server/_core/asaas-adapter.ts
export const asaasClient = process.env.ASAAS_API_KEY
  ? new AsaasRealClient(process.env.ASAAS_API_KEY)
  : new AsaasMockClient();
```

**Why**: Enables testing without real API calls, easy switching to production.

### Step 1.2: Implement Real Client

Create client with full Asaas API support:

```typescript
// server/_core/asaas-real.ts
export class AsaasRealClient {
  async createCustomer(data: CustomerData): Promise<Customer>
  async getPayment(id: string): Promise<Payment>
  async listPayments(filters: PaymentFilters): Promise<Payment[]>
  async updatePayment(id: string, data: PaymentUpdate): Promise<Payment>
}
```

**Key methods**:
- `createCustomer()` - Register new customer
- `getPayment()` - Fetch single payment
- `listPayments()` - Query with filters
- `updatePayment()` - Modify payment

### Step 1.3: Add Mock Client

Create mock for testing without API:

```typescript
// server/_core/asaas-mock.ts
export class AsaasMockClient {
  // Same interface as real client
  // Returns predictable test data
}
```

**Benefits**: Fast tests, no API rate limits, deterministic behavior.

## Phase 2: Webhook Infrastructure

### Step 2.1: Create Webhook Handler

Implement event processing:

```typescript
// server/_core/asaas-webhook-handler.ts
export async function processWebhookEvent(
  event: string,
  data: WebhookData
): Promise<ProcessResult>
```

**Responsibilities**:
- Parse event type
- Extract payment/customer ID
- Map Asaas status to internal status
- Trigger database updates

### Step 2.2: Add Webhook Endpoint

Create HTTP endpoint for receiving webhooks:

```typescript
// server/_core/asaas-webhook-endpoint.ts
router.post("/webhooks/asaas", async (req, res) => {
  // 1. Validate signature
  // 2. Parse body
  // 3. Process event
  // 4. Log result
  // 5. Return 200 OK
});
```

**Security**:
- Validate HMAC-SHA256 signature
- Reject invalid signatures
- Rate limit by IP
- Log all events

### Step 2.3: Register Webhook with Asaas

Create endpoint to register webhook:

```typescript
// server/_core/webhook-registration.ts
export async function registerWebhook(
  webhookUrl: string,
  events: string[]
): Promise<WebhookId>
```

**Events to register**:
- `payment.received`
- `payment.updated`
- `payment.confirmed`
- `payment.overdue`
- `notification.sent`

## Phase 3: Database Integration

### Step 3.1: Create Webhook History Schema

Track all webhook events:

```sql
CREATE TABLE webhookHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event VARCHAR(100),
  asaasPaymentId VARCHAR(100),
  asaasCustomerId VARCHAR(100),
  status VARCHAR(50),
  success BOOLEAN,
  errorMessage TEXT,
  receivedAt TIMESTAMP,
  processedAt TIMESTAMP,
  payload JSON
);
```

### Step 3.2: Create Metrics Table

Collect statistics:

```sql
CREATE TABLE webhookMetrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  date DATE,
  eventType VARCHAR(100),
  successCount INT,
  failureCount INT,
  avgProcessingTime INT,
  createdAt TIMESTAMP
);
```

### Step 3.3: Implement Database Queries

Create functions to update payments:

```typescript
// server/_core/asaas-webhook-db.ts
export async function updatePaymentFromWebhook(
  asaasPaymentId: string,
  status: string,
  data: WebhookData
): Promise<void>
```

**Logic**:
1. Find payment by Asaas ID
2. Map status (RECEIVED → PAID)
3. Update database
4. Create notification
5. Log event

## Phase 4: Admin Dashboard

### Step 4.1: Create Dashboard Component

Build admin interface:

```tsx
// app/(tabs)/webhook-dashboard.tsx
export function WebhookDashboard() {
  // Display metrics
  // Show recent events
  // Provide retry buttons
}
```

**Features**:
- Real-time metrics
- Event history
- Status badges
- Quick retry

### Step 4.2: Add Search Functionality

Enable finding specific webhooks:

```tsx
// components/webhook-search.tsx
export function WebhookSearch() {
  // Search by payment ID
  // Search by customer ID
  // Filter by status
  // Filter by date
}
```

### Step 4.3: Implement Retry System

Allow manual retry of failed webhooks:

```typescript
// server/_core/webhook-retry.ts
export async function retryFailedWebhooks(
  filters?: RetryFilters
): Promise<RetryResult>
```

**Retry strategy**:
- Exponential backoff
- Max 6 attempts
- Configurable delays
- Automatic scheduling

## Phase 5: Testing & Monitoring

### Step 5.1: Unit Tests

Test each component:

```typescript
// tests/asaas-real-api.test.ts
describe("Asaas Real API", () => {
  it("should create customer", async () => {
    const result = await asaasClient.createCustomer({...});
    expect(result.id).toBeDefined();
  });
});
```

### Step 5.2: Integration Tests

Test webhook flow:

```typescript
// tests/webhook-integration.test.ts
describe("Webhook Integration", () => {
  it("should process payment.received event", async () => {
    const result = await processWebhookEvent("payment.received", {...});
    expect(result.success).toBe(true);
  });
});
```

### Step 5.3: Monitoring

Track webhook health:

```typescript
// Monitor success rate
// Alert on failures > threshold
// Log processing times
// Track error types
```

## Implementation Checklist

### Core Integration
- [ ] Create Asaas adapter (real + mock)
- [ ] Implement real API client
- [ ] Add mock client for testing
- [ ] Create webhook handler
- [ ] Build webhook endpoint
- [ ] Register webhook with Asaas

### Database
- [ ] Create webhook history table
- [ ] Create metrics table
- [ ] Implement database queries
- [ ] Add logging functions
- [ ] Create notification triggers

### Admin Interface
- [ ] Build dashboard component
- [ ] Add search functionality
- [ ] Implement retry system
- [ ] Create status badges
- [ ] Add quick actions

### Testing & Monitoring
- [ ] Write unit tests (API client)
- [ ] Write integration tests (webhooks)
- [ ] Add monitoring/alerts
- [ ] Test error scenarios
- [ ] Validate retry logic

### Deployment
- [ ] Set environment variables
- [ ] Configure webhook URL
- [ ] Register webhooks with Asaas
- [ ] Test in sandbox
- [ ] Deploy to production
- [ ] Monitor initial events

## Environment Variables

### Test Environment

```
ASAAS_API_KEY=aac_test_...
ASAAS_WEBHOOK_SECRET=test_secret_...
ASAAS_BASE_URL=https://sandbox.asaas.com/v3
WEBHOOK_URL=http://localhost:3000/api/webhooks/asaas
```

### Production Environment

```
ASAAS_API_KEY=aac_prod_...
ASAAS_WEBHOOK_SECRET=prod_secret_...
ASAAS_BASE_URL=https://api.asaas.com/v3
WEBHOOK_URL=https://yourdomain.com/api/webhooks/asaas
```

## Common Issues & Solutions

### Webhook Not Received

**Problem**: Webhooks not arriving at endpoint.

**Solutions**:
1. Verify webhook URL is public
2. Check firewall rules
3. Verify webhook registered in Asaas
4. Check logs for registration errors
5. Test with Asaas dashboard trigger

### Signature Validation Fails

**Problem**: Webhook signature invalid.

**Solutions**:
1. Verify webhook secret is correct
2. Check signature calculation
3. Ensure raw body used (not parsed)
4. Verify HMAC algorithm (SHA256)
5. Check timestamp validation

### Database Updates Fail

**Problem**: Webhook received but database not updated.

**Solutions**:
1. Check database connection
2. Verify payment exists
3. Check transaction isolation
4. Review error logs
5. Implement retry logic

### High Failure Rate

**Problem**: Many webhooks failing.

**Solutions**:
1. Check API rate limits
2. Verify network connectivity
3. Review error messages
4. Check database capacity
5. Implement exponential backoff

## Performance Optimization

### Caching

```typescript
// Cache payment lookups
const cache = new Map<string, Payment>();
```

### Batch Processing

```typescript
// Process multiple webhooks in batch
await processBatch(webhooks, batchSize);
```

### Async Processing

```typescript
// Don't block webhook response
queue.enqueue(processWebhookEvent);
res.status(200).send("OK");
```

## Security Best Practices

1. **Validate signatures** - Always verify HMAC
2. **Use HTTPS** - Encrypt webhook traffic
3. **Rotate secrets** - Change webhook secret regularly
4. **Rate limit** - Prevent abuse
5. **Log everything** - Audit trail for compliance
6. **Error handling** - Don't leak sensitive data
7. **Access control** - Admin-only endpoints
8. **Input validation** - Sanitize all inputs
