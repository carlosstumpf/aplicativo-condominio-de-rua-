import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Moradores (Residents) table
 */
export const moradores = mysqlTable("moradores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  telefone: varchar("telefone", { length: 20 }).notNull().unique(),
  nomeCompleto: text("nomeCompleto").notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull(),
  identificacaoCasa: varchar("identificacaoCasa", { length: 50 }).notNull(),
  statusAtivo: int("statusAtivo").default(1).notNull(),
  asaasCustomerId: varchar("asaasCustomerId", { length: 100 }),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Morador = typeof moradores.$inferSelect;
export type InsertMorador = typeof moradores.$inferInsert;

/**
 * Cobranças (Charges) table
 */
export const cobrancas = mysqlTable("cobrancas", {
  id: int("id").autoincrement().primaryKey(),
  moradorId: int("moradorId").references(() => moradores.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  asaasPaymentId: varchar("asaasPaymentId", { length: 100 }).notNull().unique(),
  tipo: mysqlEnum("tipo", ["PIX", "BOLETO"]).notNull(),
  mesReferencia: varchar("mesReferencia", { length: 7 }).notNull(),
  valor: int("valor").notNull(),
  vencimento: varchar("vencimento", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "RECEIVED", "OVERDUE", "CANCELLED"]).default("PENDING").notNull(),
  descricao: text("descricao"),
  // PIX fields
  pixQrCode: text("pixQrCode"),
  pixCopyPaste: text("pixCopyPaste"),
  // Boleto fields
  boletoUrl: text("boletoUrl"),
  boletoBarCode: varchar("boletoBarCode", { length: 100 }),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Cobranca = typeof cobrancas.$inferSelect;
export type InsertCobranca = typeof cobrancas.$inferInsert;

/**
 * Despesas (Expenses) table
 */
export const despesas = mysqlTable("despesas", {
  id: int("id").autoincrement().primaryKey(),
  categoria: mysqlEnum("categoria", ["MANUTENCAO", "LIMPEZA", "SEGURANCA", "UTILIDADES", "OUTROS"]).notNull(),
  descricao: text("descricao").notNull(),
  valor: int("valor").notNull(),
  comprovante: text("comprovante"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Despesa = typeof despesas.$inferSelect;
export type InsertDespesa = typeof despesas.$inferInsert;

/**
 * Chamados (Support Tickets) table
 */
export const chamados = mysqlTable("chamados", {
  id: int("id").autoincrement().primaryKey(),
  moradorId: int("moradorId").references(() => moradores.id),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  categoria: mysqlEnum("categoria", ["MANUTENCAO", "SEGURANCA", "LIMPEZA", "OUTRO"]).default("OUTRO").notNull(),
  anexo: text("anexo"),
  status: mysqlEnum("status", ["ABERTO", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"]).default("ABERTO").notNull(),
  prioridade: mysqlEnum("prioridade", ["BAIXA", "MEDIA", "ALTA"]).default("MEDIA").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Chamado = typeof chamados.$inferSelect;
export type InsertChamado = typeof chamados.$inferInsert;

/**
 * Respostas de Chamados (Support Ticket Responses) table
 */
export const respostasChamados = mysqlTable("respostasChamados", {
  id: int("id").autoincrement().primaryKey(),
  chamadoId: int("chamadoId").references(() => chamados.id),
  userId: int("userId").references(() => users.id),
  resposta: text("resposta").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type RespostaChamado = typeof respostasChamados.$inferSelect;
export type InsertRespostaChamado = typeof respostasChamados.$inferInsert;

/**
 * Webhook History (Asaas webhook events) table
 */
export const webhookHistory = mysqlTable("webhookHistory", {
  id: int("id").autoincrement().primaryKey(),
  asaasPaymentId: varchar("asaasPaymentId", { length: 100 }).notNull(),
  event: varchar("event", { length: 50 }).notNull(),
  asaasStatus: varchar("asaasStatus", { length: 50 }).notNull(),
  internalStatus: mysqlEnum("internalStatus", ["PENDING", "RECEIVED", "OVERDUE", "CANCELLED"]).notNull(),
  payload: text("payload").notNull(),
  statusCode: int("statusCode").default(200).notNull(),
  success: int("success").default(1).notNull(),
  errorMessage: text("errorMessage"),
  statusUpdated: int("statusUpdated").default(0).notNull(),
  notificationCreated: int("notificationCreated").default(0).notNull(),
  retryCount: int("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  lastRetryAt: timestamp("lastRetryAt"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookHistoryRecord = typeof webhookHistory.$inferSelect;
export type InsertWebhookHistoryRecord = typeof webhookHistory.$inferInsert;

/**
 * Webhook Metrics (aggregated statistics) table
 */
export const webhookMetrics = mysqlTable("webhookMetrics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(),
  totalReceived: int("totalReceived").default(0).notNull(),
  totalProcessed: int("totalProcessed").default(0).notNull(),
  totalSuccessful: int("totalSuccessful").default(0).notNull(),
  totalFailed: int("totalFailed").default(0).notNull(),
  totalRetried: int("totalRetried").default(0).notNull(),
  averageProcessingTime: int("averageProcessingTime").default(0).notNull(),
  statusUpdatedCount: int("statusUpdatedCount").default(0).notNull(),
  notificationCreatedCount: int("notificationCreatedCount").default(0).notNull(),
  errorCount: int("errorCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookMetrics = typeof webhookMetrics.$inferSelect;
export type InsertWebhookMetrics = typeof webhookMetrics.$inferInsert;
