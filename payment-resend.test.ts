/**
 * Payment Resend Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  salvarReenvio,
  atualizarStatusReenvio,
  obterHistoricoReenvios,
  obterHistoricoReenviosMorador,
  obterEstatisticasReenvios,
  obterReenviosRecentes,
  obterReenviosFalhados,
} from "@/server/_core/payment-resend-db";

describe("Payment Resend", () => {
  describe("Resend Records", () => {
    it("should save resend record", async () => {
      const result = await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        canal: "WHATSAPP",
        numeroDestinatario: "+55 11 99999-9999",
        motivo: "Morador solicitou",
        adminId: 1,
      });

      expect(result).toBeDefined();
      expect(result?.canal).toBe("WHATSAPP");
      expect(result?.status).toBe("pendente");
      expect(result?.tentativas).toBe(1);
    });

    it("should update resend status", async () => {
      const reenvio = await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        canal: "WHATSAPP",
        numeroDestinatario: "+55 11 99999-9999",
      });

      if (!reenvio) throw new Error("Failed to save resend");

      const updated = await atualizarStatusReenvio(reenvio.id, "enviado");

      expect(updated?.status).toBe("enviado");
      expect(updated?.tentativas).toBeGreaterThan(1);
    });

    it("should track failed resends with error", async () => {
      const reenvio = await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        canal: "EMAIL",
        numeroDestinatario: "test@email.com",
      });

      if (!reenvio) throw new Error("Failed to save resend");

      const updated = await atualizarStatusReenvio(
        reenvio.id,
        "falha",
        "Email inválido"
      );

      expect(updated?.status).toBe("falha");
      expect(updated?.erro).toBe("Email inválido");
    });

    it("should increment tentativas on each update", async () => {
      const reenvio = await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        canal: "SMS",
        numeroDestinatario: "+55 11 99999-9999",
      });

      if (!reenvio) throw new Error("Failed to save resend");

      const initial = reenvio.tentativas;

      await atualizarStatusReenvio(reenvio.id, "pendente");
      await atualizarStatusReenvio(reenvio.id, "pendente");

      const history = await obterHistoricoReenvios("pay_123456");
      const lastRecord = history[history.length - 1];

      expect(lastRecord.tentativas).toBeGreaterThan(initial);
    });
  });

  describe("Resend History", () => {
    it("should get resend history for payment", async () => {
      await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_hist_001",
        canal: "WHATSAPP",
      });

      await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_hist_001",
        canal: "EMAIL",
      });

      const history = await obterHistoricoReenvios("pay_hist_001");

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].asaasPaymentId).toBe("pay_hist_001");
    });

    it("should get resend history for morador", async () => {
      await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_001",
        canal: "WHATSAPP",
      });

      await salvarReenvio({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_002",
        canal: "EMAIL",
      });

      const history = await obterHistoricoReenviosMorador(1, 1);

      expect(history.length).toBeGreaterThanOrEqual(2);
      history.forEach((r) => {
        expect(r.moradorId).toBe(1);
        expect(r.condominioId).toBe(1);
      });
    });

    it("should filter by status", async () => {
      const reenvio1 = await salvarReenvio({
        condominioId: 2,
        moradorId: 1,
        asaasPaymentId: "pay_filter_001",
        canal: "WHATSAPP",
      });

      const reenvio2 = await salvarReenvio({
        condominioId: 2,
        moradorId: 1,
        asaasPaymentId: "pay_filter_002",
        canal: "EMAIL",
      });

      if (reenvio1) await atualizarStatusReenvio(reenvio1.id, "enviado");
      if (reenvio2) await atualizarStatusReenvio(reenvio2.id, "falha");

      const enviados = await obterHistoricoReenviosMorador(2, 1, {
        status: "enviado",
      });

      enviados.forEach((r) => {
        expect(r.status).toBe("enviado");
      });
    });

    it("should filter by canal", async () => {
      await salvarReenvio({
        condominioId: 3,
        moradorId: 1,
        asaasPaymentId: "pay_canal_001",
        canal: "WHATSAPP",
      });

      await salvarReenvio({
        condominioId: 3,
        moradorId: 1,
        asaasPaymentId: "pay_canal_002",
        canal: "EMAIL",
      });

      const whatsappOnly = await obterHistoricoReenviosMorador(3, 1, {
        canal: "WHATSAPP",
      });

      whatsappOnly.forEach((r) => {
        expect(r.canal).toBe("WHATSAPP");
      });
    });

    it("should respect limite parameter", async () => {
      for (let i = 0; i < 5; i++) {
        await salvarReenvio({
          condominioId: 4,
          moradorId: 1,
          asaasPaymentId: `pay_limite_${i}`,
          canal: "WHATSAPP",
        });
      }

      const limited = await obterHistoricoReenviosMorador(4, 1, { limite: 2 });

      expect(limited.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Statistics", () => {
    it("should calculate resend statistics", async () => {
      // Create some resends
      const r1 = await salvarReenvio({
        condominioId: 5,
        moradorId: 1,
        asaasPaymentId: "pay_stat_001",
        canal: "WHATSAPP",
      });

      const r2 = await salvarReenvio({
        condominioId: 5,
        moradorId: 2,
        asaasPaymentId: "pay_stat_002",
        canal: "EMAIL",
      });

      // Update status
      if (r1) await atualizarStatusReenvio(r1.id, "enviado");
      if (r2) await atualizarStatusReenvio(r2.id, "falha");

      const stats = await obterEstatisticasReenvios(5);

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.enviados).toBeGreaterThanOrEqual(1);
      expect(stats.falhas).toBeGreaterThanOrEqual(1);
      expect(stats.taxaSucesso).toBeGreaterThanOrEqual(0);
      expect(stats.taxaSucesso).toBeLessThanOrEqual(100);
    });

    it("should group by canal", async () => {
      await salvarReenvio({
        condominioId: 6,
        moradorId: 1,
        asaasPaymentId: "pay_canal_stat_001",
        canal: "WHATSAPP",
      });

      await salvarReenvio({
        condominioId: 6,
        moradorId: 1,
        asaasPaymentId: "pay_canal_stat_002",
        canal: "EMAIL",
      });

      const stats = await obterEstatisticasReenvios(6);

      expect(stats.porCanal).toBeDefined();
      expect(Array.isArray(stats.porCanal)).toBe(true);
    });

    it("should calculate success rate", async () => {
      // 2 enviados, 1 falha = 66.67%
      const r1 = await salvarReenvio({
        condominioId: 7,
        moradorId: 1,
        asaasPaymentId: "pay_rate_001",
        canal: "WHATSAPP",
      });

      const r2 = await salvarReenvio({
        condominioId: 7,
        moradorId: 1,
        asaasPaymentId: "pay_rate_002",
        canal: "EMAIL",
      });

      const r3 = await salvarReenvio({
        condominioId: 7,
        moradorId: 1,
        asaasPaymentId: "pay_rate_003",
        canal: "SMS",
      });

      if (r1) await atualizarStatusReenvio(r1.id, "enviado");
      if (r2) await atualizarStatusReenvio(r2.id, "enviado");
      if (r3) await atualizarStatusReenvio(r3.id, "falha");

      const stats = await obterEstatisticasReenvios(7);

      expect(stats.taxaSucesso).toBeGreaterThanOrEqual(66);
      expect(stats.taxaSucesso).toBeLessThanOrEqual(67);
    });
  });

  describe("Recent and Failed Resends", () => {
    it("should get recent resends", async () => {
      await salvarReenvio({
        condominioId: 8,
        moradorId: 1,
        asaasPaymentId: "pay_recent_001",
        canal: "WHATSAPP",
      });

      const recent = await obterReenviosRecentes(8, 10);

      expect(Array.isArray(recent)).toBe(true);
      expect(recent.length).toBeGreaterThanOrEqual(1);
    });

    it("should get failed resends for retry", async () => {
      const reenvio = await salvarReenvio({
        condominioId: 9,
        moradorId: 1,
        asaasPaymentId: "pay_failed_001",
        canal: "EMAIL",
      });

      if (reenvio) {
        await atualizarStatusReenvio(reenvio.id, "falha", "Email inválido");
      }

      const failed = await obterReenviosFalhados(9, 10);

      expect(failed.length).toBeGreaterThanOrEqual(1);
      failed.forEach((r) => {
        expect(r.status).toBe("falha");
      });
    });

    it("should respect limite on recent resends", async () => {
      for (let i = 0; i < 5; i++) {
        await salvarReenvio({
          condominioId: 10,
          moradorId: 1,
          asaasPaymentId: `pay_recent_${i}`,
          canal: "WHATSAPP",
        });
      }

      const recent = await obterReenviosRecentes(10, 2);

      expect(recent.length).toBeLessThanOrEqual(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty resend history", async () => {
      const history = await obterHistoricoReenvios("pay_nonexistent");

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    it("should handle empty statistics", async () => {
      const stats = await obterEstatisticasReenvios(99999);

      expect(stats.total).toBe(0);
      expect(stats.enviados).toBe(0);
      expect(stats.taxaSucesso).toBe(0);
    });

    it("should preserve metadata", async () => {
      const metadata = {
        flowId: "flow_123",
        tentativaAnterior: 1,
      };

      const reenvio = await salvarReenvio({
        condominioId: 11,
        moradorId: 1,
        asaasPaymentId: "pay_metadata_001",
        canal: "WHATSAPP",
        metadados: metadata,
      });

      expect(reenvio?.metadados).toEqual(metadata);
    });

    it("should handle multiple channels for same payment", async () => {
      const paymentId = "pay_multi_channel_001";

      await salvarReenvio({
        condominioId: 12,
        moradorId: 1,
        asaasPaymentId: paymentId,
        canal: "WHATSAPP",
      });

      await salvarReenvio({
        condominioId: 12,
        moradorId: 1,
        asaasPaymentId: paymentId,
        canal: "EMAIL",
      });

      await salvarReenvio({
        condominioId: 12,
        moradorId: 1,
        asaasPaymentId: paymentId,
        canal: "SMS",
      });

      const history = await obterHistoricoReenvios(paymentId);

      expect(history.length).toBe(3);
      const canals = history.map((r) => r.canal);
      expect(canals).toContain("WHATSAPP");
      expect(canals).toContain("EMAIL");
      expect(canals).toContain("SMS");
    });
  });
});
