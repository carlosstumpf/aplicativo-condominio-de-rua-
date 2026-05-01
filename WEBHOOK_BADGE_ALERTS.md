# Webhook Badge Alerts Documentation

## Overview

The webhook status badge system provides real-time visual alerts to administrators about webhook failures. Badges appear in two locations:

1. **Tab Bar Badge** - Shows failure count on the Webhooks tab
2. **Dashboard Header Badge** - Shows detailed status information on the webhook dashboard

## Features

### ✅ Real-Time Failure Detection
- Monitors webhook failure count every 30 seconds
- Automatically updates when failures are detected
- Shows count of failed and ready-to-retry webhooks

### ✅ Visual Status Indicators
- **Green (Healthy)**: No failures detected
- **Yellow (Warning)**: 1-4 failures detected
- **Red (Critical)**: 5+ failures detected

### ✅ Pulsing Animation
- Badge pulses when failures are detected
- Draws immediate attention to critical issues
- Stops pulsing when all failures are resolved

### ✅ Failure Count Display
- Shows exact count for 1-99 failures
- Shows "99+" for 100+ failures
- Updates in real-time as webhooks are retried

## Badge Types

### 1. Tab Bar Badge (WebhookTabBadge)

**Location**: Webhooks tab in main navigation

**Features**:
- Compact red badge with failure count
- Only visible when failures exist
- Positioned on top-right of webhook icon
- Updates every 30 seconds

**Example**:
```
Webhooks [5]  ← Red badge showing 5 failures
```

### 2. Dashboard Header Badge (WebhookHeaderBadge)

**Location**: Top of webhook dashboard next to title

**Features**:
- Shows status label (Saudável/Atenção/Crítico)
- Displays failed webhook count
- Shows ready-to-retry count
- Color-coded background

**Example**:
```
┌─────────────────────────────────┐
│ Painel de Webhooks  [Crítico]   │
│                      5 falhadas │
│                      2 prontas  │
└─────────────────────────────────┘
```

### 3. Inline Badge (WebhookStatusBadge)

**Location**: Can be used anywhere in the app

**Features**:
- Customizable size (small/medium)
- Optional failure count display
- Configurable refresh interval
- Pulsing animation on failure

## Status Determination

