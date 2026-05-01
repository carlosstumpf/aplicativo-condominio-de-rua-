/**
 * Receipt Tracking Database Operations
 * Track and manage payment receipt delivery status
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

export interface ReceiptDeliveryLog {
  id: number;
  receiptId: string;
  billingId: number;
  moradorId: number;
  emailSent: boolean;
  emailError?: string;
  emailSentAt?: Date;
  whatsappSent: boolean;
  whatsappError?: string;
  whatsappSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create receipt delivery log
 */
export async function createReceiptDeliveryLog(data: {
  receiptId: string;
  billingId: number;
  moradorId: number;
  emailSent: boolean;
  emailError?: string;
  whatsappSent: boolean;
  whatsappError?: string;
}): Promise<ReceiptDeliveryLog | null> {
  try {
    // Insert into receipt_delivery_logs table
    // Assuming table structure exists
    const result = await db.execute(sql`
      INSERT INTO receipt_delivery_logs (
        receipt_id,
        billing_id,
        morador_id,
        email_sent,
        email_error,
        email_sent_at,
        whatsapp_sent,
        whatsapp_error,
        whatsapp_sent_at,
        created_at,
        updated_at
      ) VALUES (
        ${data.receiptId},
        ${data.billingId},
        ${data.moradorId},
        ${data.emailSent},
        ${data.emailError || null},
        ${data.emailSent ? new Date() : null},
        ${data.whatsappSent},
        ${data.whatsappError || null},
        ${data.whatsappSent ? new Date() : null},
        ${new Date()},
        ${new Date()}
      )
      RETURNING *
    `);

    return result.rows?.[0] as ReceiptDeliveryLog | null;
  } catch (error) {
    console.error("Error creating receipt delivery log:", error);
    return null;
  }
}

/**
 * Get receipt delivery log by ID
 */
export async function getReceiptDeliveryLog(receiptId: string): Promise<ReceiptDeliveryLog | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM receipt_delivery_logs
      WHERE receipt_id = ${receiptId}
      LIMIT 1
    `);

    return result.rows?.[0] as ReceiptDeliveryLog | null;
  } catch (error) {
    console.error("Error getting receipt delivery log:", error);
    return null;
  }
}

/**
 * Get receipt delivery logs by billing ID
 */
export async function getReceiptDeliveryLogsByBillingId(
  billingId: number
): Promise<ReceiptDeliveryLog[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM receipt_delivery_logs
      WHERE billing_id = ${billingId}
      ORDER BY created_at DESC
    `);

    return (result.rows || []) as ReceiptDeliveryLog[];
  } catch (error) {
    console.error("Error getting receipt delivery logs:", error);
    return [];
  }
}

/**
 * Get receipt delivery logs by morador ID
 */
export async function getReceiptDeliveryLogsByMoradorId(
  moradorId: number
): Promise<ReceiptDeliveryLog[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM receipt_delivery_logs
      WHERE morador_id = ${moradorId}
      ORDER BY created_at DESC
    `);

    return (result.rows || []) as ReceiptDeliveryLog[];
  } catch (error) {
    console.error("Error getting receipt delivery logs:", error);
    return [];
  }
}

/**
 * Get failed receipt deliveries
 */
export async function getFailedReceiptDeliveries(
  limit: number = 100
): Promise<ReceiptDeliveryLog[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM receipt_delivery_logs
      WHERE (email_sent = false AND email_error IS NOT NULL)
        OR (whatsapp_sent = false AND whatsapp_error IS NOT NULL)
      ORDER BY created_at DESC
      LIMIT ${limit}
    `);

    return (result.rows || []) as ReceiptDeliveryLog[];
  } catch (error) {
    console.error("Error getting failed receipt deliveries:", error);
    return [];
  }
}

/**
 * Get receipt delivery statistics
 */
