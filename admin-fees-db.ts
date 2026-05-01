/**
 * Admin Monthly Fee Management Database Operations
 * Handle individual and batch fee management with history tracking
 */

import { db } from "./db";
import { sql, eq } from "drizzle-orm";

export interface MensalidadeConfig {
  id: number;
  moradorId: number;
  valor: number;
  dataVencimento: Date;
  tipoUnidade: "apartamento" | "sala_comercial" | "garagem" | "outro";
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface MensalidadeHistorico {
  id: number;
  moradorId: number;
  valorAnterior: number;
  valorNovo: number;
  motivo?: string;
  alteradoPor: number; // Admin ID
  dataAlteracao: Date;
}

export interface FeeChangeRequest {
  moradorId: number;
  novoValor: number;
  motivo?: string;
  adminId: number;
}

export interface BatchFeeChange {
  moradores: number[]; // Array de morador IDs
  novoValor?: number; // Se definido, usa este valor
  percentualAumento?: number; // Se definido, calcula novo valor como: valorAtual * (1 + percentualAumento/100)
  motivo?: string;
  adminId: number;
}

/**
 * Get current monthly fee for a resident
 */
export async function getMensalidadeAtual(moradorId: number): Promise<MensalidadeConfig | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM mensalidades
      WHERE morador_id = ${moradorId} AND ativo = true
      LIMIT 1
    `);

    return result.rows?.[0] as MensalidadeConfig | null;
  } catch (error) {
    console.error("Error getting current monthly fee:", error);
    return null;
  }
}

/**
 * Set monthly fee for a resident
 */
export async function setMensalidade(data: {
  moradorId: number;
  valor: number;
  dataVencimento: Date;
  tipoUnidade: "apartamento" | "sala_comercial" | "garagem" | "outro";
}): Promise<MensalidadeConfig | null> {
  try {
    // Deactivate previous fee
    await db.execute(sql`
      UPDATE mensalidades
      SET ativo = false
      WHERE morador_id = ${data.moradorId} AND ativo = true
    `);

    // Create new fee
    const result = await db.execute(sql`
      INSERT INTO mensalidades (
        morador_id,
        valor,
        data_vencimento,
        tipo_unidade,
        ativo,
        criado_em,
        atualizado_em
      ) VALUES (
        ${data.moradorId},
        ${data.valor},
        ${data.dataVencimento},
        ${data.tipoUnidade},
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as MensalidadeConfig | null;
  } catch (error) {
    console.error("Error setting monthly fee:", error);
    return null;
  }
}

/**
 * Update monthly fee for a resident
 */
