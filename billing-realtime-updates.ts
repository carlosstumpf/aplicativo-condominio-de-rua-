/**
 * Billing Real-time Updates
 * Handle real-time payment status updates via webhooks
 */

import { EventEmitter } from "events";

export interface PaymentUpdateEvent {
  batchId: number;
  billingId: number;
  moradorId: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  amount: number;
  paymentMethod?: string;
  timestamp: Date;
  previousStatus?: string;
}

export interface BillingStatsUpdate {
  batchId: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
  timestamp: Date;
}

class BillingRealtimeUpdates extends EventEmitter {
  private activeSubscriptions: Map<number, Set<string>> = new Map();

  /**
   * Subscribe to batch billing updates
   */
  subscribeToBatch(batchId: number, clientId: string): void {
    if (!this.activeSubscriptions.has(batchId)) {
      this.activeSubscriptions.set(batchId, new Set());
    }
    this.activeSubscriptions.get(batchId)!.add(clientId);
  }

  /**
   * Unsubscribe from batch billing updates
   */
  unsubscribeFromBatch(batchId: number, clientId: string): void {
    const subscribers = this.activeSubscriptions.get(batchId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.activeSubscriptions.delete(batchId);
      }
    }
  }

  /**
   * Emit payment update
   */
  emitPaymentUpdate(event: PaymentUpdateEvent): void {
    const subscribers = this.activeSubscriptions.get(event.batchId);
    if (subscribers && subscribers.size > 0) {
      this.emit(`batch:${event.batchId}:payment`, event);
    }
  }

  /**
   * Emit batch stats update
   */
  emitBatchStatsUpdate(update: BillingStatsUpdate): void {
    const subscribers = this.activeSubscriptions.get(update.batchId);
    if (subscribers && subscribers.size > 0) {
      this.emit(`batch:${update.batchId}:stats`, update);
    }
  }

  /**
   * Get active subscribers for batch
   */
  getActiveSubscribers(batchId: number): number {
    return this.activeSubscriptions.get(batchId)?.size || 0;
  }

  /**
   * Get all active batches
   */
  getActiveBatches(): number[] {
    return Array.from(this.activeSubscriptions.keys());
  }
}

// Singleton instance
export const billingRealtimeUpdates = new BillingRealtimeUpdates();

/**
 * Process payment webhook and emit update
 */
export async function processPaymentWebhook(webhookData: {
  batchId: number;
  billingId: number;
  moradorId: number;
  status: string;
  amount: number;
  paymentMethod?: string;
}): Promise<void> {
  const event: PaymentUpdateEvent = {
    batchId: webhookData.batchId,
    billingId: webhookData.billingId,
    moradorId: webhookData.moradorId,
    status: webhookData.status as "paid" | "pending" | "overdue" | "cancelled",
    amount: webhookData.amount,
    paymentMethod: webhookData.paymentMethod,
    timestamp: new Date(),
  };

  billingRealtimeUpdates.emitPaymentUpdate(event);
}

/**
 * Calculate and emit batch stats update
 */
export async function calculateAndEmitBatchStatsUpdate(batchId: number): Promise<void> {
  // TODO: Query database for actual stats
  const mockStats: BillingStatsUpdate = {
    batchId,
    totalAmount: 25000,
    paidAmount: 23500,
    pendingAmount: 1000,
    overdueAmount: 500,
    paymentRate: 94,
    timestamp: new Date(),
  };

  billingRealtimeUpdates.emitBatchStatsUpdate(mockStats);
}

/**
 * Simulate payment updates for testing
 */
export async function simulatePaymentUpdates(batchId: number, count: number = 5): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const event: PaymentUpdateEvent = {
      batchId,
      billingId: Math.floor(Math.random() * 1000),
      moradorId: Math.floor(Math.random() * 50) + 1,
      status: ["paid", "pending", "overdue"][Math.floor(Math.random() * 3)] as any,
      amount: 500,
      paymentMethod: ["PIX", "Boleto", "Transferência"][Math.floor(Math.random() * 3)],
      timestamp: new Date(),
    };

    billingRealtimeUpdates.emitPaymentUpdate(event);
  }
}
