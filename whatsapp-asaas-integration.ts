/**
 * WhatsApp + Asaas Integration Service
 * Conecta Baileys com Asaas para enviar PIX/Boleto automaticamente
 */

import pino from "pino";
import { getAsaasService } from "@/server/_core/asaas-real-service";
import { getMessageProcessor } from "@/server/_core/message-processor";

export interface MoradorPaymentInfo {
  phone: string;
  name: string;
  email: string;
  cpf?: string;
  value: number;
  dueDate: string;
}

export interface PaymentSendResult {
  success: boolean;
  action: "pix_sent" | "boleto_sent" | "error";
  message: string;
  pixQrCode?: string;
  pixKey?: string;
  barCode?: string;
  bankSlipUrl?: string;
  chargeId?: string;
}

/**
 * Serviço de Integração WhatsApp + Asaas
 */
export class WhatsAppAsaasIntegration {
  private logger: any;

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
  }

  /**
   * Processar mensagem de pagamento
   * Detecta opção (1=PIX, 2=Boleto) e envia automaticamente
   */
  async processPaymentMessage(data: {
    moradorPhone: string;
    moradorName: string;
    moradorEmail: string;
    moradorCpf?: string;
    messageText: string; // "1" para PIX, "2" para Boleto
    value: number;
    dueDate: string;
  }): Promise<PaymentSendResult> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas] Processando pagamento para ${data.moradorPhone}`
      );

      const option = data.messageText.trim();

      if (option === "1") {
        // Opção 1: PIX
        return await this.sendPixViaWhatsApp({
          phone: data.moradorPhone,
          name: data.moradorName,
          email: data.moradorEmail,
          cpf: data.moradorCpf,
          value: data.value,
          dueDate: data.dueDate,
        });
      } else if (option === "2") {
        // Opção 2: Boleto
        return await this.sendBoletoViaWhatsApp({
          phone: data.moradorPhone,
          name: data.moradorName,
          email: data.moradorEmail,
          cpf: data.moradorCpf,
          value: data.value,
          dueDate: data.dueDate,
        });
      } else {
        return {
          success: false,
          action: "error",
          message: "Opção inválida. Digite 1 para PIX ou 2 para Boleto",
        };
      }
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas] Erro ao processar pagamento:", error);

      return {
        success: false,
        action: "error",
        message: error instanceof Error ? error.message : "Erro ao processar pagamento",
      };
    }
  }

  /**
   * Enviar PIX via WhatsApp
   */
  async sendPixViaWhatsApp(data: MoradorPaymentInfo): Promise<PaymentSendResult> {
    try {
      this.logger.info(`[WhatsApp+Asaas] Enviando PIX para ${data.phone}`);

      const asaas = getAsaasService();

      // Passo 1: Criar fluxo PIX no Asaas
      const pixResult = await asaas.createPixFlow({
        moradorName: data.name,
        moradorEmail: data.email,
        moradorPhone: data.phone,
        moradorCpf: data.cpf,
        value: data.value,
        dueDate: data.dueDate,
      });

      if (!pixResult.success) {
        this.logger.error("[WhatsApp+Asaas] Erro ao criar PIX:", pixResult.error);

        return {
          success: false,
          action: "error",
          message: `Erro ao gerar PIX: ${pixResult.error}`,
        };
      }

      // Passo 2: Formatar mensagem com PIX
      const pixMessage = this.formatPixMessage({
        pixKey: pixResult.pixKey!,
        value: data.value,
        dueDate: data.dueDate,
        moradorName: data.name,
      });

      this.logger.info(`[WhatsApp+Asaas] PIX gerado com sucesso: ${pixResult.charge?.id}`);

      // Passo 3: Enviar via WhatsApp (será implementado em whatsapp-asaas-handler.ts)
      // TODO: Integrar com Baileys para enviar mensagem

      return {
        success: true,
        action: "pix_sent",
        message: pixMessage,
        pixQrCode: pixResult.pixQrCode,
        pixKey: pixResult.pixKey,
        chargeId: pixResult.charge?.id,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas] Erro ao enviar PIX:", error);

      return {
        success: false,
        action: "error",
        message: error instanceof Error ? error.message : "Erro ao enviar PIX",
      };
    }
  }

  /**
   * Enviar Boleto via WhatsApp
   */
  async sendBoletoViaWhatsApp(data: MoradorPaymentInfo): Promise<PaymentSendResult> {
    try {
      this.logger.info(`[WhatsApp+Asaas] Enviando Boleto para ${data.phone}`);

      const asaas = getAsaasService();

      // Passo 1: Criar fluxo Boleto no Asaas
      const boletoResult = await asaas.createBoletoFlow({
        moradorName: data.name,
        moradorEmail: data.email,
        moradorPhone: data.phone,
        moradorCpf: data.cpf,
        value: data.value,
        dueDate: data.dueDate,
      });

      if (!boletoResult.success) {
        this.logger.error("[WhatsApp+Asaas] Erro ao criar Boleto:", boletoResult.error);

        return {
          success: false,
          action: "error",
          message: `Erro ao gerar Boleto: ${boletoResult.error}`,
        };
      }

      // Passo 2: Formatar mensagem com Boleto
      const boletoMessage = this.formatBoletoMessage({
        barCode: boletoResult.barCode!,
        bankSlipUrl: boletoResult.bankSlipUrl!,
        value: data.value,
        dueDate: data.dueDate,
        moradorName: data.name,
      });

      this.logger.info(
        `[WhatsApp+Asaas] Boleto gerado com sucesso: ${boletoResult.charge?.id}`
      );

      // Passo 3: Enviar via WhatsApp (será implementado em whatsapp-asaas-handler.ts)
      // TODO: Integrar com Baileys para enviar mensagem

      return {
        success: true,
        action: "boleto_sent",
        message: boletoMessage,
        barCode: boletoResult.barCode,
        bankSlipUrl: boletoResult.bankSlipUrl,
        chargeId: boletoResult.charge?.id,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas] Erro ao enviar Boleto:", error);

      return {
        success: false,
        action: "error",
        message: error instanceof Error ? error.message : "Erro ao enviar Boleto",
      };
    }
  }

  /**
   * Formatar mensagem PIX
   */
  private formatPixMessage(data: {
    pixKey: string;
    value: number;
    dueDate: string;
    moradorName: string;
  }): string {
    return `
