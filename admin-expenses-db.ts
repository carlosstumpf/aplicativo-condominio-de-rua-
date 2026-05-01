/**
 * Admin Expense Tracking Database Operations
 * Handle expense categorization, document uploads, and tracking
 */

import { db } from "./db";
import { sql, eq } from "drizzle-orm";

export interface DespesaCategoria {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  criadoEm: Date;
}

export interface Despesa {
  id: number;
  titulo: string;
  descricao?: string;
  valor: number;
  categoria: number;
  data: Date;
  dataVencimento?: Date;
  status: "pendente" | "paga" | "cancelada";
  fornecedor?: string;
  referencia?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface DespesaDocumento {
  id: number;
  despesaId: number;
  nomeArquivo: string;
  tipoArquivo: string;
  urlArquivo: string;
  tamanho: number;
  uploadedEm: Date;
}

export interface DespesaFiltros {
  categoria?: number;
  status?: "pendente" | "paga" | "cancelada";
  dataInicio?: Date;
  dataFim?: Date;
  fornecedor?: string;
  busca?: string;
}

/**
 * Create expense category
 */
export async function createExpenseCategory(data: {
  nome: string;
  descricao?: string;
  cor: string;
}): Promise<DespesaCategoria | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO despesas_categorias (
        nome,
        descricao,
        cor,
        ativo,
        criado_em
      ) VALUES (
        ${data.nome},
        ${data.descricao || null},
        ${data.cor},
        true,
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as DespesaCategoria | null;
  } catch (error) {
    console.error("Error creating expense category:", error);
    return null;
  }
}

/**
 * Get all expense categories
 */
export async function getExpenseCategories(): Promise<DespesaCategoria[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM despesas_categorias
      WHERE ativo = true
      ORDER BY nome
    `);

    return (result.rows || []) as DespesaCategoria[];
  } catch (error) {
    console.error("Error getting expense categories:", error);
    return [];
  }
}

/**
 * Create expense
 */
export async function createExpense(data: {
  titulo: string;
  descricao?: string;
  valor: number;
  categoria: number;
  data: Date;
  dataVencimento?: Date;
  fornecedor?: string;
  referencia?: string;
}): Promise<Despesa | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO despesas (
        titulo,
        descricao,
        valor,
        categoria,
        data,
        data_vencimento,
        status,
        fornecedor,
        referencia,
        criado_em,
        atualizado_em
      ) VALUES (
        ${data.titulo},
        ${data.descricao || null},
        ${data.valor},
        ${data.categoria},
        ${data.data},
        ${data.dataVencimento || null},
        'pendente',
        ${data.fornecedor || null},
        ${data.referencia || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as Despesa | null;
  } catch (error) {
    console.error("Error creating expense:", error);
    return null;
  }
}

/**
 * Update expense
 */
export async function updateExpense(
  id: number,
  data: Partial<{
    titulo: string;
    descricao?: string;
    valor: number;
    categoria: number;
    data: Date;
    dataVencimento?: Date;
    status: "pendente" | "paga" | "cancelada";
    fornecedor?: string;
    referencia?: string;
  }>
): Promise<Despesa | null> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.titulo !== undefined) {
      updates.push(`titulo = $${updates.length + 1}`);
      values.push(data.titulo);
    }
    if (data.descricao !== undefined) {
      updates.push(`descricao = $${updates.length + 1}`);
      values.push(data.descricao);
    }
    if (data.valor !== undefined) {
      updates.push(`valor = $${updates.length + 1}`);
      values.push(data.valor);
    }
    if (data.categoria !== undefined) {
      updates.push(`categoria = $${updates.length + 1}`);
      values.push(data.categoria);
    }
    if (data.data !== undefined) {
      updates.push(`data = $${updates.length + 1}`);
      values.push(data.data);
    }
    if (data.dataVencimento !== undefined) {
      updates.push(`data_vencimento = $${updates.length + 1}`);
      values.push(data.dataVencimento);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${updates.length + 1}`);
      values.push(data.status);
    }
    if (data.fornecedor !== undefined) {
      updates.push(`fornecedor = $${updates.length + 1}`);
      values.push(data.fornecedor);
    }
    if (data.referencia !== undefined) {
      updates.push(`referencia = $${updates.length + 1}`);
      values.push(data.referencia);
    }

    updates.push(`atualizado_em = NOW()`);

    const query = `UPDATE despesas SET ${updates.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await db.execute(sql.raw(query, values));

    return result.rows?.[0] as Despesa | null;
  } catch (error) {
    console.error("Error updating expense:", error);
    return null;
  }
}

/**
 * Get expense by ID
 */
export async function getExpense(id: number): Promise<Despesa | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM despesas WHERE id = ${id}
    `);

    return result.rows?.[0] as Despesa | null;
  } catch (error) {
    console.error("Error getting expense:", error);
    return null;
  }
}

