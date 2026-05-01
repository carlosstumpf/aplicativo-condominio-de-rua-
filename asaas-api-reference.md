# Asaas API Reference

## Overview

Asaas is a payment processing platform in Brazil. This reference documents the key API endpoints and webhook events used for payment integration.

## API Authentication

### Test Environment
- **Base URL**: `https://sandbox.asaas.com/v3`
- **API Key**: Provided by Asaas (starts with `aac_`)
- **Header**: `Authorization: Bearer {API_KEY}`

### Production Environment
- **Base URL**: `https://api.asaas.com/v3`
- **API Key**: Production key from Asaas
- **Header**: `Authorization: Bearer {API_KEY}`

## Key Endpoints

### Customers

```
POST /customers
GET /customers
GET /customers/{id}
PUT /customers/{id}
```

### Payments

```
POST /payments
GET /payments
GET /payments/{id}
PUT /payments/{id}
```

### Webhooks

```
POST /webhooks
GET /webhooks
PUT /webhooks/{id}
DELETE /webhooks/{id}
```

## Payment Status Lifecycle

```
PENDING
  ↓
RECEIVED (paid)
  ↓
CONFIRMED (cleared)

OR

PENDING
  ↓
OVERDUE (late)
  ↓
RECEIVED_IN_CASH (paid in cash)
  ↓
CONFIRMED

OR

CANCELLED (never paid)
```

## Webhook Events

### Payment Events

| Event | Trigger | Data |
|-------|---------|------|
| `payment.received` | Payment received | paymentId, status, amount |
| `payment.updated` | Payment status changed | paymentId, status, reason |
| `payment.confirmed` | Payment confirmed | paymentId, status |
| `payment.overdue` | Payment became overdue | paymentId, daysOverdue |
| `payment.deleted` | Payment cancelled | paymentId, reason |

### Notification Events

| Event | Trigger | Data |
|-------|---------|------|
| `notification.sent` | Notification sent to customer | customerId, type |
| `notification.failed` | Notification failed | customerId, type, reason |

## Webhook Payload Structure

```json
{
  "event": "payment.received",
  "data": {
    "id": "pay_123456",
    "object": "payment",
    "status": "RECEIVED",
    "customer": {
      "id": "cust_789012",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "amount": 100.00,
    "netAmount": 97.50,
    "billingType": "BOLETO",
    "dueDate": "2026-04-27",
    "value": 100.00,
    "grossValue": 100.00,
    "description": "Monthly fee",
    "externalReference": "ref_123",
    "installment": null,
    "subscription": null,
    "split": null,
    "anticipation": null,
    "postalService": false,
    "custody": null,
    "custodyId": null,
    "invoiceUrl": "https://...",
    "boletoUrl": "https://...",
    "pixUrl": null,
    "creditCardNumber": null,
    "creditCard": null,
    "pixAddressKey": null,
    "pixExpirationDate": null,
    "pixQrCode": null,
    "pixCopiaECola": null,
    "pixTransaction": null,
    "transactionReceiptUrl": null,
    "confirmedDate": "2026-04-27T10:00:00.000Z",
    "paymentDate": "2026-04-27",
    "clientSlipNumber": null,
    "installmentNumber": null,
    "lastInvoiceNumber": null,
    "lastInvoiceUrl": null,
    "chargebackPortalUrl": null,
    "refundPortalUrl": null,
    "refunds": null,
    "chargebacks": null,
    "canBeSplitted": true,
    "canChangeReceiverPaymentMethod": false,
    "canResendEmail": true,
    "deleted": false,
    "markedAsRefunded": false,
    "markedAsRefundedDate": null,
    "markedAsNegative": false,
    "markedAsNegativeDate": null,
    "markedAsManualReconciliation": false,
    "markedAsManualReconciliationDate": null,
    "markedAsCreditCardReconciliation": false,
    "markedAsCreditCardReconciliationDate": null,
    "markedAsNotReceived": false,
    "markedAsNotReceivedDate": null,
    "markedAsInProcessReconciliation": false,
    "markedAsInProcessReconciliationDate": null,
    "markedAsInProcessChargeback": false,
    "markedAsInProcessChargebackDate": null,
    "markedAsChargebackRefunded": false,
    "markedAsChargebackRefundedDate": null,
    "markedAsInProcessRefund": false,
    "markedAsInProcessRefundDate": null,
    "markedAsRefundedByAnticipation": false,
    "markedAsRefundedByAnticipationDate": null,
    "markedAsInProcessAnticipation": false,
    "markedAsInProcessAnticipationDate": null,
    "markedAsInProcessAnticipationRefund": false,
    "markedAsInProcessAnticipationRefundDate": null,
    "markedAsInProcessAnticipationChargeback": false,
    "markedAsInProcessAnticipationChargebackDate": null,
    "markedAsInProcessAnticipationChargebackRefund": false,
    "markedAsInProcessAnticipationChargebackRefundDate": null,
    "markedAsInProcessCustody": false,
    "markedAsInProcessCustodyDate": null,
    "markedAsCustodyRefunded": false,
    "markedAsCustodyRefundedDate": null,
    "markedAsInProcessCustodyRefund": false,
    "markedAsInProcessCustodyRefundDate": null,
    "markedAsInProcessCustodyChargeback": false,
    "markedAsInProcessCustodyChargebackDate": null,
    "markedAsInProcessCustodyChargebackRefund": false,
    "markedAsInProcessCustodyChargebackRefundDate": null,
    "createdDate": "2026-04-20T08:00:00.000Z",
    "updatedDate": "2026-04-27T10:00:00.000Z"
  },
  "timestamp": "2026-04-27T10:00:00.000Z"
}
```

## Error Handling

### Common Errors

| Code | Message | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key |
| 404 | Not found | Verify resource ID |
| 422 | Invalid data | Check payload format |
| 429 | Rate limited | Implement backoff |
| 500 | Server error | Retry with backoff |

### Webhook Validation

Asaas signs webhooks with HMAC-SHA256:

```
Signature = HMAC-SHA256(webhook_secret, request_body)
Header: X-Asaas-Signature
```

Validate signature before processing:

```python
import hmac
import hashlib

def validate_webhook(body, signature, secret):
    expected = hmac.new(
        secret.encode(),
        body.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

## Rate Limits

- **Requests**: 100 per minute
- **Burst**: 10 per second
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Retry Strategy

Implement exponential backoff:

```
Attempt 1: Immediate
Attempt 2: 5 seconds
Attempt 3: 15 seconds
Attempt 4: 1 hour
Attempt 5: 4 hours
Attempt 6: 24 hours
```

## Testing

### Sandbox Credentials

```
Email: test@asaas.com
API Key: aac_test_...
```

### Test Payment IDs

```
pay_test_123 - Will be marked as received
pay_test_456 - Will be marked as overdue
pay_test_789 - Will be marked as cancelled
```

### Simulate Webhooks

Use Asaas dashboard to manually trigger webhook events for testing.

## Documentation

- [Official API Docs](https://docs.asaas.com)
- [Webhook Documentation](https://docs.asaas.com/webhooks)
- [Payment Status Guide](https://docs.asaas.com/payment-status)
