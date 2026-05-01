/**
 * Asaas API Adapter
 * Provides a unified interface that switches between real and mock implementations
 * based on environment configuration
 */

import { AsaasAPI, getAsaasAPI } from "./asaas-real";
import * as MockAsaas from "./asaas-mock";

export type AsaasPayment = Awaited<ReturnType<typeof getPayment>>;
export type AsaasCustomer = Awaited<ReturnType<typeof getCustomer>>;

let asaasAPI: AsaasAPI | null = null;
let isInitialized = false;

/**
 * Initialize the Asaas adapter
 * Determines whether to use real or mock implementation
 */
export function initializeAsaas(): void {
  if (isInitialized) return;

  asaasAPI = getAsaasAPI();
  isInitialized = true;

  if (asaasAPI) {
    console.log("[Asaas] Using REAL API (production/sandbox)");
  } else {
    console.log("[Asaas] Using MOCK API (development/testing)");
  }
}

/**
 * Check if using real Asaas API
 */
export function isUsingRealAsaas(): boolean {
  if (!isInitialized) initializeAsaas();
  return asaasAPI !== null;
}

/**
 * Create a customer
 */
export async function createCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}): Promise<any> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.createCustomer(data);
  } else {
    return MockAsaas.createMockCustomer(data);
  }
}

/**
 * Get a customer
 */
export async function getCustomer(customerId: string): Promise<any> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.getCustomer(customerId);
  } else {
    return MockAsaas.getMockCustomer(customerId);
  }
}

/**
 * Create a payment
 */
export async function createPayment(data: {
  customer: string;
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}): Promise<any> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.createPayment(data);
  } else {
    return MockAsaas.createMockPayment(data);
  }
}

/**
 * Get a payment
 */
export async function getPayment(paymentId: string): Promise<any> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.getPayment(paymentId);
  } else {
    return MockAsaas.getMockPayment(paymentId);
  }
}

/**
 * List payments
 */
export async function listPayments(filters?: {
  customer?: string;
  status?: string;
  billingType?: string;
}): Promise<{
  data: any[];
  totalCount: number;
}> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.listPayments(filters);
  } else {
    return MockAsaas.listMockPayments(filters);
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "CANCELLED"
): Promise<any> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    // Real API only accepts these statuses
    const realApiStatus = status as "RECEIVED" | "CONFIRMED" | "OVERDUE" | "CANCELLED";
    return asaasAPI.updatePaymentStatus(paymentId, realApiStatus);
  } else {
    return MockAsaas.updateMockPaymentStatus(paymentId, status);
  }
}

/**
 * Get PIX QR Code
 */
export async function getPixQrCode(
  paymentId: string
): Promise<{
  qrCode: string;
  copyPaste: string;
  expiresAt?: string;
}> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.getPixQrCode(paymentId);
  } else {
    const result = MockAsaas.generatePixQrCodeMock(paymentId);
    return {
      qrCode: result.qrCode,
      copyPaste: result.copyPaste || result.qrCode,
      expiresAt: undefined,
    };
  }
}

/**
 * Get bank slip URL
 */
export async function getBankSlipUrl(
  paymentId: string
): Promise<{
  url: string;
  barCode?: string;
}> {
  if (!isInitialized) initializeAsaas();

  if (asaasAPI) {
    return asaasAPI.getBankSlipUrl(paymentId);
  } else {
    return MockAsaas.getBankSlipUrlMock(paymentId);
  }
}

/**
 * Register webhook (only for real API)
 */
export async function registerWebhook(
  url: string,
  events: string[]
): Promise<{
  id: string;
  url: string;
  events: string[];
}> {
  if (!isInitialized) initializeAsaas();

  if (!asaasAPI) {
    throw new Error("Webhook registration only available with real Asaas API");
  }

  return asaasAPI.registerWebhook(url, events);
}

/**
 * List webhooks (only for real API)
 */
export async function listWebhooks(): Promise<
  Array<{
    id: string;
    url: string;
    events: string[];
    createdAt: string;
  }>
> {
  if (!isInitialized) initializeAsaas();

  if (!asaasAPI) {
    return [];
  }

  return asaasAPI.listWebhooks();
}

/**
 * Delete webhook (only for real API)
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  if (!isInitialized) initializeAsaas();

  if (!asaasAPI) {
    throw new Error("Webhook deletion only available with real Asaas API");
  }

  return asaasAPI.deleteWebhook(webhookId);
}

/**
 * Clear mock data (for testing)
 */
export function clearMockData(): void {
  if (!asaasAPI) {
    MockAsaas.clearMockData();
  }
}
