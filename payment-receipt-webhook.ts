/**
 * Payment Receipt Webhook Handler
 * Trigger receipt delivery when payments are confirmed
 */

import { sendPaymentReceiptEmail, sendPaymentReceiptViaWhatsApp } from "./payment-receipt-email";
import { PaymentReceiptData, generateReceiptId } from "./payment-receipt-generator";
import { db } from "./db";
import { cobrancas, moradores } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export interface PaymentConfirmationWebhook {
  billingId: number;
  moradorId: number;
  amount: number;
  paymentMethod: "pix" | "boleto" | "transfer";
  transactionId?: string;
  paymentDate: Date;
  condominiumName: string;
  condominiumCNPJ?: string;
}

export interface ReceiptDeliveryConfig {
  sendEmail: boolean;
  sendWhatsApp: boolean;
  ccAdmins?: string[];
  bccAdmins?: string[];
}

/**
 * Handle payment confirmation and send receipts
 */
export async function handlePaymentConfirmationAndSendReceipts(
  webhook: PaymentConfirmationWebhook,
  config: ReceiptDeliveryConfig = { sendEmail: true, sendWhatsApp: true }
): Promise<{
  success: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  error?: string;
}> {
  try {
    // Fetch morador details
    const morador = await db.query.moradores.findFirst({
      where: eq(moradores.id, webhook.moradorId),
    });

    if (!morador) {
      return {
        success: false,
        emailSent: false,
        whatsappSent: false,
        error: "Morador not found",
      };
    }

    // Fetch billing details
    const billing = await db.query.cobrancas.findFirst({
      where: eq(cobrancas.id, webhook.billingId),
    });

    if (!billing) {
      return {
        success: false,
        emailSent: false,
        whatsappSent: false,
        error: "Billing not found",
      };
    }

    // Prepare receipt data
    const receiptData: PaymentReceiptData = {
      receiptId: generateReceiptId(),
      receiptDate: new Date(),
      paymentDate: webhook.paymentDate,
      moradorId: webhook.moradorId,
      moradorName: morador.nome,
      moradorEmail: morador.email || "",
      moradorPhone: morador.telefone,
      condominiumName: webhook.condominiumName,
      condominiumCNPJ: webhook.condominiumCNPJ,
      billingId: webhook.billingId,
      billingDescription: billing.descricao || "Mensalidade",
      billingDueDate: billing.data_vencimento,
      amount: webhook.amount,
      paymentMethod: webhook.paymentMethod,
      transactionId: webhook.transactionId,
    };

    let emailSent = false;
    let whatsappSent = false;
    let error: string | undefined;

    // Send email
    if (config.sendEmail && morador.email) {
      try {
        const emailResult = await sendPaymentReceiptEmail(receiptData);
        emailSent = emailResult.success;
        if (!emailResult.success) {
          error = emailResult.error;
        }
      } catch (err) {
        console.error("Error sending email receipt:", err);
        error = err instanceof Error ? err.message : "Email send failed";
      }
    }

    // Send WhatsApp
    if (config.sendWhatsApp && morador.telefone) {
      try {
        const whatsappResult = await sendPaymentReceiptViaWhatsApp(receiptData);
        whatsappSent = whatsappResult.success;
        if (!whatsappResult.success && !error) {
          error = whatsappResult.error;
        }
      } catch (err) {
        console.error("Error sending WhatsApp receipt:", err);
        if (!error) {
          error = err instanceof Error ? err.message : "WhatsApp send failed";
        }
      }
    }

    // Log receipt delivery
    await logReceiptDelivery({
      billingId: webhook.billingId,
      moradorId: webhook.moradorId,
      receiptId: receiptData.receiptId,
      emailSent,
      whatsappSent,
      error,
    });

    return {
      success: emailSent || whatsappSent,
      emailSent,
      whatsappSent,
      error: !emailSent && !whatsappSent ? error : undefined,
    };
  } catch (error) {
    console.error("Error handling payment confirmation:", error);
    return {
      success: false,
      emailSent: false,
      whatsappSent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log receipt delivery attempt
 */
async function logReceiptDelivery(data: {
  billingId: number;
  moradorId: number;
  receiptId: string;
  emailSent: boolean;
  whatsappSent: boolean;
  error?: string;
}): Promise<void> {
  try {
    // Create receipt delivery log entry
    // This assumes you have a receiptDeliveryLogs table
    // If not, you can store this in a separate logging system
    console.log("Receipt delivery logged:", {
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (error) {
    console.error("Error logging receipt delivery:", error);
  }
}

/**
 * Retry failed receipt delivery
 */
export async function retryFailedReceiptDelivery(
  receiptId: string,
  config: ReceiptDeliveryConfig = { sendEmail: true, sendWhatsApp: true }
): Promise<{
  success: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  error?: string;
}> {
  try {
    // Fetch receipt details from log
    // This assumes you have a receiptDeliveryLogs table
    // For now, return a placeholder response
    return {
      success: false,
      emailSent: false,
      whatsappSent: false,
      error: "Receipt not found in logs",
    };
  } catch (error) {
    return {
      success: false,
      emailSent: false,
      whatsappSent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send test receipt
 */
export async function sendTestReceipt(
  moradorId: number,
  config: ReceiptDeliveryConfig = { sendEmail: true, sendWhatsApp: true }
): Promise<{
  success: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  error?: string;
}> {
  try {
    const morador = await db.query.moradores.findFirst({
      where: eq(moradores.id, moradorId),
    });

    if (!morador) {
      return {
        success: false,
        emailSent: false,
        whatsappSent: false,
        error: "Morador not found",
      };
    }

    const testReceiptData: PaymentReceiptData = {
      receiptId: generateReceiptId(),
      receiptDate: new Date(),
      paymentDate: new Date(),
      moradorId: morador.id,
      moradorName: morador.nome,
      moradorEmail: morador.email || "",
      moradorPhone: morador.telefone,
      condominiumName: "Condomínio Teste",
      billingId: 0,
      billingDescription: "Teste de Recibo",
      billingDueDate: new Date(),
      amount: 500,
      paymentMethod: "pix",
      transactionId: "TEST-001",
    };

    let emailSent = false;
    let whatsappSent = false;
    let error: string | undefined;

    if (config.sendEmail && morador.email) {
      try {
        const emailResult = await sendPaymentReceiptEmail(testReceiptData);
        emailSent = emailResult.success;
        if (!emailResult.success) {
          error = emailResult.error;
        }
      } catch (err) {
        console.error("Error sending test email:", err);
        error = err instanceof Error ? err.message : "Email send failed";
      }
    }

    if (config.sendWhatsApp && morador.telefone) {
      try {
        const whatsappResult = await sendPaymentReceiptViaWhatsApp(testReceiptData);
        whatsappSent = whatsappResult.success;
        if (!whatsappResult.success && !error) {
          error = whatsappResult.error;
        }
      } catch (err) {
        console.error("Error sending test WhatsApp:", err);
        if (!error) {
          error = err instanceof Error ? err.message : "WhatsApp send failed";
        }
      }
    }

    return {
      success: emailSent || whatsappSent,
      emailSent,
      whatsappSent,
      error: !emailSent && !whatsappSent ? error : undefined,
    };
  } catch (error) {
    return {
      success: false,
      emailSent: false,
      whatsappSent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
