/**
 * Billing Asaas Integration
 * Generates PIX, Boleto, and Bank Transfer payment options via Asaas
 */

import { asaasAdapter } from "./asaas-adapter";
import { getBilling } from "./billing-schedule-db";

export interface PaymentGenerationResult {
  method: "pix" | "boleto" | "transfer";
  billingId: number;
  customerId: string;
  paymentId: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "generated";
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoBarcode?: string;
  boletoUrl?: string;
  bankDetails?: {
    bank: string;
    accountNumber: string;
    accountType: string;
    accountHolder: string;
  };
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Generate PIX payment for billing
 */
export async function generatePixPayment(
  billingId: number,
  customerId: string,
  amount: number,
  dueDate: Date
): Promise<PaymentGenerationResult> {
  try {
    const client = asaasAdapter.getClient();

    // Create payment via Asaas
    const payment = await client.createPayment({
      customerId,
      billingType: "PIX",
      value: amount,
      dueDate,
      description: `Cobrança - Fatura ${billingId}`,
    });

    // Get PIX details
    const pixDetails = await client.getPixDetails(payment.id);

    return {
      method: "pix",
      billingId,
      customerId,
      paymentId: payment.id,
      amount,
      dueDate,
      status: "generated",
      pixQrCode: pixDetails.qrCode,
      pixCopyPaste: pixDetails.copyPaste,
      expiresAt: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating PIX payment:", error);
    throw new Error(`Failed to generate PIX payment: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate Boleto payment for billing
 */
export async function generateBoletoPayment(
  billingId: number,
  customerId: string,
  amount: number,
  dueDate: Date
): Promise<PaymentGenerationResult> {
  try {
    const client = asaasAdapter.getClient();

    // Create payment via Asaas
    const payment = await client.createPayment({
      customerId,
      billingType: "BOLETO",
      value: amount,
      dueDate,
      description: `Cobrança - Fatura ${billingId}`,
    });

    return {
      method: "boleto",
      billingId,
      customerId,
      paymentId: payment.id,
      amount,
      dueDate,
      status: "generated",
      boletoBarcode: payment.barCode,
      boletoUrl: payment.bankSlipUrl,
      expiresAt: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating Boleto payment:", error);
    throw new Error(`Failed to generate Boleto payment: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate Bank Transfer payment (return bank details)
 */
export async function generateBankTransferPayment(
  billingId: number,
  customerId: string,
  amount: number,
  dueDate: Date
): Promise<PaymentGenerationResult> {
  try {
    // Get bank details from Asaas account settings
    // For now, return mock data
    const bankDetails = {
      bank: "Banco do Brasil",
      accountNumber: "123456-7",
      accountType: "Conta Corrente",
      accountHolder: "Condomínio Rua ABC",
    };

    return {
      method: "transfer",
      billingId,
      customerId,
      paymentId: `TRANSFER-${billingId}-${Date.now()}`,
      amount,
      dueDate,
      status: "generated",
      bankDetails,
      expiresAt: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating bank transfer payment:", error);
    throw new Error(`Failed to generate bank transfer payment: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate payment by method
 */
export async function generatePayment(
  billingId: number,
  customerId: string,
  method: "pix" | "boleto" | "transfer"
): Promise<PaymentGenerationResult> {
  try {
    const billing = await getBilling(billingId);

    if (!billing) {
      throw new Error(`Billing ${billingId} not found`);
    }

    switch (method) {
      case "pix":
        return await generatePixPayment(billingId, customerId, billing.amount, billing.dueDate);
      case "boleto":
        return await generateBoletoPayment(billingId, customerId, billing.amount, billing.dueDate);
      case "transfer":
        return await generateBankTransferPayment(billingId, customerId, billing.amount, billing.dueDate);
      default:
        throw new Error(`Unknown payment method: ${method}`);
    }
  } catch (error) {
    console.error("Error generating payment:", error);
    throw error;
  }
}

/**
 * Get payment status from Asaas
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  id: string;
  status: string;
  value: number;
  paidValue: number;
  dueDate: Date;
  paidDate?: Date;
}> {
  try {
    const client = asaasAdapter.getClient();
    const payment = await client.getPayment(paymentId);

    return {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      paidValue: payment.paidValue || 0,
      dueDate: new Date(payment.dueDate),
      paidDate: payment.paidDate ? new Date(payment.paidDate) : undefined,
    };
  } catch (error) {
    console.error("Error getting payment status:", error);
    throw new Error(`Failed to get payment status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Format PIX payment display
 */
export function formatPixPayment(payment: PaymentGenerationResult): string {
  if (payment.method !== "pix") {
    throw new Error("Payment is not a PIX payment");
  }

  return `PIX - Transferência Instantânea

Valor: R$ ${payment.amount.toFixed(2)}
Vencimento: ${payment.dueDate.toLocaleDateString("pt-BR")}

QR Code:
${payment.pixQrCode}

Ou copie e cole:
${payment.pixCopyPaste}

Após o pagamento, sua taxa será atualizada automaticamente.`;
}

/**
 * Format Boleto payment display
 */
export function formatBoletoPayment(payment: PaymentGenerationResult): string {
  if (payment.method !== "boleto") {
    throw new Error("Payment is not a Boleto payment");
  }

  return `Boleto - Código de Barras

Valor: R$ ${payment.amount.toFixed(2)}
Vencimento: ${payment.dueDate.toLocaleDateString("pt-BR")}

Código de Barras:
${payment.boletoBarcode}

Você pode pagar em qualquer banco ou lotérica.
Após o pagamento, sua taxa será atualizada automaticamente.

Baixar Boleto: ${payment.boletoUrl}`;
}

/**
 * Format Bank Transfer payment display
 */
export function formatBankTransferPayment(payment: PaymentGenerationResult): string {
  if (payment.method !== "transfer") {
    throw new Error("Payment is not a bank transfer payment");
  }

  const details = payment.bankDetails;

  return `Transferência Bancária

Valor: R$ ${payment.amount.toFixed(2)}
Vencimento: ${payment.dueDate.toLocaleDateString("pt-BR")}

Dados para Transferência:
Banco: ${details?.bank}
Conta: ${details?.accountNumber}
Tipo: ${details?.accountType}
Titular: ${details?.accountHolder}

Após o pagamento, sua taxa será atualizada automaticamente.`;
}

/**
 * Create payment record in database
 */
export async function createPaymentRecord(
  billingId: number,
  paymentData: PaymentGenerationResult
): Promise<void> {
  // TODO: Save payment record to database
  // This would store the payment details for tracking and reconciliation
  console.log("Payment record created:", {
    billingId,
    paymentId: paymentData.paymentId,
    method: paymentData.method,
    amount: paymentData.amount,
    createdAt: paymentData.createdAt,
  });
}

/**
 * Get payment history for billing
 */
export async function getPaymentHistory(billingId: number): Promise<PaymentGenerationResult[]> {
  // TODO: Fetch payment history from database
  return [];
}

/**
 * Cancel payment
 */
export async function cancelPayment(paymentId: string): Promise<void> {
  try {
    const client = asaasAdapter.getClient();
    await client.deletePayment(paymentId);
    console.log(`Payment ${paymentId} cancelled`);
  } catch (error) {
    console.error("Error cancelling payment:", error);
    throw new Error(`Failed to cancel payment: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Refund payment
 */
export async function refundPayment(paymentId: string, amount?: number): Promise<void> {
  try {
    const client = asaasAdapter.getClient();
    // TODO: Implement refund via Asaas API
    console.log(`Payment ${paymentId} refunded for amount: ${amount}`);
  } catch (error) {
    console.error("Error refunding payment:", error);
    throw new Error(`Failed to refund payment: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
