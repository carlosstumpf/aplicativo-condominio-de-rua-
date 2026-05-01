# Webhook Search - Quick Start Guide

## What is Webhook Search?

Webhook Search lets you quickly find specific webhooks by payment ID or customer ID. Perfect for troubleshooting payment issues or tracking specific customer transactions.

## Quick Start

### 1. Open Webhook Dashboard

1. Login as Administrator
2. Navigate to **Webhooks** tab
3. Tap **Webhook History**

### 2. Find the Search Bar

Look for the search box at the top:

```
🔍 Buscar por ID de pagamento ou cliente...
```

### 3. Enter Your Search

Type one of:

- **Payment ID**: `pay_123456` or just `123456`
- **Customer ID**: `cust_789012` or just `789012`
- **Partial match**: Any part of the ID

### 4. View Results

Results appear instantly with:

- Event type (payment.received, etc.)
- Status (✓ Success or ✗ Failed)
- Payment/Customer ID
- Received timestamp
- Error message (if failed)

## Common Tasks

### Find a Specific Payment

1. Get payment ID from Asaas dashboard
2. Type `pay_xxx` in search
3. See all webhooks for that payment
4. Check status and error details

### Track Customer Webhooks

1. Get customer ID from Asaas
2. Type `cust_xxx` in search
3. See all webhooks for that customer
4. Monitor payment history

### Find Failed Webhooks

1. Search for a payment ID
2. Look for red "✗ Failed" status
3. Read error message
4. Click "🔄 Reenviar" to retry

### Search by Partial ID

1. Type just part of the ID (e.g., `123456`)
2. Search automatically finds matches
3. Results show all matching webhooks

## Search Types

### 💰 Payment Search

```
[💰 Pagamentos] [🔔 Notificações] [📊 Status] [⚠️ Erros]
```

- Tap **💰 Pagamentos** to search only payment webhooks
- Shows payment.received, payment.updated, etc.

### 🔔 Notification Search

- Tap **🔔 Notificações** for notification webhooks
- Shows notification.sent, notification.failed, etc.

### All Types

- Tap **Todos** to search all webhook types
- Default behavior if no type selected

## Tips & Tricks

### 1. Use Auto-Detection

The search automatically detects type:

```
pay_123  → Searches payment webhooks
cust_456 → Searches customer webhooks
abc123   → Searches both types
```

### 2. View Recent Searches

Recent searches are saved automatically:

```
Recent: [pay_123, cust_456, pay_789]
```

### 3. Quick Retry Failed Webhooks

From search results:

1. Find webhook with "✗ Failed" status
2. Tap "🔄 Reenviar" button
3. Webhook is retried immediately

### 4. Check Error Details

Failed webhooks show error message:

```
Error: Invalid payload JSON
```

This helps identify the issue.

### 5. Copy IDs Easily

Long IDs are displayed for easy copying:

```
ID: pay_abc123def456ghi789jkl012
```

## Understanding Results

### Result Status

| Status | Meaning |
|--------|---------|
| ✓ Sucesso | Webhook processed successfully |
| ⏳ Pendente | Webhook waiting to be processed |
| ✗ Falhou | Webhook failed (see error) |

### Result Details

```
Event: payment.received
ID: 1
Status: ✓ Sucesso

Pagamento: pay_123456
Cliente: cust_789012
Recebido: 27 de abr, 11:30
```

### Error Messages

Common errors and solutions:

| Error | Solution |
|-------|----------|
| Invalid payload JSON | Check webhook data format |
| Timeout | Retry webhook |
| Rate limit exceeded | Wait and retry |
| Database error | Contact support |

## Troubleshooting

### "No results found"

**Cause**: ID doesn't exist or wrong format.

**Solution**:
1. Verify payment/customer ID
2. Check Asaas dashboard
3. Try partial ID match
4. Check search type selector

### "Search is slow"

**Cause**: Large number of webhooks.

**Solution**:
1. Use more specific search
2. Try payment ID instead of partial
3. Use date filters if available

### "Can't find a specific webhook"

**Cause**: Webhook may not have been received.

**Solution**:
1. Check Asaas webhook settings
2. Verify webhook is enabled
3. Check webhook logs
4. Contact support if issue persists

### "Retry button doesn't work"

**Cause**: Webhook already succeeded or retry limit reached.

**Solution**:
1. Check webhook status
2. If successful, no retry needed
3. If failed 5+ times, contact support

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Type 3+ chars | Start search |
| ✕ button | Clear search |
| Enter | Search (if available) |

## Search Limits

- **Minimum**: 3 characters
- **Maximum**: 100 characters
- **Results per page**: 50
- **Debounce delay**: 300ms (waits after typing stops)

## Privacy & Security

- Searches are logged for audit trail
- Only admins can search webhooks
- IDs are encrypted in transit
- Results cached locally (browser)

## Next Steps

- [Full Documentation](./docs/WEBHOOK_SEARCH.md)
- [Webhook Dashboard Guide](./WEBHOOK_ADMIN_QUICKSTART.md)
- [Selective Retry](./WEBHOOK_SELECTIVE_RETRY_QUICKSTART.md)
- [Status Badges](./docs/WEBHOOK_BADGE_ALERTS.md)

## Need Help?

- Check error message in result
- Read [Full Documentation](./docs/WEBHOOK_SEARCH.md)
- Contact support with webhook ID