export async function updateMensalidade(
  moradorId: number,
  novoValor: number,
  motivo?: string,
  adminId?: number
): Promise<{
  success: boolean;
  anterior?: number;
  novo?: number;
  error?: string;
}> {
  try {
    // Get current fee
    const atual = await getMensalidadeAtual(moradorId);

    if (!atual) {
      return {
        success: false,
        error: "Mensalidade atual não encontrada",
      };
    }

    // Record in history
    if (adminId) {
      await db.execute(sql`
        INSERT INTO mensalidades_historico (
          morador_id,
          valor_anterior,
          valor_novo,
          motivo,
          alterado_por,
          data_alteracao
        ) VALUES (
          ${moradorId},
          ${atual.valor},
          ${novoValor},
          ${motivo || null},
          ${adminId},
          NOW()
        )
      `);
    }

    // Update fee
    await db.execute(sql`
      UPDATE mensalidades
      SET valor = ${novoValor}, atualizado_em = NOW()
      WHERE morador_id = ${moradorId} AND ativo = true
    `);

    return {
      success: true,
      anterior: atual.valor,
      novo: novoValor,
    };
  } catch (error) {
    console.error("Error updating monthly fee:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get fee history for a resident
 */
export async function getMensalidadeHistorico(moradorId: number): Promise<MensalidadeHistorico[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM mensalidades_historico
      WHERE morador_id = ${moradorId}
      ORDER BY data_alteracao DESC
    `);

    return (result.rows || []) as MensalidadeHistorico[];
  } catch (error) {
    console.error("Error getting fee history:", error);
    return [];
  }
}

/**
 * Apply batch fee change
 */
export async function applyBatchFeeChange(
  change: BatchFeeChange
): Promise<{
  success: boolean;
  processados: number;
  erros: number;
  detalhes: Array<{
    moradorId: number;
    sucesso: boolean;
    valorAnterior?: number;
    valorNovo?: number;
    erro?: string;
  }>;
}> {
  const detalhes: Array<{
    moradorId: number;
    sucesso: boolean;
    valorAnterior?: number;
    valorNovo?: number;
    erro?: string;
  }> = [];

  let processados = 0;
  let erros = 0;

  for (const moradorId of change.moradores) {
    try {
      const atual = await getMensalidadeAtual(moradorId);

      if (!atual) {
        detalhes.push({
          moradorId,
          sucesso: false,
          erro: "Mensalidade atual não encontrada",
        });
        erros++;
        continue;
      }

      // Calculate new value
      let novoValor = change.novoValor || atual.valor;

      if (change.percentualAumento !== undefined) {
        novoValor = atual.valor * (1 + change.percentualAumento / 100);
      }

      // Update fee
      const resultado = await updateMensalidade(
        moradorId,
        novoValor,
        change.motivo,
        change.adminId
      );

      if (resultado.success) {
        detalhes.push({
          moradorId,
          sucesso: true,
          valorAnterior: resultado.anterior,
          valorNovo: resultado.novo,
        });
        processados++;
      } else {
        detalhes.push({
          moradorId,
          sucesso: false,
          erro: resultado.error,
        });
        erros++;
      }
    } catch (error) {
      detalhes.push({
        moradorId,
        sucesso: false,
        erro: error instanceof Error ? error.message : "Unknown error",
      });
      erros++;
    }
  }

  return {
    success: erros === 0,
    processados,
    erros,
    detalhes,
  };
}

/**
 * Get all residents with their current fees
 */
export async function getAllMensalidades(): Promise<
  Array<{
    moradorId: number;
    moradorNome: string;
    valor: number;
    dataVencimento: Date;
    tipoUnidade: string;
    ultimaAlteracao: Date;
  }>
> {
  try {
    const result = await db.execute(sql`
      SELECT
        m.id as morador_id,
        m.nome as morador_nome,
        mf.valor,
        mf.data_vencimento,
        mf.tipo_unidade,
        mf.atualizado_em as ultima_alteracao
      FROM moradores m
      LEFT JOIN mensalidades mf ON m.id = mf.morador_id AND mf.ativo = true
      ORDER BY m.nome
    `);

    return (result.rows || []) as Array<{
      moradorId: number;
      moradorNome: string;
      valor: number;
      dataVencimento: Date;
      tipoUnidade: string;
      ultimaAlteracao: Date;
    }>;
  } catch (error) {
    console.error("Error getting all monthly fees:", error);
    return [];
  }
}

/**
 * Get fee statistics
 */
export async function getFeeStatistics(): Promise<{
  totalMoradores: number;
  valorMedio: number;
  valorMinimo: number;
  valorMaximo: number;
  distribuicaoPorTipo: Record<string, { quantidade: number; valorMedio: number }>;
}> {
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(DISTINCT m.id) as total_moradores,
        AVG(mf.valor) as valor_medio,
        MIN(mf.valor) as valor_minimo,
        MAX(mf.valor) as valor_maximo,
        mf.tipo_unidade,
        COUNT(mf.id) as quantidade_por_tipo
      FROM moradores m
      LEFT JOIN mensalidades mf ON m.id = mf.morador_id AND mf.ativo = true
      GROUP BY mf.tipo_unidade
    `);

    const rows = result.rows || [];
    const distribuicaoPorTipo: Record<string, { quantidade: number; valorMedio: number }> = {};

    rows.forEach((row: any) => {
      if (row.tipo_unidade) {
        distribuicaoPorTipo[row.tipo_unidade] = {
          quantidade: parseInt(row.quantidade_por_tipo || "0"),
          valorMedio: parseFloat(row.valor_medio || "0"),
        };
      }
    });

    const firstRow = rows[0] as any;

    return {
      totalMoradores: parseInt(firstRow?.total_moradores || "0"),
      valorMedio: parseFloat(firstRow?.valor_medio || "0"),
      valorMinimo: parseFloat(firstRow?.valor_minimo || "0"),
      valorMaximo: parseFloat(firstRow?.valor_maximo || "0"),
      distribuicaoPorTipo,
    };
  } catch (error) {
    console.error("Error getting fee statistics:", error);
    return {
      totalMoradores: 0,
      valorMedio: 0,
      valorMinimo: 0,
      valorMaximo: 0,
      distribuicaoPorTipo: {},
    };
  }
}

/**
 * Get fee change history for admin audit
 */
export async function getFeeChangeHistory(
  adminId?: number,
  dataInicio?: Date,
  dataFim?: Date
): Promise<
  Array<{
    id: number;
    moradorId: number;
    moradorNome: string;
    valorAnterior: number;
    valorNovo: number;
    motivo?: string;
    alteradoPor: number;
    adminNome: string;
    dataAlteracao: Date;
  }>
> {
  try {
    let query = `
      SELECT
        mh.id,
        mh.morador_id,
        m.nome as morador_nome,
        mh.valor_anterior,
        mh.valor_novo,
        mh.motivo,
        mh.alterado_por,
        a.nome as admin_nome,
        mh.data_alteracao
      FROM mensalidades_historico mh
      LEFT JOIN moradores m ON mh.morador_id = m.id
      LEFT JOIN usuarios a ON mh.alterado_por = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (adminId) {
      query += ` AND mh.alterado_por = $${params.length + 1}`;
      params.push(adminId);
    }

    if (dataInicio) {
      query += ` AND mh.data_alteracao >= $${params.length + 1}`;
      params.push(dataInicio);
    }

    if (dataFim) {
      query += ` AND mh.data_alteracao <= $${params.length + 1}`;
      params.push(dataFim);
    }

    query += ` ORDER BY mh.data_alteracao DESC`;

    const result = await db.execute(sql.raw(query, params));

    return (result.rows || []) as Array<{
      id: number;
      moradorId: number;
      moradorNome: string;
      valorAnterior: number;
      valorNovo: number;
      motivo?: string;
      alteradoPor: number;
      adminNome: string;
      dataAlteracao: Date;
    }>;
  } catch (error) {
    console.error("Error getting fee change history:", error);
    return [];
  }
}
