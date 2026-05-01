/**
 * Webhook Search Module
 * Search webhooks by payment ID, customer ID, or event type
 */

import { db } from "../_core/db";
import { webhookHistory } from "../../drizzle/schema";
import { like, and, eq } from "drizzle-orm";

export type SearchType = "payment" | "customer" | "all";

interface WebhookSearchResult {
  id: number;
  event: string;
  asaasPaymentId: string;
  asaasCustomerId?: string;
  status: string;
  success: number;
  errorMessage?: string;
  receivedAt: Date;
  processedAt: Date;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
}

/**
 * Search webhooks by payment ID
 */
export async function searchWebhooksByPaymentId(
  paymentId: string,
  options: SearchOptions = {}
): Promise<WebhookSearchResult[]> {
  const { limit = 50, offset = 0 } = options;

  try {
    console.log(`[Webhook Search] Searching by payment ID: ${paymentId}`);

    const results = await db
      .select({
        id: webhookHistory.id,
        event: webhookHistory.event,
        asaasPaymentId: webhookHistory.asaasPaymentId,
        asaasCustomerId: webhookHistory.asaasCustomerId,
        status: webhookHistory.status,
        success: webhookHistory.success,
        errorMessage: webhookHistory.errorMessage,
        receivedAt: webhookHistory.receivedAt,
        processedAt: webhookHistory.processedAt,
      })
      .from(webhookHistory)
      .where(like(webhookHistory.asaasPaymentId, `%${paymentId}%`))
      .limit(limit)
      .offset(offset);

    console.log(`[Webhook Search] Found ${results.length} webhooks for payment ${paymentId}`);
    return results;
  } catch (error) {
    console.error("[Webhook Search] Error searching by payment ID:", error);
    return [];
  }
}

/**
 * Search webhooks by customer ID
 */
export async function searchWebhooksByCustomerId(
  customerId: string,
  options: SearchOptions = {}
): Promise<WebhookSearchResult[]> {
  const { limit = 50, offset = 0 } = options;

  try {
    console.log(`[Webhook Search] Searching by customer ID: ${customerId}`);

    const results = await db
      .select({
        id: webhookHistory.id,
        event: webhookHistory.event,
        asaasPaymentId: webhookHistory.asaasPaymentId,
        asaasCustomerId: webhookHistory.asaasCustomerId,
        status: webhookHistory.status,
        success: webhookHistory.success,
        errorMessage: webhookHistory.errorMessage,
        receivedAt: webhookHistory.receivedAt,
        processedAt: webhookHistory.processedAt,
      })
      .from(webhookHistory)
      .where(
        webhookHistory.asaasCustomerId
          ? like(webhookHistory.asaasCustomerId, `%${customerId}%`)
          : undefined
      )
      .limit(limit)
      .offset(offset);

    console.log(`[Webhook Search] Found ${results.length} webhooks for customer ${customerId}`);
    return results;
  } catch (error) {
    console.error("[Webhook Search] Error searching by customer ID:", error);
    return [];
  }
}

/**
 * Search webhooks by payment or customer ID
 */
export async function searchWebhooks(
  query: string,
  type: SearchType = "all",
  options: SearchOptions = {}
): Promise<WebhookSearchResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const trimmedQuery = query.trim();

  try {
    if (type === "payment") {
      return await searchWebhooksByPaymentId(trimmedQuery, options);
    }

    if (type === "customer") {
      return await searchWebhooksByCustomerId(trimmedQuery, options);
    }

    // Search both payment and customer IDs
    const [paymentResults, customerResults] = await Promise.all([
      searchWebhooksByPaymentId(trimmedQuery, options),
      searchWebhooksByCustomerId(trimmedQuery, options),
    ]);

    // Combine and deduplicate by ID
    const combined = [...paymentResults, ...customerResults];
    const seen = new Set<number>();
    const unique = combined.filter((result) => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });

    return unique.slice(0, options.limit || 50);
  } catch (error) {
    console.error("[Webhook Search] Error searching webhooks:", error);
    return [];
  }
}

/**
 * Get webhook by payment ID (exact match)
 */
