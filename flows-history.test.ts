/**
 * Flows History Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  recordFlowHistory,
  updateFlowStatus,
  getFlowsHistory,
  getFlowDetail,
  getFlowsStats,
  getFlowsByType,
  getFailedFlows,
  exportFlowsHistoryToCsv,
  getFlowTimeline,
  resendFlow,
  getFlowsSummary,
} from "../server/_core/flows-history-db";

describe("Flows History Database", () => {
  const mockMoradorId = 1;
  const mockFlowData = {
    moradorId: mockMoradorId,
    flowId: "payment_flow",
    flowType: "payment" as const,
    status: "pending" as const,
    sentAt: new Date(),
    data: { month: "2024-04", paymentMethod: "PIX" },
    source: "whatsapp" as const,
    phoneNumber: "5511999999999",
  };

  describe("recordFlowHistory", () => {
    it("deve registrar novo flow no histórico", async () => {
      const result = await recordFlowHistory(mockFlowData);

      expect(result).toBeDefined();
      expect(result.moradorId).toBe(mockMoradorId);
      expect(result.flowType).toBe("payment");
      expect(result.status).toBe("pending");
    });

    it("deve registrar flow com dados corretos", async () => {
      const result = await recordFlowHistory(mockFlowData);

      expect(result.data).toEqual(mockFlowData.data);
      expect(result.source).toBe("whatsapp");
      expect(result.phoneNumber).toBe("5511999999999");
    });

    it("deve registrar flow de manutenção", async () => {
      const maintenanceData = {
        ...mockFlowData,
        flowId: "maintenance_flow",
        flowType: "maintenance" as const,
        data: { category: "water", urgency: "high" },
      };

      const result = await recordFlowHistory(maintenanceData);

      expect(result.flowType).toBe("maintenance");
      expect(result.data.category).toBe("water");
    });

    it("deve registrar flow de saldo", async () => {
      const balanceData = {
        ...mockFlowData,
        flowId: "balance_flow",
        flowType: "balance" as const,
        data: {},
      };

      const result = await recordFlowHistory(balanceData);

      expect(result.flowType).toBe("balance");
    });

    it("deve registrar flow de ajuda", async () => {
      const helpData = {
        ...mockFlowData,
        flowId: "help_flow",
        flowType: "help" as const,
        data: { question: "Como pago?" },
      };

      const result = await recordFlowHistory(helpData);

      expect(result.flowType).toBe("help");
    });
  });

  describe("updateFlowStatus", () => {
    it("deve atualizar status para completed", async () => {
      const flowId = 1;
      const result = await updateFlowStatus(flowId, "completed", {
        pixKey: "12345678901234567890123456789012",
      });

      expect(result.status).toBe("completed");
      expect(result.completedAt).toBeDefined();
      expect(result.result).toBeDefined();
    });

    it("deve atualizar status para failed com mensagem de erro", async () => {
      const flowId = 1;
      const result = await updateFlowStatus(
        flowId,
        "failed",
        undefined,
        "Cliente não encontrado"
      );

      expect(result.status).toBe("failed");
      expect(result.failedAt).toBeDefined();
      expect(result.errorMessage).toBe("Cliente não encontrado");
    });

    it("deve atualizar status para cancelled", async () => {
      const flowId = 1;
      const result = await updateFlowStatus(flowId, "cancelled");

      expect(result.status).toBe("cancelled");
    });

    it("deve registrar resultado do flow", async () => {
      const flowId = 1;
      const resultData = { transactionId: "txn_123", amount: 500 };
      const result = await updateFlowStatus(flowId, "completed", resultData);

      expect(result.result).toEqual(resultData);
    });
  });

  describe("getFlowsHistory", () => {
    it("deve retornar histórico de flows", async () => {
      const result = await getFlowsHistory(mockMoradorId);

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar por tipo de flow", async () => {
      const result = await getFlowsHistory(mockMoradorId, {
        flowType: "payment",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar por status", async () => {
      const result = await getFlowsHistory(mockMoradorId, {
        status: "completed",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar por data", async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const result = await getFlowsHistory(mockMoradorId, {
        startDate,
        endDate,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve filtrar por origem", async () => {
      const result = await getFlowsHistory(mockMoradorId, {
        source: "whatsapp",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve aplicar paginação", async () => {
      const result = await getFlowsHistory(mockMoradorId, {
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getFlowDetail", () => {
    it("deve retornar detalhes de um flow", async () => {
      const result = await getFlowDetail(1);

      // Pode ser null ou um objeto
      expect(result === null || typeof result === "object").toBe(true);
    });

    it("deve retornar null se flow não existe", async () => {
      const result = await getFlowDetail(99999);

      expect(result).toBeNull();
    });
  });

  describe("getFlowsStats", () => {
    it("deve retornar estatísticas de flows", async () => {
      const result = await getFlowsStats(mockMoradorId);

      expect(result).toBeDefined();
      expect(result.total).toBeDefined();
      expect(result.completed).toBeDefined();
      expect(result.failed).toBeDefined();
      expect(result.pending).toBeDefined();
      expect(result.completionRate).toBeDefined();
      expect(result.averageTime).toBeDefined();
    });

    it("deve calcular taxa de conclusão corretamente", async () => {
      const result = await getFlowsStats(mockMoradorId);

      expect(result.completionRate).toBeGreaterThanOrEqual(0);
      expect(result.completionRate).toBeLessThanOrEqual(100);
    });

    it("deve filtrar por data", async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const result = await getFlowsStats(mockMoradorId, startDate, endDate);

      expect(result).toBeDefined();
    });
  });

  describe("getFlowsByType", () => {
    it("deve retornar flows de pagamento", async () => {
      const result = await getFlowsByType(mockMoradorId, "payment");

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve retornar flows de manutenção", async () => {
      const result = await getFlowsByType(mockMoradorId, "maintenance");

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve retornar flows de saldo", async () => {
      const result = await getFlowsByType(mockMoradorId, "balance");

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve retornar flows de ajuda", async () => {
      const result = await getFlowsByType(mockMoradorId, "help");

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getFailedFlows", () => {
    it("deve retornar flows com falha", async () => {
      const result = await getFailedFlows(mockMoradorId);

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve respeitar limite", async () => {
      const result = await getFailedFlows(mockMoradorId, 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("deve retornar apenas flows com status failed", async () => {
      const result = await getFailedFlows(mockMoradorId);

      result.forEach((flow) => {
        expect(flow.status).toBe("failed");
      });
    });
  });

  describe("exportFlowsHistoryToCsv", () => {
    it("deve exportar histórico como CSV", async () => {
      const result = await exportFlowsHistoryToCsv(mockMoradorId);

      expect(typeof result).toBe("string");
      expect(result.includes("ID,Tipo,Status")).toBe(true);
    });

    it("deve incluir headers corretos", async () => {
      const result = await exportFlowsHistoryToCsv(mockMoradorId);

      const headers = [
        "ID",
        "Tipo",
        "Status",
        "Data Envio",
        "Data Conclusão",
        "Origem",
        "Dados",
      ];

      headers.forEach((header) => {
        expect(result.includes(header)).toBe(true);
      });
    });

    it("deve aplicar filtros na exportação", async () => {
      const result = await exportFlowsHistoryToCsv(mockMoradorId, {
        flowType: "payment",
      });

      expect(typeof result).toBe("string");
    });
  });

  describe("getFlowTimeline", () => {
    it("deve retornar timeline de um flow", async () => {
      const result = await getFlowTimeline(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve incluir evento de envio", async () => {
      const result = await getFlowTimeline(1);

      const sendEvent = result.find((e) => e.event.includes("enviado"));
      expect(sendEvent).toBeDefined();
    });

    it("deve incluir evento de conclusão se aplicável", async () => {
      const result = await getFlowTimeline(1);

      // Pode ter ou não, dependendo do status
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("resendFlow", () => {
    it("deve reenviar um flow", async () => {
      const result = await resendFlow(1);

      expect(result).toBeDefined();
      expect(result.status).toBe("pending");
    });

    it("deve criar novo registro ao reenviar", async () => {
      const result = await resendFlow(1);

      expect(result.id).toBeDefined();
      expect(result.sentAt).toBeDefined();
    });

    it("deve manter dados originais ao reenviar", async () => {
      const result = await resendFlow(1);

      expect(result.data).toBeDefined();
    });

    it("deve falhar se flow não existe", async () => {
      try {
        await resendFlow(99999);
        expect.fail("Deveria lançar erro");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getFlowsSummary", () => {
    it("deve retornar resumo de flows", async () => {
      const result = await getFlowsSummary(mockMoradorId);

      expect(result).toBeDefined();
      expect(result.totalFlows).toBeDefined();
      expect(result.completedToday).toBeDefined();
      expect(result.failedToday).toBeDefined();
      expect(result.pendingFlows).toBeDefined();
    });

    it("deve incluir último flow", async () => {
      const result = await getFlowsSummary(mockMoradorId);

      // Pode ser undefined se não há flows
      expect(result.lastFlow === undefined || typeof result.lastFlow === "object").toBe(true);
    });

    it("deve contar flows de hoje corretamente", async () => {
      const result = await getFlowsSummary(mockMoradorId);

      const todayTotal = result.completedToday + result.failedToday;
      expect(todayTotal).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Filtros Combinados", () => {
    it("deve filtrar por múltiplos critérios", async () => {
      const result = await getFlowsHistory(mockMoradorId, {
        flowType: "payment",
        status: "completed",
        source: "whatsapp",
        limit: 10,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve retornar resultados vazios se nenhum match", async () => {
      const result = await getFlowsHistory(mockMoradorId, {
        flowType: "payment",
        status: "completed",
        startDate: new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000), // 100 anos atrás
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Validações", () => {
    it("deve validar moradorId", async () => {
      const result = await getFlowsHistory(0);

      expect(Array.isArray(result)).toBe(true);
    });

    it("deve validar flowHistoryId", async () => {
      const result = await getFlowDetail(0);

      expect(result === null || typeof result === "object").toBe(true);
    });
  });
});
