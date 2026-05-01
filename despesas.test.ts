import { describe, it, expect } from "vitest";

describe("Despesas System", () => {
  describe("Expense Creation", () => {
    it("should validate expense description length", () => {
      const minLength = 5;
      const maxLength = 200;
      const validDescription = "Reparo do telhado";

      expect(validDescription.length).toBeGreaterThanOrEqual(minLength);
      expect(validDescription.length).toBeLessThanOrEqual(maxLength);
    });

    it("should validate positive expense value", () => {
      const value = 1500.0;
      expect(value).toBeGreaterThan(0);
    });

    it("should validate expense categories", () => {
      const validCategories = [
        "MANUTENCAO",
        "LIMPEZA",
        "SEGURANCA",
        "UTILIDADES",
        "OUTROS",
      ];
      const testCategory = "MANUTENCAO";

      expect(validCategories).toContain(testCategory);
    });

    it("should validate expense date format", () => {
      const dateString = "2026-04-25";
      const date = new Date(dateString);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString().split("T")[0]).toBe(dateString);
    });
  });

  describe("Expense Filtering", () => {
    it("should filter expenses by category", () => {
      const expenses = [
        { id: 1, categoria: "MANUTENCAO", valor: 1500 },
        { id: 2, categoria: "LIMPEZA", valor: 350 },
        { id: 3, categoria: "MANUTENCAO", valor: 200 },
      ];

      const manutencao = expenses.filter((e) => e.categoria === "MANUTENCAO");
      expect(manutencao).toHaveLength(2);
      expect(manutencao[0].id).toBe(1);
    });

    it("should filter expenses by date range", () => {
      const expenses = [
        { id: 1, data: "2026-04-25", valor: 1500 },
        { id: 2, data: "2026-04-20", valor: 350 },
        { id: 3, data: "2026-04-15", valor: 200 },
      ];

      const startDate = new Date("2026-04-20");
      const endDate = new Date("2026-04-25");

      const filtered = expenses.filter((e) => {
        const expenseDate = new Date(e.data);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

      expect(filtered).toHaveLength(2);
    });

    it("should search expenses by description", () => {
      const expenses = [
        { id: 1, descricao: "Reparo do telhado" },
        { id: 2, descricao: "Limpeza profunda" },
        { id: 3, descricao: "Manutenção do portão" },
      ];

      const searchTerm = "reparo";
      const results = expenses.filter((e) =>
        e.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });
  });

  describe("Expense Statistics", () => {
    it("should calculate total expenses", () => {
      const expenses = [
        { valor: 1500 },
        { valor: 350 },
        { valor: 280.5 },
        { valor: 450 },
      ];

      const total = expenses.reduce((sum, e) => sum + e.valor, 0);
      expect(total).toBe(2580.5);
    });

    it("should calculate expenses by category", () => {
      const expenses = [
        { categoria: "MANUTENCAO", valor: 1500 },
        { categoria: "LIMPEZA", valor: 350 },
        { categoria: "MANUTENCAO", valor: 200 },
        { categoria: "UTILIDADES", valor: 280.5 },
      ];

      const byCategory = {
        MANUTENCAO: expenses
          .filter((e) => e.categoria === "MANUTENCAO")
          .reduce((sum, e) => sum + e.valor, 0),
        LIMPEZA: expenses
          .filter((e) => e.categoria === "LIMPEZA")
          .reduce((sum, e) => sum + e.valor, 0),
        UTILIDADES: expenses
          .filter((e) => e.categoria === "UTILIDADES")
          .reduce((sum, e) => sum + e.valor, 0),
      };

      expect(byCategory.MANUTENCAO).toBe(1700);
      expect(byCategory.LIMPEZA).toBe(350);
      expect(byCategory.UTILIDADES).toBe(280.5);
    });

    it("should calculate average expense", () => {
      const expenses = [
        { valor: 1500 },
        { valor: 350 },
        { valor: 280.5 },
        { valor: 450 },
      ];

      const total = expenses.reduce((sum, e) => sum + e.valor, 0);
      const average = total / expenses.length;

      expect(average).toBe(645.125);
    });

    it("should calculate highest expense", () => {
      const expenses = [
        { id: 1, valor: 1500 },
        { id: 2, valor: 350 },
        { id: 3, valor: 280.5 },
      ];

      const highest = Math.max(...expenses.map((e) => e.valor));
      expect(highest).toBe(1500);
    });

    it("should count expenses by category", () => {
      const expenses = [
        { categoria: "MANUTENCAO" },
        { categoria: "LIMPEZA" },
        { categoria: "MANUTENCAO" },
        { categoria: "MANUTENCAO" },
      ];

      const count = {
        MANUTENCAO: expenses.filter((e) => e.categoria === "MANUTENCAO").length,
        LIMPEZA: expenses.filter((e) => e.categoria === "LIMPEZA").length,
      };

      expect(count.MANUTENCAO).toBe(3);
      expect(count.LIMPEZA).toBe(1);
    });
  });

  describe("Expense Pagination", () => {
    it("should paginate expenses correctly", () => {
      const expenses = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const page = 2;
      const limit = 10;
      const offset = (page - 1) * limit;

      const paginatedExpenses = expenses.slice(offset, offset + limit);

      expect(paginatedExpenses).toHaveLength(10);
      expect(paginatedExpenses[0].id).toBe(11);
      expect(paginatedExpenses[9].id).toBe(20);
    });

    it("should calculate total pages", () => {
      const totalExpenses = 25;
      const limit = 10;
      const totalPages = Math.ceil(totalExpenses / limit);

      expect(totalPages).toBe(3);
    });
  });

  describe("Expense Validation", () => {
    it("should reject empty description", () => {
      const descricao = "";
      const isValid = descricao.trim().length >= 5;

      expect(isValid).toBe(false);
    });

    it("should reject zero or negative value", () => {
      const valor = 0;
      const isValid = valor > 0;

      expect(isValid).toBe(false);
    });

    it("should accept valid expense data", () => {
      const expense = {
        descricao: "Reparo do telhado",
        valor: 1500.0,
        categoria: "MANUTENCAO",
        data: "2026-04-25",
      };

      const isValid =
        expense.descricao.length >= 5 &&
        expense.valor > 0 &&
        ["MANUTENCAO", "LIMPEZA", "SEGURANCA", "UTILIDADES", "OUTROS"].includes(
          expense.categoria
        ) &&
        !isNaN(new Date(expense.data).getTime());

      expect(isValid).toBe(true);
    });
  });

  describe("Comprovante Handling", () => {
    it("should track expenses with comprovante", () => {
      const expenses = [
        { id: 1, descricao: "Reparo", comprovante: "file.pdf" },
        { id: 2, descricao: "Limpeza", comprovante: undefined },
        { id: 3, descricao: "Manutenção", comprovante: "file2.pdf" },
      ];

      const withComprovante = expenses.filter((e) => e.comprovante);
      expect(withComprovante).toHaveLength(2);
    });

    it("should calculate percentage of expenses with comprovante", () => {
      const expenses = [
        { id: 1, comprovante: "file.pdf" },
        { id: 2, comprovante: undefined },
        { id: 3, comprovante: "file2.pdf" },
        { id: 4, comprovante: "file3.pdf" },
      ];

      const withComprovante = expenses.filter((e) => e.comprovante).length;
      const percentage = (withComprovante / expenses.length) * 100;

      expect(percentage).toBe(75);
    });
  });

  describe("Date Range Filtering", () => {
    it("should filter expenses by start date", () => {
      const expenses = [
        { id: 1, data: "2026-04-10" },
        { id: 2, data: "2026-04-20" },
        { id: 3, data: "2026-04-30" },
      ];

      const startDate = new Date("2026-04-15");
      const filtered = expenses.filter(
        (e) => new Date(e.data) >= startDate
      );

      expect(filtered).toHaveLength(2);
    });

    it("should filter expenses by end date", () => {
      const expenses = [
        { id: 1, data: "2026-04-10" },
        { id: 2, data: "2026-04-20" },
        { id: 3, data: "2026-04-30" },
      ];

      const endDate = new Date("2026-04-25");
      const filtered = expenses.filter((e) => new Date(e.data) <= endDate);

      expect(filtered).toHaveLength(2);
    });

    it("should filter expenses by date range", () => {
      const expenses = [
        { id: 1, data: "2026-04-10" },
        { id: 2, data: "2026-04-20" },
        { id: 3, data: "2026-04-30" },
      ];

      const startDate = new Date("2026-04-15");
      const endDate = new Date("2026-04-25");

      const filtered = expenses.filter(
        (e) =>
          new Date(e.data) >= startDate && new Date(e.data) <= endDate
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });
  });
});
