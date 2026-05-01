/**
 * WhatsApp + Asaas Message Handler
 * Processa mensagens e envia PIX/Boleto automaticamente
 */

import pino from "pino";
import {
  getWhatsAppAsaasIntegration,
  MoradorPaymentInfo,
} from "@/server/_core/whatsapp-asaas-integration";
import { getMessageProcessor } from "@/server/_core/message-processor";

export interface MoradorData {
  phone: string;
  name: string;
  email: string;
  cpf?: string;
}

export interface PaymentData {
  value: number;
  dueDate: string;
}

/**
 * Handler para processar mensagens WhatsApp
 */
export class WhatsAppAsaasHandler {
  private logger: any;
  private integration: any;
  private processor: any;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });

    this.integration = getWhatsAppAsaasIntegration();
    this.processor = getMessageProcessor();
  }

  /**
   * Processar mensagem recebida do morador
   */
  async handleMoradorMessage(data: {
    moradorPhone: string;
    moradorName: string;
    moradorEmail: string;
    moradorCpf?: string;
    messageText: string;
    paymentValue: number;
    paymentDueDate: string;
  }): Promise<{
    success: boolean;
    action: string;
    message: string;
    pixQrCode?: string;
    pixKey?: string;
    barCode?: string;
    bankSlipUrl?: string;
  }> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas Handler] Processando mensagem de ${data.moradorPhone}`
      );

      const option = data.messageText.trim().toLowerCase();

      // Opção 1: PIX
      if (option === "1" || option === "pix") {
        this.logger.info(`[WhatsApp+Asaas Handler] Morador solicitou PIX`);

        const result = await this.integration.sendPixViaWhatsApp({
          phone: data.moradorPhone,
          name: data.moradorName,
          email: data.moradorEmail,
          cpf: data.moradorCpf,
          value: data.paymentValue,
          dueDate: data.paymentDueDate,
        });

        // Registrar no histórico
        this.processor.recordMessage({
          from: data.moradorPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER || "+5521999231962",
          text: data.messageText,
          direction: "incoming",
          type: "menu",
          action: "payment_pix",
          success: result.success,
        });

        if (result.success) {
          this.processor.recordMenuInteraction({
            moradorPhone: data.moradorPhone,
            option: "1",
            action: "payment_pix",
            responseTime: 0,
            success: true,
          });
        }

        return {
          success: result.success,
          action: "pix_sent",
          message: result.message,
          pixQrCode: result.pixQrCode,
          pixKey: result.pixKey,
        };
      }

      // Opção 2: Boleto
      if (option === "2" || option === "boleto") {
        this.logger.info(`[WhatsApp+Asaas Handler] Morador solicitou Boleto`);

        const result = await this.integration.sendBoletoViaWhatsApp({
          phone: data.moradorPhone,
          name: data.moradorName,
          email: data.moradorEmail,
          cpf: data.moradorCpf,
          value: data.paymentValue,
          dueDate: data.paymentDueDate,
        });

        // Registrar no histórico
        this.processor.recordMessage({
          from: data.moradorPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER || "+5521999231962",
          text: data.messageText,
          direction: "incoming",
          type: "menu",
          action: "payment_boleto",
          success: result.success,
        });

        if (result.success) {
          this.processor.recordMenuInteraction({
            moradorPhone: data.moradorPhone,
            option: "2",
            action: "payment_boleto",
            responseTime: 0,
            success: true,
          });
        }

        return {
          success: result.success,
          action: "boleto_sent",
          message: result.message,
          barCode: result.barCode,
          bankSlipUrl: result.bankSlipUrl,
        };
      }

      // Opção 3: Falar com Admin
      if (option === "3" || option === "admin" || option === "ajuda") {
        this.logger.info(`[WhatsApp+Asaas Handler] Morador quer falar com admin`);

        const result = await this.integration.processAdminContact({
          moradorPhone: data.moradorPhone,
          moradorName: data.moradorName,
          message: data.messageText,
        });

        // Registrar no histórico
        this.processor.recordMessage({
          from: data.moradorPhone,
          to: process.env.WHATSAPP_PHONE_NUMBER || "+5521999231962",
          text: data.messageText,
          direction: "incoming",
          type: "menu",
          action: "contact_admin",
          success: result.success,
        });

        if (result.success) {
          this.processor.recordMenuInteraction({
            moradorPhone: data.moradorPhone,
            option: "3",
            action: "contact_admin",
            responseTime: 0,
            success: true,
          });
        }

        return {
          success: result.success,
          action: "admin_contact",
          message: result.message,
        };
      }

      // Opção desconhecida
      this.logger.warn(`[WhatsApp+Asaas Handler] Opção desconhecida: ${option}`);

      const unknownMessage = `
❓ *Opção não reconhecida*

Olá ${data.moradorName},

Desculpe, não entendi sua mensagem.

