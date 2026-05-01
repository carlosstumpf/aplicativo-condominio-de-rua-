/**
 * Asaas Webhook Handler
 * Processes incoming webhooks from Asaas and synchronizes payment status
 */

import crypto from "crypto";

export type AsaasWebhookEventType =
  | "payment.pending"
  | "payment.confirmed"
  | "payment.received"
  | "payment.overdue"
  | "payment.refunded"
  | "payment.deleted"
  | "payment.chargeback_requested"
  | "payment.chargeback_dispute"
  | "payment.chargeback_reversal"
  | "payment.anticipation_received"
  | "payment.anticipation_confirmed"
  | "payment.anticipation_cancelled"
  | "payment.settlement_received";

export interface AsaasWebhookPayload {
  event: AsaasWebhookEventType;
  payment: {
    id: string;
    customer: string;
    billingType: "BOLETO" | "PIX" | "CREDIT_CARD";
    value: number;
    status: string;
    dueDate: string;
    originalDueDate?: string;
    description?: string;
    externalReference?: string;
    pixQrCode?: string;
    pixCopyPaste?: string;
    barCode?: string;
    bankSlipUrl?: string;
    createdAt: string;
    updatedAt: string;
    confirmedDate?: string;
    receivedDate?: string;
    refundedValue?: number;
    refundedDate?: string;
  };
  timestamp: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  event: AsaasWebhookEventType;
  paymentId: string;
  statusUpdated: string;
  notificationCreated: boolean;
  error?: string;
}

/**
 * Validate webhook signature using HMAC-SHA256
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

/**
 * Map Asaas payment status to internal status
 */
export function mapAsaasStatusToInternal(
  asaasStatus: string
): "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "CANCELLED" {
  const statusMap: Record<string, any> = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    RECEIVED: "RECEIVED",
    OVERDUE: "OVERDUE",
    CANCELLED: "CANCELLED",
    REFUNDED: "CANCELLED",
  };

  return statusMap[asaasStatus] || "PENDING";
}

/**
 * Process webhook event and determine actions
 */
export async function processWebhookEvent(
  payload: AsaasWebhookPayload,
  handlers: {
    updatePaymentStatus?: (paymentId: string, status: string) => Promise<void>;
    createNotification?: (data: {
      type: string;
      title: string;
      message: string;
      paymentId: string;
      status: string;
    }) => Promise<void>;
    logWebhookEvent?: (event: AsaasWebhookEventType, paymentId: string, status: string) => Promise<void>;
  }
): Promise<WebhookProcessingResult> {
  const { event, payment, timestamp } = payload;
  const paymentId = payment.id;
  const internalStatus = mapAsaasStatusToInternal(payment.status);

  try {
    // Update payment status in database
    if (handlers.updatePaymentStatus) {
      await handlers.updatePaymentStatus(paymentId, internalStatus);
    }

    // Create notification based on event type
    let notificationCreated = false;
    if (handlers.createNotification) {
      const notificationData = getNotificationData(event, payment, internalStatus);
      if (notificationData) {
        await handlers.createNotification(notificationData);
        notificationCreated = true;
      }
    }

    // Log webhook event
    if (handlers.logWebhookEvent) {
      await handlers.logWebhookEvent(event, paymentId, internalStatus);
    }

    return {
      success: true,
      event,
      paymentId,
      statusUpdated: internalStatus,
      notificationCreated,
    };
  } catch (error: any) {
    return {
      success: false,
      event,
      paymentId,
      statusUpdated: internalStatus,
      notificationCreated: false,
      error: error.message,
    };
  }
}

/**
 * Get notification data for webhook event
 */
function getNotificationData(
  event: AsaasWebhookEventType,
  payment: AsaasWebhookPayload["payment"],
  internalStatus: string
): {
  type: string;
  title: string;
  message: string;
  paymentId: string;
  status: string;
} | null {
  const baseMessage = `Cobrança #${payment.id.substring(0, 8)}`;

  const notificationMap: Record<
    AsaasWebhookEventType,
    {
      type: string;
      title: string;
      message: string;
    }
  > = {
    "payment.pending": {
      type: "pagamentos",
      title: "Cobrança Pendente",
      message: `${baseMessage} aguardando pagamento`,
    },
    "payment.confirmed": {
      type: "pagamentos",
      title: "Cobrança Confirmada",
      message: `${baseMessage} foi confirmada`,
    },
    "payment.received": {
      type: "pagamentos",
      title: "Pagamento Recebido",
      message: `${baseMessage} foi recebido com sucesso (R$ ${payment.value.toFixed(2)})`,
    },
    "payment.overdue": {
      type: "vencimentos",
      title: "Cobrança Vencida",
      message: `${baseMessage} está vencida desde ${payment.dueDate}`,
    },
    "payment.refunded": {
      type: "pagamentos",
      title: "Pagamento Reembolsado",
      message: `${baseMessage} foi reembolsado (R$ ${payment.refundedValue?.toFixed(2) || "0.00"})`,
    },
    "payment.deleted": {
      type: "pagamentos",
      title: "Cobrança Cancelada",
      message: `${baseMessage} foi cancelada`,
    },
    "payment.chargeback_requested": {
      type: "pagamentos",
      title: "Chargeback Solicitado",
      message: `${baseMessage} tem uma solicitação de chargeback`,
    },
    "payment.chargeback_dispute": {
      type: "pagamentos",
      title: "Chargeback em Disputa",
      message: `${baseMessage} está em disputa de chargeback`,
    },
    "payment.chargeback_reversal": {
      type: "pagamentos",
      title: "Chargeback Revertido",
      message: `${baseMessage} teve o chargeback revertido`,
    },
    "payment.anticipation_received": {
      type: "pagamentos",
      title: "Antecipação Recebida",
      message: `${baseMessage} foi antecipada`,
    },
    "payment.anticipation_confirmed": {
      type: "pagamentos",
      title: "Antecipação Confirmada",
      message: `${baseMessage} antecipação foi confirmada`,
    },
    "payment.anticipation_cancelled": {
      type: "pagamentos",
      title: "Antecipação Cancelada",
      message: `${baseMessage} antecipação foi cancelada`,
    },
    "payment.settlement_received": {
      type: "pagamentos",
      title: "Liquidação Recebida",
      message: `${baseMessage} foi liquidada`,
    },
  };

  const notif = notificationMap[event];
  if (!notif) return null;

  return {
    ...notif,
    paymentId: payment.id,
    status: internalStatus,
  };
}

/**
 * Parse webhook payload from request body
 */
export function parseWebhookPayload(body: any): AsaasWebhookPayload | null {
  try {
    if (typeof body === "string") {
      return JSON.parse(body);
    }
    return body;
  } catch (error) {
    return null;
  }
}

/**
 * Get webhook signature from request headers
 */
export function getWebhookSignature(headers: Record<string, any>): string | null {
  return headers["asaas-signature"] || headers["x-asaas-signature"] || null;
}

/**
 * Validate webhook payload structure
 */
export function isValidWebhookPayload(payload: any): payload is AsaasWebhookPayload {
  return (
    payload &&
    typeof payload === "object" &&
    typeof payload.event === "string" &&
    payload.payment &&
    typeof payload.payment === "object" &&
    typeof payload.payment.id === "string" &&
    typeof payload.payment.status === "string" &&
    typeof payload.timestamp === "number"
  );
}