export async function getWebhookByPaymentId(paymentId: string): Promise<WebhookSearchResult | null> {
  try {
    const result = await db
      .select({
        id: webhookHistory.id,
        event: webhookHistory.event,
        asaasPaymentId: webhookHistory.asaasPaymentId,
        asaasCustomerId: webhookHistory.asaasCustomerId,
        status: webhookHistory.status,
        success: webhookHistory.success,
        errorMessage: webhookHistory.errorMessage,
        receivedAt: webhookHistory.receivedAt,
        processedAt: webhookHistory.processedAt,
      })
      .from(webhookHistory)
      .where(eq(webhookHistory.asaasPaymentId, paymentId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Webhook Search] Error getting webhook by payment ID:", error);
    return null;
  }
}

/**
 * Get webhook by customer ID (exact match)
 */
export async function getWebhookByCustomerId(customerId: string): Promise<WebhookSearchResult | null> {
  try {
    const result = await db
      .select({
        id: webhookHistory.id,
        event: webhookHistory.event,
        asaasPaymentId: webhookHistory.asaasPaymentId,
        asaasCustomerId: webhookHistory.asaasCustomerId,
        status: webhookHistory.status,
        success: webhookHistory.success,
        errorMessage: webhookHistory.errorMessage,
        receivedAt: webhookHistory.receivedAt,
        processedAt: webhookHistory.processedAt,
      })
      .from(webhookHistory)
      .where(webhookHistory.asaasCustomerId ? eq(webhookHistory.asaasCustomerId, customerId) : undefined)
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Webhook Search] Error getting webhook by customer ID:", error);
    return null;
  }
}

/**
 * Count search results
 */
export async function countSearchResults(
  query: string,
  type: SearchType = "all"
): Promise<number> {
  if (!query || query.trim().length < 3) {
    return 0;
  }

  try {
    const trimmedQuery = query.trim();

    if (type === "payment") {
      const result = await db
        .select({ count: webhookHistory.id })
        .from(webhookHistory)
        .where(like(webhookHistory.asaasPaymentId, `%${trimmedQuery}%`));

      return result.length;
    }

    if (type === "customer") {
      const result = await db
        .select({ count: webhookHistory.id })
        .from(webhookHistory)
        .where(
          webhookHistory.asaasCustomerId
            ? like(webhookHistory.asaasCustomerId, `%${trimmedQuery}%`)
            : undefined
        );

      return result.length;
    }

    // Count both
    const [paymentCount, customerCount] = await Promise.all([
      db
        .select({ count: webhookHistory.id })
        .from(webhookHistory)
        .where(like(webhookHistory.asaasPaymentId, `%${trimmedQuery}%`)),
      db
        .select({ count: webhookHistory.id })
        .from(webhookHistory)
        .where(
          webhookHistory.asaasCustomerId
            ? like(webhookHistory.asaasCustomerId, `%${trimmedQuery}%`)
            : undefined
        ),
    ]);

    // Deduplicate by assuming some overlap
    return Math.min(paymentCount.length + customerCount.length, 100);
  } catch (error) {
    console.error("[Webhook Search] Error counting search results:", error);
    return 0;
  }
}

/**
 * Get recent searches (from memory, not persisted)
 */
const recentSearches = new Map<string, { query: string; timestamp: number }>();

export function addRecentSearch(query: string): void {
  recentSearches.set(query, { query, timestamp: Date.now() });

  // Keep only last 10 searches
  if (recentSearches.size > 10) {
    const oldest = Array.from(recentSearches.values()).sort((a, b) => a.timestamp - b.timestamp)[0];
    recentSearches.delete(oldest.query);
  }
}

export function getRecentSearches(): string[] {
  return Array.from(recentSearches.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((s) => s.query);
}

export function clearRecentSearches(): void {
  recentSearches.clear();
}

/**
 * Suggest search queries based on pattern
 */
export function getSuggestedSearches(prefix: string): string[] {
  if (!prefix || prefix.length < 2) {
    return [];
  }

  const recent = getRecentSearches();
  return recent.filter((search) => search.toLowerCase().startsWith(prefix.toLowerCase())).slice(0, 5);
}
