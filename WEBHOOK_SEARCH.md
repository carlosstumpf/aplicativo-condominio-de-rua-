# Webhook Search Documentation

## Overview

The Webhook Search feature allows administrators to quickly find specific webhooks by payment ID, customer ID, or other identifiers. It includes real-time search with debouncing, filtering, and detailed result display.

## Features

### 1. Multi-Type Search

Search by different identifier types:

- **Payment ID** - Search by Asaas payment ID (e.g., `pay_123abc`)
- **Customer ID** - Search by Asaas customer ID (e.g., `cust_456def`)
- **All** - Search both payment and customer IDs simultaneously

### 2. Auto-Detection

The search automatically detects the type based on prefix:

```
pay_123456  → Searches as Payment ID
cust_789012 → Searches as Customer ID
abc123      → Searches both types
```

### 3. Debounced Search

Search is debounced (300ms) to reduce server load:

```
User types: p → a → y → _1 → 2 → 3
Only one search executed after 300ms of inactivity
```

### 4. Result Highlighting

Failed webhooks show error details and offer quick retry:

```
Event: payment.received
Status: ✗ Failed
Error: Invalid payload JSON
[🔄 Reenviar]
```

### 5. Recent Searches

Last 10 searches are stored locally for quick access:

```
Recent: [pay_123, cust_456, pay_789, ...]
```

## UI Components

### WebhookSearch (Full Component)

Main search component with type selector:

```tsx
import { WebhookSearch } from "@/components/webhook-search";

function Dashboard() {
  const handleSearch = (query: string, type: SearchType) => {
    // Perform search
  };

  return (
    <WebhookSearch
      onSearch={handleSearch}
      isLoading={false}
      placeholder="Buscar por ID de pagamento ou cliente..."
      debounceDelay={300}
      showTypeSelector={true}
    />
  );
}
```

**Props:**
- `onSearch` - Callback when search query changes
- `isLoading` - Whether search is in progress
- `placeholder` - Search input placeholder
- `debounceDelay` - Debounce delay in milliseconds (default: 300)
- `showTypeSelector` - Show type filter buttons (default: true)

### WebhookSearchBar (Compact)

Compact search bar for headers:

```tsx
import { WebhookSearchBar } from "@/components/webhook-search";

function Header() {
  const handleSearch = (query: string, type: SearchType) => {
    // Perform search
  };

  return (
    <WebhookSearchBar
      onSearch={handleSearch}
      isLoading={false}
    />
  );
}
```

### WebhookSearchResults

Display search results:

```tsx
import { WebhookSearchResults } from "@/components/webhook-search-results";

function ResultsPanel() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = async (id: number) => {
    // Retry webhook
  };

  return (
    <WebhookSearchResults
      results={results}
      isLoading={isLoading}
      query="pay_123"
      onResultSelect={(result) => console.log(result)}
      onRetry={handleRetry}
      showEmpty={true}
    />
  );
}
```

## Backend Integration

### Search Endpoints

```typescript
// Search webhooks by payment ID
async function searchWebhooksByPaymentId(
  paymentId: string,
  options?: { limit?: number; offset?: number }
): Promise<WebhookSearchResult[]>

// Search webhooks by customer ID
async function searchWebhooksByCustomerId(
  customerId: string,
  options?: { limit?: number; offset?: number }
): Promise<WebhookSearchResult[]>

// Search both types
async function searchWebhooks(
  query: string,
  type: "payment" | "customer" | "all",
  options?: { limit?: number; offset?: number }
): Promise<WebhookSearchResult[]>

// Get exact match by payment ID
async function getWebhookByPaymentId(paymentId: string): Promise<WebhookSearchResult | null>

// Get exact match by customer ID
async function getWebhookByCustomerId(customerId: string): Promise<WebhookSearchResult | null>

// Count search results
async function countSearchResults(
  query: string,
  type: "payment" | "customer" | "all"
): Promise<number>
```

### Add tRPC Endpoints

```typescript
// server/routers/webhook-admin.ts

export const webhookAdminRouter = router({
  // ... existing endpoints

  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(3).max(100),
        type: z.enum(["payment", "customer", "all"]).default("all"),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return searchWebhooks(input.query, input.type, {
        limit: input.limit,
        offset: input.offset,
      });
    }),

  countSearchResults: protectedProcedure
    .input(
      z.object({
        query: z.string().min(3).max(100),
        type: z.enum(["payment", "customer", "all"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      return countSearchResults(input.query, input.type);
    }),

  getByPaymentId: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      return getWebhookByPaymentId(input.paymentId);
    }),

  getByCustomerId: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      return getWebhookByCustomerId(input.customerId);
    }),
});
```

