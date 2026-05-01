import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * Financial Reports Router
 * Provides endpoints for financial data aggregation and reporting
 */
export const relatoriosFinanceirosRouter = router({
  /**
   * Get financial summary for a given period
   */
  getSummary: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
      })
    )
    .query(({ input }) => {
      const { dataInicio, dataFim } = input;

      // Mock data - in production, query from database
      return {
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
        },
        resumo: {
          totalReceitas: 15500.0,
          totalDespesas: 8750.5,
          lucroLiquido: 6749.5,
          taxaLucro: 43.5,
        },
        cobrancas: {
          total: 25,
          pagas: 20,
          pendentes: 3,
          vencidas: 2,
          taxaPagamento: 80.0,
        },
        despesas: {
          total: 8750.5,
          porCategoria: {
            manutencao: 3500.0,
            limpeza: 2000.0,
            seguranca: 2250.5,
            utilidades: 1000.0,
          },
        },
        inadimplentes: {
          total: 5,
          valorTotal: 2500.0,
          percentualMoradores: 20.0,
        },
      };
    }),

  /**
   * Get revenue data for chart
   */
  getRevenueData: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
        granularidade: z.enum(["dia", "semana", "mes"]).default("mes"),
      })
    )
    .query(({ input }) => {
      // Mock data for chart
      return {
        labels: ["Janeiro", "Fevereiro", "Março", "Abril"],
        datasets: [
          {
            label: "Receitas",
            data: [12000, 13500, 14200, 15500],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
          },
          {
            label: "Despesas",
            data: [7500, 8000, 8200, 8750.5],
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
          },
        ],
      };
    }),

  /**
   * Get expense breakdown by category
   */
  getExpensesByCategory: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        labels: ["Manutenção", "Limpeza", "Segurança", "Utilidades"],
        datasets: [
          {
            label: "Despesas por Categoria",
            data: [3500, 2000, 2250.5, 1000],
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(34, 197, 94, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(168, 85, 247, 0.8)",
            ],
            borderColor: [
              "rgb(59, 130, 246)",
              "rgb(34, 197, 94)",
              "rgb(249, 115, 22)",
              "rgb(168, 85, 247)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }),

  /**
   * Get delinquent residents data
   */
  getDelinquentResidents: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        total: 5,
        residentes: [
          {
            id: 1,
            nome: "João Silva",
            casa: "101",
            valorDevido: 500.0,
            diasVencido: 45,
            cobrancas: 2,
          },
          {
            id: 2,
            nome: "Maria Santos",
            casa: "205",
            valorDevido: 750.0,
            diasVencido: 30,
            cobrancas: 1,
          },
          {
            id: 3,
            nome: "Pedro Oliveira",
            casa: "312",
            valorDevido: 600.0,
            diasVencido: 60,
            cobrancas: 3,
          },
          {
            id: 4,
            nome: "Ana Costa",
            casa: "408",
            valorDevido: 400.0,
            diasVencido: 15,
            cobrancas: 1,
          },
          {
            id: 5,
            nome: "Carlos Mendes",
            casa: "501",
            valorDevido: 250.0,
            diasVencido: 90,
            cobrancas: 4,
          },
        ],
        valorTotal: 2500.0,
      };
    }),

  /**
   * Get monthly evolution data
   */
  getMonthlyEvolution: publicProcedure
    .input(
      z.object({
        ano: z.number(),
      })
    )
    .query(({ input }) => {
      const meses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];

      return {
        ano: input.ano,
        labels: meses,
        datasets: [
          {
            label: "Receitas",
            data: [
              10000, 11500, 12000, 13500, 14200, 15000, 14800, 15200, 15500,
              16000, 16200, 15500,
            ],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.4,
          },
          {
            label: "Despesas",
            data: [
              6000, 6500, 7000, 7500, 8000, 8200, 8000, 8100, 8200, 8300,
              8400, 8750.5,
            ],
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
          },
          {
            label: "Lucro",
            data: [
              4000, 5000, 5000, 6000, 6200, 6800, 6800, 7100, 7300, 7700,
              7800, 6749.5,
            ],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
          },
        ],
      };
    }),

  /**
   * Get payment status distribution
   */
  getPaymentStatus: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        labels: ["Pago", "Pendente", "Vencido"],
        datasets: [
          {
            label: "Status de Pagamentos",
            data: [20, 3, 2],
            backgroundColor: [
              "rgba(34, 197, 94, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderColor: [
              "rgb(34, 197, 94)",
              "rgb(249, 115, 22)",
              "rgb(239, 68, 68)",
            ],
            borderWidth: 1,
          },
        ],
      };
    }),

  /**
   * Generate PDF report
   */
  generatePDFReport: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
        incluirGraficos: z.boolean().default(true),
        incluirInadimplentes: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const { dataInicio, dataFim, incluirGraficos, incluirInadimplentes } =
        input;

      // In production, use a PDF library like pdfkit or reportlab
      // For now, return mock response indicating PDF generation
      return {
        success: true,
        message: "PDF report generated successfully",
        fileName: `relatorio_financeiro_${dataInicio}_${dataFim}.pdf`,
        downloadUrl: `/downloads/relatorio_financeiro_${dataInicio}_${dataFim}.pdf`,
        tamanho: "2.5 MB",
        geradoEm: new Date().toISOString(),
      };
    }),

  /**
   * Get comparison with previous period
   */
  getComparison: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        periodoAtual: {
          receitas: 15500.0,
          despesas: 8750.5,
          lucro: 6749.5,
        },
        periodoPosterior: {
          receitas: 14200.0,
          despesas: 8200.0,
          lucro: 6000.0,
        },
        variacao: {
          receitas: {
            valor: 1300.0,
            percentual: 9.15,
            direcao: "up",
          },
          despesas: {
            valor: 550.5,
            percentual: 6.71,
            direcao: "up",
          },
          lucro: {
            valor: 749.5,
            percentual: 12.49,
            direcao: "up",
          },
        },
      };
    }),

  /**
   * Get cash flow data
   */
  getCashFlow: publicProcedure
    .input(
      z.object({
        dataInicio: z.string(),
        dataFim: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        saldoInicial: 5000.0,
        entradas: 15500.0,
        saidas: 8750.5,
        saldoFinal: 11749.5,
        fluxo: [
          {
            data: "2026-04-01",
            tipo: "entrada",
            descricao: "Cobrança - Morador 101",
            valor: 500.0,
            saldo: 5500.0,
          },
          {
            data: "2026-04-02",
            tipo: "saida",
            descricao: "Despesa - Limpeza",
            valor: 200.0,
            saldo: 5300.0,
          },
          {
            data: "2026-04-03",
            tipo: "entrada",
            descricao: "Cobrança - Morador 205",
            valor: 500.0,
            saldo: 5800.0,
          },
        ],
      };
    }),
});
