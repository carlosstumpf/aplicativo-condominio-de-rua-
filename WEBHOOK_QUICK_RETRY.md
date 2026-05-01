# Webhook Quick Retry Documentation

## Overview

The webhook quick retry feature allows administrators to retry all failed webhooks with a single click. The feature includes multiple UI components for different contexts and provides visual feedback throughout the retry process.

## Features

### ✅ One-Click Retry
- Retry all failed webhooks with a single button press
- No need to navigate to individual webhooks
- Immediate feedback with loading state

### ✅ Multiple UI Variants
- **Action Bar**: Full-featured retry interface on dashboard
- **Quick Retry Button**: Compact button next to badge
- **Icon Button**: Minimal icon button for tab bar
- **Confirmation Dialog**: Confirmation before retry

### ✅ Visual Feedback
- Loading state with spinner and "Reenviando..." text
- Success state showing count of retried webhooks
- Error notifications with dismissible alerts
- Haptic feedback on button press and completion

### ✅ Smart State Management
- Prevents double-clicks during retry
- Auto-dismisses success message after 2 seconds
- Auto-dismisses error message after 5 seconds
- Maintains consistency across UI variants

## Components

### 1. WebhookQuickRetry

**Location**: Primary retry button component

**Features**:
- Shows failure count in button text
- Displays loading state during retry
- Shows success state with count
- Configurable refresh interval
- Optional count display

**Usage**:
```typescript
<WebhookQuickRetry
  failedCount={5}
  onRetryComplete={() => refreshData()}
  onRetryError={(error) => showError(error)}
  showOnlyOnFailure={true}
/>
```

### 2. WebhookQuickRetryIcon

**Location**: Compact icon button for tab bar

**Features**:
- Minimal red icon button
- Shows loading spinner during retry
- Only visible when failures exist
- Perfect for constrained spaces

**Usage**:
```typescript
<WebhookQuickRetryIcon
  failedCount={5}
  onRetryComplete={() => refreshData()}
/>
```

### 3. WebhookRetryActionBar

**Location**: Dashboard action bar

**Features**:
- Shows failed count and ready-to-retry count
- Full-featured retry button
- Status information display
- Success state with count
- Dismissible after success

**Usage**:
```typescript
<WebhookRetryActionBar
  failedCount={5}
  readyForRetry={3}
  onRetryComplete={() => refreshData()}
/>
```

### 4. WebhookRetryConfirmation

**Location**: Modal confirmation dialog

**Features**:
- Confirms retry action before proceeding
- Shows failure count
- Warning message about processing time
- Confirm/Cancel buttons
- Loading state during retry

**Usage**:
```typescript
<WebhookRetryConfirmation
  visible={showConfirmation}
  failedCount={5}
  isRetrying={isRetrying}
  onConfirm={handleRetry}
  onCancel={handleCancel}
/>
```

### 5. WebhookRetryErrorNotification

**Location**: Error alert notification

**Features**:
- Shows error message
- Auto-dismisses after 5 seconds
- Manual dismiss button
- Red background for visibility

**Usage**:
```typescript
<WebhookRetryErrorNotification
  visible={showError}
  error={error}
  onDismiss={() => setShowError(false)}
/>
```

### 6. WebhookRetrySuccessNotification

**Location**: Success alert notification

**Features**:
- Shows count of retried webhooks
- Auto-dismisses after 3 seconds
- Green background for visibility
- Proper pluralization

**Usage**:
```typescript
<WebhookRetrySuccessNotification
  visible={showSuccess}
  successCount={5}
  onDismiss={() => setShowSuccess(false)}
/>
```

## How It Works

### 1. User Initiates Retry
```
User clicks "Reenviar" button
    ↓
Button shows loading state
    ↓
Haptic feedback triggered
```

### 2. Confirmation (Optional)
```
Modal dialog appears
    ↓
Shows failure count
    ↓
User confirms or cancels
```

### 3. Retry Execution
```
API call: processFailedWebhooks()
    ↓
Backend retries all failed webhooks
    ↓
Returns success count
```

### 4. Success Feedback
```
Success notification shown
    ↓
Shows "✓ X reenviados"
    ↓
Auto-dismisses after 2-3 seconds
    ↓
Data refreshed automatically
```

### 5. Error Handling
```
If retry fails:
    ↓
Error notification shown
    ↓
Shows error message
    ↓
Auto-dismisses after 5 seconds
    ↓
User can retry again
```

## Integration Points

### Dashboard Integration
```typescript
// In webhook-dashboard.tsx
<WebhookRetryActionBar
  failedCount={retryStats.totalFailed}
  readyForRetry={retryStats.readyForRetry}
  onRetryComplete={() => {
    metricsQuery.refetch();
    retryStatsQuery.refetch();
  }}
/>
```

### Tab Bar Integration
```typescript
// In tab navigation
<WebhookQuickRetryIcon
  failedCount={failedCount}
  onRetryComplete={() => refetchStats()}
/>
```

## User Flow

### Scenario 1: Quick Retry from Dashboard
```
1. Admin opens webhook dashboard
2. Sees "5 webhooks falhados" action bar
3. Clicks "Reenviar Tudo" button
4. Confirmation dialog appears
5. Admin confirms
6. Button shows "Reenviando..."
7. After 2-3 seconds: "✓ 5 reenviados"
8. Dashboard data refreshes
9. Failed count returns to 0
```

