import crypto from "crypto";

/**
 * Asaas Webhook Event Types
 */
export enum AsaasWebhookEventType {
  PAYMENT_CONFIRMED = "payment.confirmed",
  PAYMENT_RECEIVED = "payment.received",
  PAYMENT_OVERDUE = "payment.overdue",
  PAYMENT_ANTICIPATED = "payment.anticipated",
  PAYMENT_DELETED = "payment.deleted",
  PAYMENT_RESTORED = "payment.restored",
  PAYMENT_REFUNDED = "payment.refunded",
  PAYMENT_REFUND_IN_PROGRESS = "payment.refund_in_progress",
  PAYMENT_RECEIVED_IN_CASH = "payment.received_in_cash",
  PAYMENT_CHARGEBACK_REQUESTED = "payment.chargeback_requested",
  PAYMENT_CHARGEBACK_DISPUTE = "payment.chargeback_dispute",
  PAYMENT_AWAITING_RISK_ANALYSIS = "payment.awaiting_risk_analysis",
  PAYMENT_RISK_REJECTED = "payment.risk_rejected",
  PAYMENT_PENDING = "payment.pending",
}

/**
 * Asaas Webhook Payload
 */
export interface AsaasWebhookPayload {
  event: string;
  id: string;
  payment: {
    object: string;
    id: string;
    dateCreated: string;
    customer: string;
    subscription: string | null;
    installment: string | null;
    installmentNumber: number | null;
    description: string;
    value: number;
    netValue: number;
    status: string;
    dueDate: string;
    originalDueDate: string;
    paymentDate: string | null;
    clientPaymentDate: string | null;
    invoiceUrl: string;
    invoiceNumber: string | null;
    externalReference: string | null;
    deleted: boolean;
    anticipated: boolean;
    anticipatedValue: number | null;
    pixQrCodeId: string | null;
    transactionReceiptUrl: string | null;
    nossoNumero: string | null;
    bankSlipUrl: string | null;
  };
}

/**
 * Webhook validation using HMAC signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const hash = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return hash === signature;
  } catch (error) {
    console.error("Webhook signature validation error:", error);
    return false;
  }
}

/**
 * Process Asaas webhook event
 */
