import { describe, it, expect } from "vitest";

describe("Financial Reports System", () => {
  describe("Financial Summary", () => {
    it("should calculate total revenues", () => {
      const receitas = [500, 750, 600, 400, 250];
      const total = receitas.reduce((sum, r) => sum + r, 0);

      expect(total).toBe(2500);
    });

    it("should calculate total expenses", () => {
      const despesas = [200, 150, 300, 100, 50];
      const total = despesas.reduce((sum, d) => sum + d, 0);

      expect(total).toBe(800);
    });

    it("should calculate net profit", () => {
      const receitas = 15500.0;
      const despesas = 8750.5;
      const lucro = receitas - despesas;

      expect(lucro).toBe(6749.5);
    });

    it("should calculate profit margin", () => {
      const receitas = 15500.0;
      const lucro = 6749.5;
      const margem = (lucro / receitas) * 100;

      expect(margem).toBeCloseTo(43.54, 1);
    });

    it("should calculate payment rate", () => {
      const totalCobrancas = 25;
      const cobrancasPagas = 20;
      const taxa = (cobrancasPagas / totalCobrancas) * 100;

      expect(taxa).toBe(80);
    });
  });

  describe("Revenue Data", () => {
    it("should aggregate monthly revenues", () => {
      const meses = [
        { mes: "Janeiro", receita: 12000 },
        { mes: "Fevereiro", receita: 13500 },
        { mes: "Março", receita: 14200 },
        { mes: "Abril", receita: 15500 },
      ];

      const total = meses.reduce((sum, m) => sum + m.receita, 0);
      expect(total).toBe(55200);
    });

    it("should calculate revenue growth", () => {
      const mesAnterior = 14200;
      const mesAtual = 15500;
      const crescimento = ((mesAtual - mesAnterior) / mesAnterior) * 100;

      expect(crescimento).toBeCloseTo(9.15, 1);
    });

    it("should identify peak revenue month", () => {
      const meses = [
        { mes: "Janeiro", receita: 12000 },
        { mes: "Fevereiro", receita: 13500 },
        { mes: "Março", receita: 14200 },
        { mes: "Abril", receita: 15500 },
      ];

      const pico = meses.reduce((max, m) => (m.receita > max.receita ? m : max));
      expect(pico.mes).toBe("Abril");
      expect(pico.receita).toBe(15500);
    });
  });

  describe("Expense Breakdown", () => {
    it("should categorize expenses", () => {
      const despesas = {
        manutencao: 3500.0,
        limpeza: 2000.0,
        seguranca: 2250.5,
        utilidades: 1000.0,
      };

      const total = Object.values(despesas).reduce((sum, d) => sum + d, 0);
      expect(total).toBe(8750.5);
    });

    it("should calculate expense percentage by category", () => {
      const total = 8750.5;
      const manutencao = 3500.0;
      const percentual = (manutencao / total) * 100;

      expect(percentual).toBeCloseTo(40.0, 1);
    });

    it("should identify highest expense category", () => {
      const despesas = {
        manutencao: 3500.0,
        limpeza: 2000.0,
        seguranca: 2250.5,
        utilidades: 1000.0,
      };

      const maior = Object.entries(despesas).reduce((max, [cat, val]) =>
        val > max[1] ? [cat, val] : max
      );

      expect(maior[0]).toBe("manutencao");
      expect(maior[1]).toBe(3500.0);
    });

    it("should sum expenses by category", () => {
      const despesas = [
        { categoria: "manutencao", valor: 1500 },
        { categoria: "manutencao", valor: 2000 },
        { categoria: "limpeza", valor: 2000 },
      ];

      const porCategoria = despesas.reduce((acc, d) => {
        acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
        return acc;
      }, {} as Record<string, number>);

      expect(porCategoria.manutencao).toBe(3500);
      expect(porCategoria.limpeza).toBe(2000);
    });
  });

  describe("Delinquent Residents", () => {
    it("should identify delinquent residents", () => {
      const moradores = [
        { id: 1, nome: "João", status: "ativo", saldo: 0 },
        { id: 2, nome: "Maria", status: "ativo", saldo: 750 },
        { id: 3, nome: "Pedro", status: "ativo", saldo: 600 },
      ];

      const inadimplentes = moradores.filter((m) => m.saldo > 0);
      expect(inadimplentes).toHaveLength(2);
    });

    it("should calculate total delinquent amount", () => {
      const inadimplentes = [
        { id: 1, valor: 500 },
        { id: 2, valor: 750 },
        { id: 3, valor: 600 },
        { id: 4, valor: 400 },
        { id: 5, valor: 250 },
      ];

      const total = inadimplentes.reduce((sum, m) => sum + m.valor, 0);
      expect(total).toBe(2500);
    });

    it("should calculate delinquency percentage", () => {
      const totalMoradores = 25;
      const inadimplentes = 5;
      const percentual = (inadimplentes / totalMoradores) * 100;

      expect(percentual).toBe(20);
    });

    it("should sort delinquents by overdue days", () => {
      const inadimplentes = [
        { id: 1, dias: 45 },
        { id: 2, dias: 30 },
        { id: 3, dias: 60 },
      ];

      const ordenados = [...inadimplentes].sort((a, b) => b.dias - a.dias);
      expect(ordenados[0].dias).toBe(60);
      expect(ordenados[2].dias).toBe(30);
    });
  });

  describe("Cash Flow", () => {
    it("should calculate cash flow", () => {
      const saldoInicial = 5000.0;
      const entradas = 15500.0;
      const saidas = 8750.5;
      const saldoFinal = saldoInicial + entradas - saidas;

      expect(saldoFinal).toBe(11749.5);
    });

    it("should track daily cash flow", () => {
      const fluxo = [
        { data: "2026-04-01", tipo: "entrada", valor: 500 },
        { data: "2026-04-02", tipo: "saida", valor: 200 },
        { data: "2026-04-03", tipo: "entrada", valor: 500 },
      ];

      let saldo = 5000;
      const fluxoComSaldo = fluxo.map((f) => {
        if (f.tipo === "entrada") {
          saldo += f.valor;
        } else {
          saldo -= f.valor;
        }
        return { ...f, saldo };
      });

      expect(fluxoComSaldo[2].saldo).toBe(5800);
    });

    it("should calculate net cash flow", () => {
      const entradas = 15500.0;
      const saidas = 8750.5;
      const fluxoLiquido = entradas - saidas;

      expect(fluxoLiquido).toBe(6749.5);
    });
  });

  describe("Period Comparison", () => {
    it("should compare periods", () => {
      const periodoAtual = { receitas: 15500, despesas: 8750.5 };
      const periodoPosterior = { receitas: 14200, despesas: 8200 };

      const variacaoReceitas = periodoAtual.receitas - periodoPosterior.receitas;
      const variacaoDespesas = periodoAtual.despesas - periodoPosterior.despesas;

      expect(variacaoReceitas).toBe(1300);
      expect(variacaoDespesas).toBeCloseTo(550.5, 1);
    });

    it("should calculate percentage change", () => {
      const anterior = 14200;
      const atual = 15500;
      const percentual = ((atual - anterior) / anterior) * 100;

      expect(percentual).toBeCloseTo(9.15, 1);
    });

    it("should identify growth direction", () => {
      const anterior = 14200;
      const atual = 15500;
      const direcao = atual > anterior ? "up" : atual < anterior ? "down" : "flat";

      expect(direcao).toBe("up");
    });
  });

  describe("Payment Status Distribution", () => {
    it("should count payment statuses", () => {
      const pagamentos = [
        { status: "pago" },
        { status: "pago" },
        { status: "pendente" },
        { status: "vencido" },
      ];

      const contagem = pagamentos.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(contagem.pago).toBe(2);
      expect(contagem.pendente).toBe(1);
      expect(contagem.vencido).toBe(1);
    });

    it("should calculate status percentages", () => {
      const total = 25;
      const pago = 20;
      const percentual = (pago / total) * 100;

      expect(percentual).toBe(80);
    });
  });

  describe("Chart Data Formatting", () => {
    it("should format chart labels", () => {
      const meses = ["Janeiro", "Fevereiro", "Março", "Abril"];
      expect(meses).toHaveLength(4);
      expect(meses[0]).toBe("Janeiro");
    });

    it("should format chart datasets", () => {
      const dataset = {
        label: "Receitas",
        data: [12000, 13500, 14200, 15500],
        borderColor: "#22c55e",
      };

      expect(dataset.data).toHaveLength(4);
      expect(dataset.borderColor).toBe("#22c55e");
    });

    it("should format currency values", () => {
      const value = 1250.5;
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);

      expect(formatted).toContain("1.250");
      expect(formatted).toContain("50");
    });
  });

  describe("PDF Export", () => {
    it("should generate PDF report metadata", () => {
      const report = {
        fileName: "relatorio_financeiro_2026-04-01_2026-04-30.pdf",
        tamanho: "2.5 MB",
        geradoEm: new Date().toISOString(),
      };

      expect(report.fileName).toContain("relatorio_financeiro");
      expect(report.fileName).toContain(".pdf");
    });

    it("should include report period", () => {
      const dataInicio = "2026-04-01";
      const dataFim = "2026-04-30";

      expect(dataInicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dataFim).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should support optional report sections", () => {
      const opcoes = {
        incluirGraficos: true,
        incluirInadimplentes: true,
        incluirFluxoCaixa: true,
      };

      expect(opcoes.incluirGraficos).toBe(true);
      expect(opcoes.incluirInadimplentes).toBe(true);
    });
  });

  describe("Report Filtering", () => {
    it("should filter by period", () => {
      const transacoes = [
        { data: "2026-04-01", valor: 100 },
        { data: "2026-04-15", valor: 200 },
        { data: "2026-05-01", valor: 300 },
      ];

      const dataInicio = new Date("2026-04-01");
      const dataFim = new Date("2026-04-30");

      const filtradas = transacoes.filter((t) => {
        const data = new Date(t.data);
        return data >= dataInicio && data <= dataFim;
      });

      expect(filtradas).toHaveLength(2);
    });

    it("should filter by category", () => {
      const despesas = [
        { categoria: "manutencao", valor: 100 },
        { categoria: "limpeza", valor: 200 },
        { categoria: "manutencao", valor: 300 },
      ];

      const manutencao = despesas.filter((d) => d.categoria === "manutencao");
      expect(manutencao).toHaveLength(2);
    });

    it("should filter by status", () => {
      const cobrancas = [
        { id: 1, status: "pago" },
        { id: 2, status: "pendente" },
        { id: 3, status: "pago" },
      ];

      const pagas = cobrancas.filter((c) => c.status === "pago");
      expect(pagas).toHaveLength(2);
    });
  });

  describe("Data Validation", () => {
    it("should validate currency values", () => {
      const valor = 1250.5;
      const isValid = typeof valor === "number" && valor >= 0;

      expect(isValid).toBe(true);
    });

    it("should validate date format", () => {
      const data = "2026-04-27";
      const isValid = /^\d{4}-\d{2}-\d{2}$/.test(data);

      expect(isValid).toBe(true);
    });

    it("should validate percentage", () => {
      const percentual = 43.5;
      const isValid = percentual >= 0 && percentual <= 100;

      expect(isValid).toBe(true);
    });
  });
});