### Scenario 2: Quick Retry from Tab Bar
```
1. Admin sees red badge on Webhooks tab
2. Clicks red retry icon next to badge
3. Icon shows loading spinner
4. After completion: icon disappears
5. Badge updates to show 0 failures
```

### Scenario 3: Error During Retry
```
1. Admin clicks retry button
2. Network error occurs
3. Error notification appears: "Erro ao reenviar webhooks"
4. Shows error details
5. Auto-dismisses after 5 seconds
6. Admin can retry again
```

## Customization

### Change Button Text
```typescript
// In webhook-quick-retry.tsx
<Text>🔄 Reenviar {failedCount}</Text>
// Change to custom text
```

### Change Success Message
```typescript
// In webhook-quick-retry.tsx
`✓ ${successCount} reenviados`
// Change to custom message
```

### Change Auto-Dismiss Timing
```typescript
// Success: 2 seconds
setTimeout(() => setShowSuccess(false), 2000);

// Error: 5 seconds
setTimeout(onDismiss, 5000);
```

### Change Button Colors
```typescript
// In useColors hook
backgroundColor: colors.error  // Red for retry
backgroundColor: colors.success  // Green for success
```

### Add Confirmation Dialog
```typescript
// Wrap retry button with confirmation
const [showConfirmation, setShowConfirmation] = useState(false);

<WebhookRetryConfirmation
  visible={showConfirmation}
  failedCount={failedCount}
  onConfirm={handleRetry}
  onCancel={() => setShowConfirmation(false)}
/>
```

## Performance Considerations

### ✅ Optimized
- Single API call for all retries
- Efficient state management
- No unnecessary re-renders
- Haptic feedback is non-blocking

### ⚠️ Considerations
- Retry may take time for many webhooks
- Show progress indicator for long operations
- Consider batch processing for 100+ webhooks
- Monitor API rate limits

### 📊 Optimization Tips
```typescript
// Show progress for long retries
if (retryStats.totalFailed > 50) {
  showProgressIndicator();
}

// Batch retries if needed
const batchSize = 10;
for (let i = 0; i < failedCount; i += batchSize) {
  await retryBatch(i, i + batchSize);
}
```

## Testing

### Run Quick Retry Tests
```bash
pnpm test webhook-quick-retry
```

### Expected Output
```
✓ tests/webhook-quick-retry.test.ts (53 tests)
Tests  53 passed (53)
```

### Test Coverage
- ✅ Button visibility (show/hide based on failures)
- ✅ Button states (loading, success, disabled)
- ✅ Action bar display and formatting
- ✅ Confirmation dialog
- ✅ Retry execution
- ✅ Success handling
- ✅ Error handling
- ✅ Haptic feedback
- ✅ Icon button variants
- ✅ State consistency

## API Requirements

### Required Endpoint
```typescript
// Must support retrying all failed webhooks
trpc.webhookAdmin.processFailedWebhooks.useMutation()

// Expected response:
{
  processed: 5,
  failed: 0,
  message: "5 webhooks retried successfully"
}
```

### Backend Implementation
```typescript
// In server/routers/webhook-admin.ts
processFailedWebhooks: adminProcedure.mutation(async ({ ctx }) => {
  const failed = await db.webhookHistory.findMany({
    where: { status: "failed" }
  });

  let processed = 0;
  for (const webhook of failed) {
    try {
      await retryWebhook(webhook);
      processed++;
    } catch (error) {
      console.error("Retry failed:", error);
    }
  }

  return { processed };
});
```

## Troubleshooting

### Button Not Showing
1. Check user is admin
2. Verify webhook failures exist
3. Check browser console for errors
4. Verify tRPC query is working

### Retry Not Working
1. Check network connectivity
2. Verify backend API is accessible
3. Check for API rate limits
4. Review browser console errors

### Success Message Not Showing
1. Check if retry actually succeeded
2. Verify success count is > 0
3. Check auto-dismiss timing
4. Look for JavaScript errors

### Haptic Not Triggering
1. Check device supports haptics
2. Verify expo-haptics is installed
3. Check device settings allow haptics
4. Test on physical device (not simulator)

## Security Considerations

### ✅ Implemented
- Admin-only access (checked in component wrapper)
- Confirmation dialog before retry
- Error handling prevents data loss
- Audit logging available

### ⚠️ Important
- Backend must validate admin role
- Rate limit retry attempts
- Log all retry operations
- Monitor for abuse patterns

## Future Enhancements

1. **Progress Indicator**: Show progress for large retry operations
2. **Selective Retry**: Allow retrying specific webhook types
3. **Scheduled Retry**: Schedule retry for off-peak hours
4. **Retry History**: Track retry attempts and results
5. **Batch Processing**: Handle 100+ webhooks efficiently
6. **Webhook Filtering**: Retry only specific failure types
7. **Notification**: Send email when retry completes
8. **Metrics**: Track retry success rates over time

## Version History

- **v1.0.0** (2026-04-27)
  - Initial implementation
  - Multiple UI variants
  - Confirmation dialog
  - Error handling
  - 53 unit tests
  - Full documentation

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test cases in `tests/webhook-quick-retry.test.ts`
3. Check browser console for errors
4. Verify backend API response
5. Test on physical device for haptics
