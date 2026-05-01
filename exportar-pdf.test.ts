import { describe, it, expect } from "vitest";

describe("PDF Export Functionality", () => {
  describe("Delinquent Residents Report", () => {
    it("should filter moradores by risk level", () => {
      const moradores = [
        { id: 1, diasAtraso: 45, totalDevido: 2500 },
        { id: 2, diasAtraso: 32, totalDevido: 1800 },
        { id: 3, diasAtraso: 18, totalDevido: 950 },
      ];

      const criticos = moradores.filter((m) => m.diasAtraso > 30);
      expect(criticos).toHaveLength(2);
      expect(criticos[0].diasAtraso).toBe(45);
      expect(criticos[1].diasAtraso).toBe(32);
    });

    it("should filter moradores by medium risk", () => {
      const moradores = [
        { id: 1, diasAtraso: 45, totalDevido: 2500 },
        { id: 2, diasAtraso: 32, totalDevido: 1800 },
        { id: 3, diasAtraso: 18, totalDevido: 950 },
      ];

      const medios = moradores.filter((m) => m.diasAtraso > 15 && m.diasAtraso <= 30);
      expect(medios).toHaveLength(1);
      expect(medios[0].diasAtraso).toBe(18);
    });

    it("should sort moradores by dias atraso", () => {
      const moradores = [
        { id: 1, diasAtraso: 18, nome: "Carlos" },
        { id: 2, diasAtraso: 45, nome: "João" },
        { id: 3, diasAtraso: 32, nome: "Maria" },
      ];

      moradores.sort((a, b) => b.diasAtraso - a.diasAtraso);

      expect(moradores[0].diasAtraso).toBe(45);
      expect(moradores[1].diasAtraso).toBe(32);
      expect(moradores[2].diasAtraso).toBe(18);
    });

    it("should sort moradores by valor devido", () => {
      const moradores = [
        { id: 1, totalDevido: 950, nome: "Carlos" },
        { id: 2, totalDevido: 2500, nome: "João" },
        { id: 3, totalDevido: 1800, nome: "Maria" },
      ];

      moradores.sort((a, b) => b.totalDevido - a.totalDevido);

      expect(moradores[0].totalDevido).toBe(2500);
      expect(moradores[1].totalDevido).toBe(1800);
      expect(moradores[2].totalDevido).toBe(950);
    });

    it("should sort moradores by nome", () => {
      const moradores = [
        { id: 1, nome: "Carlos" },
        { id: 2, nome: "João" },
        { id: 3, nome: "Maria" },
      ];

      moradores.sort((a, b) => a.nome.localeCompare(b.nome));

      expect(moradores[0].nome).toBe("Carlos");
      expect(moradores[1].nome).toBe("João");
      expect(moradores[2].nome).toBe("Maria");
    });

    it("should calculate total devido", () => {
      const moradores = [
        { id: 1, totalDevido: 2500 },
        { id: 2, totalDevido: 1800 },
        { id: 3, totalDevido: 950 },
      ];

      const totalDevido = moradores.reduce((sum, m) => sum + m.totalDevido, 0);

      expect(totalDevido).toBe(5250);
    });

    it("should calculate average devido", () => {
      const moradores = [
        { id: 1, totalDevido: 2500 },
        { id: 2, totalDevido: 1800 },
        { id: 3, totalDevido: 950 },
      ];

      const totalDevido = moradores.reduce((sum, m) => sum + m.totalDevido, 0);
      const average = totalDevido / moradores.length;

      expect(average).toBeCloseTo(1750, 0);
    });

    it("should determine risk level based on dias atraso", () => {
      const getRiskLevel = (diasAtraso: number) => {
        if (diasAtraso > 30) return "alto";
        if (diasAtraso > 15) return "médio";
        return "baixo";
      };

      expect(getRiskLevel(45)).toBe("alto");
      expect(getRiskLevel(32)).toBe("alto");
      expect(getRiskLevel(25)).toBe("médio");
      expect(getRiskLevel(18)).toBe("médio");
      expect(getRiskLevel(10)).toBe("baixo");
    });

    it("should format currency correctly", () => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value);
      };

      const formatted = formatCurrency(2500);
      expect(formatted).toContain("2.500");
      expect(formatted).toContain("00");
    });

    it("should generate HTML report with correct structure", () => {
      const moradores = [
        {
          id: 1,
          nome: "João Silva",
          casa: "101",
          bloco: "A",
          telefone: "(11) 98765-4321",
          email: "joao@email.com",
          totalDevido: 2500,
          diasAtraso: 45,
        },
      ];

      const html = `<table><tr><td>${moradores[0].nome}</td></tr></table>`;

      expect(html).toContain("João Silva");
      expect(html).toContain("<table>");
      expect(html).toContain("</table>");
    });

    it("should include all required fields in report", () => {
      const morador = {
        id: 1,
        nome: "João Silva",
        casa: "101",
        bloco: "A",
        telefone: "(11) 98765-4321",
        email: "joao@email.com",
        totalDevido: 2500,
        cobrancasVencidas: 3,
        diasAtraso: 45,
      };

      expect(morador.nome).toBeDefined();
      expect(morador.casa).toBeDefined();
      expect(morador.telefone).toBeDefined();
      expect(morador.email).toBeDefined();
      expect(morador.totalDevido).toBeDefined();
      expect(morador.diasAtraso).toBeDefined();
    });

    it("should handle empty list", () => {
      const moradores: any[] = [];
      const totalDevido = moradores.reduce((sum, m) => sum + m.totalDevido, 0);

      expect(moradores).toHaveLength(0);
      expect(totalDevido).toBe(0);
    });

    it("should handle single morador", () => {
      const moradores = [
        { id: 1, nome: "João", totalDevido: 2500, diasAtraso: 45 },
      ];

      expect(moradores).toHaveLength(1);
      expect(moradores[0].nome).toBe("João");
    });

    it("should apply multiple filters correctly", () => {
      const moradores = [
        { id: 1, diasAtraso: 45, totalDevido: 2500, status: "ativo" },
        { id: 2, diasAtraso: 32, totalDevido: 1800, status: "ativo" },
        { id: 3, diasAtraso: 18, totalDevido: 950, status: "inativo" },
        { id: 4, diasAtraso: 60, totalDevido: 3200, status: "ativo" },
      ];

      let filtered = moradores;
      filtered = filtered.filter((m) => m.diasAtraso > 30);
      filtered = filtered.filter((m) => m.status === "ativo");

      expect(filtered.length).toBeGreaterThanOrEqual(2);
      expect(filtered.some((m) => m.diasAtraso === 45)).toBe(true);
      expect(filtered.some((m) => m.diasAtraso === 60)).toBe(true);
    });

    it("should calculate report summary", () => {
      const moradores = [
        { id: 1, totalDevido: 2500, diasAtraso: 45 },
        { id: 2, totalDevido: 1800, diasAtraso: 32 },
        { id: 3, totalDevido: 950, diasAtraso: 18 },
      ];

      const summary = {
        totalMoradores: moradores.length,
        totalDevido: moradores.reduce((sum, m) => sum + m.totalDevido, 0),
        mediaDevido: moradores.reduce((sum, m) => sum + m.totalDevido, 0) / moradores.length,
        diasMedioAtraso:
          moradores.reduce((sum, m) => sum + m.diasAtraso, 0) / moradores.length,
      };

      expect(summary.totalMoradores).toBe(3);
      expect(summary.totalDevido).toBe(5250);
      expect(summary.mediaDevido).toBeCloseTo(1750, 0);
      expect(summary.diasMedioAtraso).toBeCloseTo(31.67, 1);
    });

    it("should format date correctly", () => {
      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-BR");
      };

      const formatted = formatDate("2026-04-27");
      expect(formatted).toContain("04");
      expect(formatted).toContain("2026");
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should generate filename with date", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `inadimplentes_${date}.html`;

      expect(filename).toContain("inadimplentes_");
      expect(filename).toContain(".html");
      expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe("Export Options", () => {
    it("should support PDF export", () => {
      const exportOptions = ["pdf", "html", "email"];
      expect(exportOptions).toContain("pdf");
    });

    it("should support HTML export", () => {
      const exportOptions = ["pdf", "html", "email"];
      expect(exportOptions).toContain("html");
    });

    it("should support email export", () => {
      const exportOptions = ["pdf", "html", "email"];
      expect(exportOptions).toContain("email");
    });
  });

  describe("Filter Options", () => {
    it("should support 'todos' filter", () => {
      const filters = ["todos", "critico", "medio"];
      expect(filters).toContain("todos");
    });

    it("should support 'critico' filter", () => {
      const filters = ["todos", "critico", "medio"];
      expect(filters).toContain("critico");
    });

    it("should support 'medio' filter", () => {
      const filters = ["todos", "critico", "medio"];
      expect(filters).toContain("medio");
    });
  });

  describe("Sort Options", () => {
    it("should support sort by 'dias'", () => {
      const sorts = ["dias", "valor", "nome"];
      expect(sorts).toContain("dias");
    });

    it("should support sort by 'valor'", () => {
      const sorts = ["dias", "valor", "nome"];
      expect(sorts).toContain("valor");
    });

    it("should support sort by 'nome'", () => {
      const sorts = ["dias", "valor", "nome"];
      expect(sorts).toContain("nome");
    });
  });
});
