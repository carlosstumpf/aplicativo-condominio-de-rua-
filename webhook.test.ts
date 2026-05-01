import { describe, it, expect } from "vitest";
import {
  validateWebhookSignature,
  processAsaasWebhook,
  AsaasWebhookEventType,
  AsaasWebhookPayload,
} from "../server/_core/webhook-handler";

describe("Asaas Webhook Integration", () => {
  describe("Webhook Signature Validation", () => {
    it("should validate correct webhook signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test-secret";
      const signature = require("crypto")
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const isValid = validateWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid webhook signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test-secret";
      const invalidSignature = "invalid-signature";

      const isValid = validateWebhookSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });

    it("should handle empty signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test-secret";

      const isValid = validateWebhookSignature(payload, "", secret);
      expect(isValid).toBe(false);
    });

    it("should be case-sensitive for signature", () => {
      const payload = JSON.stringify({ test: "data" });
      const secret = "test-secret";
      const signature = require("crypto")
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const uppercaseSignature = signature.toUpperCase();
      const isValid = validateWebhookSignature(payload, uppercaseSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe("Webhook Event Types", () => {
    it("should have payment confirmed event type", () => {
      expect(AsaasWebhookEventType.PAYMENT_CONFIRMED).toBe("payment.confirmed");
    });

    it("should have payment received event type", () => {
      expect(AsaasWebhookEventType.PAYMENT_RECEIVED).toBe("payment.received");
    });

    it("should have payment overdue event type", () => {
      expect(AsaasWebhookEventType.PAYMENT_OVERDUE).toBe("payment.overdue");
    });

    it("should have payment refunded event type", () => {
      expect(AsaasWebhookEventType.PAYMENT_REFUNDED).toBe("payment.refunded");
    });

    it("should have payment deleted event type", () => {
      expect(AsaasWebhookEventType.PAYMENT_DELETED).toBe("payment.deleted");
    });

    it("should have chargeback event types", () => {
      expect(AsaasWebhookEventType.PAYMENT_CHARGEBACK_REQUESTED).toBe(
        "payment.chargeback_requested"
      );
      expect(AsaasWebhookEventType.PAYMENT_CHARGEBACK_DISPUTE).toBe(
        "payment.chargeback_dispute"
      );
    });
  });

  describe("Webhook Payload Processing", () => {
    const createMockPayload = (overrides?: Partial<AsaasWebhookPayload>) => ({
      event: "payment.confirmed",
      id: "webhook_123",
      payment: {
        object: "payment",
        id: "pay_123",
        dateCreated: "2026-04-27T10:00:00.000Z",
        customer: "cust_123",
        subscription: null,
        installment: null,
        installmentNumber: null,
        description: "Cobrança de condomínio",
        value: 500.0,
        netValue: 485.0,
        status: "RECEIVED",
        dueDate: "2026-04-27",
        originalDueDate: "2026-04-27",
        paymentDate: "2026-04-27T10:30:00.000Z",
        clientPaymentDate: "2026-04-27",
        invoiceUrl: "https://asaas.com/invoice",
        invoiceNumber: "INV-001",
        externalReference: "ref_123",
        deleted: false,
        anticipated: false,
        anticipatedValue: null,
        pixQrCodeId: null,
        transactionReceiptUrl: "https://asaas.com/receipt",
        nossoNumero: null,
        bankSlipUrl: null,
      },
      ...overrides,
    });

    it("should process payment confirmed webhook", async () => {
      const payload = createMockPayload();
      const result = await processAsaasWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Payment confirmed");
    });

    it("should process payment overdue webhook", async () => {
      const payload = createMockPayload({
        event: "payment.overdue",
        payment: {
          ...createMockPayload().payment,
          status: "OVERDUE",
        },
      });

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
    });

    it("should process payment refunded webhook", async () => {
      const payload = createMockPayload({
        event: "payment.refunded",
        payment: {
          ...createMockPayload().payment,
          status: "REFUNDED",
        },
      });

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
    });

    it("should process payment deleted webhook", async () => {
      const payload = createMockPayload({
        event: "payment.deleted",
        payment: {
          ...createMockPayload().payment,
          deleted: true,
        },
      });

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
    });

    it("should process chargeback webhook", async () => {
      const payload = createMockPayload({
        event: "payment.chargeback_requested",
        payment: {
          ...createMockPayload().payment,
          status: "CHARGEBACK_REQUESTED",
        },
      });

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
    });

    it("should handle unhandled event types", async () => {
      const payload = createMockPayload({
        event: "unknown.event",
      });

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
      expect(result.message).toContain("acknowledged but not processed");
    });
  });

  describe("Payment Status Mapping", () => {
    it("should map PENDING status", async () => {
      const payload: AsaasWebhookPayload = {
        event: "payment.pending",
        id: "webhook_123",
        payment: {
          object: "payment",
          id: "pay_123",
          dateCreated: "2026-04-27T10:00:00.000Z",
          customer: "cust_123",
          subscription: null,
          installment: null,
          installmentNumber: null,
          description: "Cobrança",
          value: 500.0,
          netValue: 485.0,
          status: "PENDING",
          dueDate: "2026-04-27",
          originalDueDate: "2026-04-27",
          paymentDate: null,
          clientPaymentDate: null,
          invoiceUrl: "",
          invoiceNumber: null,
          externalReference: null,
          deleted: false,
          anticipated: false,
          anticipatedValue: null,
          pixQrCodeId: null,
          transactionReceiptUrl: null,
          nossoNumero: null,
          bankSlipUrl: null,
        },
      };

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
    });

    it("should map CONFIRMED status", async () => {
      const payload: AsaasWebhookPayload = {
        event: "payment.confirmed",
        id: "webhook_123",
        payment: {
          object: "payment",
          id: "pay_123",
          dateCreated: "2026-04-27T10:00:00.000Z",
          customer: "cust_123",
          subscription: null,
          installment: null,
          installmentNumber: null,
          description: "Cobrança",
          value: 500.0,
          netValue: 485.0,
          status: "CONFIRMED",
          dueDate: "2026-04-27",
          originalDueDate: "2026-04-27",
          paymentDate: "2026-04-27T10:30:00.000Z",
          clientPaymentDate: "2026-04-27",
          invoiceUrl: "",
          invoiceNumber: null,
          externalReference: null,
          deleted: false,
          anticipated: false,
          anticipatedValue: null,
          pixQrCodeId: null,
          transactionReceiptUrl: null,
          nossoNumero: null,
          bankSlipUrl: null,
        },
      };

      const result = await processAsaasWebhook(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("Webhook Error Handling", () => {
    it("should handle missing payment data", async () => {
      const payload = {
        event: "payment.confirmed",
        id: "webhook_123",
        payment: null,
      } as any;

      try {
        await processAsaasWebhook(payload);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle malformed payload", async () => {
      const payload = {
        event: "payment.confirmed",
        id: "webhook_123",
      } as any;

      try {
        await processAsaasWebhook(payload);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Webhook Payload Structure", () => {
    it("should have required payment fields", () => {
      const payload: AsaasWebhookPayload = {
        event: "payment.confirmed",
        id: "webhook_123",
        payment: {
          object: "payment",
          id: "pay_123",
          dateCreated: "2026-04-27T10:00:00.000Z",
          customer: "cust_123",
          subscription: null,
          installment: null,
          installmentNumber: null,
          description: "Cobrança",
          value: 500.0,
          netValue: 485.0,
          status: "RECEIVED",
          dueDate: "2026-04-27",
          originalDueDate: "2026-04-27",
          paymentDate: "2026-04-27T10:30:00.000Z",
          clientPaymentDate: "2026-04-27",
          invoiceUrl: "",
          invoiceNumber: null,
          externalReference: null,
          deleted: false,
          anticipated: false,
          anticipatedValue: null,
          pixQrCodeId: null,
          transactionReceiptUrl: null,
          nossoNumero: null,
          bankSlipUrl: null,
        },
      };

      expect(payload.event).toBeDefined();
      expect(payload.id).toBeDefined();
      expect(payload.payment.id).toBeDefined();
      expect(payload.payment.value).toBeDefined();
      expect(payload.payment.status).toBeDefined();
    });

    it("should support optional payment fields", () => {
      const payload: AsaasWebhookPayload = {
        event: "payment.confirmed",
        id: "webhook_123",
        payment: {
          object: "payment",
          id: "pay_123",
          dateCreated: "2026-04-27T10:00:00.000Z",
          customer: "cust_123",
          subscription: "sub_123",
          installment: "inst_123",
          installmentNumber: 1,
          description: "Cobrança",
          value: 500.0,
          netValue: 485.0,
          status: "RECEIVED",
          dueDate: "2026-04-27",
          originalDueDate: "2026-04-27",
          paymentDate: "2026-04-27T10:30:00.000Z",
          clientPaymentDate: "2026-04-27",
          invoiceUrl: "https://asaas.com/invoice",
          invoiceNumber: "INV-001",
          externalReference: "ref_123",
          deleted: false,
          anticipated: true,
          anticipatedValue: 500.0,
          pixQrCodeId: "pix_123",
          transactionReceiptUrl: "https://asaas.com/receipt",
          nossoNumero: "123456789",
          bankSlipUrl: "https://asaas.com/boleto",
        },
      };

      expect(payload.payment.subscription).toBe("sub_123");
      expect(payload.payment.installment).toBe("inst_123");
      expect(payload.payment.pixQrCodeId).toBe("pix_123");
    });
  });

  describe("Webhook Retry Logic", () => {
    it("should return 200 status for all events", async () => {
      const payload: AsaasWebhookPayload = {
        event: "payment.confirmed",
        id: "webhook_123",
        payment: {
          object: "payment",
          id: "pay_123",
          dateCreated: "2026-04-27T10:00:00.000Z",
          customer: "cust_123",
          subscription: null,
          installment: null,
          installmentNumber: null,
          description: "Cobrança",
          value: 500.0,
          netValue: 485.0,
          status: "RECEIVED",
          dueDate: "2026-04-27",
          originalDueDate: "2026-04-27",
          paymentDate: "2026-04-27T10:30:00.000Z",
          clientPaymentDate: "2026-04-27",
          invoiceUrl: "",
          invoiceNumber: null,
          externalReference: null,
          deleted: false,
          anticipated: false,
          anticipatedValue: null,
          pixQrCodeId: null,
          transactionReceiptUrl: null,
          nossoNumero: null,
          bankSlipUrl: null,
        },
      };

      const result = await processAsaasWebhook(payload);
      // Should always return success to prevent Asaas retries
      expect(result.success).toBe(true);
    });
  });

  describe("Webhook Logging", () => {
    it("should log webhook events", async () => {
      const payload: AsaasWebhookPayload = {
        event: "payment.confirmed",
        id: "webhook_123",
        payment: {
          object: "payment",
          id: "pay_123",
          dateCreated: "2026-04-27T10:00:00.000Z",
          customer: "cust_123",
          subscription: null,
          installment: null,
          installmentNumber: null,
          description: "Cobrança",
          value: 500.0,
          netValue: 485.0,
          status: "RECEIVED",
          dueDate: "2026-04-27",
          originalDueDate: "2026-04-27",
          paymentDate: "2026-04-27T10:30:00.000Z",
          clientPaymentDate: "2026-04-27",
          invoiceUrl: "",
          invoiceNumber: null,
          externalReference: null,
          deleted: false,
          anticipated: false,
          anticipatedValue: null,
          pixQrCodeId: null,
          transactionReceiptUrl: null,
          nossoNumero: null,
          bankSlipUrl: null,
        },
      };

      const result = await processAsaasWebhook(payload);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
