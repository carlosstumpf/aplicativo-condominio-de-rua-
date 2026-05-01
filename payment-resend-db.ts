/**
 * Payment Resend Database Schema
 * Tracks manual payment link resends
 */

import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  integer,
  text,
  timestamp,
  varchar,
  pgTable,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Payment Resends
 * Tracks every time a payment link is resent
 */
export const paymentResends = pgTable(
  "payment_resends",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    condominioId: integer().notNull(),
    moradorId: integer().notNull(),
    asaasPaymentId: varchar(50).notNull(),
    canal: varchar(20).notNull(), // "WHATSAPP", "EMAIL", "SMS", "APP"
    numeroDestinatario: varchar(255),
    status: varchar(20).notNull().default("pendente"), // "pendente", "enviado", "falha"
    motivo: varchar(255), // Motivo do reenvio (ex: "Morador solicitou", "Link expirado")
    adminId: integer(), // Admin que solicitou o reenvio
    tentativas: integer().notNull().default(1),
    ultimaTentativa: timestamp(),
    erro: text(), // Erro se houver
    metadados: jsonb(), // Dados adicionais
    criadoEm: timestamp().notNull().defaultNow(),
    atualizadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    condominioIdIdx: index("payment_resends_condominio_id_idx").on(
      table.condominioId
    ),
    moradorIdIdx: index("payment_resends_morador_id_idx").on(table.moradorId),
    asaasPaymentIdIdx: index("payment_resends_asaas_payment_id_idx").on(
      table.asaasPaymentId
    ),
    statusIdx: index("payment_resends_status_idx").on(table.status),
    canalIdx: index("payment_resends_canal_idx").on(table.canal),
  })
);

/**
 * Save resend record
 */
export async function salvarReenvio(data: {
  condominioId: number;
  moradorId: number;
  asaasPaymentId: string;
  canal: "WHATSAPP" | "EMAIL" | "SMS" | "APP";
  numeroDestinatario?: string;
  motivo?: string;
  adminId?: number;
  metadados?: Record<string, any>;
}) {
  try {
    const result = await db
      .insert(paymentResends)
      .values({
        condominioId: data.condominioId,
        moradorId: data.moradorId,
        asaasPaymentId: data.asaasPaymentId,
        canal: data.canal,
        numeroDestinatario: data.numeroDestinatario,
        motivo: data.motivo,
        adminId: data.adminId,
        metadados: data.metadados,
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error saving resend record:", error);
    return null;
  }
}

/**
 * Update resend status
 */
export async function atualizarStatusReenvio(
  reenvioId: number,
  status: "pendente" | "enviado" | "falha",
  erro?: string
) {
  try {
    const result = await db
      .update(paymentResends)
      .set({
        status,
        erro,
        ultimaTentativa: new Date(),
        tentativas: sql`${paymentResends.tentativas} + 1`,
        atualizadoEm: new Date(),
      })
      .where(sql`${paymentResends.id} = ${reenvioId}`)
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error updating resend status:", error);
    return null;
  }
}

/**
 * Get resend history for payment
 */
export async function obterHistoricoReenvios(asaasPaymentId: string) {
  try {
    return await db
      .select()
      .from(paymentResends)
      .where(sql`${paymentResends.asaasPaymentId} = ${asaasPaymentId}`)
      .orderBy(sql`${paymentResends.criadoEm} DESC`);
  } catch (error) {
    console.error("Error getting resend history:", error);
    return [];
  }
}

/**
 * Get resend history for morador
 */
export async function obterHistoricoReenviosMorador(
  condominioId: number,
  moradorId: number,
  filtros?: {
    status?: string;
    canal?: string;
    limite?: number;
  }
) {
  try {
    let query = db
      .select()
      .from(paymentResends)
      .where(
        sql`${paymentResends.condominioId} = ${condominioId} AND ${paymentResends.moradorId} = ${moradorId}`
      );

    if (filtros?.status) {
      query = query.where(sql`${paymentResends.status} = ${filtros.status}`);
    }

    if (filtros?.canal) {
      query = query.where(sql`${paymentResends.canal} = ${filtros.canal}`);
    }

    query = query.orderBy(sql`${paymentResends.criadoEm} DESC`);

    if (filtros?.limite) {
      query = query.limit(filtros.limite);
    }

    return await query;
  } catch (error) {
    console.error("Error getting morador resend history:", error);
    return [];
  }
}

/**
 * Get resend statistics
 */
export async function obterEstatisticasReenvios(condominioId: number) {
  try {
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentResends)
      .where(sql`${paymentResends.condominioId} = ${condominioId}`);

    const enviados = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentResends)
      .where(
        sql`${paymentResends.condominioId} = ${condominioId} AND ${paymentResends.status} = 'enviado'`
      );

    const falhas = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentResends)
      .where(
        sql`${paymentResends.condominioId} = ${condominioId} AND ${paymentResends.status} = 'falha'`
      );

    const porCanal = await db
      .select({
        canal: paymentResends.canal,
        count: sql<number>`count(*)`,
      })
      .from(paymentResends)
      .where(sql`${paymentResends.condominioId} = ${condominioId}`)
      .groupBy(paymentResends.canal);

    return {
      total: total[0]?.count || 0,
      enviados: enviados[0]?.count || 0,
      falhas: falhas[0]?.count || 0,
      taxaSucesso:
        total[0]?.count > 0
          ? ((enviados[0]?.count || 0) / (total[0]?.count || 1)) * 100
          : 0,
      porCanal: porCanal || [],
    };
  } catch (error) {
    console.error("Error getting resend statistics:", error);
    return {
      total: 0,
      enviados: 0,
      falhas: 0,
      taxaSucesso: 0,
      porCanal: [],
    };
  }
}

/**
 * Get recent resends
 */
export async function obterReenviosRecentes(
  condominioId: number,
  limite: number = 50
) {
  try {
    return await db
      .select()
      .from(paymentResends)
      .where(sql`${paymentResends.condominioId} = ${condominioId}`)
      .orderBy(sql`${paymentResends.criadoEm} DESC`)
      .limit(limite);
  } catch (error) {
    console.error("Error getting recent resends:", error);
    return [];
  }
}

/**
 * Get failed resends for retry
 */
export async function obterReenviosFalhados(
  condominioId: number,
  limite: number = 100
) {
  try {
    return await db
      .select()
      .from(paymentResends)
      .where(
        sql`${paymentResends.condominioId} = ${condominioId} AND ${paymentResends.status} = 'falha'`
      )
      .orderBy(sql`${paymentResends.criadoEm} ASC`)
      .limit(limite);
  } catch (error) {
    console.error("Error getting failed resends:", error);
    return [];
  }
}

/**
 * Get resends by admin
 */
export async function obterReenviosPorAdmin(
  condominioId: number,
  adminId: number,
  filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    limite?: number;
  }
) {
  try {
    let query = db
      .select()
      .from(paymentResends)
      .where(
        sql`${paymentResends.condominioId} = ${condominioId} AND ${paymentResends.adminId} = ${adminId}`
      );

    if (filtros?.dataInicio) {
      query = query.where(
        sql`${paymentResends.criadoEm} >= ${filtros.dataInicio}`
      );
    }

    if (filtros?.dataFim) {
      query = query.where(
        sql`${paymentResends.criadoEm} <= ${filtros.dataFim}`
      );
    }

    query = query.orderBy(sql`${paymentResends.criadoEm} DESC`);

    if (filtros?.limite) {
      query = query.limit(filtros.limite);
    }

    return await query;
  } catch (error) {
    console.error("Error getting resends by admin:", error);
    return [];
  }
}