## Usage Examples

### Example 1: Search by Payment ID

```typescript
// User types "pay_123" in search
const results = await searchWebhooks("pay_123", "payment");

// Returns all webhooks with payment ID containing "pay_123"
// [
//   { id: 1, event: "payment.received", asaasPaymentId: "pay_123456", ... },
//   { id: 2, event: "payment.updated", asaasPaymentId: "pay_123789", ... }
// ]
```

### Example 2: Search by Customer ID

```typescript
const results = await searchWebhooks("cust_456", "customer");

// Returns all webhooks for customer "cust_456"
```

### Example 3: Search Both Types

```typescript
const results = await searchWebhooks("123", "all");

// Returns webhooks matching "123" in either payment or customer ID
```

### Example 4: Get Exact Match

```typescript
const result = await getWebhookByPaymentId("pay_123456");

// Returns exact webhook for payment ID or null
```

### Example 5: Pagination

```typescript
// Get page 2 (50 results per page)
const results = await searchWebhooks("pay_", "payment", {
  limit: 50,
  offset: 50,
});
```

## Best Practices

### 1. Use Type Selector

Let users choose search type when possible:

```tsx
<WebhookSearch
  showTypeSelector={true}  // Show type buttons
  onSearch={handleSearch}
/>
```

### 2. Implement Debouncing

Always use debouncing to reduce server load:

```tsx
<WebhookSearch
  debounceDelay={300}  // 300ms debounce
  onSearch={handleSearch}
/>
```

### 3. Show Loading State

Provide visual feedback during search:

```tsx
<WebhookSearch
  isLoading={isSearching}
  onSearch={handleSearch}
/>
```

### 4. Handle Empty Results

Show helpful message when no results found:

```tsx
{results.length === 0 && (
  <Text>💡 Nenhum resultado encontrado. Tente outro ID.</Text>
)}
```

### 5. Paginate Large Results

For large result sets, use pagination:

```typescript
const page1 = await searchWebhooks(query, type, { limit: 50, offset: 0 });
const page2 = await searchWebhooks(query, type, { limit: 50, offset: 50 });
```

### 6. Store Recent Searches

Keep history for quick re-search:

```typescript
addRecentSearch("pay_123");
const recent = getRecentSearches();  // ["pay_123", ...]
```

## Query Patterns

### Valid Queries

```
pay_123456      ✓ Payment ID with prefix
cust_789012     ✓ Customer ID with prefix
abc123def       ✓ Alphanumeric
abc-123-def     ✓ With hyphens
abc_123_def     ✓ With underscores
```

### Invalid Queries

```
ab              ✗ Too short (< 3 chars)
pay@123         ✗ Special characters
pay#456         ✗ Invalid characters
a...repeat(101) ✗ Too long (> 100 chars)
```

## Performance

- **Search Time**: O(n) where n is number of webhooks
- **Debounce**: 300ms default (configurable)
- **Result Limit**: 50 per page (configurable)
- **Database Index**: Recommended on `asaasPaymentId` and `asaasCustomerId`

## Troubleshooting

### No Results Found

**Problem**: Search returns empty results.

**Solutions**:
1. Verify payment/customer ID format
2. Check if ID exists in database
3. Try partial ID match
4. Check search type selector

### Search is Slow

**Problem**: Search takes too long.

**Solutions**:
1. Add database indexes on payment/customer ID columns
2. Reduce result limit
3. Use pagination
4. Check database query performance

### Debounce Not Working

**Problem**: Too many search requests.

**Solutions**:
1. Increase `debounceDelay` (default 300ms)
2. Verify debounce implementation
3. Check browser console for errors

### Results Not Updating

**Problem**: Search results don't refresh.

**Solutions**:
1. Clear browser cache
2. Check network tab for failed requests
3. Verify API endpoint is working
4. Check component state management

## Related Features

- [Webhook Admin Dashboard](./WEBHOOK_ADMIN_DASHBOARD.md)
- [Selective Retry](./WEBHOOK_SELECTIVE_RETRY.md)
- [Status Badges](./WEBHOOK_BADGE_ALERTS.md)
- [Quick Retry](./WEBHOOK_QUICK_RETRY.md)
