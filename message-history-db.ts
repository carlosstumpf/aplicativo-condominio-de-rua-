/**
 * Message History Database
 * Armazena histórico de todas as interações via WhatsApp
 */

import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

/**
 * Tabela: Histórico de Mensagens
 */
export const messageHistory = sqliteTable(
  "message_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    messageId: text("message_id").notNull().unique(),
    from: text("from").notNull(), // Número do morador
    to: text("to").notNull(), // Número do admin
    text: text("text").notNull(),
    direction: text("direction").notNull(), // "incoming" ou "outgoing"
    type: text("type").notNull(), // "text", "menu", "payment", etc
    action: text("action"), // Ação executada (payment_pix, payment_boleto, etc)
    success: integer("success").notNull().default(1), // 1 = sucesso, 0 = erro
    errorMessage: text("error_message"),
    metadata: text("metadata"), // JSON com dados adicionais
    timestamp: integer("timestamp").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    fromIdx: index("message_history_from_idx").on(table.from),
    toIdx: index("message_history_to_idx").on(table.to),
    typeIdx: index("message_history_type_idx").on(table.type),
    actionIdx: index("message_history_action_idx").on(table.action),
    timestampIdx: index("message_history_timestamp_idx").on(table.timestamp),
  })
);

/**
 * Tabela: Interações de Menu
 */
export const menuInteractions = sqliteTable(
  "menu_interactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    moradorPhone: text("morador_phone").notNull(),
    moradorName: text("morador_name"),
    menuTitle: text("menu_title").notNull(),
    optionNumber: integer("option_number").notNull(),
    optionLabel: text("option_label").notNull(),
    action: text("action").notNull(),
    success: integer("success").notNull().default(1),
    errorMessage: text("error_message"),
    responseTime: integer("response_time"), // ms
    timestamp: integer("timestamp").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    moradorPhoneIdx: index("menu_interactions_morador_phone_idx").on(
      table.moradorPhone
    ),
    actionIdx: index("menu_interactions_action_idx").on(table.action),
    timestampIdx: index("menu_interactions_timestamp_idx").on(table.timestamp),
  })
);

/**
 * Tabela: Pagamentos Processados
 */
export const processedPayments = sqliteTable(
  "processed_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    moradorPhone: text("morador_phone").notNull(),
    moradorName: text("morador_name"),
    amount: real("amount").notNull(),
    dueDate: text("due_date"),
    paymentMethod: text("payment_method").notNull(), // "pix" ou "boleto"
    pixKey: text("pix_key"),
    barcodeUrl: text("barcode_url"),
    asaasPaymentId: text("asaas_payment_id"),
    status: text("status").notNull().default("pending"), // pending, sent, confirmed, paid
    sentAt: integer("sent_at"),
    confirmedAt: integer("confirmed_at"),
    paidAt: integer("paid_at"),
    timestamp: integer("timestamp").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    moradorPhoneIdx: index("processed_payments_morador_phone_idx").on(
      table.moradorPhone
    ),
    statusIdx: index("processed_payments_status_idx").on(table.status),
    paymentMethodIdx: index("processed_payments_payment_method_idx").on(
      table.paymentMethod
    ),
    timestampIdx: index("processed_payments_timestamp_idx").on(table.timestamp),
  })
);

/**
 * Tabela: Estatísticas de Interação
 */
export const interactionStats = sqliteTable(
  "interaction_stats",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    moradorPhone: text("morador_phone").notNull().unique(),
    moradorName: text("morador_name"),
    totalMessages: integer("total_messages").notNull().default(0),
    totalMenus: integer("total_menus").notNull().default(0),
    totalPayments: integer("total_payments").notNull().default(0),
    pixCount: integer("pix_count").notNull().default(0),
    boletoCount: integer("boleto_count").notNull().default(0),
    adminContactCount: integer("admin_contact_count").notNull().default(0),
    lastInteraction: integer("last_interaction"),
    averageResponseTime: real("average_response_time"),
    successRate: real("success_rate").notNull().default(100),
    updatedAt: integer("updated_at").notNull().default(sql`(strftime('%s', 'now'))`),
  },
  (table) => ({
    moradorPhoneIdx: index("interaction_stats_morador_phone_idx").on(
      table.moradorPhone
    ),
  })
);

/**
 * Funções de Banco de Dados
 */

