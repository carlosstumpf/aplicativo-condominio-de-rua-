/**
 * Payment Receipt WhatsApp Delivery Service
 * Send payment receipts via WhatsApp using Twilio
 */

import { twilio } from "./twilio-client";
import { PaymentReceiptData, formatReceiptData } from "./payment-receipt-generator";

export interface WhatsAppDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

class PaymentReceiptWhatsAppService {
  private twilioPhoneNumber: string;

  constructor(twilioPhoneNumber: string = process.env.TWILIO_WHATSAPP_NUMBER || "") {
    this.twilioPhoneNumber = twilioPhoneNumber;
  }

  /**
   * Send receipt via WhatsApp
   */
  async sendReceiptViaWhatsApp(data: PaymentReceiptData): Promise<WhatsAppDeliveryResult> {
    if (!data.moradorPhone) {
      return {
        success: false,
        error: "Morador phone number not provided",
        timestamp: new Date(),
      };
    }

    try {
      const formatted = formatReceiptData(data);
      const message = this.buildReceiptMessage(formatted);

      const result = await twilio.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${data.moradorPhone}`,
        body: message,
      });

      return {
        success: true,
        messageId: result.sid,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send receipt via WhatsApp Flow (interactive)
   */
  async sendReceiptViaWhatsAppFlow(data: PaymentReceiptData): Promise<WhatsAppDeliveryResult> {
    if (!data.moradorPhone) {
      return {
        success: false,
        error: "Morador phone number not provided",
        timestamp: new Date(),
      };
    }

    try {
      const formatted = formatReceiptData(data);

      // Build interactive message with buttons
      const message = this.buildInteractiveReceiptMessage(formatted);

      const result = await twilio.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${data.moradorPhone}`,
        contentSid: message.contentSid,
        contentVariables: JSON.stringify(message.variables),
      });

      return {
        success: true,
        messageId: result.sid,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }

  /**
   * Build receipt message text
   */
  private buildReceiptMessage(formatted: ReturnType<typeof formatReceiptData>): string {
    return `
✓ *Pagamento Confirmado*

Olá ${formatted.moradorName}!

Seu pagamento foi processado com sucesso.

*Detalhes do Recibo:*
• Número: ${formatted.receiptId}
• Valor: ${formatted.amount}
• Descrição: ${formatted.billingDescription}
• Data do Pagamento: ${formatted.paymentDate}
• Método: ${formatted.paymentMethod}

Obrigado! 🙏

---
Gestão de Condomínio
    `;
  }

  /**
   * Build interactive receipt message
   */
  private buildInteractiveReceiptMessage(formatted: ReturnType<typeof formatReceiptData>): {
    contentSid: string;
    variables: Record<string, string>;
  } {
    return {
      contentSid: process.env.TWILIO_RECEIPT_TEMPLATE_SID || "",
      variables: {
        1: formatted.moradorName,
        2: formatted.amount,
        3: formatted.billingDescription,
        4: formatted.receiptId,
      },
    };
  }

  /**
   * Send batch receipts via WhatsApp
   */
  async sendBatchReceiptsViaWhatsApp(
    receipts: PaymentReceiptData[]
  ): Promise<WhatsAppDeliveryResult[]> {
    const results = await Promise.all(
      receipts.map((receipt) => this.sendReceiptViaWhatsApp(receipt))
    );
    return results;
  }

  /**
   * Send receipt with attachment (document)
   */
  async sendReceiptWithAttachment(
    data: PaymentReceiptData,
    attachmentUrl: string
  ): Promise<WhatsAppDeliveryResult> {
    if (!data.moradorPhone) {
      return {
        success: false,
        error: "Morador phone number not provided",
        timestamp: new Date(),
      };
    }

    try {
      const formatted = formatReceiptData(data);
      const message = this.buildReceiptMessage(formatted);

      const result = await twilio.messages.create({
        from: `whatsapp:${this.twilioPhoneNumber}`,
        to: `whatsapp:${data.moradorPhone}`,
        body: message,
        mediaUrl: [attachmentUrl],
      });

      return {
        success: true,
        messageId: result.sid,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
    }
  }
}

// Singleton instance
export const whatsappService = new PaymentReceiptWhatsAppService();

/**
 * Send receipt via WhatsApp (convenience function)
 */
export async function sendPaymentReceiptViaWhatsApp(
  data: PaymentReceiptData
): Promise<WhatsAppDeliveryResult> {
  return whatsappService.sendReceiptViaWhatsApp(data);
}

/**
 * Send receipt via WhatsApp Flow (convenience function)
 */
export async function sendPaymentReceiptViaWhatsAppFlow(
  data: PaymentReceiptData
): Promise<WhatsAppDeliveryResult> {
  return whatsappService.sendReceiptViaWhatsAppFlow(data);
}

/**
 * Send batch receipts via WhatsApp (convenience function)
 */
export async function sendBatchPaymentReceiptsViaWhatsApp(
  receipts: PaymentReceiptData[]
): Promise<WhatsAppDeliveryResult[]> {
  return whatsappService.sendBatchReceiptsViaWhatsApp(receipts);
}
