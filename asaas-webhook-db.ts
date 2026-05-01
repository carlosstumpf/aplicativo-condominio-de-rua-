/**
 * Asaas Webhook Database Operations
 * Handles database updates when webhooks are received
 */

import {
  updateCobrancaStatus,
  getCobrancaByAsaasId,
  createNotificacao,
  getMoradorById,
} from "../db-queries";
import { enviarConfirmacaoPagamento } from "./whatsapp-notifications";

/**
 * Map Asaas payment status to internal cobranca status
 */
export function mapAsaasStatusToCobrancaStatus(asaasStatus: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "PENDING",
    CONFIRMED: "PENDING", // Confirmed but not yet received
    RECEIVED: "RECEIVED",
    OVERDUE: "OVERDUE",
    REFUNDED: "CANCELLED",
    DELETED: "CANCELLED",
    CHARGEBACK_REQUESTED: "OVERDUE", // Treat as overdue for now
    CHARGEBACK_DISPUTE: "OVERDUE",
    CHARGEBACK_REVERSAL: "RECEIVED", // Chargeback was reversed, payment is good
  };

  return statusMap[asaasStatus] || asaasStatus;
}

/**
 * Update payment status in database when webhook is received
 */
export async function handlePaymentStatusUpdate(
  asaasPaymentId: string,
  asaasStatus: string,
  paymentData?: any
): Promise<{
  success: boolean;
  cobranca?: any;
  error?: string;
}> {
  try {
    // Get the cobranca record by Asaas payment ID
    const cobranca = await getCobrancaByAsaasId(asaasPaymentId);

    if (!cobranca) {
      console.warn(`[Webhook DB] Cobranca not found for Asaas payment: ${asaasPaymentId}`);
      return {
        success: false,
        error: `Cobranca not found for payment ${asaasPaymentId}`,
      };
    }

    // Map Asaas status to internal status
    const newStatus = mapAsaasStatusToCobrancaStatus(asaasStatus);

    // Only update if status has changed
    if (cobranca.status === newStatus) {
      console.log(
        `[Webhook DB] Status unchanged for payment ${asaasPaymentId}: ${newStatus}`
      );
      return {
        success: true,
        cobranca,
      };
    }

    // Update the cobranca status
    await updateCobrancaStatus(asaasPaymentId, newStatus);

    console.log(
      `[Webhook DB] Updated payment ${asaasPaymentId} status: ${cobranca.status} → ${newStatus}`
    );

    // Send WhatsApp confirmation if payment was received
    if (newStatus === "RECEIVED" && cobranca.moradorId) {
      try {
        await enviarConfirmacaoPagamento(cobranca.id, cobranca.moradorId);
      } catch (err) {
        console.error(`[Webhook DB] Error sending WhatsApp confirmation:`, err);
      }
    }

    return {
      success: true,
      cobranca: {
        ...cobranca,
        status: newStatus,
      },
    };
  } catch (error: any) {
    console.error(`[Webhook DB] Error updating payment status:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create notification for payment event
 */
export async function handlePaymentNotification(
  asaasPaymentId: string,
  event: string,
  paymentData?: any
): Promise<{
  success: boolean;
  notification?: any;
  error?: string;
}> {
  try {
    // Get the cobranca record
    const cobranca = await getCobrancaByAsaasId(asaasPaymentId);

    if (!cobranca) {
      console.warn(`[Webhook DB] Cobranca not found for notification: ${asaasPaymentId}`);
      return {
        success: false,
        error: `Cobranca not found for payment ${asaasPaymentId}`,
      };
    }

    // Get morador info for notification
    const morador = await getMoradorById(cobranca.moradorId as number);

    if (!morador) {
      console.warn(`[Webhook DB] Morador not found for notification: ${cobranca.moradorId}`);
      return {
        success: false,
        error: `Morador not found for payment notification`,
      };
    }

    // Skip notification if morador has no associated user
    if (!morador.userId) {
      console.warn(
        `[Webhook DB] Morador ${morador.id} has no associated user, skipping notification`
      );
      return {
        success: true,
        notification: null,
      };
    }

    // Determine notification type and content based on event
    let notificationType = "PAGAMENTO";
    let titulo = "";
    let mensagem = "";

    const valorFormatado = (cobranca.valor / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    switch (event) {
      case "payment.received":
        titulo = "Pagamento Confirmado";
        mensagem = `Pagamento de ${valorFormatado} foi confirmado com sucesso`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.confirmed":
        titulo = "Pagamento Confirmado";
        mensagem = `Pagamento de ${valorFormatado} foi confirmado`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.pending":
        titulo = "Cobrança Pendente";
        mensagem = `Cobrança de ${valorFormatado} está aguardando pagamento`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.overdue":
        titulo = "Cobrança Vencida";
        mensagem = `Cobrança de ${valorFormatado} venceu em ${cobranca.vencimento}`;
        notificationType = "VENCIMENTO";
        break;

      case "payment.refunded":
        titulo = "Pagamento Reembolsado";
        mensagem = `Pagamento de ${valorFormatado} foi reembolsado`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.deleted":
        titulo = "Cobrança Cancelada";
        mensagem = `Cobrança de ${valorFormatado} foi cancelada`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.chargeback_requested":
        titulo = "Chargeback Solicitado";
        mensagem = `Chargeback solicitado para pagamento de ${valorFormatado}`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.chargeback_dispute":
        titulo = "Chargeback em Disputa";
        mensagem = `Chargeback em disputa para pagamento de ${valorFormatado}`;
        notificationType = "PAGAMENTO";
        break;

      case "payment.chargeback_reversal":
        titulo = "Chargeback Revertido";
        mensagem = `Chargeback revertido para pagamento de ${valorFormatado}`;
        notificationType = "PAGAMENTO";
        break;

      default:
        titulo = "Atualização de Pagamento";
        mensagem = `Atualização de pagamento: ${event}`;
        notificationType = "PAGAMENTO";
    }

    // Create notification for the morador's user
    if (!morador.userId) {
      console.warn(
        `[Webhook DB] Morador ${morador.id} has no associated user, skipping notification`
      );
      return {
        success: true,
        notification: null,
      };
    }

    const notification = await createNotificacao({
      userId: morador.userId as number,
      tipo: notificationType,
      titulo,
      mensagem,
      referenceId: cobranca.id,
      lida: false,
    });

    console.log(
      `[Webhook DB] Created notification for user ${morador.userId}: ${titulo}`
    );

    return {
      success: true,
      notification,
    };
  } catch (error: any) {
    console.error(`[Webhook DB] Error creating notification:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Log webhook event for audit trail
 */
export async function logWebhookEvent(
  event: string,
  asaasPaymentId: string,
  status: string,
  details?: any
): Promise<void> {
  try {
    // TODO: Implement webhook event logging to database
    // For now, just log to console
    console.log(`[Webhook Event Log] Event: ${event}, Payment: ${asaasPaymentId}, Status: ${status}`, {
      timestamp: new Date().toISOString(),
      details,
    });
  } catch (error: any) {
    console.error(`[Webhook DB] Error logging webhook event:`, error);
  }
}

/**
 * Handle complete webhook processing with status update and notification
 */
export async function processWebhookWithDatabase(
  asaasPaymentId: string,
  event: string,
  asaasStatus: string,
  paymentData?: any
): Promise<{
  success: boolean;
  statusUpdated: boolean;
  notificationCreated: boolean;
  error?: string;
}> {
  try {
    let statusUpdated = false;
    let notificationCreated = false;

    // Update payment status
    const statusResult = await handlePaymentStatusUpdate(
      asaasPaymentId,
      asaasStatus,
      paymentData
    );
    statusUpdated = statusResult.success;

    // Create notification
    const notificationResult = await handlePaymentNotification(
      asaasPaymentId,
      event,
      paymentData
    );
    notificationCreated = notificationResult.success;

    // Log webhook event
    await logWebhookEvent(
      event,
      asaasPaymentId,
      asaasStatus,
      paymentData
    );

    return {
      success: statusUpdated && notificationCreated,
      statusUpdated,
      notificationCreated,
    };
  } catch (error: any) {
    console.error(`[Webhook DB] Error processing webhook:`, error);
    return {
      success: false,
      statusUpdated: false,
      notificationCreated: false,
      error: error.message,
    };
  }
}
