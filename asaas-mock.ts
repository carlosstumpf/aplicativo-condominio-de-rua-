/**
 * Mock Asaas API for development and testing
 * Simulates real Asaas API responses without requiring actual credentials
 */

/**
 * Generate a simple ID string
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export interface MockAsaasPayment {
  id: string;
  customer: string;
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD";
  value: number;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  description?: string;
  externalReference?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  barCode?: string;
  bankSlipUrl?: string;
  createdAt: string;
}

// In-memory storage for mock data
const mockPayments: Map<string, MockAsaasPayment> = new Map();
const mockCustomers: Map<string, any> = new Map();

/**
 * Generate a realistic mock PIX QR Code
 */
function generateMockPixQrCode(): { qrCode: string; copyPaste: string } {
  // Mock PIX QR code (EMV format)
  const randomId = generateId();
  const qrCode = `00020126580014br.gov.bcb.pix0136${randomId}52040000530398654061234.567895802BR5913CONDOMINIO LTDA6009SAO PAULO62410503***63041D3D`;

  return {
    qrCode,
    copyPaste: qrCode,
  };
}

/**
 * Generate a realistic mock bank slip barcode
 */
function generateMockBarCode(): string {
  const bankCode = "001"; // Banco do Brasil
  const branchCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const accountNumber = String(Math.floor(Math.random() * 1000000)).padStart(7, "0");
  const sequenceNumber = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

  return `${bankCode}${branchCode} ${accountNumber} ${sequenceNumber} 1 12345678901234`;
}

/**
 * Create a mock customer
 */
export function createMockCustomer(data: any) {
  const customerId = `cus_${Date.now()}_${generateId().substring(0, 9)}`;

  const customer = {
    id: customerId,
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    cpfCnpj: data.cpfCnpj || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    postalCode: data.postalCode || "",
    createdAt: new Date().toISOString(),
  };

  mockCustomers.set(customerId, customer);
  return customer;
}

/**
 * Get a mock customer
 */
export function getMockCustomer(customerId: string) {
  const customer = mockCustomers.get(customerId);
  if (!customer) {
    throw new Error(`Customer ${customerId} not found`);
  }
  return customer;
}

/**
 * Create a mock payment (cobrança)
 */
export function createMockPayment(data: {
  customer: string;
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD";
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}) {
  // Verify customer exists
  if (!mockCustomers.has(data.customer)) {
    throw new Error(`Customer ${data.customer} not found`);
  }

  const paymentId = `pay_${Date.now()}_${generateId().substring(0, 9)}`;
  const pixData = generateMockPixQrCode();

  const payment: MockAsaasPayment = {
    id: paymentId,
    customer: data.customer,
    billingType: data.billingType,
    value: data.value,
    status: "PENDING",
    dueDate: data.dueDate,
    description: data.description || "",
    externalReference: data.externalReference || "",
    pixQrCode: data.billingType === "PIX" ? pixData.qrCode : undefined,
    pixCopyPaste: data.billingType === "PIX" ? pixData.copyPaste : undefined,
    barCode: data.billingType === "BOLETO" ? generateMockBarCode() : undefined,
    bankSlipUrl: data.billingType === "BOLETO" ? `https://www.asaas.com/boleto/${paymentId}` : undefined,
    createdAt: new Date().toISOString(),
  };

  mockPayments.set(paymentId, payment);
  return payment;
}

/**
 * Get a mock payment
 */
export function getMockPayment(paymentId: string) {
  const payment = mockPayments.get(paymentId);
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }
  return payment;
}

/**
 * Update mock payment status
 */
export function updateMockPaymentStatus(
  paymentId: string,
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "CANCELLED"
) {
  const payment = mockPayments.get(paymentId);
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  payment.status = status;
  mockPayments.set(paymentId, payment);
  return payment;
}

/**
 * List mock payments
 */
export function listMockPayments(filters?: {
  customer?: string;
  status?: string;
  billingType?: string;
}) {
  let payments = Array.from(mockPayments.values());

  if (filters?.customer) {
    payments = payments.filter((p) => p.customer === filters.customer);
  }

  if (filters?.status) {
    payments = payments.filter((p) => p.status === filters.status);
  }

  if (filters?.billingType) {
    payments = payments.filter((p) => p.billingType === filters.billingType);
  }

  return {
    data: payments,
    totalCount: payments.length,
  };
}

/**
 * Generate PIX QR Code for a payment
 */
export function generatePixQrCodeMock(paymentId: string) {
  const payment = getMockPayment(paymentId);

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
}

/**
 * Get bank slip URL for a payment
 */
export function getBankSlipUrlMock(paymentId: string) {
  const payment = getMockPayment(paymentId);

  if (payment.billingType !== "BOLETO") {
    throw new Error("Payment must be a BOLETO to get bank slip URL");
  }

  if (!payment.bankSlipUrl) {
    throw new Error("Bank slip URL not available for this payment");
  }

  return {
    url: payment.bankSlipUrl,
    barCode: payment.barCode,
  };
}

/**
 * Clear all mock data (for testing)
 */
export function clearMockData() {
  mockPayments.clear();
  mockCustomers.clear();
}
