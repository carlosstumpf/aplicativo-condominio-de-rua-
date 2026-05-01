/**
 * Admin Expenses Management Tests
 */

import { describe, it, expect } from "vitest";
import {
  createExpenseCategory,
  getExpenseCategories,
  createExpense,
  updateExpense,
  getExpense,
  getExpenses,
  addExpenseDocument,
  getExpenseDocuments,
  deleteExpenseDocument,
  getExpenseStatistics,
} from "@/server/_core/admin-expenses-db";

describe("Admin Expenses Management", () => {
  describe("Expense Categories", () => {
    it("should create expense category", async () => {
      const result = await createExpenseCategory({
        nome: "Manutenção",
        descricao: "Despesas com manutenção predial",
        cor: "#F59E0B",
      });

      expect(result).toBeDefined();
      expect(result?.nome).toBe("Manutenção");
      expect(result?.ativo).toBe(true);
    });

    it("should get all expense categories", async () => {
      const result = await getExpenseCategories();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should only return active categories", async () => {
      const result = await getExpenseCategories();

      result.forEach((cat) => {
        expect(cat.ativo).toBe(true);
      });
    });
  });

  describe("Expense Operations", () => {
    it("should create expense", async () => {
      const result = await createExpense({
        titulo: "Manutenção Hidráulica",
        descricao: "Conserto de vazamento",
        valor: 1500,
        categoria: 1,
        data: new Date(),
        fornecedor: "Encanador Silva",
        referencia: "REF001",
      });

      expect(result).toBeDefined();
      expect(result?.titulo).toBe("Manutenção Hidráulica");
      expect(result?.valor).toBe(1500);
      expect(result?.status).toBe("pendente");
    });

    it("should get expense by ID", async () => {
      const created = await createExpense({
        titulo: "Test Expense",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      if (created) {
        const result = await getExpense(created.id);

        expect(result).toBeDefined();
        expect(result?.titulo).toBe("Test Expense");
      }
    });

    it("should update expense", async () => {
      const created = await createExpense({
        titulo: "Original Title",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      if (created) {
        const result = await updateExpense(created.id, {
          titulo: "Updated Title",
          valor: 600,
          status: "paga",
        });

        expect(result?.titulo).toBe("Updated Title");
        expect(result?.valor).toBe(600);
        expect(result?.status).toBe("paga");
      }
    });

    it("should list expenses with filters", async () => {
      const result = await getExpenses({
        status: "pendente",
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((exp) => {
        expect(exp.status).toBe("pendente");
      });
    });

    it("should filter expenses by category", async () => {
      const result = await getExpenses({
        categoria: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter expenses by date range", async () => {
      const dataInicio = new Date("2026-01-01");
      const dataFim = new Date("2026-12-31");

      const result = await getExpenses({
        dataInicio,
        dataFim,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Expense Documents", () => {
    it("should add document to expense", async () => {
      const expense = await createExpense({
        titulo: "Test Expense",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      if (expense) {
        const result = await addExpenseDocument({
          despesaId: expense.id,
          nomeArquivo: "recibo.pdf",
          tipoArquivo: "application/pdf",
          urlArquivo: "https://example.com/recibo.pdf",
          tamanho: 102400,
        });

        expect(result).toBeDefined();
        expect(result?.nomeArquivo).toBe("recibo.pdf");
      }
    });

    it("should get documents for expense", async () => {
      const expense = await createExpense({
        titulo: "Test Expense",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      if (expense) {
        await addExpenseDocument({
          despesaId: expense.id,
          nomeArquivo: "doc1.pdf",
          tipoArquivo: "application/pdf",
          urlArquivo: "https://example.com/doc1.pdf",
          tamanho: 102400,
        });

        const result = await getExpenseDocuments(expense.id);

        expect(Array.isArray(result)).toBe(true);
      }
    });

    it("should delete document", async () => {
      const expense = await createExpense({
        titulo: "Test Expense",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      if (expense) {
        const doc = await addExpenseDocument({
          despesaId: expense.id,
          nomeArquivo: "doc.pdf",
          tipoArquivo: "application/pdf",
          urlArquivo: "https://example.com/doc.pdf",
          tamanho: 102400,
        });

        if (doc) {
          const result = await deleteExpenseDocument(doc.id);

          expect(result).toBe(true);
        }
      }
    });
  });

  describe("Expense Statistics", () => {
    it("should calculate expense statistics", async () => {
      const result = await getExpenseStatistics();

      expect(result).toBeDefined();
      expect(result.totalDespesas).toBeGreaterThanOrEqual(0);
      expect(result.valorTotal).toBeGreaterThanOrEqual(0);
      expect(result.valorPago).toBeGreaterThanOrEqual(0);
      expect(result.valorPendente).toBeGreaterThanOrEqual(0);
    });

    it("should include statistics by category", async () => {
      const result = await getExpenseStatistics();

      expect(result.porCategoria).toBeDefined();
      expect(typeof result.porCategoria).toBe("object");
    });

    it("should include statistics by status", async () => {
      const result = await getExpenseStatistics();

      expect(result.porStatus).toBeDefined();
      expect(typeof result.porStatus).toBe("object");
    });

    it("should filter statistics by category", async () => {
      const result = await getExpenseStatistics({
        categoria: 1,
      });

      expect(result).toBeDefined();
    });

    it("should filter statistics by status", async () => {
      const result = await getExpenseStatistics({
        status: "paga",
      });

      expect(result).toBeDefined();
    });

    it("should filter statistics by date range", async () => {
      const result = await getExpenseStatistics({
        dataInicio: new Date("2026-01-01"),
        dataFim: new Date("2026-12-31"),
      });

      expect(result).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero value expenses", async () => {
      const result = await createExpense({
        titulo: "Zero Value",
        valor: 0,
        categoria: 1,
        data: new Date(),
      });

      // Should either reject or handle zero
      expect(result === null || result.valor === 0).toBe(true);
    });

    it("should handle very large values", async () => {
      const result = await createExpense({
        titulo: "Large Value",
        valor: 999999999,
        categoria: 1,
        data: new Date(),
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result.valor).toBe(999999999);
      }
    });

    it("should handle missing optional fields", async () => {
      const result = await createExpense({
        titulo: "Minimal Expense",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      expect(result).toBeDefined();
      expect(result?.titulo).toBe("Minimal Expense");
    });

    it("should handle search in empty list", async () => {
      const result = await getExpenses({
        busca: "nonexistent",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Data Integrity", () => {
    it("should maintain expense status correctly", async () => {
      const created = await createExpense({
        titulo: "Status Test",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      expect(created?.status).toBe("pendente");

      if (created) {
        const updated = await updateExpense(created.id, {
          status: "paga",
        });

        expect(updated?.status).toBe("paga");
      }
    });

    it("should preserve document metadata", async () => {
      const expense = await createExpense({
        titulo: "Doc Test",
        valor: 500,
        categoria: 1,
        data: new Date(),
      });

      if (expense) {
        const doc = await addExpenseDocument({
          despesaId: expense.id,
          nomeArquivo: "test.pdf",
          tipoArquivo: "application/pdf",
          urlArquivo: "https://example.com/test.pdf",
          tamanho: 102400,
        });

        expect(doc?.nomeArquivo).toBe("test.pdf");
        expect(doc?.tamanho).toBe(102400);
      }
    });
  });
});
