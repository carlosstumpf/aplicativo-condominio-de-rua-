import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export const exportarPdfRouter = router({
  gerarInadimplentes: publicProcedure
    .input(
      z.object({
        filtro: z.enum(["todos", "critico", "medio"]).optional(),
        ordenacao: z.enum(["nome", "valor", "dias"]).optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock data for delinquent residents
      const moradores = [
        {
          id: 1,
          nome: "João Silva",
          casa: "101",
          bloco: "A",
          telefone: "(11) 98765-4321",
          email: "joao@email.com",
          totalDevido: 2500.0,
          cobrancasVencidas: 3,
          diasAtraso: 45,
          ultimoPagamento: "2026-02-15",
          dataCadastro: "2020-01-10",
        },
        {
          id: 2,
          nome: "Maria Santos",
          casa: "205",
          bloco: "B",
          telefone: "(11) 91234-5678",
          email: "maria@email.com",
          totalDevido: 1800.0,
          cobrancasVencidas: 2,
          diasAtraso: 32,
          ultimoPagamento: "2026-02-20",
          dataCadastro: "2021-05-15",
        },
        {
          id: 3,
          nome: "Carlos Oliveira",
          casa: "308",
          bloco: "C",
          telefone: "(11) 99876-5432",
          email: "carlos@email.com",
          totalDevido: 950.0,
          cobrancasVencidas: 1,
          diasAtraso: 18,
          ultimoPagamento: "2026-03-01",
          dataCadastro: "2019-11-20",
        },
        {
          id: 4,
          nome: "Ana Costa",
          casa: "402",
          bloco: "A",
          telefone: "(11) 98765-1234",
          email: "ana@email.com",
          totalDevido: 3200.0,
          cobrancasVencidas: 4,
          diasAtraso: 60,
          ultimoPagamento: "2026-01-10",
          dataCadastro: "2018-03-05",
        },
        {
          id: 5,
          nome: "Pedro Ferreira",
          casa: "501",
          bloco: "B",
          telefone: "(11) 91111-2222",
          email: "pedro@email.com",
          totalDevido: 1200.0,
          cobrancasVencidas: 2,
          diasAtraso: 25,
          ultimoPagamento: "2026-02-25",
          dataCadastro: "2022-07-12",
        },
      ];

      // Filter based on risk level
      let filtered = moradores;
      if (input.filtro === "critico") {
        filtered = moradores.filter((m) => m.diasAtraso > 30);
      } else if (input.filtro === "medio") {
        filtered = moradores.filter((m) => m.diasAtraso > 15 && m.diasAtraso <= 30);
      }

      // Sort
      if (input.ordenacao === "valor") {
        filtered.sort((a, b) => b.totalDevido - a.totalDevido);
      } else if (input.ordenacao === "dias") {
        filtered.sort((a, b) => b.diasAtraso - a.diasAtraso);
      } else {
        filtered.sort((a, b) => a.nome.localeCompare(b.nome));
      }

      const totalDevido = filtered.reduce((sum, m) => sum + m.totalDevido, 0);

      return {
        condominioNome: "Condomínio Rua Principal",
        dataGeracao: new Date().toISOString(),
        moradores: filtered,
        totalMoradores: filtered.length,
        totalDevido,
        geradoPor: "Admin",
      };
    }),

  gerarRelatorioHTML: publicProcedure
    .input(
      z.object({
        filtro: z.enum(["todos", "critico", "medio"]).optional(),
        ordenacao: z.enum(["nome", "valor", "dias"]).optional(),
      })
    )
    .query(async ({ input }) => {
      // Get data
      const moradores = [
        {
          id: 1,
          nome: "João Silva",
          casa: "101",
          bloco: "A",
          telefone: "(11) 98765-4321",
          email: "joao@email.com",
          totalDevido: 2500.0,
          cobrancasVencidas: 3,
          diasAtraso: 45,
          ultimoPagamento: "2026-02-15",
          dataCadastro: "2020-01-10",
        },
        {
          id: 2,
          nome: "Maria Santos",
          casa: "205",
          bloco: "B",
          telefone: "(11) 91234-5678",
          email: "maria@email.com",
          totalDevido: 1800.0,
          cobrancasVencidas: 2,
          diasAtraso: 32,
          ultimoPagamento: "2026-02-20",
          dataCadastro: "2021-05-15",
        },
        {
          id: 3,
          nome: "Carlos Oliveira",
          casa: "308",
          bloco: "C",
          telefone: "(11) 99876-5432",
          email: "carlos@email.com",
          totalDevido: 950.0,
          cobrancasVencidas: 1,
          diasAtraso: 18,
          ultimoPagamento: "2026-03-01",
          dataCadastro: "2019-11-20",
        },
        {
          id: 4,
          nome: "Ana Costa",
          casa: "402",
          bloco: "A",
          telefone: "(11) 98765-1234",
          email: "ana@email.com",
          totalDevido: 3200.0,
          cobrancasVencidas: 4,
          diasAtraso: 60,
          ultimoPagamento: "2026-01-10",
          dataCadastro: "2018-03-05",
        },
        {
          id: 5,
          nome: "Pedro Ferreira",
          casa: "501",
          bloco: "B",
          telefone: "(11) 91111-2222",
          email: "pedro@email.com",
          totalDevido: 1200.0,
          cobrancasVencidas: 2,
          diasAtraso: 25,
          ultimoPagamento: "2026-02-25",
          dataCadastro: "2022-07-12",
        },
      ];

      // Filter based on risk level
      let filtered = moradores;
      if (input.filtro === "critico") {
        filtered = moradores.filter((m) => m.diasAtraso > 30);
      } else if (input.filtro === "medio") {
        filtered = moradores.filter((m) => m.diasAtraso > 15 && m.diasAtraso <= 30);
      }

      // Sort
      if (input.ordenacao === "valor") {
        filtered.sort((a, b) => b.totalDevido - a.totalDevido);
      } else if (input.ordenacao === "dias") {
        filtered.sort((a, b) => b.diasAtraso - a.diasAtraso);
      } else {
        filtered.sort((a, b) => a.nome.localeCompare(b.nome));
      }

      const totalDevido = filtered.reduce((sum, m) => sum + m.totalDevido, 0);

      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value);
      };

      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-BR");
      };

      const getRiskLevel = (diasAtraso: number) => {
        if (diasAtraso > 30) return "ALTO";
        if (diasAtraso > 15) return "MÉDIO";
        return "BAIXO";
      };

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Inadimplentes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      color: #1a1a1a;
      font-size: 24px;
    }
    .header h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #555;
    }
    .summary-box {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    .summary-box h3 {
      margin: 0 0 10px 0;
      font-size: 12px;
      color: #1a1a1a;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    thead {
      background-color: #003366;
      color: white;
    }
    th {
      padding: 8px;
      text-align: left;
      font-weight: bold;
      font-size: 10px;
      border-bottom: 2px solid #000;
    }
    td {
      padding: 8px;
      font-size: 10px;
      border-bottom: 1px solid #ddd;
    }
    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .currency {
      text-align: right;
    }
    .center {
      text-align: center;
    }
    .risk-high {
      color: #d32f2f;
      font-weight: bold;
    }
    .risk-medium {
      color: #f57c00;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 9px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Condomínio Rua Principal</h1>
      <h2>Relatório de Moradores Inadimplentes</h2>
      <div class="info-row">
        <span>Data de Geração: ${formatDate(new Date().toISOString())}</span>
        <span>Gerado por: Admin</span>
      </div>
    </div>

    <div class="summary-box">
      <h3>Resumo Executivo</h3>
      <div class="summary-row">
        <span>Total de Moradores Inadimplentes:</span>
        <strong>${filtered.length}</strong>
      </div>
      <div class="summary-row">
        <span>Valor Total em Atraso:</span>
        <strong>${formatCurrency(totalDevido)}</strong>
      </div>
      <div class="summary-row">
        <span>Média por Morador:</span>
        <strong>${formatCurrency(totalDevido / filtered.length)}</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Morador</th>
          <th>Casa</th>
          <th>Telefone</th>
          <th>Email</th>
          <th class="currency">Valor Devido</th>
          <th class="center">Dias Atraso</th>
          <th class="center">Risco</th>
        </tr>
      </thead>
      <tbody>
        ${filtered
          .map(
            (morador) => `
        <tr>
          <td>${morador.nome}</td>
          <td>${morador.casa}${morador.bloco ? ` / ${morador.bloco}` : ""}</td>
          <td>${morador.telefone}</td>
          <td>${morador.email}</td>
          <td class="currency">${formatCurrency(morador.totalDevido)}</td>
          <td class="center">${morador.diasAtraso}</td>
          <td class="center ${getRiskLevel(morador.diasAtraso) === "ALTO" ? "risk-high" : getRiskLevel(morador.diasAtraso) === "MÉDIO" ? "risk-medium" : ""}">
            ${getRiskLevel(morador.diasAtraso)}
          </td>
        </tr>
      `
          )
          .join("")}
      </tbody>
    </table>

    <div class="footer">
      <p>Este relatório foi gerado automaticamente pelo sistema de gestão de condomínio.</p>
      <p>Para mais informações, entre em contato com a administração.</p>
    </div>
  </div>
</body>
</html>`;

      return {
        html,
        filename: `inadimplentes_${new Date().toISOString().split("T")[0]}.html`,
      };
    }),
});