export async function processAsaasWebhook(
  payload: AsaasWebhookPayload
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const { event, payment } = payload;

    console.log(`Processing webhook event: ${event}`);
    console.log(`Payment ID: ${payment.id}, Status: ${payment.status}`);

    // Map Asaas status to our internal status
    const statusMap: Record<string, string> = {
      PENDING: "pendente",
      CONFIRMED: "confirmado",
      OVERDUE: "vencido",
      RECEIVED: "pago",
      REFUNDED: "reembolsado",
      RECEIVED_IN_CASH: "pago_dinheiro",
      DELETED: "deletado",
      ANTICIPATED: "antecipado",
      CHARGEBACK_REQUESTED: "chargeback_solicitado",
      CHARGEBACK_DISPUTE: "chargeback_disputa",
      AWAITING_RISK_ANALYSIS: "aguardando_analise",
      RISK_REJECTED: "risco_rejeitado",
    };

    const internalStatus = statusMap[payment.status] || payment.status;

    // Handle different event types
    switch (event) {
      case AsaasWebhookEventType.PAYMENT_CONFIRMED:
      case AsaasWebhookEventType.PAYMENT_RECEIVED:
        return await handlePaymentConfirmed(payment, internalStatus);

      case AsaasWebhookEventType.PAYMENT_OVERDUE:
        return await handlePaymentOverdue(payment, internalStatus);

      case AsaasWebhookEventType.PAYMENT_REFUNDED:
        return await handlePaymentRefunded(payment, internalStatus);

      case AsaasWebhookEventType.PAYMENT_DELETED:
        return await handlePaymentDeleted(payment);

      case AsaasWebhookEventType.PAYMENT_CHARGEBACK_REQUESTED:
      case AsaasWebhookEventType.PAYMENT_CHARGEBACK_DISPUTE:
        return await handlePaymentChargeback(payment, internalStatus);

      default:
        console.log(`Unhandled event type: ${event}`);
        return {
          success: true,
          message: `Event ${event} acknowledged but not processed`,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", message);
    return {
      success: false,
      message: `Failed to process webhook: ${message}`,
    };
  }
}

/**
 * Handle payment confirmed event
 */
async function handlePaymentConfirmed(
  payment: AsaasWebhookPayload["payment"],
  status: string
) {
  try {
    // Update cobranca status
    const result = await updateCobrancaStatus(payment.id, status, {
      paymentDate: payment.paymentDate,
      transactionReceiptUrl: payment.transactionReceiptUrl,
    });

    // Create notification
    await createNotification({
      tipo: "PAGAMENTO",
      titulo: "✅ Pagamento Confirmado",
      mensagem: `Pagamento de R$ ${payment.value.toFixed(2)} foi confirmado com sucesso`,
      referenceId: payment.id,
    });

    return {
      success: true,
      message: "Payment confirmed and updated",
      data: result,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Handle payment overdue event
 */
async function handlePaymentOverdue(
  payment: AsaasWebhookPayload["payment"],
  status: string
) {
  try {
    const result = await updateCobrancaStatus(payment.id, status);

    // Create notification
    await createNotification({
      tipo: "VENCIMENTO",
      titulo: "⏰ Cobrança Vencida",
      mensagem: `Cobrança de R$ ${payment.value.toFixed(2)} venceu em ${payment.dueDate}`,
      referenceId: payment.id,
    });

    return {
      success: true,
      message: "Payment marked as overdue",
      data: result,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Handle payment refunded event
 */
async function handlePaymentRefunded(
  payment: AsaasWebhookPayload["payment"],
  status: string
) {
  try {
    const result = await updateCobrancaStatus(payment.id, status, {
      refundedValue: payment.value,
      refundDate: new Date().toISOString(),
    });

    // Create notification
    await createNotification({
      tipo: "PAGAMENTO",
      titulo: "💰 Reembolso Processado",
      mensagem: `Reembolso de R$ ${payment.value.toFixed(2)} foi processado`,
      referenceId: payment.id,
    });

    return {
      success: true,
      message: "Payment refunded",
      data: result,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Handle payment deleted event
 */
async function handlePaymentDeleted(payment: AsaasWebhookPayload["payment"]) {
  try {
    const result = await deleteCobranca(payment.id);

    return {
      success: true,
      message: "Payment deleted",
      data: result,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Handle payment chargeback event
 */
async function handlePaymentChargeback(
  payment: AsaasWebhookPayload["payment"],
  status: string
) {
  try {
    const result = await updateCobrancaStatus(payment.id, status);

    // Create notification
    await createNotification({
      tipo: "PAGAMENTO",
      titulo: "⚠️ Chargeback Solicitado",
      mensagem: `Chargeback solicitado para pagamento de R$ ${payment.value.toFixed(2)}`,
      referenceId: payment.id,
    });

    return {
      success: true,
      message: "Chargeback processed",
      data: result,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Update cobranca status in database
 */
async function updateCobrancaStatus(
  paymentId: string,
  status: string,
  additionalData?: Record<string, any>
) {
  // Mock implementation - in production, this would update the database
  return {
    id: paymentId,
    status,
    updatedAt: new Date(),
    ...additionalData,
  };
}

/**
 * Delete cobranca from database
 */
async function deleteCobranca(paymentId: string) {
  // Mock implementation - in production, this would delete from database
  return {
    id: paymentId,
    deleted: true,
    deletedAt: new Date(),
  };
}

/**
 * Create notification for webhook event
 */
async function createNotification(data: {
  tipo: string;
  titulo: string;
  mensagem: string;
  referenceId: string;
}) {
  // Mock implementation - in production, this would create in database
  return {
    id: Math.random(),
    ...data,
    criadoEm: new Date(),
  };
}

/**
 * Log webhook event for audit trail
 */
export async function logWebhookEvent(
  event: string,
  payload: AsaasWebhookPayload,
  status: "success" | "failed",
  error?: string
) {
  const log = {
    id: Math.random(),
    event,
    paymentId: payload.payment.id,
    status,
    error,
    receivedAt: new Date(),
    payload: JSON.stringify(payload),
  };

  console.log("Webhook log:", log);

  // In production, save to database
  return log;
}
