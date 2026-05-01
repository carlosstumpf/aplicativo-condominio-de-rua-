/**
 * Notifications System Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createNotificacao,
  getNotificacoes,
  marcarComoLida,
  arquivarNotificacao,
  getNotificacoesNaoLidas,
  criarTarefaPendente,
  getTarefasPendentes,
  completarTarefa,
  getNotificacaoStats,
  rastrearEntrega,
  getPreferencias,
  atualizarPreferencias,
} from "@/server/_core/notifications-db";

describe("Notifications System", () => {
  describe("Notification Creation", () => {
    it("should create notification", async () => {
      const result = await createNotificacao({
        adminId: 1,
        titulo: "Test Notification",
        descricao: "This is a test",
        tipo: "alerta",
        prioridade: "normal",
      });

      expect(result).toBeDefined();
      expect(result?.titulo).toBe("Test Notification");
      expect(result?.status).toBe("nao_lida");
    });

    it("should create notification with all fields", async () => {
      const result = await createNotificacao({
        adminId: 1,
        titulo: "Payment Received",
        descricao: "João Silva paid R$ 500",
        tipo: "pagamento",
        prioridade: "alta",
        acao: "/admin/pagamentos/123",
        dados: { moradorId: 123, valor: 500 },
        expiradoEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(result).toBeDefined();
      expect(result?.tipo).toBe("pagamento");
      expect(result?.acao).toBe("/admin/pagamentos/123");
    });

    it("should create notification with default priority", async () => {
      const result = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      expect(result?.prioridade).toBe("normal");
    });

    it("should handle different notification types", async () => {
      const types = ["tarefa", "mensagem", "alerta", "pagamento", "despesa"];

      for (const type of types) {
        const result = await createNotificacao({
          adminId: 1,
          titulo: `Test ${type}`,
          tipo,
        });

        expect(result?.tipo).toBe(type);
      }
    });
  });

  describe("Notification Retrieval", () => {
    it("should get notifications for admin", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Test 1",
        tipo: "alerta",
      });

      await createNotificacao({
        adminId: 1,
        titulo: "Test 2",
        tipo: "alerta",
      });

      const result = await getNotificacoes(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter notifications by status", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      const result = await getNotificacoes(1, { status: "nao_lida" });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((n) => {
        expect(n.status).toBe("nao_lida");
      });
    });

    it("should filter notifications by type", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Payment",
        tipo: "pagamento",
      });

      const result = await getNotificacoes(1, { tipo: "pagamento" });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter notifications by priority", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Critical",
        tipo: "alerta",
        prioridade: "crítica",
      });

      const result = await getNotificacoes(1, { prioridade: "crítica" });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should limit and offset notifications", async () => {
      const result = await getNotificacoes(1, { limite: 5, offset: 0 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Notification Status", () => {
    it("should mark notification as read", async () => {
      const created = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      if (created) {
        const result = await marcarComoLida(created.id);

        expect(result?.status).toBe("lida");
        expect(result?.lidoEm).toBeDefined();
      }
    });

    it("should archive notification", async () => {
      const created = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      if (created) {
        const result = await arquivarNotificacao(created.id);

        expect(result?.status).toBe("arquivada");
      }
    });

    it("should get unread count", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Test 1",
        tipo: "alerta",
      });

      await createNotificacao({
        adminId: 1,
        titulo: "Test 2",
        tipo: "alerta",
      });

      const count = await getNotificacoesNaoLidas(1);

      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Pending Tasks", () => {
    it("should create pending task", async () => {
      const result = await criarTarefaPendente({
        titulo: "Cobrar João Silva",
        descricao: "Mensalidade vencida",
        tipo: "cobranca",
        prioridade: "alta",
      });

      expect(result).toBeDefined();
      expect(result?.titulo).toBe("Cobrar João Silva");
      expect(result?.status).toBe("pendente");
    });

    it("should create task with assignment", async () => {
      const result = await criarTarefaPendente({
        titulo: "Test Task",
        tipo: "cobranca",
        atribuidoA: 1,
      });

      expect(result?.atribuidoA).toBe(1);
    });

    it("should create task with resource reference", async () => {
      const result = await criarTarefaPendente({
        titulo: "Test Task",
        tipo: "cobranca",
        recursoTipo: "morador",
        recursoId: 123,
      });

      expect(result?.recursoTipo).toBe("morador");
      expect(result?.recursoId).toBe(123);
    });

    it("should get pending tasks", async () => {
      await criarTarefaPendente({
        titulo: "Task 1",
        tipo: "cobranca",
      });

      const result = await getTarefasPendentes();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter tasks by status", async () => {
      const result = await getTarefasPendentes({ status: "pendente" });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((t) => {
        expect(t.status).toBe("pendente");
      });
    });

    it("should filter tasks by assignment", async () => {
      await criarTarefaPendente({
        titulo: "Test",
        tipo: "cobranca",
        atribuidoA: 1,
      });

      const result = await getTarefasPendentes({ atribuidoA: 1 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should complete task", async () => {
      const created = await criarTarefaPendente({
        titulo: "Test Task",
        tipo: "cobranca",
      });

      if (created) {
        const result = await completarTarefa(created.id);

        expect(result?.status).toBe("concluida");
        expect(result?.dataConclusao).toBeDefined();
      }
    });
  });

  describe("Notification Statistics", () => {
    it("should get notification statistics", async () => {
      const result = await getNotificacaoStats(1);

      expect(result).toBeDefined();
      expect(result.notificacoesNaoLidas).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.notificacoesPorTipo)).toBe(true);
      expect(Array.isArray(result.notificacoesPorPrioridade)).toBe(true);
      expect(result.tarefasPendentes).toBeGreaterThanOrEqual(0);
    });

    it("should include notification breakdown by type", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "pagamento",
      });

      const result = await getNotificacaoStats(1);

      expect(result.notificacoesPorTipo).toBeDefined();
    });

    it("should include notification breakdown by priority", async () => {
      await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
        prioridade: "alta",
      });

      const result = await getNotificacaoStats(1);

      expect(result.notificacoesPorPrioridade).toBeDefined();
    });
  });

  describe("Delivery Tracking", () => {
    it("should track notification delivery", async () => {
      const notif = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      if (notif) {
        const result = await rastrearEntrega({
          notificacaoId: notif.id,
          canal: "push",
          status: "enviada",
        });

        expect(result).toBeDefined();
        expect(result?.canal).toBe("push");
        expect(result?.status).toBe("enviada");
      }
    });

    it("should track delivery failure", async () => {
      const notif = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      if (notif) {
        const result = await rastrearEntrega({
          notificacaoId: notif.id,
          canal: "email",
          status: "falhou",
          erro: "Invalid email address",
        });

        expect(result?.status).toBe("falhou");
        expect(result?.erro).toBe("Invalid email address");
      }
    });

    it("should track delivery with response", async () => {
      const notif = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      if (notif) {
        const result = await rastrearEntrega({
          notificacaoId: notif.id,
          canal: "push",
          status: "entregue",
          resposta: { messageId: "12345" },
        });

        expect(result?.resposta).toBeDefined();
      }
    });
  });

  describe("Notification Preferences", () => {
    it("should get preferences", async () => {
      const result = await getPreferencias(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should update preferences", async () => {
      const result = await atualizarPreferencias(1, "pagamento", {
        pushHabilitado: true,
        emailHabilitado: false,
        whatsappHabilitado: true,
      });

      expect(result).toBeDefined();
      expect(result?.pushHabilitado).toBe(true);
      expect(result?.emailHabilitado).toBe(false);
    });

    it("should create preference if not exists", async () => {
      const result = await atualizarPreferencias(1, "novo_tipo", {
        pushHabilitado: true,
      });

      expect(result).toBeDefined();
      expect(result?.tipo).toBe("novo_tipo");
    });

    it("should set silence hours", async () => {
      const silenceUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);

      const result = await atualizarPreferencias(1, "alerta", {
        silencioAte: silenceUntil,
      });

      expect(result?.silencioAte).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty notification list", async () => {
      const result = await getNotificacoes(99999);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle invalid notification ID", async () => {
      const result = await marcarComoLida(99999);

      expect(result).toBeNull();
    });

    it("should handle empty task list", async () => {
      const result = await getTarefasPendentes();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle notification with no description", async () => {
      const result = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      expect(result?.descricao).toBeUndefined();
    });

    it("should handle notification with no expiration", async () => {
      const result = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      expect(result?.expiradoEm).toBeUndefined();
    });
  });

  describe("Data Integrity", () => {
    it("should maintain notification timestamps", async () => {
      const result = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      expect(result?.criadoEm).toBeDefined();
      expect(result?.lidoEm).toBeUndefined();
    });

    it("should update read timestamp", async () => {
      const created = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "alerta",
      });

      if (created) {
        const updated = await marcarComoLida(created.id);

        expect(updated?.lidoEm).toBeDefined();
        expect(updated?.lidoEm?.getTime()).toBeGreaterThan(
          created.criadoEm.getTime()
        );
      }
    });

    it("should preserve notification data", async () => {
      const dados = { moradorId: 123, valor: 500 };

      const result = await createNotificacao({
        adminId: 1,
        titulo: "Test",
        tipo: "pagamento",
        dados,
      });

      expect(result?.dados).toEqual(dados);
    });
  });
});
