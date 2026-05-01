/**
 * Asaas Database Schema
 * Manages payment integration with Asaas
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
  decimal,
  pgTable,
  index,
} from "drizzle-orm/pg-core";

/**
 * Asaas Configuration
 * Stores Asaas API credentials and settings
 */
export const asaasConfig = pgTable(
  "asaas_config",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    condominioId: integer().notNull(),
    apiKey: text().notNull(), // Asaas API Key
    walletId: varchar(50), // Asaas Wallet ID
    ambiente: varchar(20).notNull().default("producao"), // "teste" ou "producao"
    ativo: boolean().notNull().default(true),
    testeado: boolean().notNull().default(false),
    ultimoTeste: timestamp(),
    criadoEm: timestamp().notNull().defaultNow(),
    atualizadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    condominioIdIdx: index("asaas_config_condominio_id_idx").on(
      table.condominioId
    ),
  })
);

/**
 * Asaas Customers
 * Stores customer data synced from Asaas
 */
export const asaasCustomers = pgTable(
  "asaas_customers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    condominioId: integer().notNull(),
    moradorId: integer().notNull(),
    asaasCustomerId: varchar(50).notNull(), // ID do cliente no Asaas
    nome: varchar(255).notNull(),
    email: varchar(255).notNull(),
    cpfCnpj: varchar(20),
    telefone: varchar(20),
    endereco: text(),
    numero: varchar(10),
    complemento: text(),
    bairro: varchar(100),
    cidade: varchar(100),
    estado: varchar(2),
    cep: varchar(10),
    sincronizadoEm: timestamp().notNull().defaultNow(),
    criadoEm: timestamp().notNull().defaultNow(),
    atualizadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    condominioIdIdx: index("asaas_customers_condominio_id_idx").on(
      table.condominioId
    ),
    moradorIdIdx: index("asaas_customers_morador_id_idx").on(table.moradorId),
    asaasCustomerIdIdx: index("asaas_customers_asaas_customer_id_idx").on(
      table.asaasCustomerId
    ),
  })
);

/**
 * Asaas Payments
 * Stores payment records from Asaas
 */
export const asaasPayments = pgTable(
  "asaas_payments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    condominioId: integer().notNull(),
    moradorId: integer().notNull(),
    asaasPaymentId: varchar(50).notNull(), // ID da cobrança no Asaas
    asaasCustomerId: varchar(50).notNull(),
    descricao: varchar(255).notNull(),
    valor: decimal("10,2").notNull(),
    status: varchar(20).notNull(), // "PENDING", "CONFIRMED", "RECEIVED", "OVERDUE", "REFUNDED", "DELETED", "DUNNING"
    tipo: varchar(20).notNull(), // "PIX", "BOLETO", "CREDIT_CARD", "DEBIT_CARD"
    dataVencimento: timestamp().notNull(),
    dataPagamento: timestamp(),
    dataConfirmacao: timestamp(),
    pixQrCode: text(), // QR Code para PIX
    pixCopyPaste: text(), // Chave PIX para copiar e colar
    boletoUrl: text(), // URL do boleto
    boletoBarcode: varchar(50), // Código de barras
    linkPagamento: text(), // Link de pagamento
    metadados: jsonb(), // Dados adicionais
    sincronizadoEm: timestamp().notNull().defaultNow(),
    criadoEm: timestamp().notNull().defaultNow(),
    atualizadoEm: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    condominioIdIdx: index("asaas_payments_condominio_id_idx").on(
      table.condominioId
    ),
    moradorIdIdx: index("asaas_payments_morador_id_idx").on(table.moradorId),
    asaasPaymentIdIdx: index("asaas_payments_asaas_payment_id_idx").on(
      table.asaasPaymentId
    ),
    statusIdx: index("asaas_payments_status_idx").on(table.status),
    dataVencimentoIdx: index("asaas_payments_data_vencimento_idx").on(
      table.dataVencimento
    ),
  })
);

/**
 * Asaas Webhooks
 * Tracks webhook events from Asaas
 */
export const asaasWebhooks = pgTable(
  "asaas_webhooks",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    condominioId: integer().notNull(),
    evento: varchar(50).notNull(), // "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED"
    asaasPaymentId: varchar(50),
    asaasCustomerId: varchar(50),
    payload: jsonb().notNull(),
    processado: boolean().notNull().default(false),
    erro: text(),
    criadoEm: timestamp().notNull().defaultNow(),
    processadoEm: timestamp(),
  },
  (table) => ({
    condominioIdIdx: index("asaas_webhooks_condominio_id_idx").on(
      table.condominioId
    ),
    eventoIdx: index("asaas_webhooks_evento_idx").on(table.evento),
    processadoIdx: index("asaas_webhooks_processado_idx").on(table.processado),
  })
);

