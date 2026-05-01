import axios from "axios";

const ASAAS_BASE_URL = "https://api.asaas.com/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

if (!ASAAS_API_KEY) {
  console.warn("⚠️ ASAAS_API_KEY not configured. Payment features will not work.");
}

const asaasClient = axios.create({
  baseURL: ASAAS_BASE_URL,
  headers: {
    "access_token": ASAAS_API_KEY,
    "Content-Type": "application/json",
  },
});

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD";
  value: number;
  netValue?: number;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "CANCELLED" | "DUNNING" | "DELETED";
  dueDate: string;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  description?: string;
  externalReference?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  bankSlipUrl?: string;
  invoiceUrl?: string;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  barCode?: string;
  fine?: number;
  interest?: number;
  discount?: number;
  createdAt?: string;
}

/**
 * Create a customer in Asaas
 */
export async function createAsaasCustomer(customer: AsaasCustomer) {
  try {
    const response = await asaasClient.post("/customers", customer);
    return response.data;
  } catch (error: any) {
    console.error("Error creating Asaas customer:", error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || "Failed to create customer in Asaas");
  }
}

/**
 * Get customer by ID from Asaas
 */
export async function getAsaasCustomer(customerId: string) {
  try {
    const response = await asaasClient.get(`/customers/${customerId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching Asaas customer:", error.response?.data || error.message);
    throw new Error("Failed to fetch customer from Asaas");
  }
}

/**
 * Create a payment (cobrança) in Asaas
 */
export async function createAsaasPayment(payment: {
  customer: string;
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  discount?: number;
  interest?: number;
  fine?: number;
}) {
  try {
    const response = await asaasClient.post("/payments", payment);
    return response.data;
  } catch (error: any) {
    console.error("Error creating Asaas payment:", error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || "Failed to create payment in Asaas");
  }
}

/**
 * Get payment by ID from Asaas
 */
export async function getAsaasPayment(paymentId: string) {
  try {
    const response = await asaasClient.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching Asaas payment:", error.response?.data || error.message);
    throw new Error("Failed to fetch payment from Asaas");
  }
}

/**
 * List payments from Asaas with filters
 */
export async function listAsaasPayments(params?: {
  customer?: string;
  status?: string;
  billingType?: string;
  offset?: number;
  limit?: number;
}) {
  try {
    const response = await asaasClient.get("/payments", { params });
    return response.data;
  } catch (error: any) {
    console.error("Error listing Asaas payments:", error.response?.data || error.message);
    throw new Error("Failed to list payments from Asaas");
  }
}

/**
 * Generate PIX QR Code for a payment
 */
export async function generatePixQrCode(paymentId: string) {
  try {
    const payment = await getAsaasPayment(paymentId);

    if (payment.status !== "PENDING") {
      throw new Error("Payment must be in PENDING status to generate PIX QR Code");
    }

    if (!payment.pixQrCode) {
      throw new Error("PIX QR Code not available for this payment");
    }

    return {
      qrCode: payment.pixQrCode,
      copyPaste: payment.pixCopyPaste,
      expiresAt: payment.dueDate,
    };
  } catch (error: any) {
    console.error("Error generating PIX QR Code:", error.message);
    throw error;
  }
}

/**
 * Get bank slip (boleto) URL for a payment
 */
export async function getBankSlipUrl(paymentId: string) {
  try {
    const payment = await getAsaasPayment(paymentId);

    if (payment.billingType !== "BOLETO") {
      throw new Error("Payment must be a BOLETO to get bank slip URL");
    }

    if (!payment.bankSlipUrl) {
      throw new Error("Bank slip URL not available for this payment");
    }

    return {
      url: payment.bankSlipUrl,
      barCode: payment.barCode,
      nossoNumero: payment.nossoNumero,
    };
  } catch (error: any) {
    console.error("Error getting bank slip URL:", error.message);
    throw error;
  }
}

/**
 * Check if Asaas API is configured and accessible
 */
export async function checkAsaasConnection() {
  if (!ASAAS_API_KEY) {
    return {
      connected: false,
      message: "ASAAS_API_KEY not configured",
    };
  }

  try {
    // Try to fetch account info to verify API key
    const response = await asaasClient.get("/account");
    return {
      connected: true,
      message: "Connected to Asaas API",
      account: response.data,
    };
  } catch (error: any) {
    return {
      connected: false,
      message: error.response?.data?.errors?.[0]?.detail || "Failed to connect to Asaas API",
      error: error.message,
    };
  }
}
