import { describe, it, expect, beforeEach } from "vitest";
import * as mockAsaas from "../server/_core/asaas-mock";

describe("Asaas Mock Integration", () => {
  beforeEach(() => {
    mockAsaas.clearMockData();
  });

  describe("Customer Management", () => {
    it("should create a mock customer", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João Silva",
        email: "joao@example.com",
        phone: "11999999999",
        cpfCnpj: "12345678901",
      });

      expect(customer).toHaveProperty("id");
      expect(customer.name).toBe("João Silva");
      expect(customer.email).toBe("joao@example.com");
    });

    it("should retrieve a created customer", () => {
      const created = mockAsaas.createMockCustomer({
        name: "Maria Santos",
        email: "maria@example.com",
      });

      const retrieved = mockAsaas.getMockCustomer(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe("Maria Santos");
    });

    it("should throw error when retrieving non-existent customer", () => {
      expect(() => {
        mockAsaas.getMockCustomer("nonexistent");
      }).toThrow("Customer nonexistent not found");
    });
  });

  describe("Payment Creation", () => {
    it("should create a PIX payment", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
        description: "Condomínio - Abril",
      });

      expect(payment).toHaveProperty("id");
      expect(payment.value).toBe(100.0);
      expect(payment.billingType).toBe("PIX");
      expect(payment.pixQrCode).toBeDefined();
      expect(payment.status).toBe("PENDING");
    });

    it("should create a BOLETO payment", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "Maria",
        email: "maria@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "BOLETO",
        value: 250.0,
        dueDate: "2026-05-15",
      });

      expect(payment.billingType).toBe("BOLETO");
      expect(payment.barCode).toBeDefined();
      expect(payment.bankSlipUrl).toBeDefined();
    });

    it("should throw error when creating payment for non-existent customer", () => {
      expect(() => {
        mockAsaas.createMockPayment({
          customer: "nonexistent",
          billingType: "PIX",
          value: 100,
          dueDate: "2026-04-30",
        });
      }).toThrow("Customer nonexistent not found");
    });
  });

  describe("PIX QR Code Generation", () => {
    it("should generate PIX QR code for pending payment", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      const qrCode = mockAsaas.generatePixQrCodeMock(payment.id);

      expect(qrCode).toHaveProperty("qrCode");
      expect(qrCode).toHaveProperty("copyPaste");
      expect(qrCode).toHaveProperty("expiresAt");
      expect(qrCode.qrCode.length).toBeGreaterThan(0);
    });

    it("should throw error when generating QR code for non-PIX payment", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "BOLETO",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      expect(() => {
        mockAsaas.generatePixQrCodeMock(payment.id);
      }).toThrow("PIX QR Code not available for this payment");
    });
  });

  describe("Bank Slip URL Generation", () => {
    it("should get bank slip URL for BOLETO payment", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "BOLETO",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      const bankSlip = mockAsaas.getBankSlipUrlMock(payment.id);

      expect(bankSlip).toHaveProperty("url");
      expect(bankSlip).toHaveProperty("barCode");
      expect(bankSlip.url).toContain("asaas.com");
      expect(bankSlip.barCode && bankSlip.barCode.length).toBeGreaterThan(0);
    });

    it("should throw error when getting bank slip for non-BOLETO payment", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      expect(() => {
        mockAsaas.getBankSlipUrlMock(payment.id);
      }).toThrow("Payment must be a BOLETO to get bank slip URL");
    });
  });

  describe("Payment Status Updates", () => {
    it("should update payment status", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      expect(payment.status).toBe("PENDING");

      const updated = mockAsaas.updateMockPaymentStatus(payment.id, "RECEIVED");

      expect(updated.status).toBe("RECEIVED");
    });
  });

  describe("Payment Listing and Filtering", () => {
    it("should list all payments", () => {
      const customer1 = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });
      const customer2 = mockAsaas.createMockCustomer({
        name: "Maria",
        email: "maria@example.com",
      });

      mockAsaas.createMockPayment({
        customer: customer1.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      mockAsaas.createMockPayment({
        customer: customer2.id,
        billingType: "BOLETO",
        value: 200.0,
        dueDate: "2026-05-15",
      });

      const result = mockAsaas.listMockPayments();

      expect(result.totalCount).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it("should filter payments by status", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      const payment1 = mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      mockAsaas.updateMockPaymentStatus(payment1.id, "RECEIVED");

      mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 50.0,
        dueDate: "2026-05-15",
      });

      const pending = mockAsaas.listMockPayments({ status: "PENDING" });
      const received = mockAsaas.listMockPayments({ status: "RECEIVED" });

      expect(pending.totalCount).toBe(1);
      expect(received.totalCount).toBe(1);
    });

    it("should filter payments by billing type", () => {
      const customer = mockAsaas.createMockCustomer({
        name: "João",
        email: "joao@example.com",
      });

      mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "PIX",
        value: 100.0,
        dueDate: "2026-04-30",
      });

      mockAsaas.createMockPayment({
        customer: customer.id,
        billingType: "BOLETO",
        value: 200.0,
        dueDate: "2026-05-15",
      });

      const pixPayments = mockAsaas.listMockPayments({ billingType: "PIX" });
      const boletoPayments = mockAsaas.listMockPayments({ billingType: "BOLETO" });

      expect(pixPayments.totalCount).toBe(1);
      expect(boletoPayments.totalCount).toBe(1);
    });
  });
});
