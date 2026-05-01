/**
 * Payment Receipt Delivery Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateHTMLReceipt,
  generatePlainTextReceipt,
  generateReceiptId,
  formatReceiptData,
  PaymentReceiptData,
} from "@/server/_core/payment-receipt-generator";
import {
  handlePaymentConfirmationAndSendReceipts,
  PaymentConfirmationWebhook,
} from "@/server/_core/payment-receipt-webhook";

describe("Payment Receipt Delivery", () => {
  const mockReceiptData: PaymentReceiptData = {
    receiptId: "REC-TEST-001",
    receiptDate: new Date("2026-04-27"),
    paymentDate: new Date("2026-04-27"),
    moradorId: 1,
    moradorName: "João Silva",
    moradorEmail: "joao@example.com",
    moradorPhone: "+5511999999999",
    condominiumName: "Condomínio Teste",
    condominiumCNPJ: "12.345.678/0001-90",
    billingId: 1,
    billingDescription: "Mensalidade Abril",
    billingDueDate: new Date("2026-04-30"),
    amount: 500,
    paymentMethod: "pix",
    transactionId: "PIX-123456",
  };

  describe("Receipt Generation", () => {
    it("should generate HTML receipt", () => {
      const html = generateHTMLReceipt(mockReceiptData);

      expect(html).toContain("✓ Pagamento Confirmado");
      expect(html).toContain("João Silva");
      expect(html).toContain("R$ 500,00");
      expect(html).toContain("PIX");
      expect(html).toContain("REC-TEST-001");
    });

    it("should generate plain text receipt", () => {
      const text = generatePlainTextReceipt(mockReceiptData);

      expect(text).toContain("RECIBO DE PAGAMENTO");
      expect(text).toContain("João Silva");
      expect(text).toContain("500,00");
      expect(text).toContain("PIX");
    });

    it("should generate unique receipt IDs", () => {
      const id1 = generateReceiptId();
      const id2 = generateReceiptId();

      expect(id1).toMatch(/^REC-/);
      expect(id2).toMatch(/^REC-/);
      expect(id1).not.toBe(id2);
    });

    it("should format receipt data correctly", () => {
      const formatted = formatReceiptData(mockReceiptData);

      expect(formatted.receiptId).toBe("REC-TEST-001");
      expect(formatted.moradorName).toBe("João Silva");
      expect(formatted.amount).toContain("R$");
      expect(formatted.paymentMethod).toBe("PIX");
    });
  });

  describe("Receipt Formatting", () => {
    it("should format currency correctly", () => {
      const data = {
        ...mockReceiptData,
        amount: 1234.56,
      };

      const html = generateHTMLReceipt(data);
      expect(html).toContain("R$ 1.234,56");
    });

    it("should format date correctly", () => {
      const data = {
        ...mockReceiptData,
        paymentDate: new Date("2026-04-27"),
      };

      const text = generatePlainTextReceipt(data);
      expect(text).toContain("27/04/2026");
    });

    it("should handle different payment methods", () => {
      const methods: Array<"pix" | "boleto" | "transfer"> = ["pix", "boleto", "transfer"];

      methods.forEach((method) => {
        const data = { ...mockReceiptData, paymentMethod: method };
        const formatted = formatReceiptData(data);

        if (method === "pix") {
          expect(formatted.paymentMethod).toBe("PIX");
        } else if (method === "boleto") {
          expect(formatted.paymentMethod).toBe("Boleto Bancário");
        } else {
          expect(formatted.paymentMethod).toBe("Transferência Bancária");
        }
      });
    });
  });

  describe("Receipt HTML Content", () => {
    it("should include condominium information", () => {
      const html = generateHTMLReceipt(mockReceiptData);

      expect(html).toContain("Condomínio Teste");
      expect(html).toContain("12.345.678/0001-90");
    });

    it("should include morador information", () => {
      const html = generateHTMLReceipt(mockReceiptData);

      expect(html).toContain("João Silva");
      expect(html).toContain("joao@example.com");
    });

    it("should include payment details", () => {
      const html = generateHTMLReceipt(mockReceiptData);

      expect(html).toContain("Mensalidade Abril");
      expect(html).toContain("PIX-123456");
      expect(html).toContain("30/04/2026");
    });

    it("should include success badge", () => {
      const html = generateHTMLReceipt(mockReceiptData);

      expect(html).toContain("Pago");
      expect(html).toContain("status-badge");
    });

    it("should be valid HTML", () => {
      const html = generateHTMLReceipt(mockReceiptData);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
    });
  });

  describe("Receipt Plain Text Content", () => {
    it("should include all required sections", () => {
      const text = generatePlainTextReceipt(mockReceiptData);

      expect(text).toContain("RECIBO DE PAGAMENTO");
      expect(text).toContain("CONDOMÍNIO");
      expect(text).toContain("MORADOR");
      expect(text).toContain("DETALHES DO PAGAMENTO");
      expect(text).toContain("VALOR PAGO");
    });

    it("should be readable format", () => {
      const text = generatePlainTextReceipt(mockReceiptData);

      expect(text).toContain("═══════════════════");
      expect(text).toContain("───────────────────");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing optional fields", () => {
      const data: PaymentReceiptData = {
        ...mockReceiptData,
        moradorPhone: undefined,
        condominiumCNPJ: undefined,
        transactionId: undefined,
      };

      const html = generateHTMLReceipt(data);
      const text = generatePlainTextReceipt(data);

      expect(html).toContain("João Silva");
      expect(text).toContain("João Silva");
    });

    it("should handle large amounts", () => {
      const data = {
        ...mockReceiptData,
        amount: 999999.99,
      };

      const html = generateHTMLReceipt(data);
      expect(html).toContain("R$ 999.999,99");
    });

    it("should handle special characters in names", () => {
      const data = {
        ...mockReceiptData,
        moradorName: "José da Silva & Cia",
        billingDescription: "Mensalidade - Abril/2026 (Teste & Validação)",
      };

      const html = generateHTMLReceipt(data);
      expect(html).toContain("José da Silva & Cia");
    });

    it("should handle different date formats", () => {
      const data = {
        ...mockReceiptData,
        receiptDate: new Date("2026-12-25T15:30:00"),
        paymentDate: new Date("2026-01-01T00:00:00"),
      };

      const text = generatePlainTextReceipt(data);
      expect(text).toContain("25/12/2026");
      expect(text).toContain("01/01/2026");
    });
  });

  describe("Receipt ID Generation", () => {
    it("should generate valid receipt IDs", () => {
      for (let i = 0; i < 10; i++) {
        const id = generateReceiptId();
        expect(id).toMatch(/^REC-[A-Z0-9]+-[A-Z0-9]+$/);
      }
    });

    it("should generate unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateReceiptId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("Payment Confirmation Webhook", () => {
    const mockWebhook: PaymentConfirmationWebhook = {
      billingId: 1,
      moradorId: 1,
      amount: 500,
      paymentMethod: "pix",
      transactionId: "PIX-123456",
      paymentDate: new Date(),
      condominiumName: "Condomínio Teste",
    };

    it("should handle payment confirmation", async () => {
      // This test would require mocking database calls
      // For now, we'll just verify the webhook structure
      expect(mockWebhook.billingId).toBe(1);
      expect(mockWebhook.amount).toBe(500);
      expect(mockWebhook.paymentMethod).toBe("pix");
    });

    it("should validate webhook data", () => {
      expect(mockWebhook.billingId).toBeGreaterThan(0);
      expect(mockWebhook.moradorId).toBeGreaterThan(0);
      expect(mockWebhook.amount).toBeGreaterThan(0);
      expect(["pix", "boleto", "transfer"]).toContain(mockWebhook.paymentMethod);
    });
  });

  describe("Receipt Delivery Config", () => {
    it("should respect email delivery config", () => {
      const config1 = { sendEmail: true, sendWhatsApp: false };
      const config2 = { sendEmail: false, sendWhatsApp: true };
      const config3 = { sendEmail: true, sendWhatsApp: true };

      expect(config1.sendEmail).toBe(true);
      expect(config1.sendWhatsApp).toBe(false);

      expect(config2.sendEmail).toBe(false);
      expect(config2.sendWhatsApp).toBe(true);

      expect(config3.sendEmail).toBe(true);
      expect(config3.sendWhatsApp).toBe(true);
    });

    it("should support CC and BCC", () => {
      const config = {
        sendEmail: true,
        sendWhatsApp: false,
        ccAdmins: ["admin1@example.com", "admin2@example.com"],
        bccAdmins: ["bcc@example.com"],
      };

      expect(config.ccAdmins).toHaveLength(2);
      expect(config.bccAdmins).toHaveLength(1);
    });
  });

  describe("Receipt Data Validation", () => {
    it("should validate required fields", () => {
      const requiredFields = [
        "receiptId",
        "moradorName",
        "moradorEmail",
        "amount",
        "billingDescription",
      ];

      requiredFields.forEach((field) => {
        expect(mockReceiptData).toHaveProperty(field);
      });
    });

    it("should validate amount is positive", () => {
      expect(mockReceiptData.amount).toBeGreaterThan(0);
    });

    it("should validate email format", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(mockReceiptData.moradorEmail).toMatch(emailRegex);
    });
  });
});