/**
 * Create or update Asaas configuration
 */
export async function configurarAsaas(data: {
  condominioId: number;
  apiKey: string;
  walletId?: string;
  ambiente?: "teste" | "producao";
}) {
  try {
    const existing = await db
      .select()
      .from(asaasConfig)
      .where(sql`${asaasConfig.condominioId} = ${data.condominioId}`);

    if (existing.length > 0) {
      const result = await db
        .update(asaasConfig)
        .set({
          apiKey: data.apiKey,
          walletId: data.walletId,
          ambiente: data.ambiente || "producao",
          atualizadoEm: new Date(),
        })
        .where(sql`${asaasConfig.condominioId} = ${data.condominioId}`)
        .returning();

      return result[0] || null;
    } else {
      const result = await db
        .insert(asaasConfig)
        .values({
          condominioId: data.condominioId,
          apiKey: data.apiKey,
          walletId: data.walletId,
          ambiente: data.ambiente || "producao",
        })
        .returning();

      return result[0] || null;
    }
  } catch (error) {
    console.error("Error configuring Asaas:", error);
    return null;
  }
}

/**
 * Get Asaas configuration
 */
export async function obterConfigAsaas(condominioId: number) {
  try {
    const result = await db
      .select()
      .from(asaasConfig)
      .where(sql`${asaasConfig.condominioId} = ${condominioId}`);

    return result[0] || null;
  } catch (error) {
    console.error("Error getting Asaas config:", error);
    return null;
  }
}

/**
 * Save or update Asaas customer
 */
export async function salvarCustomerAsaas(data: {
  condominioId: number;
  moradorId: number;
  asaasCustomerId: string;
  nome: string;
  email: string;
  cpfCnpj?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}) {
  try {
    const existing = await db
      .select()
      .from(asaasCustomers)
      .where(
        sql`${asaasCustomers.condominioId} = ${data.condominioId} AND ${asaasCustomers.moradorId} = ${data.moradorId}`
      );

    if (existing.length > 0) {
      const result = await db
        .update(asaasCustomers)
        .set({
          asaasCustomerId: data.asaasCustomerId,
          nome: data.nome,
          email: data.email,
          cpfCnpj: data.cpfCnpj,
          telefone: data.telefone,
          endereco: data.endereco,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
          sincronizadoEm: new Date(),
          atualizadoEm: new Date(),
        })
        .where(
          sql`${asaasCustomers.condominioId} = ${data.condominioId} AND ${asaasCustomers.moradorId} = ${data.moradorId}`
        )
        .returning();

      return result[0] || null;
    } else {
      const result = await db
        .insert(asaasCustomers)
        .values(data)
        .returning();

      return result[0] || null;
    }
  } catch (error) {
    console.error("Error saving Asaas customer:", error);
    return null;
  }
}

/**
 * Save payment
 */
export async function salvarPagamentoAsaas(data: {
  condominioId: number;
  moradorId: number;
  asaasPaymentId: string;
  asaasCustomerId: string;
  descricao: string;
  valor: number;
  status: string;
  tipo: string;
  dataVencimento: Date;
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  linkPagamento?: string;
  metadados?: Record<string, any>;
}) {
  try {
    const existing = await db
      .select()
      .from(asaasPayments)
      .where(
        sql`${asaasPayments.asaasPaymentId} = ${data.asaasPaymentId}`
      );

    if (existing.length > 0) {
      const result = await db
        .update(asaasPayments)
        .set({
          status: data.status,
          pixQrCode: data.pixQrCode,
          pixCopyPaste: data.pixCopyPaste,
          boletoUrl: data.boletoUrl,
          boletoBarcode: data.boletoBarcode,
          linkPagamento: data.linkPagamento,
          metadados: data.metadados,
          atualizadoEm: new Date(),
        })
        .where(sql`${asaasPayments.asaasPaymentId} = ${data.asaasPaymentId}`)
        .returning();

      return result[0] || null;
    } else {
      const result = await db
        .insert(asaasPayments)
        .values({
          condominioId: data.condominioId,
          moradorId: data.moradorId,
          asaasPaymentId: data.asaasPaymentId,
          asaasCustomerId: data.asaasCustomerId,
          descricao: data.descricao,
          valor: data.valor.toString(),
          status: data.status,
          tipo: data.tipo,
          dataVencimento: data.dataVencimento,
          pixQrCode: data.pixQrCode,
          pixCopyPaste: data.pixCopyPaste,
          boletoUrl: data.boletoUrl,
          boletoBarcode: data.boletoBarcode,
          linkPagamento: data.linkPagamento,
          metadados: data.metadados,
        })
        .returning();

      return result[0] || null;
    }
  } catch (error) {
    console.error("Error saving Asaas payment:", error);
    return null;
  }
}

