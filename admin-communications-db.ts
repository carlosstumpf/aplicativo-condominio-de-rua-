/**
 * Admin Communication System Database Operations
 * Handle WhatsApp and App notifications with scheduling and templates
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

export interface ComunicacaoTemplate {
  id: number;
  nome: string;
  descricao?: string;
  tipo: "whatsapp" | "app" | "ambos";
  conteudo: string;
  variaveis: string[]; // e.g., ["nome", "valor", "data"]
  ativo: boolean;
  criadoEm: Date;
}

export interface Comunicacao {
  id: number;
  titulo: string;
  conteudo: string;
  tipo: "whatsapp" | "app" | "email";
  destinatarios: "todos" | "selecionados" | "por_filtro";
  moradorIds?: number[]; // For "selecionados"
  filtro?: {
    // For "por_filtro"
    status?: string;
    atraso?: boolean;
    categoria?: string;
  };
  agendado: boolean;
  dataAgendamento?: Date;
  templateId?: number;
  status: "rascunho" | "agendado" | "enviado" | "erro";
  totalDestinatarios: number;
  enviados: number;
  erros: number;
  criadoEm: Date;
  enviadoEm?: Date;
}

export interface ComunicacaoLog {
  id: number;
  comunicacaoId: number;
  moradorId: number;
  tipo: "whatsapp" | "app" | "email";
  status: "pendente" | "enviado" | "erro";
  mensagem?: string;
  erro?: string;
  tentativas: number;
  proximaTentativa?: Date;
  criadoEm: Date;
  enviadoEm?: Date;
}

/**
 * Create communication template
 */
export async function createCommunicationTemplate(data: {
  nome: string;
  descricao?: string;
  tipo: "whatsapp" | "app" | "ambos";
  conteudo: string;
  variaveis: string[];
}): Promise<ComunicacaoTemplate | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO comunicacoes_templates (
        nome,
        descricao,
        tipo,
        conteudo,
        variaveis,
        ativo,
        criado_em
      ) VALUES (
        ${data.nome},
        ${data.descricao || null},
        ${data.tipo},
        ${data.conteudo},
        ${JSON.stringify(data.variaveis)},
        true,
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as ComunicacaoTemplate | null;
  } catch (error) {
    console.error("Error creating communication template:", error);
    return null;
  }
}

/**
 * Get all communication templates
 */
export async function getCommunicationTemplates(): Promise<ComunicacaoTemplate[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM comunicacoes_templates
      WHERE ativo = true
      ORDER BY nome
    `);

    return (result.rows || []) as ComunicacaoTemplate[];
  } catch (error) {
    console.error("Error getting communication templates:", error);
    return [];
  }
}

/**
 * Create communication
 */
export async function createCommunication(data: {
  titulo: string;
  conteudo: string;
  tipo: "whatsapp" | "app" | "email";
  destinatarios: "todos" | "selecionados" | "por_filtro";
  moradorIds?: number[];
  filtro?: Record<string, any>;
  agendado: boolean;
  dataAgendamento?: Date;
  templateId?: number;
  totalDestinatarios: number;
}): Promise<Comunicacao | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO comunicacoes (
        titulo,
        conteudo,
        tipo,
        destinatarios,
        morador_ids,
        filtro,
        agendado,
        data_agendamento,
        template_id,
        status,
        total_destinatarios,
        enviados,
        erros,
        criado_em
      ) VALUES (
        ${data.titulo},
        ${data.conteudo},
        ${data.tipo},
        ${data.destinatarios},
        ${data.moradorIds ? JSON.stringify(data.moradorIds) : null},
        ${data.filtro ? JSON.stringify(data.filtro) : null},
        ${data.agendado},
        ${data.dataAgendamento || null},
        ${data.templateId || null},
        ${data.agendado ? "agendado" : "rascunho"},
        ${data.totalDestinatarios},
        0,
        0,
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as Comunicacao | null;
  } catch (error) {
    console.error("Error creating communication:", error);
    return null;
  }
}

/**
 * Get communication by ID
 */
export async function getCommunication(id: number): Promise<Comunicacao | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM comunicacoes WHERE id = ${id}
    `);

    return result.rows?.[0] as Comunicacao | null;
  } catch (error) {
    console.error("Error getting communication:", error);
    return null;
  }
}

/**
 * Get all communications
 */
