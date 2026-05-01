/**
 * Billing Automation Tests
 * Tests for billing schedule, notifications, and payments
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createBillingSchedule,
  getBillingsDueForReminder,
  getOverdueBillings,
  getMoradorBillingStats,
  daysUntilDue,
  isDueForReminder,
  isOverdue,
  formatBillingStatus,
} from "@/server/_core/billing-schedule-db";
import {
  generatePixPayment,
  generateBoletoPayment,
  generateBankTransferPayment,
  formatPixPayment,
  formatBoletoPayment,
  formatBankTransferPayment,
} from "@/server/_core/billing-asaas-integration";
import {
  sendBillingReminders,
  sendOverdueNotifications,
  formatBillingReminderMessage,
  formatOverdueNoticeMessage,
} from "@/server/_core/billing-notification-service";

describe("Billing Automation", () => {
  describe("Billing Schedule Database", () => {
    it("should create a billing schedule", async () => {
      const billing = await createBillingSchedule({
        moradorId: 1,
        dueDate: new Date("2026-05-15"),
        amount: 500,
        description: "Taxa de Condomínio - Maio/2026",
      });

      expect(billing).toBeDefined();
      expect(billing.moradorId).toBe(1);
      expect(billing.amount).toBe(500);
      expect(billing.status).toBe("pending");
    });

    it("should calculate days until due correctly", () => {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const days = daysUntilDue(threeDaysLater);
      expect(days).toBe(3);
    });

    it("should identify billing due for reminder", () => {
      const now = new Date();
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      expect(isDueForReminder(threeDaysLater)).toBe(true);
    });

    it("should identify overdue billing", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(isOverdue(yesterday)).toBe(true);
    });

    it("should format billing status correctly", () => {
      expect(formatBillingStatus("pending")).toBe("Pendente");
      expect(formatBillingStatus("paid")).toBe("Pago");
      expect(formatBillingStatus("overdue")).toBe("Atrasado");
      expect(formatBillingStatus("cancelled")).toBe("Cancelado");
    });

    it("should get morador billing statistics", async () => {
      const stats = await getMoradorBillingStats(1);

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.paid).toBeGreaterThanOrEqual(0);
      expect(stats.overdue).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Asaas Payment Integration", () => {
    it("should format PIX payment correctly", () => {
      const payment = {
        method: "pix" as const,
        billingId: 1,
        customerId: "COND-1",
        paymentId: "PAY-123",
        amount: 500,
        dueDate: new Date("2026-05-15"),
        status: "generated" as const,
        pixQrCode: "00020126580014br.gov.bcb.pix...",
        pixCopyPaste: "00020126580014br.gov.bcb.pix...",
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      const formatted = formatPixPayment(payment);

      expect(formatted).toContain("PIX");
      expect(formatted).toContain("R$ 500.00");
      expect(formatted).toContain("QR Code");
      expect(formatted).toContain("copie e cole");
    });

    it("should format Boleto payment correctly", () => {
      const payment = {
        method: "boleto" as const,
        billingId: 1,
        customerId: "COND-1",
        paymentId: "PAY-123",
        amount: 500,
        dueDate: new Date("2026-05-15"),
        status: "generated" as const,
        boletoBarcode: "12345.67890 12345.678901 12345.678901 1 12345678901234",
        boletoUrl: "https://asaas.com/boleto/123",
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      const formatted = formatBoletoPayment(payment);

      expect(formatted).toContain("Boleto");
      expect(formatted).toContain("R$ 500.00");
      expect(formatted).toContain("Código de Barras");
      expect(formatted).toContain("12345.67890");
    });

    it("should format Bank Transfer payment correctly", () => {
      const payment = {
        method: "transfer" as const,
        billingId: 1,
        customerId: "COND-1",
        paymentId: "PAY-123",
        amount: 500,
        dueDate: new Date("2026-05-15"),
        status: "generated" as const,
        bankDetails: {
          bank: "Banco do Brasil",
          accountNumber: "123456-7",
          accountType: "Conta Corrente",
          accountHolder: "Condomínio Rua ABC",
        },
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      const formatted = formatBankTransferPayment(payment);

      expect(formatted).toContain("Transferência Bancária");
      expect(formatted).toContain("R$ 500.00");
      expect(formatted).toContain("Banco do Brasil");
      expect(formatted).toContain("123456-7");
    });
  });

  describe("Billing Notifications", () => {
    it("should format billing reminder message correctly", () => {
      const message = formatBillingReminderMessage(
        "João Silva",
        500,
        new Date("2026-05-15"),
        3
      );

      expect(message).toContain("João Silva");
      expect(message).toContain("3 dia(s)");
      expect(message).toContain("R$ 500.00");
      expect(message).toContain("PIX");
      expect(message).toContain("Boleto");
    });

    it("should format overdue notice message correctly", () => {
      const message = formatOverdueNoticeMessage(
        "João Silva",
        500,
        new Date("2026-05-15"),
        5
      );

      expect(message).toContain("João Silva");
      expect(message).toContain("ATRASADA");
      expect(message).toContain("5 dia(s)");
      expect(message).toContain("R$ 500.00");
    });

    it("should send billing reminders", async () => {
      const result = await sendBillingReminders();

      expect(result).toBeDefined();
      expect(result.sent).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should send overdue notifications", async () => {
      const result = await sendOverdueNotifications();

      expect(result).toBeDefined();
      expect(result.sent).toBeGreaterThanOrEqual(0);
      expect(result.failed).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe("Billing Workflow", () => {
    it("should complete full billing workflow", async () => {
      // 1. Create billing
      const billing = await createBillingSchedule({
        moradorId: 1,
        dueDate: new Date("2026-05-15"),
        amount: 500,
        description: "Taxa de Condomínio - Maio/2026",
      });

      expect(billing).toBeDefined();
      expect(billing.status).toBe("pending");

      // 2. Check if due for reminder
      const dueForReminder = isDueForReminder(billing.dueDate);
      expect(typeof dueForReminder).toBe("boolean");

      // 3. Get stats
      const stats = await getMoradorBillingStats(billing.moradorId);
      expect(stats.pending).toBeGreaterThan(0);
      expect(stats.pendingAmount).toBeGreaterThan(0);

      // 4. Format notification message
      const message = formatBillingReminderMessage(
        "João Silva",
        billing.amount,
        billing.dueDate,
        daysUntilDue(billing.dueDate)
      );

      expect(message).toContain("João Silva");
      expect(message).toContain(billing.amount.toFixed(2));
    });

    it("should handle multiple billings per morador", async () => {
      // Create multiple billings
      const billing1 = await createBillingSchedule({
        moradorId: 2,
        dueDate: new Date("2026-05-15"),
        amount: 500,
        description: "Taxa de Condomínio - Maio/2026",
      });

      const billing2 = await createBillingSchedule({
        moradorId: 2,
        dueDate: new Date("2026-06-15"),
        amount: 500,
        description: "Taxa de Condomínio - Junho/2026",
      });

      expect(billing1.id).not.toBe(billing2.id);

      // Get stats
      const stats = await getMoradorBillingStats(2);
      expect(stats.pending).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle billing with zero days until due", () => {
      const now = new Date();
      const days = daysUntilDue(now);
      expect(days).toBeLessThanOrEqual(1);
    });

    it("should handle billing far in the future", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);

      const days = daysUntilDue(future);
      expect(days).toBeGreaterThan(300);
    });

    it("should handle very old overdue billings", () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);

      expect(isOverdue(past)).toBe(true);
      const days = daysUntilDue(past);
      expect(days).toBeLessThan(-300);
    });

    it("should handle billing status formatting with unknown status", () => {
      const formatted = formatBillingStatus("unknown");
      expect(formatted).toBe("unknown");
    });
  });
});
