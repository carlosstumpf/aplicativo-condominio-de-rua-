# Webhook Selective Retry - Quick Start Guide

## What is Selective Retry?

Selective Retry allows you to retry only specific types of failed webhooks (e.g., only payment webhooks) without retrying all failed webhooks at once.

## Quick Start

### 1. Access the Dashboard

1. Login as Administrator
2. Navigate to **Webhooks** tab in the bottom navigation
3. Tap **Webhook History** to see failed webhooks

### 2. Filter by Type

In the Webhook History screen:

1. Scroll to the **"Reenvio Seletivo por Tipo"** section
2. Select webhook types to retry:
   - **💰 Pagamentos** - Payment-related webhooks
   - **🔔 Notificações** - Notification webhooks
   - **📊 Status** - Status update webhooks
   - **⚠️ Erros** - Error webhooks

3. Or select individual types:
   - Pagamento Recebido
   - Pagamento Atualizado
   - Notificação Enviada
   - etc.

### 3. Retry Selected Webhooks

1. After selecting types, tap **"Reenviar X Webhooks"** button
2. Confirm the action in the dialog
3. Wait for the retry to complete
4. See the success notification

## Common Tasks

### Retry Only Payment Webhooks

1. In Webhook History, tap **Filtrar**
2. Select **💰 Pagamentos** category
3. Tap **Reenviar** button

### Retry Specific Payment Type

1. Tap **Filtrar**
2. Deselect all categories
3. Select only **Pagamento Recebido**
4. Tap **Reenviar**

### Check Failure Counts by Type

1. In Webhook History, look at **"Falhas por Categoria"** section
2. See how many webhooks failed for each category
3. Select categories with high failure counts

### Retry All Failed Webhooks

1. Tap **Filtrar**
2. Tap **Todos** button to select all types
3. Tap **Reenviar**

## Understanding the UI

### Filter Section

```
Filtrar por Categoria
[Todos] [Limpar]

[💰 Pagamentos] [🔔 Notificações] [📊 Status] [⚠️ Erros]
```

- **Todos** - Select all webhook types
- **Limpar** - Deselect all types
- **Colored buttons** - Green = selected, Gray = not selected

### Failure Counts

```
Falhas por Categoria

💰 Pagamentos          [5]
🔔 Notificações        [2]
📊 Status              [1]
⚠️ Erros               [0]
```

- Shows how many webhooks failed for each category
- Red badge indicates number of failures

### Action Button

```
🔄 Reenviar 8 Webhooks
```

- Shows total number of webhooks to retry
- Disabled if no webhooks selected
- Shows loading state while retrying
- Shows checkmark when complete

## Tips & Tricks

### 1. Start with Categories

Use category filters first to quickly select large groups:
- All payment webhooks
- All notification webhooks

### 2. Check Retry Limits

If a webhook has been retried 5+ times, it won't retry again automatically. You can manually increase the limit in admin settings.

### 3. Batch Retries

For large numbers of failures:
1. Retry payment webhooks first
2. Then retry notification webhooks
3. Finally retry error webhooks

This helps identify which type is causing issues.

### 4. Monitor Success Rate

After retrying:
1. Check the success notification
2. Return to Webhook History
3. Verify failure counts decreased

### 5. Use Compact View

In the dashboard header, you can see a compact retry panel:
- Shows total failures
- Quick filter button
- Fast retry for common scenarios

## Troubleshooting

### "No webhooks found for selected types"

**Cause**: All webhooks of that type have already been retried or succeeded.

**Solution**: Select a different type or check the failure counts.

### "Retry failed"

**Cause**: Network error or webhook processing error.

**Solution**: 
1. Check your internet connection
2. Try retrying fewer webhooks at a time
3. Check the error details in the notification

### "Button is disabled"

**Cause**: No webhooks selected or no failures exist.

**Solution**:
1. Tap "Filtrar" to open the filter
2. Select at least one webhook type
3. Verify failure counts are > 0

### "Retry count exceeded"

**Cause**: Webhook has been retried 5+ times already.

**Solution**:
1. Check webhook details for error message
2. Fix the underlying issue
3. Contact support if issue persists

## Best Practices

### ✅ Do

- ✅ Retry by category first (faster)
- ✅ Monitor failure counts regularly
- ✅ Retry during off-peak hours for large batches
- ✅ Check error messages for failed webhooks
- ✅ Use selective retry to isolate issues

### ❌ Don't

- ❌ Retry all webhooks at once (can cause load)
- ❌ Retry webhooks with permanent errors (won't help)
- ❌ Ignore error messages (they indicate root cause)
- ❌ Retry more than 5 times (respects rate limits)

## Webhook Types Reference

### Payment Webhooks (💰)
- **Pagamento Criado** - Payment created in Asaas
- **Pagamento Atualizado** - Payment updated
- **Pagamento Confirmado** - Payment confirmed
- **Pagamento Recebido** - Payment received (most important)
- **Pagamento Vencido** - Payment overdue
- **Pagamento Deletado** - Payment deleted
- **Pagamento Restaurado** - Payment restored
- **Pagamento Reembolsado** - Payment refunded

### Notification Webhooks (🔔)
- **Notificação Enviada** - Notification sent to resident
- **Notificação Falhou** - Notification failed to send

### Status Webhooks (📊)
- **Atualização de Status** - General status update

### Error Webhooks (⚠️)
- **Erro Ocorreu** - Error occurred during processing

## Next Steps

- [Full Documentation](./docs/WEBHOOK_SELECTIVE_RETRY.md)
- [Webhook Dashboard Guide](./WEBHOOK_ADMIN_QUICKSTART.md)
- [Webhook Status Badges](./docs/WEBHOOK_BADGE_ALERTS.md)