export async function getCommunications(filtros?: {
  status?: string;
  tipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<Comunicacao[]> {
  try {
    let query = "SELECT * FROM comunicacoes WHERE 1=1";
    const params: any[] = [];

    if (filtros?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filtros.status);
    }

    if (filtros?.tipo) {
      query += ` AND tipo = $${params.length + 1}`;
      params.push(filtros.tipo);
    }

    if (filtros?.dataInicio) {
      query += ` AND criado_em >= $${params.length + 1}`;
      params.push(filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      query += ` AND criado_em <= $${params.length + 1}`;
      params.push(filtros.dataFim);
    }

    query += " ORDER BY criado_em DESC";

    const result = await db.execute(sql.raw(query, params));

    return (result.rows || []) as Comunicacao[];
  } catch (error) {
    console.error("Error getting communications:", error);
    return [];
  }
}

/**
 * Create communication log entry
 */
export async function createCommunicationLog(data: {
  comunicacaoId: number;
  moradorId: number;
  tipo: "whatsapp" | "app" | "email";
  status: "pendente" | "enviado" | "erro";
  mensagem?: string;
  erro?: string;
}): Promise<ComunicacaoLog | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO comunicacoes_logs (
        comunicacao_id,
        morador_id,
        tipo,
        status,
        mensagem,
        erro,
        tentativas,
        criado_em
      ) VALUES (
        ${data.comunicacaoId},
        ${data.moradorId},
        ${data.tipo},
        ${data.status},
        ${data.mensagem || null},
        ${data.erro || null},
        1,
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as ComunicacaoLog | null;
  } catch (error) {
    console.error("Error creating communication log:", error);
    return null;
  }
}

/**
 * Get communication logs
 */
export async function getCommunicationLogs(comunicacaoId: number): Promise<ComunicacaoLog[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM comunicacoes_logs
      WHERE comunicacao_id = ${comunicacaoId}
      ORDER BY criado_em DESC
    `);

    return (result.rows || []) as ComunicacaoLog[];
  } catch (error) {
    console.error("Error getting communication logs:", error);
    return [];
  }
}

/**
 * Update communication status
 */
export async function updateCommunicationStatus(
  id: number,
  status: "rascunho" | "agendado" | "enviado" | "erro"
): Promise<boolean> {
  try {
    await db.execute(sql`
      UPDATE comunicacoes
      SET status = ${status}, ${status === "enviado" ? sql`enviado_em = NOW()` : sql`1=1`}
      WHERE id = ${id}
    `);

    return true;
  } catch (error) {
    console.error("Error updating communication status:", error);
    return false;
  }
}

/**
 * Update communication statistics
 */
export async function updateCommunicationStats(
  id: number,
  enviados: number,
  erros: number
): Promise<boolean> {
  try {
    await db.execute(sql`
      UPDATE comunicacoes
      SET enviados = ${enviados}, erros = ${erros}
      WHERE id = ${id}
    `);

    return true;
  } catch (error) {
    console.error("Error updating communication stats:", error);
    return false;
  }
}

/**
 * Get scheduled communications ready to send
 */
export async function getScheduledCommunications(): Promise<Comunicacao[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM comunicacoes
      WHERE agendado = true
      AND status = 'agendado'
      AND data_agendamento <= NOW()
      ORDER BY data_agendamento ASC
    `);

    return (result.rows || []) as Comunicacao[];
  } catch (error) {
    console.error("Error getting scheduled communications:", error);
    return [];
  }
}

/**
 * Get communication statistics
 */
export async function getCommunicationStatistics(): Promise<{
  totalComunicacoes: number;
  enviadas: number;
  agendadas: number;
  rascunhos: number;
  taxaEntrega: number;
  porTipo: Record<string, number>;
}> {
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'enviado' THEN 1 ELSE 0 END) as enviadas,
        SUM(CASE WHEN status = 'agendado' THEN 1 ELSE 0 END) as agendadas,
        SUM(CASE WHEN status = 'rascunho' THEN 1 ELSE 0 END) as rascunhos,
        tipo
      FROM comunicacoes
      GROUP BY tipo
    `);

    const rows = result.rows || [];
    let totalComunicacoes = 0;
    let enviadas = 0;
    let agendadas = 0;
    let rascunhos = 0;
    const porTipo: Record<string, number> = {};

    rows.forEach((row: any) => {
      totalComunicacoes += parseInt(row.total || "0");
      enviadas += parseInt(row.enviadas || "0");
      agendadas += parseInt(row.agendadas || "0");
      rascunhos += parseInt(row.rascunhos || "0");
      porTipo[row.tipo] = parseInt(row.total || "0");
    });

    return {
      totalComunicacoes,
      enviadas,
      agendadas,
      rascunhos,
      taxaEntrega: totalComunicacoes > 0 ? (enviadas / totalComunicacoes) * 100 : 0,
      porTipo,
    };
  } catch (error) {
    console.error("Error getting communication statistics:", error);
    return {
      totalComunicacoes: 0,
      enviadas: 0,
      agendadas: 0,
      rascunhos: 0,
      taxaEntrega: 0,
      porTipo: {},
    };
  }
}