Por favor, escolha uma opção:
1️⃣ - Pagar com PIX
2️⃣ - Pagar com Boleto
3️⃣ - Falar com Administrador

Obrigado! 🏘️
      `.trim();

      return {
        success: false,
        action: "unknown_option",
        message: unknownMessage,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas Handler] Erro ao processar mensagem:", error);

      return {
        success: false,
        action: "error",
        message: error instanceof Error ? error.message : "Erro ao processar mensagem",
      };
    }
  }

  /**
   * Processar confirmação de pagamento via webhook Asaas
   */
  async handlePaymentConfirmation(data: {
    chargeId: string;
    moradorPhone: string;
    moradorName: string;
    value: number;
    paymentMethod: "PIX" | "BOLETO";
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas Handler] Processando confirmação de pagamento: ${data.chargeId}`
      );

      const result = await this.integration.processPaymentConfirmation(data);

      // Registrar no histórico
      this.processor.recordMessage({
        from: process.env.WHATSAPP_PHONE_NUMBER || "+5521999231962",
        to: data.moradorPhone,
        text: result.message,
        direction: "outgoing",
        type: "payment_confirmation",
        action: "payment_confirmed",
        success: true,
      });

      // Remover dos pagamentos pendentes
      this.processor.removePendingPayment(data.moradorPhone);

      return result;
    } catch (error) {
      this.logger.error(
        "[WhatsApp+Asaas Handler] Erro ao processar confirmação:",
        error
      );

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao processar confirmação",
      };
    }
  }

  /**
   * Enviar menu inicial para morador
   */
  async sendInitialMenu(data: {
    moradorPhone: string;
    moradorName: string;
    pendingValue: number;
    dueDate: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas Handler] Enviando menu inicial para ${data.moradorPhone}`
      );

      const menuMessage = `
👋 *Olá ${data.moradorName}!*

Você tem uma mensalidade pendente:

💰 *Valor:* R$ ${data.pendingValue.toFixed(2)}
📅 *Vencimento:* ${data.dueDate}

Como deseja pagar?

1️⃣ - PIX (Instantâneo)
2️⃣ - Boleto (Até 3 dias úteis)
3️⃣ - Falar com Administrador

Escolha uma opção digitando o número correspondente.

Obrigado! 🏘️
      `.trim();

      // TODO: Enviar via Baileys

      this.logger.info(`[WhatsApp+Asaas Handler] Menu enviado para ${data.moradorPhone}`);

      return {
        success: true,
        message: menuMessage,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas Handler] Erro ao enviar menu:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao enviar menu",
      };
    }
  }

  /**
   * Enviar lembrete de vencimento
   */
  async sendPaymentReminder(data: {
    moradorPhone: string;
    moradorName: string;
    value: number;
    dueDate: string;
    daysUntilDue: number;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas Handler] Enviando lembrete para ${data.moradorPhone}`
      );

      let reminderMessage = "";

      if (data.daysUntilDue === 7) {
        reminderMessage = `
⏰ *Lembrete: Faltam 7 dias!*

Olá ${data.moradorName},

Sua mensalidade vence em 7 dias:

💰 *Valor:* R$ ${data.value.toFixed(2)}
📅 *Vencimento:* ${data.dueDate}

Não deixe para última hora! Clique aqui para pagar agora.

Obrigado! 🏘️
        `.trim();
      } else if (data.daysUntilDue === 3) {
        reminderMessage = `
⏰ *Lembrete: Faltam 3 dias!*

Olá ${data.moradorName},

Sua mensalidade vence em 3 dias:

💰 *Valor:* R$ ${data.value.toFixed(2)}
📅 *Vencimento:* ${data.dueDate}

Aproveite e pague agora mesmo!

Obrigado! 🏘️
        `.trim();
      } else if (data.daysUntilDue === 1) {
        reminderMessage = `
⏰ *Lembrete: Vence AMANHÃ!*

Olá ${data.moradorName},

Sua mensalidade vence AMANHÃ:

💰 *Valor:* R$ ${data.value.toFixed(2)}
📅 *Vencimento:* ${data.dueDate}

Não deixe vencer! Pague agora mesmo.

Obrigado! 🏘️
        `.trim();
      }

      // TODO: Enviar via Baileys

      this.logger.info(
        `[WhatsApp+Asaas Handler] Lembrete enviado para ${data.moradorPhone}`
      );

      return {
        success: true,
        message: reminderMessage,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas Handler] Erro ao enviar lembrete:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao enviar lembrete",
      };
    }
  }
}

/**
 * Instância global
 */
let handler: WhatsAppAsaasHandler | null = null;

/**
 * Obter instância
 */
export function getWhatsAppAsaasHandler(): WhatsAppAsaasHandler {
  if (!handler) {
    handler = new WhatsAppAsaasHandler();
  }
  return handler;
}