✅ *PIX Gerado com Sucesso!*

Olá ${data.moradorName},

Aqui está seu PIX para pagamento:

💰 *Valor:* R$ ${data.value.toFixed(2)}
📅 *Vencimento:* ${data.dueDate}

*Chave PIX (Copia e Cola):*
\`${data.pixKey}\`

Ou escaneie o QR Code que será enviado em seguida.

Dúvidas? Digite *3* para falar com um administrador.
    `.trim();
  }

  /**
   * Formatar mensagem Boleto
   */
  private formatBoletoMessage(data: {
    barCode: string;
    bankSlipUrl: string;
    value: number;
    dueDate: string;
    moradorName: string;
  }): string {
    return `
✅ *Boleto Gerado com Sucesso!*

Olá ${data.moradorName},

Aqui está seu Boleto para pagamento:

💰 *Valor:* R$ ${data.value.toFixed(2)}
📅 *Vencimento:* ${data.dueDate}

*Código de Barras (Copia e Cola):*
\`${data.barCode}\`

*Ou baixe o boleto:*
${data.bankSlipUrl}

Dúvidas? Digite *3* para falar com um administrador.
    `.trim();
  }

  /**
   * Processar confirmação de pagamento
   */
  async processPaymentConfirmation(data: {
    moradorPhone: string;
    moradorName: string;
    chargeId: string;
    value: number;
    paymentMethod: "PIX" | "BOLETO";
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas] Confirmando pagamento: ${data.chargeId}`
      );

      const confirmationMessage = `
✅ *Pagamento Confirmado!*

Olá ${data.moradorName},

Seu pagamento foi confirmado com sucesso!

💰 *Valor:* R$ ${data.value.toFixed(2)}
📊 *Método:* ${data.paymentMethod}
🆔 *ID:* ${data.chargeId}

Obrigado por manter seu condomínio em dia! 🏘️

Dúvidas? Digite *3* para falar com um administrador.
      `.trim();

      // TODO: Enviar mensagem via Baileys

      this.logger.info(`[WhatsApp+Asaas] Confirmação enviada para ${data.moradorPhone}`);

      return {
        success: true,
        message: confirmationMessage,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas] Erro ao processar confirmação:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao processar confirmação",
      };
    }
  }

  /**
   * Processar mensagem de contato com admin
   */
  async processAdminContact(data: {
    moradorPhone: string;
    moradorName: string;
    message: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.info(
        `[WhatsApp+Asaas] Conectando ${data.moradorName} com admin`
      );

      const adminMessage = `
👤 *Nova Mensagem de Morador*

*De:* ${data.moradorName}
*Telefone:* ${data.moradorPhone}
*Mensagem:* ${data.message}

Responda aqui para conectar com o morador.
      `.trim();

      const moradorMessage = `
✅ *Sua mensagem foi recebida!*

Olá ${data.moradorName},

Sua mensagem foi encaminhada para o administrador.
Em breve você receberá uma resposta.

Obrigado! 🏘️
      `.trim();

      // TODO: Enviar adminMessage para grupo de admins
      // TODO: Enviar moradorMessage para morador

      return {
        success: true,
        message: moradorMessage,
      };
    } catch (error) {
      this.logger.error("[WhatsApp+Asaas] Erro ao conectar com admin:", error);

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao conectar com admin",
      };
    }
  }
}

/**
 * Instância global
 */
let integration: WhatsAppAsaasIntegration | null = null;

/**
 * Inicializar integração
 */
export function initializeWhatsAppAsaasIntegration(): WhatsAppAsaasIntegration {
  integration = new WhatsAppAsaasIntegration();
  return integration;
}

/**
 * Obter instância
 */
export function getWhatsAppAsaasIntegration(): WhatsAppAsaasIntegration {
  if (!integration) {
    integration = new WhatsAppAsaasIntegration();
  }
  return integration;
}