### Healthy Status
- **Condition**: 0 failed webhooks
- **Color**: Green (#22C55E)
- **Label**: "Saudável"
- **Badge**: Not displayed

### Warning Status
- **Condition**: 1-4 failed webhooks
- **Color**: Yellow (#F59E0B)
- **Label**: "Atenção"
- **Badge**: Visible with count

### Critical Status
- **Condition**: 5+ failed webhooks
- **Color**: Red (#EF4444)
- **Label**: "Crítico"
- **Badge**: Visible with count, pulsing

## How It Works

### 1. Data Fetching
```typescript
// Queries retry statistics every 30 seconds
const retryStatsQuery = trpc.webhookAdmin.getRetryStatistics.useQuery(
  undefined,
  { refetchInterval: 30000 }
);
```

### 2. Status Calculation
```typescript
if (failed === 0) {
  status = "healthy";
} else if (failed < 5) {
  status = "warning";
} else {
  status = "critical";
}
```

### 3. Animation Trigger
```typescript
// Pulse animation starts when failures detected
if (failed > 0) {
  startPulseAnimation();
}
```

### 4. Display Update
```typescript
// Badge updates with latest failure count
setFailedCount(failed);
setHasFailures(failed > 0);
```

## Usage Examples

### Using Tab Bar Badge
```typescript
// In app/(tabs)/_layout.tsx
{isAdmin && (
  <Tabs.Screen
    name="webhook-dashboard"
    options={{
      tabBarIcon: ({ color }) => (
        <View style={{ position: "relative" }}>
          <IconSymbol size={28} name="webhook" color={color} />
          <WebhookTabBadge />  {/* Badge added here */}
        </View>
      ),
    }}
  />
)}
```

### Using Dashboard Header Badge
```typescript
// In webhook-dashboard.tsx
<View className="flex-row justify-between items-start mb-2">
  <Text className="text-2xl font-bold text-foreground">
    Painel de Webhooks
  </Text>
  <WebhookHeaderBadge />  {/* Badge added here */}
</View>
```

### Using Inline Badge
```typescript
// In any component
import { WebhookStatusBadge } from "@/components/webhook-status-badge";

export function MyComponent() {
  return (
    <View>
      <Text>Webhook Status:</Text>
      <WebhookStatusBadge 
        size="medium" 
        showCount={true}
        refreshInterval={30000}
      />
    </View>
  );
}
```

## Customization

### Change Refresh Interval
```typescript
// Refresh every 60 seconds instead of 30
<WebhookStatusBadge refreshInterval={60000} />
```

### Change Badge Size
```typescript
// Use medium size instead of small
<WebhookStatusBadge size="medium" />
```

### Show/Hide Count
```typescript
// Show count in badge
<WebhookStatusBadge showCount={true} />

// Hide count
<WebhookStatusBadge showCount={false} />
```

### Change Status Thresholds
```typescript
// In webhook-status-badge.tsx
const status = 
  failed === 0 ? "healthy" :
  failed < 10 ? "warning" :  // Changed from 5 to 10
  "critical";
```

### Change Status Colors
```typescript
// In useColors hook or theme.config.js
const statusColors = {
  healthy: colors.success,      // Green
  warning: colors.warning,      // Yellow
  critical: colors.error,       // Red
};
```

## Performance Considerations

### ✅ Optimized
- Queries only run for admin users
- Refetch interval is 30 seconds (not too frequent)
- Animation uses native driver for smooth performance
- Badge only renders when failures exist

### ⚠️ Considerations
- Each badge instance makes a separate query
- Consider caching retry statistics at app level
- Reduce refresh interval if real-time updates needed

### 📊 Optimization Tips
```typescript
// Share retry statistics across components
// using React Context or Zustand
const useRetryStats = () => {
  const stats = trpc.webhookAdmin.getRetryStatistics.useQuery();
  return stats.data;
};

// Use in multiple badge components
const retryStats = useRetryStats();
```

## Testing

### Run Badge Tests
```bash
pnpm test webhook-badge
```

### Expected Output
```
✓ tests/webhook-badge.test.ts (35 tests)
Tests  35 passed (35)
```

### Test Coverage
- ✅ Status determination (healthy/warning/critical)
- ✅ Count display (1-99, 99+)
- ✅ Visual states (colors, sizes)
- ✅ Animation triggers
- ✅ Refresh intervals
- ✅ Integration with retry statistics

## Troubleshooting

### Badge Not Showing
1. Check user is admin
2. Verify webhook failures exist
3. Check browser console for errors
4. Verify tRPC query is working

### Badge Not Updating
1. Check refresh interval (default 30s)
2. Verify network connectivity
3. Check if webhooks are actually failing
4. Look for console errors

### Animation Not Working
1. Check if failures detected
2. Verify animation values (1 to 1.2)
3. Check device performance settings
4. Try reducing animation duration

### Count Shows "99+" Incorrectly
1. Check if actual count is >= 100
2. Verify count display logic
3. Check data from API

## API Integration

### Required Endpoint
```typescript
// Must return retry statistics
trpc.webhookAdmin.getRetryStatistics.useQuery()

// Expected response:
{
  totalFailed: 5,
  readyForRetry: 3,
  maxRetriesExceeded: 2,
  averageRetries: 1.5
}
```

### Backend Implementation
```typescript
// In server/routers/webhook-admin.ts
getRetryStatistics: adminProcedure.query(async ({ ctx }) => {
  const webhooks = await db.webhookHistory.findMany({
    where: { status: "failed" }
  });
  
  return {
    totalFailed: webhooks.length,
    readyForRetry: webhooks.filter(w => w.nextRetryAt <= now).length,
    maxRetriesExceeded: webhooks.filter(w => w.retries >= maxRetries).length,
    averageRetries: avg(webhooks.map(w => w.retries))
  };
});
```

## Future Enhancements

1. **Sound Alerts**: Play notification sound on critical failures
2. **Email Notifications**: Send email when critical threshold reached
3. **Webhook History Graph**: Show failure trends over time
4. **Auto-Retry Triggers**: Automatically retry when threshold reached
5. **Custom Thresholds**: Admin can set custom warning/critical levels
6. **Failure Categories**: Show breakdown by failure type
7. **Webhook Health Score**: Calculate overall webhook health percentage

## Version History

- **v1.0.0** (2026-04-27)
  - Initial implementation
  - Tab bar badge
  - Dashboard header badge
  - Real-time updates
  - Pulsing animation
  - 35 unit tests
  - Full documentation

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review test cases in `tests/webhook-badge.test.ts`
3. Check browser console for errors
4. Verify backend API response includes retry statistics