export async function getReceiptDeliveryStats(): Promise<{
  totalReceipts: number;
  emailSuccessRate: number;
  whatsappSuccessRate: number;
  failedDeliveries: number;
  lastDeliveryTime?: Date;
}> {
  try {
    const result = await db.execute(sql`
      SELECT
        COUNT(*) as total_receipts,
        SUM(CASE WHEN email_sent = true THEN 1 ELSE 0 END) as email_sent_count,
        SUM(CASE WHEN whatsapp_sent = true THEN 1 ELSE 0 END) as whatsapp_sent_count,
        SUM(CASE WHEN (email_sent = false AND email_error IS NOT NULL) 
                  OR (whatsapp_sent = false AND whatsapp_error IS NOT NULL) 
                  THEN 1 ELSE 0 END) as failed_count,
        MAX(updated_at) as last_delivery_time
      FROM receipt_delivery_logs
    `);

    const row = result.rows?.[0] as any;

    return {
      totalReceipts: parseInt(row?.total_receipts || "0"),
      emailSuccessRate: row?.total_receipts
        ? (parseInt(row.email_sent_count || "0") / parseInt(row.total_receipts)) * 100
        : 0,
      whatsappSuccessRate: row?.total_receipts
        ? (parseInt(row.whatsapp_sent_count || "0") / parseInt(row.total_receipts)) * 100
        : 0,
      failedDeliveries: parseInt(row?.failed_count || "0"),
      lastDeliveryTime: row?.last_delivery_time ? new Date(row.last_delivery_time) : undefined,
    };
  } catch (error) {
    console.error("Error getting receipt delivery stats:", error);
    return {
      totalReceipts: 0,
      emailSuccessRate: 0,
      whatsappSuccessRate: 0,
      failedDeliveries: 0,
    };
  }
}

/**
 * Update receipt delivery log
 */
export async function updateReceiptDeliveryLog(
  receiptId: string,
  data: Partial<{
    emailSent: boolean;
    emailError?: string;
    whatsappSent: boolean;
    whatsappError?: string;
  }>
): Promise<ReceiptDeliveryLog | null> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.emailSent !== undefined) {
      updates.push(`email_sent = $${updates.length + 1}`);
      values.push(data.emailSent);
    }

    if (data.emailError !== undefined) {
      updates.push(`email_error = $${updates.length + 1}`);
      values.push(data.emailError);
    }

    if (data.whatsappSent !== undefined) {
      updates.push(`whatsapp_sent = $${updates.length + 1}`);
      values.push(data.whatsappSent);
    }

    if (data.whatsappError !== undefined) {
      updates.push(`whatsapp_error = $${updates.length + 1}`);
      values.push(data.whatsappError);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at changed
      return getReceiptDeliveryLog(receiptId);
    }

    const query = `
      UPDATE receipt_delivery_logs
      SET ${updates.join(", ")}
      WHERE receipt_id = $${values.length + 1}
      RETURNING *
    `;

    values.push(receiptId);

    const result = await db.execute(sql.raw(query, values));

    return result.rows?.[0] as ReceiptDeliveryLog | null;
  } catch (error) {
    console.error("Error updating receipt delivery log:", error);
    return null;
  }
}

/**
 * Delete old receipt delivery logs (retention policy)
 */
export async function deleteOldReceiptDeliveryLogs(daysOld: number = 90): Promise<number> {
  try {
    const result = await db.execute(sql`
      DELETE FROM receipt_delivery_logs
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `);

    return result.rowCount || 0;
  } catch (error) {
    console.error("Error deleting old receipt delivery logs:", error);
    return 0;
  }
}

/**
 * Get delivery status for a specific receipt
 */
export async function getReceiptDeliveryStatus(receiptId: string): Promise<{
  receiptId: string;
  emailStatus: "pending" | "sent" | "failed";
  whatsappStatus: "pending" | "sent" | "failed";
  emailError?: string;
  whatsappError?: string;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const log = await getReceiptDeliveryLog(receiptId);

  if (!log) {
    return null;
  }

  return {
    receiptId: log.receiptId,
    emailStatus: log.emailSent ? "sent" : log.emailError ? "failed" : "pending",
    whatsappStatus: log.whatsappSent ? "sent" : log.whatsappError ? "failed" : "pending",
    emailError: log.emailError,
    whatsappError: log.whatsappError,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}