/**
 * Get expenses with filters
 */
export async function getExpenses(filtros: DespesaFiltros): Promise<Despesa[]> {
  try {
    let query = "SELECT * FROM despesas WHERE 1=1";
    const params: any[] = [];

    if (filtros.categoria) {
      query += ` AND categoria = $${params.length + 1}`;
      params.push(filtros.categoria);
    }

    if (filtros.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filtros.status);
    }

    if (filtros.dataInicio) {
      query += ` AND data >= $${params.length + 1}`;
      params.push(filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query += ` AND data <= $${params.length + 1}`;
      params.push(filtros.dataFim);
    }

    if (filtros.fornecedor) {
      query += ` AND fornecedor ILIKE $${params.length + 1}`;
      params.push(`%${filtros.fornecedor}%`);
    }

    if (filtros.busca) {
      query += ` AND (titulo ILIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1})`;
      params.push(`%${filtros.busca}%`);
      params.push(`%${filtros.busca}%`);
    }

    query += " ORDER BY data DESC";

    const result = await db.execute(sql.raw(query, params));

    return (result.rows || []) as Despesa[];
  } catch (error) {
    console.error("Error getting expenses:", error);
    return [];
  }
}

/**
 * Add document to expense
 */
export async function addExpenseDocument(data: {
  despesaId: number;
  nomeArquivo: string;
  tipoArquivo: string;
  urlArquivo: string;
  tamanho: number;
}): Promise<DespesaDocumento | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO despesas_documentos (
        despesa_id,
        nome_arquivo,
        tipo_arquivo,
        url_arquivo,
        tamanho,
        uploaded_em
      ) VALUES (
        ${data.despesaId},
        ${data.nomeArquivo},
        ${data.tipoArquivo},
        ${data.urlArquivo},
        ${data.tamanho},
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as DespesaDocumento | null;
  } catch (error) {
    console.error("Error adding expense document:", error);
    return null;
  }
}

/**
 * Get documents for expense
 */
export async function getExpenseDocuments(despesaId: number): Promise<DespesaDocumento[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM despesas_documentos
      WHERE despesa_id = ${despesaId}
      ORDER BY uploaded_em DESC
    `);

    return (result.rows || []) as DespesaDocumento[];
  } catch (error) {
    console.error("Error getting expense documents:", error);
    return [];
  }
}

/**
 * Delete document
 */
export async function deleteExpenseDocument(id: number): Promise<boolean> {
  try {
    await db.execute(sql`
      DELETE FROM despesas_documentos WHERE id = ${id}
    `);

    return true;
  } catch (error) {
    console.error("Error deleting expense document:", error);
    return false;
  }
}

/**
 * Get expense statistics
 */
export async function getExpenseStatistics(filtros?: DespesaFiltros): Promise<{
  totalDespesas: number;
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  valorCancelado: number;
  porCategoria: Record<
    string,
    {
      quantidade: number;
      valor: number;
    }
  >;
  porStatus: Record<
    string,
    {
      quantidade: number;
      valor: number;
    }
  >;
}> {
  try {
    const expenses = await getExpenses(filtros || {});

    const stats = {
      totalDespesas: expenses.length,
      valorTotal: 0,
      valorPago: 0,
      valorPendente: 0,
      valorCancelado: 0,
      porCategoria: {} as Record<string, { quantidade: number; valor: number }>,
      porStatus: {} as Record<string, { quantidade: number; valor: number }>,
    };

    const categorias = await getExpenseCategories();
    const categoriaMap = Object.fromEntries(categorias.map((c) => [c.id, c.nome]));

    for (const expense of expenses) {
      stats.valorTotal += expense.valor;

      // By status
      if (!stats.porStatus[expense.status]) {
        stats.porStatus[expense.status] = { quantidade: 0, valor: 0 };
      }
      stats.porStatus[expense.status].quantidade++;
      stats.porStatus[expense.status].valor += expense.valor;

      // By category
      const categoriaNome = categoriaMap[expense.categoria] || "Sem categoria";
      if (!stats.porCategoria[categoriaNome]) {
        stats.porCategoria[categoriaNome] = { quantidade: 0, valor: 0 };
      }
      stats.porCategoria[categoriaNome].quantidade++;
      stats.porCategoria[categoriaNome].valor += expense.valor;

      // Totals by status
      if (expense.status === "paga") {
        stats.valorPago += expense.valor;
      } else if (expense.status === "pendente") {
        stats.valorPendente += expense.valor;
      } else if (expense.status === "cancelada") {
        stats.valorCancelado += expense.valor;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting expense statistics:", error);
    return {
      totalDespesas: 0,
      valorTotal: 0,
      valorPago: 0,
      valorPendente: 0,
      valorCancelado: 0,
      porCategoria: {},
      porStatus: {},
    };
  }
}