/**
 * Get payments by morador
 */
export async function obterPagamentosMorador(
  condominioId: number,
  moradorId: number,
  filtros?: {
    status?: string;
    tipo?: string;
  }
) {
  try {
    let query = db
      .select()
      .from(asaasPayments)
      .where(
        sql`${asaasPayments.condominioId} = ${condominioId} AND ${asaasPayments.moradorId} = ${moradorId}`
      );

    if (filtros?.status) {
      query = query.where(sql`${asaasPayments.status} = ${filtros.status}`);
    }

    if (filtros?.tipo) {
      query = query.where(sql`${asaasPayments.tipo} = ${filtros.tipo}`);
    }

    return await query.orderBy(sql`${asaasPayments.dataVencimento} DESC`);
  } catch (error) {
    console.error("Error getting payments:", error);
    return [];
  }
}

/**
 * Save webhook event
 */
export async function salvarWebhookAsaas(data: {
  condominioId: number;
  evento: string;
  asaasPaymentId?: string;
  asaasCustomerId?: string;
  payload: Record<string, any>;
}) {
  try {
    const result = await db
      .insert(asaasWebhooks)
      .values({
        condominioId: data.condominioId,
        evento: data.evento,
        asaasPaymentId: data.asaasPaymentId,
        asaasCustomerId: data.asaasCustomerId,
        payload: data.payload,
      })
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error saving webhook:", error);
    return null;
  }
}

/**
 * Mark webhook as processed
 */
export async function marcarWebhookProcessado(
  webhookId: number,
  erro?: string
) {
  try {
    const result = await db
      .update(asaasWebhooks)
      .set({
        processado: true,
        erro,
        processadoEm: new Date(),
      })
      .where(sql`${asaasWebhooks.id} = ${webhookId}`)
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error marking webhook as processed:", error);
    return null;
  }
}

/**
 * Get unprocessed webhooks
 */
export async function obterWebhooksNaoProcessados(condominioId: number) {
  try {
    return await db
      .select()
      .from(asaasWebhooks)
      .where(
        sql`${asaasWebhooks.condominioId} = ${condominioId} AND ${asaasWebhooks.processado} = false`
      )
      .orderBy(sql`${asaasWebhooks.criadoEm} ASC`);
  } catch (error) {
    console.error("Error getting unprocessed webhooks:", error);
    return [];
  }
}

/**
 * Get payment statistics
 */
export async function obterEstatisticasPagamentos(condominioId: number) {
  try {
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(asaasPayments)
      .where(sql`${asaasPayments.condominioId} = ${condominioId}`);

    const recebidos = await db
      .select({ count: sql<number>`count(*)` })
      .from(asaasPayments)
      .where(
        sql`${asaasPayments.condominioId} = ${condominioId} AND ${asaasPayments.status} = 'RECEIVED'`
      );

    const pendentes = await db
      .select({ count: sql<number>`count(*)` })
      .from(asaasPayments)
      .where(
        sql`${asaasPayments.condominioId} = ${condominioId} AND ${asaasPayments.status} = 'PENDING'`
      );

    const atrasados = await db
      .select({ count: sql<number>`count(*)` })
      .from(asaasPayments)
      .where(
        sql`${asaasPayments.condominioId} = ${condominioId} AND ${asaasPayments.status} = 'OVERDUE'`
      );

    const valorTotal = await db
      .select({ total: sql<number>`SUM(CAST(${asaasPayments.valor} AS NUMERIC))` })
      .from(asaasPayments)
      .where(sql`${asaasPayments.condominioId} = ${condominioId}`);

    const valorRecebido = await db
      .select({ total: sql<number>`SUM(CAST(${asaasPayments.valor} AS NUMERIC))` })
      .from(asaasPayments)
      .where(
        sql`${asaasPayments.condominioId} = ${condominioId} AND ${asaasPayments.status} = 'RECEIVED'`
      );

    return {
      total: total[0]?.count || 0,
      recebidos: recebidos[0]?.count || 0,
      pendentes: pendentes[0]?.count || 0,
      atrasados: atrasados[0]?.count || 0,
      valorTotal: parseFloat(valorTotal[0]?.total || "0"),
      valorRecebido: parseFloat(valorRecebido[0]?.total || "0"),
      taxaRecebimento:
        total[0]?.count > 0
          ? ((recebidos[0]?.count || 0) / (total[0]?.count || 1)) * 100
          : 0,
    };
  } catch (error) {
    console.error("Error getting payment statistics:", error);
    return {
      total: 0,
      recebidos: 0,
      pendentes: 0,
      atrasados: 0,
      valorTotal: 0,
      valorRecebido: 0,
      taxaRecebimento: 0,
    };
  }
}
