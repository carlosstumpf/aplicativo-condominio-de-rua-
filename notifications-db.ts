/**
 * Notifications Database Schema and Operations
 * Handles notification storage, delivery tracking, and user preferences
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  integer,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  pgTable,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

/**
 * Notifications Table
 * Stores all notifications sent to admins
 */
export const notificacoes = pgTable(
  "notificacoes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    adminId: integer().notNull(),
    titulo: varchar(255).notNull(),
    descricao: text(),
    tipo: varchar(50).notNull(), // "tarefa", "mensagem", "alerta", "pagamento", "despesa"
    prioridade: varchar(20).notNull().default("normal"), // "baixa", "normal", "alta", "crítica"
    status: varchar(20).notNull().default("nao_lida"), // "nao_lida", "lida", "arquivada"
    acao: varchar(255), // URL ou ação para executar
    dados: jsonb(), // Dados adicionais (ex: ID do recurso)
    lidoEm: timestamp(),
    criadoEm: timestamp().notNull().defaultNow(),
    expiradoEm: timestamp(), // Notificação expira após este tempo
  },
  (table) => ({
    adminIdIdx: index("notificacoes_admin_id_idx").on(table.adminId),
    statusIdx: index("notificacoes_status_idx").on(table.status),
    tipoIdx: index("notificacoes_tipo_idx").on(table.tipo),
    criadoEmIdx: index("notificacoes_criado_em_idx").on(table.criadoEm),
  })
);

/**
 * Notification Delivery Tracking
 * Tracks delivery status for push notifications and emails
 */
export const notificacaoEntregas = pgTable(
  "notificacao_entregas",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    notificacaoId: integer().notNull(),
    canal: varchar(50).notNull(), // "push", "email", "whatsapp", "in_app"
    status: varchar(20).notNull().default("pendente"), // "pendente", "enviada", "entregue", "falhou"
    tentativas: integer().notNull().default(0),
    ultimaTentativa: timestamp(),
    proximaTentativa: timestamp(),
    erro: text(),
    resposta: jsonb(),
    enviadoEm: timestamp(),
    entregueEm: timestamp(),
    criadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    notificacaoIdIdx: index("notificacao_entregas_notificacao_id_idx").on(
      table.notificacaoId
    ),
    canalIdx: index("notificacao_entregas_canal_idx").on(table.canal),
    statusIdx: index("notificacao_entregas_status_idx").on(table.status),
  })
);

/**
 * Notification Preferences
 * User preferences for notification types and channels
 */
export const notificacaoPreferencias = pgTable(
  "notificacao_preferencias",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    adminId: integer().notNull(),
    tipo: varchar(50).notNull(), // "tarefa", "mensagem", "alerta", etc
    pushHabilitado: boolean().notNull().default(true),
    emailHabilitado: boolean().notNull().default(true),
    whatsappHabilitado: boolean().notNull().default(false),
    silencioAte: timestamp(), // Silenciar notificações até este horário
    criadoEm: timestamp().notNull().defaultNow(),
    atualizadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    adminIdTipoIdx: index("notificacao_preferencias_admin_id_tipo_idx").on(
      table.adminId,
      table.tipo
    ),
  })
);

/**
 * Pending Tasks
 * Tracks pending tasks that need admin attention
 */
export const tarefasPendentes = pgTable(
  "tarefas_pendentes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    titulo: varchar(255).notNull(),
    descricao: text(),
    tipo: varchar(50).notNull(), // "cobranca", "despesa_pendente", "comunicado", "manutencao"
    prioridade: varchar(20).notNull().default("normal"),
    status: varchar(20).notNull().default("pendente"), // "pendente", "em_progresso", "concluida", "cancelada"
    recursoTipo: varchar(50), // "morador", "despesa", "comunicado"
    recursoId: integer(),
    atribuidoA: integer(), // Admin responsável
    dataVencimento: timestamp(),
    dataConclusao: timestamp(),
    criadoEm: timestamp().notNull().defaultNow(),
    atualizadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("tarefas_pendentes_status_idx").on(table.status),
    prioridadeIdx: index("tarefas_pendentes_prioridade_idx").on(table.prioridade),
    atribuidoAIdx: index("tarefas_pendentes_atribuido_a_idx").on(table.atribuidoA),
    dataVencimentoIdx: index("tarefas_pendentes_data_vencimento_idx").on(
      table.dataVencimento
    ),
  })
);