/**
 * Registrar mensagem no histórico
 */
export async function recordMessage(
  db: any,
  data: {
    messageId: string;
    from: string;
    to: string;
    text: string;
    direction: "incoming" | "outgoing";
    type: string;
    action?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    timestamp: number;
  }
) {
  return db.insert(messageHistory).values({
    ...data,
    success: data.success ? 1 : 0,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

/**
 * Registrar interação de menu
 */
export async function recordMenuInteraction(
  db: any,
  data: {
    moradorPhone: string;
    moradorName?: string;
    menuTitle: string;
    optionNumber: number;
    optionLabel: string;
    action: string;
    success: boolean;
    errorMessage?: string;
    responseTime?: number;
    timestamp: number;
  }
) {
  return db.insert(menuInteractions).values({
    ...data,
    success: data.success ? 1 : 0,
  });
}

/**
 * Registrar pagamento processado
 */
export async function recordProcessedPayment(
  db: any,
  data: {
    moradorPhone: string;
    moradorName?: string;
    amount: number;
    dueDate?: string;
    paymentMethod: "pix" | "boleto";
    pixKey?: string;
    barcodeUrl?: string;
    asaasPaymentId?: string;
    status: "pending" | "sent" | "confirmed" | "paid";
    sentAt?: number;
    confirmedAt?: number;
    paidAt?: number;
    timestamp: number;
  }
) {
  return db.insert(processedPayments).values(data);
}

/**
 * Atualizar status de pagamento
 */
export async function updatePaymentStatus(
  db: any,
  asaasPaymentId: string,
  status: "pending" | "sent" | "confirmed" | "paid",
  updateTime?: number
) {
  const updateData: any = { status };

  if (status === "sent") updateData.sentAt = updateTime || Date.now() / 1000;
  if (status === "confirmed") updateData.confirmedAt = updateTime || Date.now() / 1000;
  if (status === "paid") updateData.paidAt = updateTime || Date.now() / 1000;

  return db
    .update(processedPayments)
    .set(updateData)
    .where(sql`asaas_payment_id = ${asaasPaymentId}`);
}

/**
 * Obter histórico de mensagens de um morador
 */
export async function getMessageHistory(
  db: any,
  moradorPhone: string,
  limit: number = 50
) {
  return db
    .select()
    .from(messageHistory)
    .where(sql`from = ${moradorPhone} OR to = ${moradorPhone}`)
    .orderBy(sql`timestamp DESC`)
    .limit(limit);
}

/**
 * Obter interações de menu de um morador
 */
export async function getMenuInteractions(
  db: any,
  moradorPhone: string,
  limit: number = 50
) {
  return db
    .select()
    .from(menuInteractions)
    .where(sql`morador_phone = ${moradorPhone}`)
    .orderBy(sql`timestamp DESC`)
    .limit(limit);
}

/**
 * Obter pagamentos processados de um morador
 */
export async function getProcessedPayments(
  db: any,
  moradorPhone: string,
  limit: number = 50
) {
  return db
    .select()
    .from(processedPayments)
    .where(sql`morador_phone = ${moradorPhone}`)
    .orderBy(sql`timestamp DESC`)
    .limit(limit);
}

/**
 * Obter estatísticas de um morador
 */
export async function getInteractionStats(db: any, moradorPhone: string) {
  return db
    .select()
    .from(interactionStats)
    .where(sql`morador_phone = ${moradorPhone}`)
    .limit(1);
}

/**
 * Atualizar estatísticas de interação
 */
export async function updateInteractionStats(
  db: any,
  moradorPhone: string,
  updates: Record<string, any>
) {
  return db
    .update(interactionStats)
    .set({
      ...updates,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(sql`morador_phone = ${moradorPhone}`);
}

/**
 * Obter estatísticas globais
 */
export async function getGlobalStats(db: any) {
  return {
    totalMessages: await db
      .select({ count: sql`COUNT(*)` })
      .from(messageHistory),
    totalMenuInteractions: await db
      .select({ count: sql`COUNT(*)` })
      .from(menuInteractions),
    totalPaymentsProcessed: await db
      .select({ count: sql`COUNT(*)` })
      .from(processedPayments),
    averageSuccessRate: await db
      .select({ avg: sql`AVG(success_rate)` })
      .from(interactionStats),
  };
}
