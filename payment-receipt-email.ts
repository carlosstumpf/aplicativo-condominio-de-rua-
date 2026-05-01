/**
 * Payment Receipt Email Service
 * Send payment receipts via email
 */

import nodemailer from "nodemailer";
import { generateHTMLReceipt, PaymentReceiptData } from "./payment-receipt-generator";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

class PaymentReceiptEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Initialize email service
   */
  initialize(config: EmailConfig): void {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  /**
   * Send receipt email
   */
  async sendReceiptEmail(data: PaymentReceiptData): Promise<EmailDeliveryResult> {
    if (!this.transporter || !this.config) {
      return {
        success: false,
        error: "Email service not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const htmlContent = generateHTMLReceipt(data);
      const subject = `Recibo de Pagamento - ${data.billingDescription}`;

      const info = await this.transporter.sendMail({
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: data.moradorEmail,
        subject,
        html: htmlContent,
        text: `Recibo de Pagamento\n\nValor: R$ ${data.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nData: ${data.paymentDate.toLocaleDateString("pt-BR")}`,
      });

      return {
        success: true,
        messageId: info.messageId,
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
   * Send receipt email with CC/BCC
   */
  async sendReceiptEmailWithCopy(
    data: PaymentReceiptData,
    cc?: string[],
    bcc?: string[]
  ): Promise<EmailDeliveryResult> {
    if (!this.transporter || !this.config) {
      return {
        success: false,
        error: "Email service not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const htmlContent = generateHTMLReceipt(data);
      const subject = `Recibo de Pagamento - ${data.billingDescription}`;

      const info = await this.transporter.sendMail({
        from: `${this.config.from.name} <${this.config.from.email}>`,
        to: data.moradorEmail,
        cc,
        bcc,
        subject,
        html: htmlContent,
      });

      return {
        success: true,
        messageId: info.messageId,
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
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email verification failed:", error);
      return false;
    }
  }
}

// Singleton instance
export const emailService = new PaymentReceiptEmailService();

/**
 * Initialize email service with environment variables
 */
export function initializeEmailService(): void {
  const config: EmailConfig = {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASSWORD || "",
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || "Gestão de Condomínio",
      email: process.env.EMAIL_FROM_ADDRESS || "noreply@condominio.com",
    },
  };

  emailService.initialize(config);
}

/**
 * Send receipt email (convenience function)
 */
export async function sendPaymentReceiptEmail(
  data: PaymentReceiptData
): Promise<EmailDeliveryResult> {
  return emailService.sendReceiptEmail(data);
}

/**
 * Send receipt email with copy (convenience function)
 */
export async function sendPaymentReceiptEmailWithCopy(
  data: PaymentReceiptData,
  cc?: string[],
  bcc?: string[]
): Promise<EmailDeliveryResult> {
  return emailService.sendReceiptEmailWithCopy(data, cc, bcc);
}
