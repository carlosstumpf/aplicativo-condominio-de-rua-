/**
 * Comprehensive Reporting and Export Database Operations
 * Handle financial reports, delinquency tracking, and data export
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

export interface RelatorioFinanceiro {
  periodo: {
    dataInicio: Date;
    dataFim: Date;
  };
  receita: {
    total: number;
    pix: number;
    boleto: number;
    transferencia: number;
  };
  despesas: {
    total: number;
    porCategoria: Record<string, number>;
  };
  saldo: number;
  moradores: {
    total: number;
    comAtraso: number;
    emDia: number;
    inadimplentes: number;
  };
}

export interface RelatorioInadimplencia {
  moradorId: number;
  moradorNome: string;
  email: string;
  telefone: string;
  diasAtraso: number;
  valorAtraso: number;
  ultimoPagamento?: Date;
  proximoVencimento: Date;
  historicoPagamentos: number; // Quantidade de pagamentos em dia
}

export interface RelatorioBancario {
  data: Date;
  descricao: string;
  tipo: "receita" | "despesa";
  valor: number;
  saldo: number;
  referencia?: string;
}

/**
 * Get financial report for period
 */
export async function getFinancialReport(
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioFinanceiro | null> {
  try {
    // Get revenue by payment method
    const receitaResult = await db.execute(sql`
      SELECT
        SUM(valor) as total,
        SUM(CASE WHEN metodo_pagamento = 'pix' THEN valor ELSE 0 END) as pix,
        SUM(CASE WHEN metodo_pagamento = 'boleto' THEN valor ELSE 0 END) as boleto,
        SUM(CASE WHEN metodo_pagamento = 'transferencia' THEN valor ELSE 0 END) as transferencia
      FROM pagamentos
      WHERE status = 'confirmado'
      AND data_pagamento >= ${dataInicio}
      AND data_pagamento <= ${dataFim}
    `);

    const receitaRow = receitaResult.rows?.[0] as any;
    const receita = {
      total: parseFloat(receitaRow?.total || "0"),
      pix: parseFloat(receitaRow?.pix || "0"),
      boleto: parseFloat(receitaRow?.boleto || "0"),
      transferencia: parseFloat(receitaRow?.transferencia || "0"),
    };

    // Get expenses by category
    const despesasResult = await db.execute(sql`
      SELECT
        SUM(valor) as total,
        dc.nome as categoria,
        SUM(valor) as valor_categoria
      FROM despesas d
      LEFT JOIN despesas_categorias dc ON d.categoria = dc.id
      WHERE d.status = 'paga'
      AND d.data >= ${dataInicio}
      AND d.data <= ${dataFim}
      GROUP BY dc.nome
    `);

    const despesasRows = despesasResult.rows || [];
    const despesas = {
      total: despesasRows.reduce((sum: number, row: any) => sum + parseFloat(row.total || "0"), 0),
      porCategoria: Object.fromEntries(
        despesasRows.map((row: any) => [row.categoria || "Sem categoria", parseFloat(row.valor_categoria || "0")])
      ),
    };

    // Get resident statistics
    const moradoresResult = await db.execute(sql`
      SELECT
        COUNT(DISTINCT m.id) as total,
        SUM(CASE WHEN p.status = 'atrasado' THEN 1 ELSE 0 END) as com_atraso,
        SUM(CASE WHEN p.status = 'em_dia' THEN 1 ELSE 0 END) as em_dia,
        SUM(CASE WHEN p.status = 'inadimplente' THEN 1 ELSE 0 END) as inadimplentes
      FROM moradores m
      LEFT JOIN pagamentos p ON m.id = p.morador_id
    `);

    const moradoresRow = moradoresResult.rows?.[0] as any;
    const moradores = {
      total: parseInt(moradoresRow?.total || "0"),
      comAtraso: parseInt(moradoresRow?.com_atraso || "0"),
      emDia: parseInt(moradoresRow?.em_dia || "0"),
      inadimplentes: parseInt(moradoresRow?.inadimplentes || "0"),
    };

    const saldo = receita.total - despesas.total;

    return {
      periodo: { dataInicio, dataFim },
      receita,
      despesas,
      saldo,
      moradores,
    };
  } catch (error) {
    console.error("Error getting financial report:", error);
    return null;
  }
}

/**
 * Get delinquency report
 */
export async function getDelinquencyReport(): Promise<RelatorioInadimplencia[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        m.id as morador_id,
        m.nome as morador_nome,
        m.email,
        m.telefone,
        EXTRACT(DAY FROM NOW() - p.data_vencimento) as dias_atraso,
        SUM(p.valor) as valor_atraso,
        MAX(p.data_pagamento) as ultimo_pagamento,
        MIN(p.data_vencimento) as proximo_vencimento,
        COUNT(CASE WHEN p.status = 'confirmado' THEN 1 END) as historico_pagamentos
      FROM moradores m
      LEFT JOIN pagamentos p ON m.id = p.morador_id
      WHERE p.status IN ('pendente', 'atrasado')
      AND p.data_vencimento < NOW()
      GROUP BY m.id, m.nome, m.email, m.telefone
      ORDER BY dias_atraso DESC
    `);

    return (result.rows || []) as RelatorioInadimplencia[];
  } catch (error) {
    console.error("Error getting delinquency report:", error);
    return [];
  }
}

/**
 * Get bank reconciliation report
 */
export async function getBankReconciliationReport(
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioBancario[]> {
  try {
    const result = await db.execute(sql`
      SELECT
        data_pagamento as data,
        'Pagamento recebido' as descricao,
        'receita' as tipo,
        valor,
        referencia
      FROM pagamentos
      WHERE data_pagamento >= ${dataInicio}
      AND data_pagamento <= ${dataFim}
      AND status = 'confirmado'

      UNION ALL

      SELECT
        data as data,
        titulo as descricao,
        'despesa' as tipo,
        valor,
        referencia
      FROM despesas
      WHERE data >= ${dataInicio}
      AND data <= ${dataFim}
      AND status = 'paga'

      ORDER BY data ASC
    `);

    // Calculate running balance
    const rows = result.rows || [];
    let saldo = 0;

    return rows.map((row: any) => {
      const valor = parseFloat(row.valor || "0");
      saldo += row.tipo === "receita" ? valor : -valor;

      return {
        data: row.data,
        descricao: row.descricao,
        tipo: row.tipo,
        valor,
        saldo,
        referencia: row.referencia,
      };
    });
  } catch (error) {
    console.error("Error getting bank reconciliation report:", error);
    return [];
  }
}

/**
 * Get monthly summary report
 */
export async function getMonthlySummaryReport(ano: number, mes: number): Promise<{
  mes: string;
  receita: number;
  despesas: number;
  saldo: number;
  moradores: {
    total: number;
    pagantes: number;
    inadimplentes: number;
  };
}> {
  try {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    const receitaResult = await db.execute(sql`
      SELECT SUM(valor) as total
      FROM pagamentos
      WHERE status = 'confirmado'
      AND data_pagamento >= ${dataInicio}
      AND data_pagamento <= ${dataFim}
    `);

    const despesasResult = await db.execute(sql`
      SELECT SUM(valor) as total
      FROM despesas
      WHERE status = 'paga'
      AND data >= ${dataInicio}
      AND data <= ${dataFim}
    `);

    const moradoresResult = await db.execute(sql`
      SELECT
        COUNT(DISTINCT m.id) as total,
        COUNT(DISTINCT CASE WHEN p.status = 'confirmado' THEN m.id END) as pagantes,
        COUNT(DISTINCT CASE WHEN p.status IN ('pendente', 'atrasado') THEN m.id END) as inadimplentes
      FROM moradores m
      LEFT JOIN pagamentos p ON m.id = p.morador_id
    `);

    const receita = parseFloat(receitaResult.rows?.[0]?.total || "0");
    const despesas = parseFloat(despesasResult.rows?.[0]?.total || "0");
    const moradoresRow = moradoresResult.rows?.[0] as any;

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return {
      mes: meses[mes - 1],
      receita,
      despesas,
      saldo: receita - despesas,
      moradores: {
        total: parseInt(moradoresRow?.total || "0"),
        pagantes: parseInt(moradoresRow?.pagantes || "0"),
        inadimplentes: parseInt(moradoresRow?.inadimplentes || "0"),
      },
    };
  } catch (error) {
    console.error("Error getting monthly summary report:", error);
    return {
      mes: "",
      receita: 0,
      despesas: 0,
      saldo: 0,
      moradores: { total: 0, pagantes: 0, inadimplentes: 0 },
    };
  }
}

/**
 * Get annual summary report
 */
export async function getAnnualSummaryReport(ano: number): Promise<
  Array<{
    mes: string;
    receita: number;
    despesas: number;
    saldo: number;
  }>
> {
  try {
    const meses = [];

    for (let mes = 1; mes <= 12; mes++) {
      const summary = await getMonthlySummaryReport(ano, mes);
      meses.push({
        mes: summary.mes,
        receita: summary.receita,
        despesas: summary.despesas,
        saldo: summary.saldo,
      });
    }

    return meses;
  } catch (error) {
    console.error("Error getting annual summary report:", error);
    return [];
  }
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(
  tipo: "pagamentos" | "despesas" | "moradores" | "inadimplencia",
  filtros?: Record<string, any>
): Promise<{
  headers: string[];
  rows: any[];
}> {
  try {
    let query = "";
    let headers: string[] = [];

    switch (tipo) {
      case "pagamentos":
        query = `
          SELECT
            m.nome as morador,
            p.valor,
            p.metodo_pagamento,
            p.status,
            p.data_pagamento,
            p.data_vencimento
          FROM pagamentos p
          LEFT JOIN moradores m ON p.morador_id = m.id
          ORDER BY p.data_pagamento DESC
        `;
        headers = ["Morador", "Valor", "Método", "Status", "Data Pagamento", "Data Vencimento"];
        break;

      case "despesas":
        query = `
          SELECT
            d.titulo,
            dc.nome as categoria,
            d.valor,
            d.status,
            d.data,
            d.fornecedor
          FROM despesas d
          LEFT JOIN despesas_categorias dc ON d.categoria = dc.id
          ORDER BY d.data DESC
        `;
        headers = ["Título", "Categoria", "Valor", "Status", "Data", "Fornecedor"];
        break;

      case "moradores":
        query = `
          SELECT
            m.nome,
            m.email,
            m.telefone,
            m.unidade,
            mf.valor as mensalidade,
            mf.data_vencimento
          FROM moradores m
          LEFT JOIN mensalidades mf ON m.id = mf.morador_id AND mf.ativo = true
          ORDER BY m.nome
        `;
        headers = ["Nome", "Email", "Telefone", "Unidade", "Mensalidade", "Vencimento"];
        break;

      case "inadimplencia":
        const inadimplentes = await getDelinquencyReport();
        return {
          headers: ["Morador", "Dias Atraso", "Valor Atraso", "Email", "Telefone"],
          rows: inadimplentes.map((r) => [
            r.moradorNome,
            r.diasAtraso,
            r.valorAtraso,
            r.email,
            r.telefone,
          ]),
        };
    }

    const result = await db.execute(sql.raw(query, []));
    const rows = result.rows || [];

    return {
      headers,
      rows: rows.map((row: any) => Object.values(row)),
    };
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    return { headers: [], rows: [] };
  }
}
