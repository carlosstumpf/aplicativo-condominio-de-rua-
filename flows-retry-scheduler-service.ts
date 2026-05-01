/**
 * Flows Retry Scheduler Service
 * Manages background job scheduling and execution for automatic retries
 */

import {
  getRetrySchedulesDue,
  updateRetryScheduleAfterAttempt,
  calculateNextRetryTime,
  getRetrySchedule,
} from "./flows-retry-scheduler-db";
import {
  recordFlowHistory,
  updateFlowStatus,
  getFlowDetail,
} from "./flows-history-db";
import { processFlowSubmission } from "./whatsapp-flows-processor";
import { createAsaasPayment } from "./whatsapp-flows-asaas";

interface RetryJob {
  scheduleId: number;
  flowHistoryId: number;
  moradorId: number;
  flowData: any;
  flowType: string;
  attemptNumber: number;
}

interface RetryResult {
  success: boolean;
  message: string;
  nextRetryTime?: Date;
  error?: string;
}

/**
 * Process all pending retry schedules
 */
export async function processPendingRetries(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const schedules = await getRetrySchedulesDue(50);

  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (const schedule of schedules) {
    try {
      const result = await executeRetryJob({
        scheduleId: schedule.id,
        flowHistoryId: schedule.flowHistoryId,
        moradorId: schedule.moradorId,
        flowData: schedule.flowHistory?.data || {},
        flowType: schedule.flowHistory?.flowType || "unknown",
        attemptNumber: schedule.attemptsCount + 1,
      });

      processed++;

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(
        `Error processing retry schedule ${schedule.id}:`,
        error
      );
      failed++;
      processed++;
    }
  }

  return { processed, successful, failed };
}

/**
 * Execute a single retry job
 */
export async function executeRetryJob(job: RetryJob): Promise<RetryResult> {
  try {
    const schedule = await getRetrySchedule(job.scheduleId);

    if (!schedule) {
      return {
        success: false,
        message: "Schedule not found",
        error: "Schedule not found",
      };
    }

    // Get original flow details
    const originalFlow = await getFlowDetail(job.flowHistoryId);

    if (!originalFlow) {
      return {
        success: false,
        message: "Original flow not found",
        error: "Original flow not found",
      };
    }

    // Process the retry based on flow type
    let retrySuccess = false;
    let retryResult: any = null;
    let retryError: string | undefined;

    try {
      switch (job.flowType) {
        case "payment":
          const paymentResult = await retryPaymentFlow(
            job.moradorId,
            job.flowData
          );
          retrySuccess = paymentResult.success;
          retryResult = paymentResult.data;
          retryError = paymentResult.error;
          break;

        case "maintenance":
          const maintenanceResult = await retryMaintenanceFlow(
            job.moradorId,
            job.flowData
          );
          retrySuccess = maintenanceResult.success;
          retryResult = maintenanceResult.data;
          retryError = maintenanceResult.error;
          break;

        case "balance":
          const balanceResult = await retryBalanceFlow(
            job.moradorId,
            job.flowData
          );
          retrySuccess = balanceResult.success;
          retryResult = balanceResult.data;
          retryError = balanceResult.error;
          break;

        case "help":
          const helpResult = await retryHelpFlow(job.moradorId, job.flowData);
          retrySuccess = helpResult.success;
          retryResult = helpResult.data;
          retryError = helpResult.error;
          break;

        default:
          return {
            success: false,
            message: `Unknown flow type: ${job.flowType}`,
            error: `Unknown flow type: ${job.flowType}`,
          };
      }
    } catch (error: any) {
      retryError = error.message || "Unknown error";
    }

    // Record the retry attempt
    const newFlowHistory = await recordFlowHistory({
      moradorId: job.moradorId,
      flowId: `${job.flowType}_retry_${job.scheduleId}`,
      flowType: job.flowType as any,
      status: retrySuccess ? "completed" : "failed",
      sentAt: new Date(),
      data: job.flowData,
      source: "retry_scheduler",
      phoneNumber: originalFlow.phoneNumber || "",
    });

    if (retrySuccess && retryResult) {
      await updateFlowStatus(newFlowHistory.id, "completed", retryResult);
    } else if (retryError) {
      await updateFlowStatus(
        newFlowHistory.id,
        "failed",
        undefined,
        retryError
      );
    }

    // Update retry schedule
    let nextRetryTime: Date | undefined;

    if (!retrySuccess && job.attemptNumber < schedule.maxRetries) {
      nextRetryTime = calculateNextRetryTime(
        new Date(),
        schedule.frequency,
        job.attemptNumber
      );
    }

    await updateRetryScheduleAfterAttempt(
      job.scheduleId,
      retrySuccess,
      nextRetryTime
    );

    return {
      success: retrySuccess,
      message: retrySuccess
        ? "Retry successful"
        : `Retry failed: ${retryError}`,
      nextRetryTime,
      error: retryError,
    };
  } catch (error: any) {
    console.error("Error executing retry job:", error);
    return {
      success: false,
      message: "Error executing retry",
      error: error.message,
    };
  }
}

/**
 * Retry payment flow
 */
async function retryPaymentFlow(
  moradorId: number,
  flowData: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await createAsaasPayment(moradorId, {
      month: flowData.month,
      paymentMethod: flowData.paymentMethod || "PIX",
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retry maintenance flow
 */
async function retryMaintenanceFlow(
  moradorId: number,
  flowData: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Process maintenance request
    const result = await processFlowSubmission({
      moradorId,
      flowType: "maintenance",
      data: flowData,
      source: "retry_scheduler",
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retry balance flow
 */
async function retryBalanceFlow(
  moradorId: number,
  flowData: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Get morador balance
    const result = await processFlowSubmission({
      moradorId,
      flowType: "balance",
      data: flowData,
      source: "retry_scheduler",
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Retry help flow
 */
async function retryHelpFlow(
  moradorId: number,
  flowData: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Process help request
    const result = await processFlowSubmission({
      moradorId,
      flowType: "help",
      data: flowData,
      source: "retry_scheduler",
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Start background retry scheduler (runs every minute)
 */
let schedulerInterval: NodeJS.Timeout | null = null;

export function startRetryScheduler(intervalMs: number = 60000): void {
  if (schedulerInterval) {
    console.warn("Retry scheduler already running");
    return;
  }

  console.log(
    `Starting retry scheduler with ${intervalMs}ms interval`
  );

  schedulerInterval = setInterval(async () => {
    try {
      const result = await processPendingRetries();

      if (result.processed > 0) {
        console.log(
          `Retry scheduler: Processed ${result.processed}, Successful: ${result.successful}, Failed: ${result.failed}`
        );
      }
    } catch (error) {
      console.error("Error in retry scheduler:", error);
    }
  }, intervalMs);
}

/**
 * Stop background retry scheduler
 */
export function stopRetryScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Retry scheduler stopped");
  }
}

/**
 * Check if scheduler is running
 */
export function isRetrySchedulerRunning(): boolean {
  return schedulerInterval !== null;
}

/**
 * Get retry scheduler status
 */
export async function getRetrySchedulerStatus(): Promise<{
  running: boolean;
  pendingRetries: number;
  stats: {
    processed: number;
    successful: number;
    failed: number;
  };
}> {
  const schedules = await getRetrySchedulesDue(1);

  return {
    running: isRetrySchedulerRunning(),
    pendingRetries: schedules.length,
    stats: {
      processed: 0,
      successful: 0,
      failed: 0,
    },
  };
}
