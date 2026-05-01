/**
 * Asaas Webhook Database Integration Tests
 * Tests for database operations triggered by webhooks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mapAsaasStatusToCobrancaStatus,
  handlePaymentStatusUpdate,
  handlePaymentNotification,
  processWebhookWithDatabase,
} from "../server/_core/asaas-webhook-db";
import * as dbQueries from "../server/db-queries";

// Mock the database queries
vi.mock("../server/db-queries", () => ({
  getCobrancaByAsaasId: vi.fn(),
  updateCobrancaStatus: vi.fn(),
  getMoradorById: vi.fn(),
  createNotificacao: vi.fn(),
}));

describe("Asaas Webhook Database Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Status Mapping", () => {
    it("should map PENDING to PENDING", () => {
      const status = mapAsaasStatusToCobrancaStatus("PENDING");
      expect(status).toBe("PENDING");
    });

    it("should map CONFIRMED to PENDING", () => {
      const status = mapAsaasStatusToCobrancaStatus("CONFIRMED");
      expect(status).toBe("PENDING");
    });

    it("should map RECEIVED to RECEIVED", () => {
      const status = mapAsaasStatusToCobrancaStatus("RECEIVED");
      expect(status).toBe("RECEIVED");
    });

    it("should map OVERDUE to OVERDUE", () => {
      const status = mapAsaasStatusToCobrancaStatus("OVERDUE");
      expect(status).toBe("OVERDUE");
    });

    it("should map REFUNDED to CANCELLED", () => {
      const status = mapAsaasStatusToCobrancaStatus("REFUNDED");
      expect(status).toBe("CANCELLED");
    });

    it("should map DELETED to CANCELLED", () => {
      const status = mapAsaasStatusToCobrancaStatus("DELETED");
      expect(status).toBe("CANCELLED");
    });

    it("should map chargeback statuses", () => {
      expect(mapAsaasStatusToCobrancaStatus("CHARGEBACK_REQUESTED")).toBe("OVERDUE");
      expect(mapAsaasStatusToCobrancaStatus("CHARGEBACK_DISPUTE")).toBe("OVERDUE");
      expect(mapAsaasStatusToCobrancaStatus("CHARGEBACK_REVERSAL")).toBe("RECEIVED");
    });

    it("should handle unknown status", () => {
      const status = mapAsaasStatusToCobrancaStatus("UNKNOWN");
      expect(status).toBe("UNKNOWN");
    });
  });

  describe("Payment Status Update", () => {
    it("should update payment status successfully", async () => {
      const mockCobranca = {
        id: 1,
        asaasPaymentId: "pay_123",
        moradorId: 1,
        status: "PENDING" as const,
        valor: 15000,
        vencimento: "2026-05-15",
        telefone: "(11) 99999-9999",
        tipo: "PIX" as const,
        mesReferencia: "2026-05",
        descricao: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue(mockCobranca);
      vi.mocked(dbQueries.updateCobrancaStatus).mockResolvedValue({} as any);

      const result = await handlePaymentStatusUpdate("pay_123", "RECEIVED");

      expect(result.success).toBe(true);
      expect(result.cobranca?.status).toBe("RECEIVED");
      expect(dbQueries.updateCobrancaStatus).toHaveBeenCalledWith("pay_123", "RECEIVED");
    });

    it("should handle cobranca not found", async () => {
      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue(undefined as any);

      const result = await handlePaymentStatusUpdate("pay_invalid", "RECEIVED");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should skip update if status unchanged", async () => {
      const mockCobranca = {
        id: 1,
        asaasPaymentId: "pay_123",
        status: "RECEIVED" as const,
        valor: 15000,
        vencimento: "2026-05-15",
        moradorId: 1,
        telefone: "(11) 99999-9999",
        tipo: "PIX" as const,
        mesReferencia: "2026-05",
        descricao: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue(mockCobranca);

      const result = await handlePaymentStatusUpdate("pay_123", "RECEIVED");

      expect(result.success).toBe(true);
      expect(dbQueries.updateCobrancaStatus).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const mockCobranca = {
        id: 1,
        asaasPaymentId: "pay_123",
        status: "PENDING" as const,
        valor: 15000,
        moradorId: 1,
        telefone: "(11) 99999-9999",
        tipo: "PIX" as const,
        mesReferencia: "2026-05",
        vencimento: "2026-05-15",
        descricao: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue(mockCobranca);
      vi.mocked(dbQueries.updateCobrancaStatus).mockRejectedValue(
        new Error("Database error")
      );

      const result = await handlePaymentStatusUpdate("pay_123", "RECEIVED");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database error");
    });
  });

  describe("Payment Notification Creation", () => {
    beforeEach(() => {
      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue({
        id: 1,
        asaasPaymentId: "pay_123",
        moradorId: 1,
        valor: 15000,
        vencimento: "2026-05-15",
        telefone: "(11) 99999-9999",
        tipo: "PIX" as const,
        mesReferencia: "2026-05",
        status: "PENDING" as const,
        descricao: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      vi.mocked(dbQueries.getMoradorById).mockResolvedValue({
        id: 1,
        userId: 10,
        nomeCompleto: "João Silva",
        telefone: "(11) 99999-9999",
        cpf: "123.456.789-00",
        identificacaoCasa: "Casa 1",
        statusAtivo: 1,
        asaasCustomerId: "cus_123",
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      vi.mocked(dbQueries.createNotificacao).mockResolvedValue({
        id: 100,
        userId: 10,
        tipo: "PAGAMENTO",
        titulo: "Pagamento Confirmado",
        mensagem: "Pagamento de R$ 150,00 foi confirmado com sucesso",
        lida: false,
      });
    });

    it("should create notification for payment.received event", async () => {
      const result = await handlePaymentNotification("pay_123", "payment.received");

      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(dbQueries.createNotificacao).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          tipo: "PAGAMENTO",
          titulo: "Pagamento Confirmado",
        })
      );
    });

    it("should create notification for payment.overdue event", async () => {
      const result = await handlePaymentNotification("pay_123", "payment.overdue");

      expect(result.success).toBe(true);
      expect(dbQueries.createNotificacao).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "VENCIMENTO",
          titulo: "Cobrança Vencida",
        })
      );
    });

    it("should create notification for payment.refunded event", async () => {
      const result = await handlePaymentNotification("pay_123", "payment.refunded");

      expect(result.success).toBe(true);
      expect(dbQueries.createNotificacao).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "PAGAMENTO",
          titulo: "Pagamento Reembolsado",
        })
      );
    });

    it("should handle cobranca not found", async () => {
      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue(undefined as any);

      const result = await handlePaymentNotification("pay_invalid", "payment.received");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should handle morador not found", async () => {
      vi.mocked(dbQueries.getMoradorById).mockResolvedValue(undefined as any);

      const result = await handlePaymentNotification("pay_123", "payment.received");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Morador not found");
    });

    it("should skip notification if morador has no userId", async () => {
      vi.mocked(dbQueries.getMoradorById).mockResolvedValue({
        id: 1,
        userId: null,
        nomeCompleto: "João Silva",
        telefone: "(11) 99999-9999",
        cpf: "123.456.789-00",
        identificacaoCasa: "Casa 1",
        statusAtivo: 1,
        asaasCustomerId: "cus_123",
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      const result = await handlePaymentNotification("pay_123", "payment.received");

      expect(result.success).toBe(true);
      expect(result.notification).toBeNull();
      expect(dbQueries.createNotificacao).not.toHaveBeenCalled();
    });

    it("should handle database errors when creating notification", async () => {
      vi.mocked(dbQueries.createNotificacao).mockRejectedValue(
        new Error("Database error")
      );

      const result = await handlePaymentNotification("pay_123", "payment.received");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database error");
    });
  });

  describe("Complete Webhook Processing", () => {
    beforeEach(() => {
      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue({
        id: 1,
        asaasPaymentId: "pay_123",
        moradorId: 1,
        valor: 15000,
        status: "PENDING" as const,
        vencimento: "2026-05-15",
        telefone: "(11) 99999-9999",
        tipo: "PIX" as const,
        mesReferencia: "2026-05",
        descricao: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      vi.mocked(dbQueries.getMoradorById).mockResolvedValue({
        id: 1,
        userId: 10,
        nomeCompleto: "João Silva",
        telefone: "(11) 99999-9999",
        cpf: "123.456.789-00",
        identificacaoCasa: "Casa 1",
        statusAtivo: 1,
        asaasCustomerId: "cus_123",
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      vi.mocked(dbQueries.updateCobrancaStatus).mockResolvedValue({} as any);
      vi.mocked(dbQueries.createNotificacao).mockResolvedValue({
        id: 100,
        userId: 10,
        tipo: "PAGAMENTO",
      });
    });

    it("should process webhook successfully", async () => {
      const result = await processWebhookWithDatabase(
        "pay_123",
        "payment.received",
        "RECEIVED"
      );

      expect(result.success).toBe(true);
      expect(result.statusUpdated).toBe(true);
      expect(result.notificationCreated).toBe(true);
    });

    it("should handle partial failures", async () => {
      vi.mocked(dbQueries.createNotificacao).mockRejectedValue(
        new Error("Notification error")
      );

      const result = await processWebhookWithDatabase(
        "pay_123",
        "payment.received",
        "RECEIVED"
      );

      expect(result.statusUpdated).toBe(true);
      expect(result.notificationCreated).toBe(false);
    });

    it("should handle complete failure", async () => {
      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue(undefined as any);

      const result = await processWebhookWithDatabase(
        "pay_invalid",
        "payment.received",
        "RECEIVED"
      );

      expect(result.success).toBe(false);
      expect(result.statusUpdated).toBe(false);
      expect(result.notificationCreated).toBe(false);
    });
  });

  describe("Notification Messages", () => {
    beforeEach(() => {
      vi.mocked(dbQueries.getCobrancaByAsaasId).mockResolvedValue({
        id: 1,
        asaasPaymentId: "pay_123",
        moradorId: 1,
        valor: 25000, // R$ 250,00
        vencimento: "2026-05-15",
        telefone: "(11) 99999-9999",
        tipo: "PIX" as const,
        mesReferencia: "2026-05",
        status: "PENDING" as const,
        descricao: null,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      vi.mocked(dbQueries.getMoradorById).mockResolvedValue({
        id: 1,
        userId: 10,
        nomeCompleto: "João Silva",
        telefone: "(11) 99999-9999",
        cpf: "123.456.789-00",
        identificacaoCasa: "Casa 1",
        statusAtivo: 1,
        asaasCustomerId: "cus_123",
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      } as any);

      vi.mocked(dbQueries.createNotificacao).mockResolvedValue({
        id: 100,
        userId: 10,
      });
    });

    it("should format currency correctly in notifications", async () => {
      await handlePaymentNotification("pay_123", "payment.received");

      const callArgs = vi.mocked(dbQueries.createNotificacao).mock.calls[0][0];
      expect(callArgs.mensagem).toContain("R$");
      expect(callArgs.mensagem).toContain("250");
    });

    it("should include vencimento date in overdue notification", async () => {
      await handlePaymentNotification("pay_123", "payment.overdue");

      const callArgs = vi.mocked(dbQueries.createNotificacao).mock.calls[0][0];
      expect(callArgs.mensagem).toContain("2026-05-15");
    });

    it("should set correct notification type for each event", async () => {
      const events = [
        { event: "payment.received", expectedType: "PAGAMENTO" },
        { event: "payment.overdue", expectedType: "VENCIMENTO" },
        { event: "payment.refunded", expectedType: "PAGAMENTO" },
        { event: "payment.deleted", expectedType: "PAGAMENTO" },
      ];

      for (const { event, expectedType } of events) {
        vi.mocked(dbQueries.createNotificacao).mockClear();
        await handlePaymentNotification("pay_123", event as any);

        const callArgs = vi.mocked(dbQueries.createNotificacao).mock.calls[0][0];
        expect(callArgs.tipo).toBe(expectedType);
      }
    });
  });
});
