/**
 * Asaas Integration Service
 * Reads the saved API key from the database and provides methods to:
 * - Create/find customers
 * - Create PIX payments
 * - Create Boleto payments
 * - Get PIX QR Code
 * - Get Boleto URL
 */

import axios, { AxiosInstance } from "axios";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const ASAAS_API_PRODUCAO = "https://api.asaas.com/v3";
const ASAAS_API_TESTE = "https://sandbox.asaas.com/api/v3";

interface AsaasConfig {
  apiKey: string;
  ambiente: "teste" | "producao";
  walletId: string | null;
}

interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
}

interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  netValue: number;
  billingType: string;
  dueDate: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  description?: string;
}

interface PixQrCodeResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

/**
 * Get the saved Asaas configuration from the database
 */
async function getAsaasConfig(): Promise<AsaasConfig | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const rows = await db.execute(
      sql`SELECT apiKey, ambiente, walletId FROM asaasConfig WHERE ativo = 1 LIMIT 1`
    );
    const results = (rows as any)[0] as any[];
    if (!results || results.length === 0) return null;

    return {
      apiKey: results[0].apiKey,
      ambiente: results[0].ambiente,
      walletId: results[0].walletId,
    };
  } catch (error) {
    console.error("[AsaasIntegration] Error getting config:", error);
    return null;
  }
}

/**
 * Create an Axios instance configured with the Asaas API key
 */
