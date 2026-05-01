/**
 * Reminder Scheduler Service
 * Agendamento automático de lembretes via cron jobs
 */

import pino from "pino";
import { getWhatsAppAsaasHandler } from "@/server/_core/whatsapp-asaas-handler";

export interface ReminderConfig {
  enabled: boolean;
  daysBeforeDue: number[]; // [7, 3, 1] = D-7, D-3, D-1
  sendTime: string; // "09:00" = 9 da manhã
  timezone: string; // "America/Sao_Paulo"
}

export interface PaymentReminder {
  id: string;
  moradorPhone: string;
  moradorName: string;
  value: number;
  dueDate: string;
  reminderDates: {
    d7?: boolean;
    d3?: boolean;
    d1?: boolean;
  };
}

/**
 * Serviço de Agendamento de Lembretes
 */
export class ReminderScheduler {
  private logger: any;
  private reminders: Map<string, PaymentReminder> = new Map();
  private config: ReminderConfig;
  private handler: any;

  constructor(config?: ReminderConfig) {
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });

    this.config = config || {
      enabled: true,
      daysBeforeDue: [7, 3, 1],
      sendTime: "09:00",
      timezone: "America/Sao_Paulo",
    };

    this.handler = getWhatsAppAsaasHandler();
  }

  /**
   * Registrar pagamento para lembretes
   */
  registerPayment(data: {
    moradorPhone: string;
    moradorName: string;
    value: number;
    dueDate: string; // YYYY-MM-DD
  }): {
    success: boolean;
    reminderId?: string;
    message?: string;
  } {
    try {
      this.logger.info(
        `[Reminder] Registrando pagamento: ${data.moradorPhone} - ${data.dueDate}`
      );

      const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const reminder: PaymentReminder = {
        id: reminderId,
        moradorPhone: data.moradorPhone,
        moradorName: data.moradorName,
        value: data.value,
        dueDate: data.dueDate,
        reminderDates: {
          d7: false,
          d3: false,
          d1: false,
        },
      };

      this.reminders.set(reminderId, reminder);

      this.logger.info(`[Reminder] Pagamento registrado: ${reminderId}`);

      return {
        success: true,
        reminderId,
        message: "Pagamento registrado para lembretes",
      };
    } catch (error) {
      this.logger.error("[Reminder] Erro ao registrar pagamento:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao registrar",
      };
    }
  }

  /**
   * Processar lembretes (deve ser chamado por cron job)
   */
  async processReminders(): Promise<{
    success: boolean;
    processed: number;
    sent: number;
    errors: number;
  }> {
    try {
      this.logger.info("[Reminder] Processando lembretes...");

      let processed = 0;
      let sent = 0;
      let errors = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const [, reminder] of this.reminders) {
        processed++;

        try {
          const dueDate = new Date(reminder.dueDate);
          const daysUntilDue = Math.floor(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Verificar se é D-7
          if (daysUntilDue === 7 && !reminder.reminderDates.d7) {
            this.logger.info(
              `[Reminder] Enviando lembrete D-7 para ${reminder.moradorPhone}`
            );

            await this.handler.sendPaymentReminder({
              moradorPhone: reminder.moradorPhone,
              moradorName: reminder.moradorName,
              value: reminder.value,
              dueDate: reminder.dueDate,
              daysUntilDue: 7,
            });

            reminder.reminderDates.d7 = true;
            sent++;
          }

          // Verificar se é D-3
          if (daysUntilDue === 3 && !reminder.reminderDates.d3) {
            this.logger.info(
              `[Reminder] Enviando lembrete D-3 para ${reminder.moradorPhone}`
            );

            await this.handler.sendPaymentReminder({
              moradorPhone: reminder.moradorPhone,
              moradorName: reminder.moradorName,
              value: reminder.value,
              dueDate: reminder.dueDate,
              daysUntilDue: 3,
            });

            reminder.reminderDates.d3 = true;
            sent++;
          }

          // Verificar se é D-1
          if (daysUntilDue === 1 && !reminder.reminderDates.d1) {
            this.logger.info(
              `[Reminder] Enviando lembrete D-1 para ${reminder.moradorPhone}`
            );

            await this.handler.sendPaymentReminder({
              moradorPhone: reminder.moradorPhone,
              moradorName: reminder.moradorName,
              value: reminder.value,
              dueDate: reminder.dueDate,
              daysUntilDue: 1,
            });

            reminder.reminderDates.d1 = true;
            sent++;
          }

          // Remover se já passou a data de vencimento
          if (daysUntilDue < 0) {
            this.logger.info(`[Reminder] Removendo lembrete expirado: ${reminder.id}`);
            this.reminders.delete(reminder.id);
          }
        } catch (error) {
          this.logger.error(
            `[Reminder] Erro ao processar lembrete ${reminder.id}:`,
            error
          );
          errors++;
        }
      }

      this.logger.info(
        `[Reminder] Processamento concluído: ${processed} processados, ${sent} enviados, ${errors} erros`
      );

      return {
        success: true,
        processed,
        sent,
        errors,
      };
    } catch (error) {
      this.logger.error("[Reminder] Erro ao processar lembretes:", error);

      return {
        success: false,
        processed: 0,
        sent: 0,
        errors: 1,
      };
    }
  }

  /**
   * Obter lembretes pendentes
   */
  getPendingReminders(): PaymentReminder[] {
    const pending: PaymentReminder[] = [];

    for (const [, reminder] of this.reminders) {
      const dueDate = new Date(reminder.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.floor(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (
        (daysUntilDue === 7 && !reminder.reminderDates.d7) ||
        (daysUntilDue === 3 && !reminder.reminderDates.d3) ||
        (daysUntilDue === 1 && !reminder.reminderDates.d1)
      ) {
        pending.push(reminder);
      }
    }

    return pending;
  }

  /**
   * Obter estatísticas
   */
  getStats(): {
    totalReminders: number;
    pendingReminders: number;
    config: ReminderConfig;
  } {
    return {
      totalReminders: this.reminders.size,
      pendingReminders: this.getPendingReminders().length,
      config: this.config,
    };
  }

  /**
   * Limpar lembretes antigos
   */
  cleanupOldReminders(): {
    success: boolean;
    removed: number;
  } {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let removed = 0;

      for (const [id, reminder] of this.reminders) {
        const dueDate = new Date(reminder.dueDate);
        const daysUntilDue = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Remover se passou mais de 30 dias do vencimento
        if (daysUntilDue < -30) {
          this.reminders.delete(id);
          removed++;
        }
      }

      this.logger.info(`[Reminder] Limpeza concluída: ${removed} removidos`);

      return {
        success: true,
        removed,
      };
    } catch (error) {
      this.logger.error("[Reminder] Erro ao limpar lembretes:", error);

      return {
        success: false,
        removed: 0,
      };
    }
  }

  /**
   * Atualizar configuração
   */
  updateConfig(config: Partial<ReminderConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info("[Reminder] Configuração atualizada:", this.config);
  }

  /**
   * Obter configuração
   */
  getConfig(): ReminderConfig {
    return this.config;
  }
}

/**
 * Instância global
 */
let scheduler: ReminderScheduler | null = null;

/**
 * Inicializar scheduler
 */
export function initializeReminderScheduler(config?: ReminderConfig): ReminderScheduler {
  scheduler = new ReminderScheduler(config);
  return scheduler;
}

/**
 * Obter instância
 */
export function getReminderScheduler(): ReminderScheduler {
  if (!scheduler) {
    scheduler = new ReminderScheduler();
  }
  return scheduler;
}
