/**
 * Asaas Integration Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  configurarAsaas,
  obterConfigAsaas,
  salvarCustomerAsaas,
  salvarPagamentoAsaas,
  obterPagamentosMorador,
  obterEstatisticasPagamentos,
} from "@/server/_core/asaas-db";

describe("Asaas Integration", () => {
  describe("Configuration", () => {
    it("should configure Asaas", async () => {
      const result = await configurarAsaas({
        condominioId: 1,
        apiKey: "test_api_key_123",
        ambiente: "teste",
      });

      expect(result).toBeDefined();
      expect(result?.apiKey).toBe("test_api_key_123");
      expect(result?.ambiente).toBe("teste");
      expect(result?.ativo).toBe(true);
    });

    it("should get Asaas configuration", async () => {
      await configurarAsaas({
        condominioId: 1,
        apiKey: "test_api_key_123",
        ambiente: "teste",
      });

      const config = await obterConfigAsaas(1);

      expect(config).toBeDefined();
      expect(config?.apiKey).toBe("test_api_key_123");
      expect(config?.condominioId).toBe(1);
    });

    it("should update existing configuration", async () => {
      await configurarAsaas({
        condominioId: 1,
        apiKey: "old_key",
        ambiente: "teste",
      });

      const updated = await configurarAsaas({
        condominioId: 1,
        apiKey: "new_key",
        ambiente: "producao",
      });

      expect(updated?.apiKey).toBe("new_key");
      expect(updated?.ambiente).toBe("producao");
    });
  });

  describe("Customer Management", () => {
    it("should save customer", async () => {
      const result = await salvarCustomerAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasCustomerId: "cus_123456",
        nome: "João Silva",
        email: "joao@email.com",
        cpfCnpj: "12345678901",
        telefone: "11999999999",
        endereco: "Rua A",
        numero: "123",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234567",
      });

      expect(result).toBeDefined();
      expect(result?.nome).toBe("João Silva");
      expect(result?.asaasCustomerId).toBe("cus_123456");
    });

    it("should update existing customer", async () => {
      await salvarCustomerAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasCustomerId: "cus_123456",
        nome: "João Silva",
        email: "joao@email.com",
        cpfCnpj: "12345678901",
      });

      const updated = await salvarCustomerAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasCustomerId: "cus_123456",
        nome: "João Silva Atualizado",
        email: "joao.novo@email.com",
        cpfCnpj: "12345678901",
      });

      expect(updated?.nome).toBe("João Silva Atualizado");
      expect(updated?.email).toBe("joao.novo@email.com");
    });
  });

  describe("Payment Management", () => {
    it("should save payment", async () => {
      const result = await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        asaasCustomerId: "cus_123456",
        descricao: "Mensalidade - Abril/2026",
        valor: 500,
        status: "PENDING",
        tipo: "PIX",
        dataVencimento: new Date("2026-05-10"),
        pixQrCode: "00020126580014...",
        pixCopyPaste: "00020126580014...",
      });

      expect(result).toBeDefined();
      expect(result?.descricao).toBe("Mensalidade - Abril/2026");
      expect(result?.status).toBe("PENDING");
      expect(result?.tipo).toBe("PIX");
    });

    it("should update payment status", async () => {
      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        asaasCustomerId: "cus_123456",
        descricao: "Mensalidade",
        valor: 500,
        status: "PENDING",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      const updated = await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_123456",
        asaasCustomerId: "cus_123456",
        descricao: "Mensalidade",
        valor: 500,
        status: "RECEIVED",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      expect(updated?.status).toBe("RECEIVED");
    });

    it("should get morador payments", async () => {
      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_001",
        asaasCustomerId: "cus_123456",
        descricao: "Mensalidade 1",
        valor: 500,
        status: "PENDING",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_002",
        asaasCustomerId: "cus_123456",
        descricao: "Mensalidade 2",
        valor: 500,
        status: "RECEIVED",
        tipo: "BOLETO",
        dataVencimento: new Date(),
      });

      const payments = await obterPagamentosMorador(1, 1);

      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter payments by status", async () => {
      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_pending",
        asaasCustomerId: "cus_123456",
        descricao: "Pendente",
        valor: 500,
        status: "PENDING",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_received",
        asaasCustomerId: "cus_123456",
        descricao: "Recebido",
        valor: 500,
        status: "RECEIVED",
        tipo: "BOLETO",
        dataVencimento: new Date(),
      });

      const pending = await obterPagamentosMorador(1, 1, { status: "PENDING" });

      pending.forEach((payment) => {
        expect(payment.status).toBe("PENDING");
      });
    });

    it("should filter payments by type", async () => {
      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_pix",
        asaasCustomerId: "cus_123456",
        descricao: "PIX",
        valor: 500,
        status: "PENDING",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_boleto",
        asaasCustomerId: "cus_123456",
        descricao: "Boleto",
        valor: 500,
        status: "PENDING",
        tipo: "BOLETO",
        dataVencimento: new Date(),
      });

      const pixPayments = await obterPagamentosMorador(1, 1, { tipo: "PIX" });

      pixPayments.forEach((payment) => {
        expect(payment.tipo).toBe("PIX");
      });
    });
  });

  describe("Statistics", () => {
    it("should get payment statistics", async () => {
      // Save some payments
      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_stat_1",
        asaasCustomerId: "cus_123456",
        descricao: "Teste 1",
        valor: 500,
        status: "RECEIVED",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 2,
        asaasPaymentId: "pay_stat_2",
        asaasCustomerId: "cus_789012",
        descricao: "Teste 2",
        valor: 300,
        status: "PENDING",
        tipo: "BOLETO",
        dataVencimento: new Date(),
      });

      const stats = await obterEstatisticasPagamentos(1);

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.recebidos).toBeGreaterThanOrEqual(1);
      expect(stats.pendentes).toBeGreaterThanOrEqual(1);
      expect(stats.valorTotal).toBeGreaterThan(0);
      expect(stats.valorRecebido).toBeGreaterThan(0);
    });

    it("should calculate collection rate", async () => {
      // 2 received, 1 pending = 66.67% collection rate
      await salvarPagamentoAsaas({
        condominioId: 2,
        moradorId: 1,
        asaasPaymentId: "pay_rate_1",
        asaasCustomerId: "cus_rate_1",
        descricao: "Teste",
        valor: 100,
        status: "RECEIVED",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      await salvarPagamentoAsaas({
        condominioId: 2,
        moradorId: 2,
        asaasPaymentId: "pay_rate_2",
        asaasCustomerId: "cus_rate_2",
        descricao: "Teste",
        valor: 100,
        status: "RECEIVED",
        tipo: "PIX",
        dataVencimento: new Date(),
      });

      await salvarPagamentoAsaas({
        condominioId: 2,
        moradorId: 3,
        asaasPaymentId: "pay_rate_3",
        asaasCustomerId: "cus_rate_3",
        descricao: "Teste",
        valor: 100,
        status: "PENDING",
        tipo: "BOLETO",
        dataVencimento: new Date(),
      });

      const stats = await obterEstatisticasPagamentos(2);

      expect(stats.taxaRecebimento).toBeGreaterThanOrEqual(66);
      expect(stats.taxaRecebimento).toBeLessThanOrEqual(67);
    });

    it("should handle overdue payments", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await salvarPagamentoAsaas({
        condominioId: 3,
        moradorId: 1,
        asaasPaymentId: "pay_overdue",
        asaasCustomerId: "cus_overdue",
        descricao: "Atrasado",
        valor: 500,
        status: "OVERDUE",
        tipo: "BOLETO",
        dataVencimento: yesterday,
      });

      const stats = await obterEstatisticasPagamentos(3);

      expect(stats.atrasados).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty payment list", async () => {
      const payments = await obterPagamentosMorador(99999, 99999);

      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBe(0);
    });

    it("should handle zero statistics", async () => {
      const stats = await obterEstatisticasPagamentos(99999);

      expect(stats.total).toBe(0);
      expect(stats.recebidos).toBe(0);
      expect(stats.taxaRecebimento).toBe(0);
    });

    it("should preserve payment metadata", async () => {
      const metadata = {
        origem: "whatsapp_flow",
        flowId: "flow_123",
        tentativas: 2,
      };

      const result = await salvarPagamentoAsaas({
        condominioId: 1,
        moradorId: 1,
        asaasPaymentId: "pay_metadata",
        asaasCustomerId: "cus_123456",
        descricao: "Com Metadata",
        valor: 500,
        status: "PENDING",
        tipo: "PIX",
        dataVencimento: new Date(),
        metadados: metadata,
      });

      expect(result?.metadados).toEqual(metadata);
    });

    it("should handle multiple payment types", async () => {
      const tipos = ["PIX", "BOLETO", "CREDIT_CARD"];

      for (let i = 0; i < tipos.length; i++) {
        await salvarPagamentoAsaas({
          condominioId: 4,
          moradorId: i + 1,
          asaasPaymentId: `pay_type_${i}`,
          asaasCustomerId: `cus_type_${i}`,
          descricao: `Pagamento ${tipos[i]}`,
          valor: 500,
          status: "PENDING",
          tipo: tipos[i] as "PIX" | "BOLETO" | "CREDIT_CARD",
          dataVencimento: new Date(),
        });
      }

      const stats = await obterEstatisticasPagamentos(4);

      expect(stats.total).toBe(3);
    });
  });
});