async function getAsaasClient(): Promise<AxiosInstance | null> {
  const config = await getAsaasConfig();
  if (!config) return null;

  const baseURL = config.ambiente === "teste" ? ASAAS_API_TESTE : ASAAS_API_PRODUCAO;

  return axios.create({
    baseURL,
    headers: {
      "access_token": config.apiKey,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
}

/**
 * Check if Asaas integration is configured and active
 */
export async function isAsaasConfigured(): Promise<boolean> {
  const config = await getAsaasConfig();
  return config !== null;
}

/**
 * Find or create a customer in Asaas
 */
export async function findOrCreateCustomer(data: {
  name: string;
  cpfCnpj: string;
  phone?: string;
  email?: string;
}): Promise<{ success: boolean; customerId?: string; error?: string }> {
  const client = await getAsaasClient();
  if (!client) {
    return { success: false, error: "Asaas nao configurado. Configure a chave API em Configuracoes > Asaas." };
  }

  try {
    // Try to find existing customer by CPF/CNPJ
    const searchResponse = await client.get("/customers", {
      params: { cpfCnpj: data.cpfCnpj },
    });

    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      return { success: true, customerId: searchResponse.data.data[0].id };
    }

    // Create new customer
    const createResponse = await client.post("/customers", {
      name: data.name,
      cpfCnpj: data.cpfCnpj,
      phone: data.phone,
      email: data.email,
      notificationDisabled: false,
    });

    return { success: true, customerId: createResponse.data.id };
  } catch (error: any) {
    const msg = error?.response?.data?.errors?.[0]?.description || error?.message || "Erro ao criar cliente no Asaas";
    console.error("[AsaasIntegration] Error creating customer:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Create a payment (PIX or BOLETO) in Asaas
 */
export async function createPayment(data: {
  customerId: string;
  billingType: "PIX" | "BOLETO";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}): Promise<{
  success: boolean;
  paymentId?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  status?: string;
  error?: string;
}> {
  const client = await getAsaasClient();
  if (!client) {
    return { success: false, error: "Asaas nao configurado." };
  }

  try {
    const response = await client.post("/payments", {
      customer: data.customerId,
      billingType: data.billingType,
      value: data.value,
      dueDate: data.dueDate,
      description: data.description || "Mensalidade Condominio",
      externalReference: data.externalReference,
    });

    return {
      success: true,
      paymentId: response.data.id,
      invoiceUrl: response.data.invoiceUrl,
      bankSlipUrl: response.data.bankSlipUrl,
      status: response.data.status,
    };
  } catch (error: any) {
    const msg = error?.response?.data?.errors?.[0]?.description || error?.message || "Erro ao criar pagamento no Asaas";
    console.error("[AsaasIntegration] Error creating payment:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Get PIX QR Code for a payment
 */
export async function getPixQrCode(paymentId: string, retries: number = 3): Promise<{
  success: boolean;
  qrCode?: string;
  copyPaste?: string;
  expiresAt?: string;
  error?: string;
}> {
  const client = await getAsaasClient();
  if (!client) {
    return { success: false, error: "Asaas nao configurado." };
  }

  let lastError: any = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AsaasIntegration] Fetching PIX QR Code for ${paymentId} (attempt ${attempt}/${retries})`);
      const response = await client.get(`/payments/${paymentId}/pixQrCode`);

      console.log(`[AsaasIntegration] Successfully fetched PIX QR Code on attempt ${attempt}`);
      return {
        success: true,
        qrCode: response.data.encodedImage,
        copyPaste: response.data.payload,
        expiresAt: response.data.expirationDate,
      };
    } catch (error: any) {
      lastError = error;
      const msg = error?.response?.data?.errors?.[0]?.description || error?.message || "Erro ao obter QR Code PIX";
      console.error(`[AsaasIntegration] Error getting PIX QR (attempt ${attempt}/${retries}):`, msg);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s, 16s
        console.log(`[AsaasIntegration] Retrying PIX in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  const finalError = lastError?.response?.data?.errors?.[0]?.description || lastError?.message || "Erro ao obter QR Code PIX apos multiplas tentativas";
  console.error(`[AsaasIntegration] Failed to get PIX QR Code after ${retries} attempts:`, finalError);
  return { success: false, error: finalError };
}

/**
 * Get Boleto bank slip URL and barcode
 * Uses the identificationField endpoint to get the linha digitavel (barcode)
 */
export async function getBoletoInfo(paymentId: string, retries: number = 5): Promise<{
  success: boolean;
  url?: string;
  barCode?: string;
  error?: string;
}> {
  const client = await getAsaasClient();
  if (!client) {
    return { success: false, error: "Asaas nao configurado." };
  }

  let lastError: any = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AsaasIntegration] Fetching Boleto info for ${paymentId} (attempt ${attempt}/${retries})`);
      
      // Get identification field (linha digitavel)
      const identResponse = await client.get(`/payments/${paymentId}/identificationField`);
      const barCode = identResponse.data?.identificationField;
      
      // Get payment details for URL
      const paymentResponse = await client.get(`/payments/${paymentId}`);
      const boletoUrl = paymentResponse.data?.invoiceUrl || paymentResponse.data?.bankSlipUrl;

      console.log(`[AsaasIntegration] Successfully fetched Boleto info on attempt ${attempt}`);
      return {
        success: true,
        url: boletoUrl,
        barCode: barCode,
      };
    } catch (error: any) {
      lastError = error;
      const statusCode = error?.response?.status || "unknown";
      const msg = error?.response?.data?.errors?.[0]?.description || error?.message || "Erro ao obter dados do boleto";
      console.error(`[AsaasIntegration] Error getting Boleto info (attempt ${attempt}/${retries}, status: ${statusCode}):`, msg);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`[AsaasIntegration] Retrying PIX in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  const finalError = lastError?.response?.data?.errors?.[0]?.description || lastError?.message || "Erro ao obter dados do boleto apos multiplas tentativas";
  console.error(`[AsaasIntegration] Failed to get Boleto info after ${retries} attempts:`, finalError);
  return { success: false, error: finalError };
}

/**
 * Get payment status from Asaas
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  const client = await getAsaasClient();
  if (!client) {
    return { success: false, error: "Asaas nao configurado." };
  }

  try {
    const response = await client.get(`/payments/${paymentId}`);
    return {
      success: true,
      status: response.data.status,
    };
  } catch (error: any) {
    const msg = error?.response?.data?.errors?.[0]?.description || error?.message || "Erro ao consultar status";
    console.error("[AsaasIntegration] Error getting status:", msg);
    return { success: false, error: msg };
  }
}
