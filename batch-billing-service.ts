/**
 * Batch Billing Service
 * Handles batch creation of billing records with progress tracking
 */

import {
  createBatchBillingJob,
  updateBatchBillingJobStatus,
  getBatchBillingJob,
  createBatchBillingItem,
  updateBatchBillingItem,
  getAllMoradoresForBatch,
  getBatchBillingStats,
} from "./batch-billing-db";
import { createBillingSchedule } from "./billing-schedule-db";
import { sendBillingReminders } from "./billing-notification-service";

export interface BatchBillingProgress {
  jobId: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  totalMoradores: number;
  processedMoradores: number;
  successfulBillings: number;
  failedBillings: number;
  progressPercentage: number;
  currentMorador?: string;
  estimatedTimeRemaining?: number;
  startedAt?: Date;
  completedAt?: Date;
}

// Store progress in memory (in production, use Redis or database)
const batchProgress = new Map<number, BatchBillingProgress>();

/**
 * Start batch billing job
 */
export async function startBatchBillingJob(data: {
  name: string;
  description: string;
  dueDate: Date;
  amount: number;
  createdBy: number;
}): Promise<BatchBillingProgress> {
  try {
    // Get all moradores
    const moradores = await getAllMoradoresForBatch();

    // Create batch job
    const job = await createBatchBillingJob({
      ...data,
      totalMoradores: moradores.length,
    });

    // Initialize progress
    const progress: BatchBillingProgress = {
      jobId: job.id,
      status: "pending",
      totalMoradores: moradores.length,
      processedMoradores: 0,
      successfulBillings: 0,
      failedBillings: 0,
      progressPercentage: 0,
      startedAt: new Date(),
    };

    batchProgress.set(job.id, progress);

    // Start processing in background
    processBatchBillingJob(job.id, data, moradores).catch((error) => {
      console.error("Error processing batch billing job:", error);
      updateProgress(job.id, {
        status: "failed",
        completedAt: new Date(),
      });
    });

    return progress;
  } catch (error) {
    console.error("Error starting batch billing job:", error);
    throw new Error(
      `Failed to start batch billing job: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Process batch billing job (background task)
 */
async function processBatchBillingJob(
  jobId: number,
  jobData: {
    name: string;
    description: string;
    dueDate: Date;
    amount: number;
    createdBy: number;
  },
  moradores: Array<{ id: number; name: string; email: string; phone?: string }>
): Promise<void> {
  try {
    // Update status to processing
    await updateBatchBillingJobStatus(jobId, "processing", {
      startedAt: new Date(),
    });

    updateProgress(jobId, { status: "processing" });

    let successCount = 0;
    let failureCount = 0;

    // Process each morador
    for (let i = 0; i < moradores.length; i++) {
      const morador = moradores[i];

      try {
        // Create billing item record
        await createBatchBillingItem({
          batchId: jobId,
          moradorId: morador.id,
          status: "pending",
        });

        // Create billing
        const billing = await createBillingSchedule({
          moradorId: morador.id,
          dueDate: jobData.dueDate,
          amount: jobData.amount,
          description: jobData.description,
        });

        // Update item status to created
        await updateBatchBillingItem(i, {
          status: "created",
          billingId: billing.id,
        });

        successCount++;
      } catch (error) {
        failureCount++;

        // Update item status to failed
        await updateBatchBillingItem(i, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        console.error(`Error creating billing for morador ${morador.id}:`, error);
      }

      // Update progress
      updateProgress(jobId, {
        processedMoradores: i + 1,
        successfulBillings: successCount,
        failedBillings: failureCount,
        progressPercentage: Math.round(((i + 1) / moradores.length) * 100),
        currentMorador: morador.name,
        estimatedTimeRemaining: calculateEstimatedTime(i + 1, moradores.length),
      });

      // Small delay to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Mark job as completed
    await updateBatchBillingJobStatus(jobId, "completed", {
      completedAt: new Date(),
      totalCreated: successCount,
      totalFailed: failureCount,
    });

    updateProgress(jobId, {
      status: "completed",
      completedAt: new Date(),
      progressPercentage: 100,
    });

    console.log(`Batch billing job ${jobId} completed: ${successCount} created, ${failureCount} failed`);
  } catch (error) {
    console.error("Error processing batch billing job:", error);

    await updateBatchBillingJobStatus(jobId, "failed", {
      completedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    updateProgress(jobId, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}

/**
 * Get batch billing progress
 */
export function getBatchBillingProgress(jobId: number): BatchBillingProgress | null {
  return batchProgress.get(jobId) || null;
}

/**
 * Update batch billing progress
 */
function updateProgress(jobId: number, updates: Partial<BatchBillingProgress>): void {
  const current = batchProgress.get(jobId);
  if (current) {
    batchProgress.set(jobId, { ...current, ...updates });
  }
}

/**
 * Calculate estimated time remaining
 */
function calculateEstimatedTime(processed: number, total: number): number {
  if (processed === 0) return 0;

  const avgTimePerItem = 100; // ms (based on 100ms delay in processing)
  const remaining = total - processed;

  return remaining * avgTimePerItem;
}

/**
 * Cancel batch billing job
 */
export async function cancelBatchBillingJob(jobId: number): Promise<void> {
  try {
    await updateBatchBillingJobStatus(jobId, "cancelled", {
      completedAt: new Date(),
    });

    updateProgress(jobId, {
      status: "cancelled",
      completedAt: new Date(),
    });

    console.log(`Batch billing job ${jobId} cancelled`);
  } catch (error) {
    console.error("Error cancelling batch billing job:", error);
    throw new Error(
      `Failed to cancel batch billing job: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get batch billing statistics
 */
export async function getBatchBillingJobStats(jobId: number): Promise<{
  total: number;
  created: number;
  failed: number;
  pending: number;
  successRate: number;
  totalAmount: number;
}> {
  try {
    const stats = await getBatchBillingStats(jobId);
    const job = await getBatchBillingJob(jobId);

    if (!job) {
      throw new Error(`Batch billing job ${jobId} not found`);
    }

    return {
      ...stats,
      totalAmount: job.amount * stats.created,
    };
  } catch (error) {
    console.error("Error getting batch billing stats:", error);
    throw new Error(
      `Failed to get batch billing stats: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Send reminders for batch billing
 */
export async function sendBatchBillingReminders(jobId: number): Promise<{
  sent: number;
  failed: number;
}> {
  try {
    const result = await sendBillingReminders();
    return result;
  } catch (error) {
    console.error("Error sending batch billing reminders:", error);
    throw new Error(
      `Failed to send reminders: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validate batch billing data
 */
export function validateBatchBillingData(data: {
  name: string;
  description: string;
  dueDate: Date;
  amount: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Nome da cobrança é obrigatório");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Descrição é obrigatória");
  }

  if (!data.dueDate || data.dueDate < new Date()) {
    errors.push("Data de vencimento deve ser no futuro");
  }

  if (!data.amount || data.amount <= 0) {
    errors.push("Valor deve ser maior que zero");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format batch billing job for display
 */
export function formatBatchBillingJob(job: {
  id: number;
  name: string;
  description: string;
  dueDate: Date;
  amount: number;
  totalMoradores: number;
  status: string;
  totalCreated: number;
  totalFailed: number;
  createdAt: Date;
}): string {
  return `
Lote de Cobrança #${job.id}

Nome: ${job.name}
Descrição: ${job.description}
Vencimento: ${job.dueDate.toLocaleDateString("pt-BR")}
Valor por Morador: R$ ${job.amount.toFixed(2)}

Moradores: ${job.totalMoradores}
Status: ${job.status}
Criadas: ${job.totalCreated}
Falhadas: ${job.totalFailed}

Data de Criação: ${job.createdAt.toLocaleString("pt-BR")}
  `.trim();
}