/**
 * Create notification
 */
export async function createNotificacao(data: {
  adminId: number;
  titulo: string;
  descricao?: string;
  tipo: string;
  prioridade?: "baixa" | "normal" | "alta" | "crítica";
  acao?: string;
  dados?: Record<string, any>;
  expiradoEm?: Date;
}) {
  try {
    const result = await db
      .insert(notificacoes)
      .values({
        adminId: data.adminId,
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        prioridade: data.prioridade || "normal",
        acao: data.acao,
        dados: data.dados,
        expiradoEm: data.expiradoEm,
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Get notifications for admin
 */
export async function getNotificacoes(
  adminId: number,
  filters?: {
    status?: string;
    tipo?: string;
    prioridade?: string;
    limite?: number;
    offset?: number;
  }
) {
  try {
    let query = db
      .select()
      .from(notificacoes)
      .where(sql`${notificacoes.adminId} = ${adminId}`);

    if (filters?.status) {
      query = query.where(sql`${notificacoes.status} = ${filters.status}`);
    }

    if (filters?.tipo) {
      query = query.where(sql`${notificacoes.tipo} = ${filters.tipo}`);
    }

    if (filters?.prioridade) {
      query = query.where(
        sql`${notificacoes.prioridade} = ${filters.prioridade}`
      );
    }

    query = query.orderBy(sql`${notificacoes.criadoEm} DESC`);

    if (filters?.limite) {
      query = query.limit(filters.limite);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function marcarComoLida(notificacaoId: number) {
  try {
    const result = await db
      .update(notificacoes)
      .set({
        status: "lida",
        lidoEm: new Date(),
      })
      .where(sql`${notificacoes.id} = ${notificacaoId}`)
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }
}

/**
 * Archive notification
 */
export async function arquivarNotificacao(notificacaoId: number) {
  try {
    const result = await db
      .update(notificacoes)
      .set({ status: "arquivada" })
      .where(sql`${notificacoes.id} = ${notificacaoId}`)
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error archiving notification:", error);
    return null;
  }
}

/**
 * Get unread count for admin
 */
export async function getNotificacoesNaoLidas(adminId: number) {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificacoes)
      .where(
        sql`${notificacoes.adminId} = ${adminId} AND ${notificacoes.status} = 'nao_lida'`
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Create pending task
 */
export async function criarTarefaPendente(data: {
  titulo: string;
  descricao?: string;
  tipo: string;
  prioridade?: "baixa" | "normal" | "alta";
  recursoTipo?: string;
  recursoId?: number;
  atribuidoA?: number;
  dataVencimento?: Date;
}) {
  try {
    const result = await db
      .insert(tarefasPendentes)
      .values({
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        prioridade: data.prioridade || "normal",
        recursoTipo: data.recursoTipo,
        recursoId: data.recursoId,
        atribuidoA: data.atribuidoA,
        dataVencimento: data.dataVencimento,
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error creating pending task:", error);
    return null;
  }
}

/**
 * Get pending tasks
 */
export async function getTarefasPendentes(filters?: {
  status?: string;
  prioridade?: string;
  atribuidoA?: number;
  tipo?: string;
  limite?: number;
}) {
  try {
    let query = db.select().from(tarefasPendentes);

    if (filters?.status) {
      query = query.where(sql`${tarefasPendentes.status} = ${filters.status}`);
    }

    if (filters?.prioridade) {
      query = query.where(
        sql`${tarefasPendentes.prioridade} = ${filters.prioridade}`
      );
    }

    if (filters?.atribuidoA) {
      query = query.where(
        sql`${tarefasPendentes.atribuidoA} = ${filters.atribuidoA}`
      );
    }

    if (filters?.tipo) {
      query = query.where(sql`${tarefasPendentes.tipo} = ${filters.tipo}`);
    }

    query = query.orderBy(sql`${tarefasPendentes.dataVencimento} ASC`);

    if (filters?.limite) {
      query = query.limit(filters.limite);
    }

    return await query;
  } catch (error) {
    console.error("Error getting pending tasks:", error);
    return [];
  }
}

/**
 * Complete task
 */
export async function completarTarefa(tarefaId: number) {
  try {
    const result = await db
      .update(tarefasPendentes)
      .set({
        status: "concluida",
        dataConclusao: new Date(),
        atualizadoEm: new Date(),
      })
      .where(sql`${tarefasPendentes.id} = ${tarefaId}`)
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error completing task:", error);
    return null;
  }
}

/**
 * Get notification statistics
 */
export async function getNotificacaoStats(adminId: number) {
  try {
    const naoLidas = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificacoes)
      .where(
        sql`${notificacoes.adminId} = ${adminId} AND ${notificacoes.status} = 'nao_lida'`
      );

    const porTipo = await db
      .select({
        tipo: notificacoes.tipo,
        count: sql<number>`count(*)`,
      })
      .from(notificacoes)
      .where(sql`${notificacoes.adminId} = ${adminId}`)
      .groupBy(notificacoes.tipo);

    const porPrioridade = await db
      .select({
        prioridade: notificacoes.prioridade,
        count: sql<number>`count(*)`,
      })
      .from(notificacoes)
      .where(sql`${notificacoes.adminId} = ${adminId}`)
      .groupBy(notificacoes.prioridade);

    const tarefas = await db
      .select({ count: sql<number>`count(*)` })
      .from(tarefasPendentes)
      .where(sql`${tarefasPendentes.status} = 'pendente'`);

    return {
      notificacoesNaoLidas: naoLidas[0]?.count || 0,
      notificacoesPorTipo: porTipo,
      notificacoesPorPrioridade: porPrioridade,
      tarefasPendentes: tarefas[0]?.count || 0,
    };
  } catch (error) {
    console.error("Error getting notification stats:", error);
    return {
      notificacoesNaoLidas: 0,
      notificacoesPorTipo: [],
      notificacoesPorPrioridade: [],
      tarefasPendentes: 0,
    };
  }
}

/**
 * Track notification delivery
 */
export async function rastrearEntrega(data: {
  notificacaoId: number;
  canal: string;
  status: string;
  erro?: string;
  resposta?: Record<string, any>;
}) {
  try {
    const result = await db
      .insert(notificacaoEntregas)
      .values({
        notificacaoId: data.notificacaoId,
        canal: data.canal,
        status: data.status,
        erro: data.erro,
        resposta: data.resposta,
        enviadoEm: data.status === "enviada" ? new Date() : undefined,
        entregueEm: data.status === "entregue" ? new Date() : undefined,
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error tracking delivery:", error);
    return null;
  }
}

/**
 * Get notification preferences
 */
export async function getPreferencias(adminId: number) {
  try {
    const result = await db
      .select()
      .from(notificacaoPreferencias)
      .where(sql`${notificacaoPreferencias.adminId} = ${adminId}`);

    return result;
  } catch (error) {
    console.error("Error getting preferences:", error);
    return [];
  }
}

/**
 * Update notification preferences
 */
export async function atualizarPreferencias(
  adminId: number,
  tipo: string,
  data: {
    pushHabilitado?: boolean;
    emailHabilitado?: boolean;
    whatsappHabilitado?: boolean;
    silencioAte?: Date;
  }
) {
  try {
    // Check if preference exists
    const existing = await db
      .select()
      .from(notificacaoPreferencias)
      .where(
        sql`${notificacaoPreferencias.adminId} = ${adminId} AND ${notificacaoPreferencias.tipo} = ${tipo}`
      );

    if (existing.length > 0) {
      const result = await db
        .update(notificacaoPreferencias)
        .set({
          pushHabilitado:
            data.pushHabilitado !== undefined
              ? data.pushHabilitado
              : existing[0].pushHabilitado,
          emailHabilitado:
            data.emailHabilitado !== undefined
              ? data.emailHabilitado
              : existing[0].emailHabilitado,
          whatsappHabilitado:
            data.whatsappHabilitado !== undefined
              ? data.whatsappHabilitado
              : existing[0].whatsappHabilitado,
          silencioAte: data.silencioAte,
          atualizadoEm: new Date(),
        })
        .where(
          sql`${notificacaoPreferencias.adminId} = ${adminId} AND ${notificacaoPreferencias.tipo} = ${tipo}`
        )
        .returning();

      return result[0] || null;
    } else {
      const result = await db
        .insert(notificacaoPreferencias)
        .values({
          adminId,
          tipo,
          pushHabilitado: data.pushHabilitado !== false,
          emailHabilitado: data.emailHabilitado !== false,
          whatsappHabilitado: data.whatsappHabilitado || false,
          silencioAte: data.silencioAte,
        })
        .returning();

      return result[0] || null;
    }
  } catch (error) {
    console.error("Error updating preferences:", error);
    return null;
  }
}
