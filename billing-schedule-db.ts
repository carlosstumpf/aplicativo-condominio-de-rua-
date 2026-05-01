/**
 * Billing Schedule Database Operations
 * Manages billing schedules, payment deadlines, and notifications
 */

import { db } from "@/server/_core/db";
import { cobrancas, notificacoes } from "@/drizzle/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

export interface BillingSchedule {
  id: number;
  moradorId: number;
  dueDate: Date;
  amount: number;
  description: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  notificationSentAt?: Date;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingNotification {
  id: number;
  billingId: number;
  moradorId: number;
  type: "reminder" | "overdue" | "payment_received";
  sentAt: Date;
  channel: "app" | "whatsapp" | "email";
}

/**
 * Create a new billing schedule
 */
export async function createBillingSchedule(data: {
  moradorId: number;
  dueDate: Date;
  amount: number;
  description: string;
}): Promise<BillingSchedule> {
  const now = new Date();

  const result = await db.insert(cobrancas).values({
    moradorId: data.moradorId,
    dataVencimento: data.dueDate,
    valor: data.amount,
    descricao: data.description,
    status: "pending",
    dataCriacao: now,
    dataAtualizacao: now,
  });

  return {
    id: result[0].insertId as number,
    moradorId: data.moradorId,
    dueDate: data.dueDate,
    amount: data.amount,
    description: data.description,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get billing schedules due for reminder (3 days before due date)
 */
export async function getBillingsDueForReminder(): Promise<BillingSchedule[]> {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const results = await db
    .select()
    .from(cobrancas)
    .where(
      and(
        eq(cobrancas.status, "pending"),
        gte(cobrancas.dataVencimento, now),
        lte(cobrancas.dataVencimento, threeDaysLater),
        isNull(cobrancas.dataNotificacao)
      )
    );

  return results.map((r) => ({
    id: r.id,
    moradorId: r.moradorId,
    dueDate: r.dataVencimento,
    amount: r.valor,
    description: r.descricao,
    status: r.status as "pending" | "paid" | "overdue" | "cancelled",
    notificationSentAt: r.dataNotificacao || undefined,
    createdAt: r.dataCriacao,
    updatedAt: r.dataAtualizacao,
  }));
}

/**
 * Get overdue billings
 */
export async function getOverdueBillings(): Promise<BillingSchedule[]> {
  const now = new Date();

  const results = await db
    .select()
    .from(cobrancas)
    .where(
      and(
        eq(cobrancas.status, "pending"),
        lte(cobrancas.dataVencimento, now)
      )
    );

  return results.map((r) => ({
    id: r.id,
    moradorId: r.moradorId,
    dueDate: r.dataVencimento,
    amount: r.valor,
    description: r.descricao,
    status: r.status as "pending" | "paid" | "overdue" | "cancelled",
    notificationSentAt: r.dataNotificacao || undefined,
    createdAt: r.dataCriacao,
    updatedAt: r.dataAtualizacao,
  }));
}

/**
 * Get billings for a morador
 */
export async function getMoradorBillings(
  moradorId: number,
  options?: {
    status?: "pending" | "paid" | "overdue" | "cancelled";
    limit?: number;
    offset?: number;
  }
): Promise<BillingSchedule[]> {
  let query = db.select().from(cobrancas).where(eq(cobrancas.moradorId, moradorId));

  if (options?.status) {
    query = query.where(eq(cobrancas.status, options.status));
  }

  const results = await query.limit(options?.limit || 10).offset(options?.offset || 0);

  return results.map((r) => ({
    id: r.id,
    moradorId: r.moradorId,
    dueDate: r.dataVencimento,
    amount: r.valor,
    description: r.descricao,
    status: r.status as "pending" | "paid" | "overdue" | "cancelled",
    notificationSentAt: r.dataNotificacao || undefined,
    createdAt: r.dataCriacao,
    updatedAt: r.dataAtualizacao,
  }));
}

/**
 * Mark billing as notified
 */
export async function markBillingAsNotified(billingId: number): Promise<void> {
  const now = new Date();

  await db
    .update(cobrancas)
    .set({
      dataNotificacao: now,
      dataAtualizacao: now,
    })
    .where(eq(cobrancas.id, billingId));
}

/**
 * Get billing by ID
 */
export async function getBilling(billingId: number): Promise<BillingSchedule | null> {
  const result = await db
    .select()
    .from(cobrancas)
    .where(eq(cobrancas.id, billingId))
    .limit(1);

  if (result.length === 0) return null;

  const r = result[0];
  return {
    id: r.id,
    moradorId: r.moradorId,
    dueDate: r.dataVencimento,
    amount: r.valor,
    description: r.descricao,
    status: r.status as "pending" | "paid" | "overdue" | "cancelled",
    notificationSentAt: r.dataNotificacao || undefined,
    createdAt: r.dataCriacao,
    updatedAt: r.dataAtualizacao,
  };
}

/**
 * Get billing statistics for a morador
 */
export async function getMoradorBillingStats(moradorId: number): Promise<{
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}> {
  const results = await db
    .select()
    .from(cobrancas)
    .where(eq(cobrancas.moradorId, moradorId));

  const stats = {
    total: results.length,
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  };

  const now = new Date();

  results.forEach((r) => {
    stats.totalAmount += r.valor;

    if (r.status === "pending") {
      stats.pending++;
      stats.pendingAmount += r.valor;

      if (r.dataVencimento <= now) {
        stats.overdue++;
        stats.overdueAmount += r.valor;
      }
    } else if (r.status === "paid") {
      stats.paid++;
    }
  });

  return stats;
}

/**
 * Get upcoming billings (next 30 days)
 */
export async function getUpcomingBillings(moradorId: number): Promise<BillingSchedule[]> {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const results = await db
    .select()
    .from(cobrancas)
    .where(
      and(
        eq(cobrancas.moradorId, moradorId),
        eq(cobrancas.status, "pending"),
        gte(cobrancas.dataVencimento, now),
        lte(cobrancas.dataVencimento, thirtyDaysLater)
      )
    );

  return results.map((r) => ({
    id: r.id,
    moradorId: r.moradorId,
    dueDate: r.dataVencimento,
    amount: r.valor,
    description: r.descricao,
    status: r.status as "pending" | "paid" | "overdue" | "cancelled",
    notificationSentAt: r.dataNotificacao || undefined,
    createdAt: r.dataCriacao,
    updatedAt: r.dataAtualizacao,
  }));
}

/**
 * Create billing notification record
 */
export async function createBillingNotification(data: {
  billingId: number;
  moradorId: number;
  type: "reminder" | "overdue" | "payment_received";
  channel: "app" | "whatsapp" | "email";
}): Promise<BillingNotification> {
  const now = new Date();

  const result = await db.insert(notificacoes).values({
    moradorId: data.moradorId,
    tipo: `billing_${data.type}`,
    mensagem: `Notificação de cobrança: ${data.type}`,
    lida: false,
    dataCriacao: now,
  });

  return {
    id: result[0].insertId as number,
    billingId: data.billingId,
    moradorId: data.moradorId,
    type: data.type,
    sentAt: now,
    channel: data.channel,
  };
}

/**
 * Get billing notifications
 */
export async function getBillingNotifications(
  moradorId: number,
  options?: {
    type?: "reminder" | "overdue" | "payment_received";
    limit?: number;
    offset?: number;
  }
): Promise<BillingNotification[]> {
  let query = db
    .select()
    .from(notificacoes)
    .where(
      and(
        eq(notificacoes.moradorId, moradorId),
        // Filter for billing-related notifications
      )
    );

  const results = await query.limit(options?.limit || 10).offset(options?.offset || 0);

  return results.map((r) => ({
    id: r.id,
    billingId: 0, // Would need to join to get this
    moradorId: r.moradorId,
    type: "reminder" as const,
    sentAt: r.dataCriacao,
    channel: "app" as const,
  }));
}

/**
 * Calculate days until due date
 */
export function daysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if billing is due for reminder (3 days before)
 */
export function isDueForReminder(dueDate: Date): boolean {
  const days = daysUntilDue(dueDate);
  return days <= 3 && days > 0;
}

/**
 * Check if billing is overdue
 */
export function isOverdue(dueDate: Date): boolean {
  return daysUntilDue(dueDate) < 0;
}

/**
 * Format billing status in Portuguese
 */
export function formatBillingStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    paid: "Pago",
    overdue: "Atrasado",
    cancelled: "Cancelado",
  };
  return statusMap[status] || status;
}

/**
 * Export billings to CSV
 */
export async function exportBillingsToCSV(moradorId: number): Promise<string> {
  const billings = await getMoradorBillings(moradorId, { limit: 1000 });

  let csv = "ID,Vencimento,Valor,Descrição,Status,Dias para Vencer\n";

  billings.forEach((billing) => {
    const daysLeft = daysUntilDue(billing.dueDate);
    csv += `${billing.id},"${billing.dueDate.toLocaleDateString("pt-BR")}","R$ ${billing.amount.toFixed(2)}","${billing.description}","${formatBillingStatus(billing.status)}","${daysLeft}"\n`;
  });

  return csv;
}
