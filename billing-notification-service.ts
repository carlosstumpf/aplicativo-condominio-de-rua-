/**
 * Billing Notification Service
 * Handles automated billing reminders and notifications
 */

import {
  getBillingsDueForReminder,
  getOverdueBillings,
  markBillingAsNotified,
  createBillingNotification,
  daysUntilDue,
  isOverdue,
} from "./billing-schedule-db";
import { getMoradorById } from "@/server/db-queries";

export interface BillingNotificationResult {
  sent: number;
  failed: number;
  errors: Array<{
    billingId: number;
    moradorId: number;
    error: string;
  }>;
}

/**
 * Send reminder notifications for billings due in 3 days
 */
export async function sendBillingReminders(): Promise<BillingNotificationResult> {
  const result: BillingNotificationResult = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  try {
    const billings = await getBillingsDueForReminder();

    for (const billing of billings) {
      try {
        const morador = await getMoradorById(billing.moradorId);

        if (!morador) {
          result.failed++;
          result.errors.push({
            billingId: billing.id,
            moradorId: billing.moradorId,
            error: "Morador not found",
          });
          continue;
        }

        const daysLeft = daysUntilDue(billing.dueDate);

        // Create notification record
        await createBillingNotification({
          billingId: billing.id,
          moradorId: billing.moradorId,
          type: "reminder",
          channel: "app",
        });

        // Mark as notified
        await markBillingAsNotified(billing.id);

        // Send WhatsApp message if available
        if (morador.telefone) {
          await sendWhatsAppBillingReminder(morador, billing, daysLeft);
        }

        // Send push notification if user exists
        if (morador.userId) {
          await sendPushNotification(morador.userId, {
            title: "💰 Aviso de Cobrança",
            body: `Sua taxa vence em ${daysLeft} dia(s). Valor: R$ ${billing.amount.toFixed(2)}`,
            data: {
              type: "billing_reminder",
              billingId: billing.id.toString(),
            },
          });
        }

        result.sent++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          billingId: billing.id,
          moradorId: billing.moradorId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  } catch (error) {
    console.error("Error sending billing reminders:", error);
  }

  return result;
}

/**
 * Send overdue notifications for billings past due date
 */
export async function sendOverdueNotifications(): Promise<BillingNotificationResult> {
  const result: BillingNotificationResult = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  try {
    const billings = await getOverdueBillings();

    for (const billing of billings) {
      try {
        const morador = await getMoradorById(billing.moradorId);

        if (!morador) {
          result.failed++;
          result.errors.push({
            billingId: billing.id,
            moradorId: billing.moradorId,
            error: "Morador not found",
          });
          continue;
        }

        const daysOverdue = Math.abs(daysUntilDue(billing.dueDate));

        // Create notification record
        await createBillingNotification({
          billingId: billing.id,
          moradorId: billing.moradorId,
          type: "overdue",
          channel: "app",
        });

        // Send WhatsApp message
        if (morador.telefone) {
          await sendWhatsAppOverdueNotice(morador, billing, daysOverdue);
        }

        // Send push notification
        if (morador.userId) {
          await sendPushNotification(morador.userId, {
            title: "⚠️ Aviso de Atraso",
            body: `Sua taxa está ${daysOverdue} dia(s) atrasada. Valor: R$ ${billing.amount.toFixed(2)}`,
            data: {
              type: "billing_overdue",
              billingId: billing.id.toString(),
            },
          });
        }

        result.sent++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          billingId: billing.id,
          moradorId: billing.moradorId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  } catch (error) {
    console.error("Error sending overdue notifications:", error);
  }

  return result;
}

/**
 * Send WhatsApp billing reminder with payment options
 */
export async function sendWhatsAppBillingReminder(
  morador: any,
  billing: any,
  daysLeft: number
): Promise<void> {
  // TODO: Integrate with WhatsApp Business API or Twilio
  // This would send a message like:
  // "Olá João! Sua taxa vence em 3 dias (15/05/2026).
  //  Valor: R$ 500,00
  //  Clique aqui para pagar: [Link com PIX/Boleto/Depósito]"

  console.log(
    `WhatsApp reminder to ${morador.telefone}: ${daysLeft} days until payment due`
  );
}

/**
 * Send WhatsApp overdue notice
 */
export async function sendWhatsAppOverdueNotice(
  morador: any,
  billing: any,
  daysOverdue: number
): Promise<void> {
  // TODO: Integrate with WhatsApp Business API
  // This would send a message like:
  // "⚠️ Atenção João! Sua taxa está ${daysOverdue} dia(s) atrasada.
  //  Valor: R$ 500,00
  //  Clique aqui para pagar agora: [Link com PIX/Boleto/Depósito]"

  console.log(
    `WhatsApp overdue notice to ${morador.telefone}: ${daysOverdue} days overdue`
  );
}

/**
 * Send push notification
 */
export async function sendPushNotification(
  userId: number,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<void> {
  // TODO: Integrate with Expo Push Notifications or Firebase Cloud Messaging
  console.log(`Push notification to user ${userId}:`, notification);
}

/**
 * Get billing notification statistics
 */
export async function getBillingNotificationStats(): Promise<{
  remindersToSend: number;
  overdueToNotify: number;
  lastReminderRun?: Date;
  lastOverdueRun?: Date;
}> {
  const reminders = await getBillingsDueForReminder();
  const overdue = await getOverdueBillings();

  return {
    remindersToSend: reminders.length,
    overdueToNotify: overdue.length,
  };
}

/**
 * Format billing notification message
 */
export function formatBillingReminderMessage(
  moradorName: string,
  amount: number,
  dueDate: Date,
  daysLeft: number
): string {
  const dueDateFormatted = dueDate.toLocaleDateString("pt-BR");

  return `Olá ${moradorName}! 👋

💰 Aviso de Cobrança

Sua taxa vence em ${daysLeft} dia(s):
📅 Data: ${dueDateFormatted}
💵 Valor: R$ ${amount.toFixed(2)}

Clique abaixo para pagar com:
🔗 PIX
📄 Boleto
🏦 Transferência Bancária

Obrigado! 🙏`;
}

/**
 * Format overdue notice message
 */
export function formatOverdueNoticeMessage(
  moradorName: string,
  amount: number,
  dueDate: Date,
  daysOverdue: number
): string {
  const dueDateFormatted = dueDate.toLocaleDateString("pt-BR");

  return `⚠️ Aviso Importante para ${moradorName}

Sua taxa está ATRASADA!

📅 Data de Vencimento: ${dueDateFormatted}
⏰ Dias em Atraso: ${daysOverdue}
💵 Valor: R$ ${amount.toFixed(2)}

Por favor, regularize seu pagamento o quanto antes.

Clique abaixo para pagar com:
🔗 PIX
📄 Boleto
🏦 Transferência Bancária

Obrigado! 🙏`;
}

/**
 * Format payment instruction message
 */
export function formatPaymentInstructionsMessage(
  amount: number,
  pixKey?: string,
  boletoBarcode?: string,
  bankDetails?: {
    bank: string;
    account: string;
    accountType: string;
  }
): string {
  let message = `💳 Instruções de Pagamento\n\nValor: R$ ${amount.toFixed(2)}\n\n`;

  if (pixKey) {
    message += `🔗 PIX\nChave: ${pixKey}\n\n`;
  }

  if (boletoBarcode) {
    message += `📄 Boleto\nCódigo: ${boletoBarcode}\n\n`;
  }

  if (bankDetails) {
    message += `🏦 Transferência Bancária\nBanco: ${bankDetails.bank}\nConta: ${bankDetails.account}\nTipo: ${bankDetails.accountType}\n\n`;
  }

  message += `Após o pagamento, sua taxa será atualizada automaticamente.\n\nObrigado! 🙏`;

  return message;
}

/**
 * Billing notification scheduler status
 */
let schedulerRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Start billing notification scheduler
 */
export function startBillingNotificationScheduler(intervalMs: number = 3600000): void {
  if (schedulerRunning) {
    console.warn("Billing notification scheduler is already running");
    return;
  }

  schedulerRunning = true;

  // Run immediately
  runBillingNotifications();

  // Schedule recurring runs
  schedulerInterval = setInterval(() => {
    runBillingNotifications();
  }, intervalMs);

  console.log(
    `Billing notification scheduler started (interval: ${intervalMs}ms)`
  );
}

/**
 * Stop billing notification scheduler
 */
export function stopBillingNotificationScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }

  schedulerRunning = false;
  console.log("Billing notification scheduler stopped");
}

/**
 * Check if scheduler is running
 */
export function isBillingNotificationSchedulerRunning(): boolean {
  return schedulerRunning;
}

/**
 * Run billing notifications
 */
async function runBillingNotifications(): Promise<void> {
  try {
    console.log("Running billing notifications...");

    const reminders = await sendBillingReminders();
    const overdue = await sendOverdueNotifications();

    console.log(
      `Billing notifications completed: ${reminders.sent + overdue.sent} sent, ${reminders.failed + overdue.failed} failed`
    );

    if (reminders.errors.length > 0 || overdue.errors.length > 0) {
      console.error("Billing notification errors:", [
        ...reminders.errors,
        ...overdue.errors,
      ]);
    }
  } catch (error) {
    console.error("Error running billing notifications:", error);
  }
}

/**
 * Get scheduler status
 */
export async function getBillingNotificationSchedulerStatus(): Promise<{
  running: boolean;
  stats: Awaited<ReturnType<typeof getBillingNotificationStats>>;
}> {
  const stats = await getBillingNotificationStats();

  return {
    running: schedulerRunning,
    stats,
  };
}
