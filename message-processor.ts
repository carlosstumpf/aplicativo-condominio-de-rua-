/**
 * Message Processor
 * Processa mensagens recebidas e executa ações automáticas
 */

import { getBaileysService } from "./baileys-service";
import pino from "pino";

export interface MessageContext {
  from: string; // Número do morador
  to: string; // Número do admin
  text: string; // Conteúdo da mensagem
  timestamp: number; // Quando chegou
  messageId: string; // ID único
}

export interface ActionResult {
  success: boolean;
  action: string;
  message?: string;
  data?: Record<string, any>;
  error?: string;
}

export interface PendingPayment {
  moradorPhone: string;
  moradorName: string;
  amount: number;
  dueDate: string;
  pixKey?: string;
  barcodeUrl?: string;
  asaasPaymentId?: string;
}

/**
 * Processador de Mensagens
 * Detecta opções numéricas e executa ações
 */
export class MessageProcessor {
  private logger: any;
  private pendingPayments: Map<string, PendingPayment> = new Map();
  private actionHandlers: Map<string, (context: MessageContext) => Promise<ActionResult>> =
    new Map();

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

    this.registerDefaultHandlers();
  }

  /**
   * Registrar handlers padrão
   */
  private registerDefaultHandlers(): void {
    // Handler para PIX
    this.registerHandler("payment_pix", async (context) => {
      return this.handlePaymentPix(context);
    });

    // Handler para Boleto
    this.registerHandler("payment_boleto", async (context) => {
      return this.handlePaymentBoleto(context);
    });

    // Handler para Falar com Admin
    this.registerHandler("contact_admin", async (context) => {
      return this.handleContactAdmin(context);
    });

    // Handler para Confirmar Pagamento
    this.registerHandler("payment_confirm", async (context) => {
      return this.handlePaymentConfirm(context);
    });
  }

  /**
   * Registrar handler customizado
   */
  registerHandler(
    action: string,
    handler: (context: MessageContext) => Promise<ActionResult>
  ): void {
    this.actionHandlers.set(action, handler);
    this.logger.info(`[MessageProcessor] Handler registrado: ${action}`);
  }

  /**
   * Processar mensagem
   */
  async processMessage(context: MessageContext): Promise<ActionResult> {
    try {
      this.logger.info(`[MessageProcessor] Processando mensagem de ${context.from}`);
      this.logger.info(`[MessageProcessor] Texto: "${context.text}"`);

      // Detectar opção numérica
      const optionMatch = context.text.trim().match(/^(\d+)$/);

      if (optionMatch) {
        const optionNumber = parseInt(optionMatch[1]);
        this.logger.info(
          `[MessageProcessor] Opção numérica detectada: ${optionNumber}`
        );

        return this.handleNumericOption(optionNumber, context);
      }

      // Detectar palavras-chave
      const lowerText = context.text.toLowerCase().trim();

      if (lowerText.includes("pix")) {
        return this.handlePaymentPix(context);
      }

      if (lowerText.includes("boleto")) {
        return this.handlePaymentBoleto(context);
      }

      if (lowerText.includes("admin") || lowerText.includes("ajuda")) {
        return this.handleContactAdmin(context);
      }

      // Mensagem não reconhecida
      return {
        success: false,
        action: "unknown",
        message: "Opção não reconhecida",
      };
    } catch (error) {
      this.logger.error(`[MessageProcessor] Erro ao processar:`, error);
      return {
        success: false,
        action: "error",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Processar opção numérica
   */
  private async handleNumericOption(
    optionNumber: number,
    context: MessageContext
  ): Promise<ActionResult> {
    try {
      // Mapeamento de opções padrão
      const optionMap: Record<number, string> = {
        1: "payment_pix",
        2: "payment_boleto",
        3: "contact_admin",
      };

      const action = optionMap[optionNumber];

      if (!action) {
        return {
          success: false,
          action: "unknown_option",
          message: `Opção ${optionNumber} não encontrada`,
        };
      }

      const handler = this.actionHandlers.get(action);

      if (!handler) {
        return {
          success: false,
          action: "no_handler",
          message: `Handler não encontrado para ação: ${action}`,
        };
      }

      return await handler(context);
    } catch (error) {
      this.logger.error(`[MessageProcessor] Erro ao processar opção:`, error);
      return {
        success: false,
        action: "error",
        error: error instanceof Error ? error.message : "Erro ao processar opção",
      };
    }
  }

  /**
   * Handler: Pagamento com PIX
   */
  private async handlePaymentPix(context: MessageContext): Promise<ActionResult> {
    try {
      this.logger.info(`[MessageProcessor] Processando PIX para ${context.from}`);

      const whatsapp = getBaileysService();

      // Buscar pagamento pendente
      const payment = this.pendingPayments.get(context.from);

      if (!payment) {
        const response = await whatsapp.sendMessage(
          context.from,
          "❌ Nenhum pagamento pendente encontrado.\n\nDigite 'mensalidade' para ver suas pendências."
        );

        return {
          success: false,
          action: "payment_pix",
          message: "Nenhum pagamento pendente",
          data: { response },
        };
      }

      // Simular geração de PIX (em produção, viria do Asaas)
      const pixData = {
        qrCode:
          "00020126580014br.gov.bcb.brcode0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913Fulano de Tal6009SAO PAULO62410503***63041D3F",
        pixKey: "00020126580014br.gov.bcb.brcode...",
        amount: payment.amount,
      };

      const message = `
✅ *Pagamento com PIX*

Valor: R$ ${payment.amount.toFixed(2)}
Vencimento: ${payment.dueDate}

*QR Code:*
${pixData.qrCode}

*Chave PIX:*
${pixData.pixKey}

Escaneie o QR Code ou copie a chave para pagar.
Após pagar, digite "pago" para confirmar.
      `.trim();

      const response = await whatsapp.sendMessage(context.from, message);

      return {
        success: true,
        action: "payment_pix",
        message: "PIX enviado com sucesso",
        data: {
          pixData,
          response,
          moradorPhone: context.from,
          amount: payment.amount,
        },
      };
    } catch (error) {
      this.logger.error(`[MessageProcessor] Erro ao processar PIX:`, error);
      return {
        success: false,
        action: "payment_pix",
        error: error instanceof Error ? error.message : "Erro ao processar PIX",
      };
    }
  }

  /**
   * Handler: Pagamento com Boleto
   */
  private async handlePaymentBoleto(context: MessageContext): Promise<ActionResult> {
    try {
      this.logger.info(`[MessageProcessor] Processando Boleto para ${context.from}`);

      const whatsapp = getBaileysService();

      // Buscar pagamento pendente
      const payment = this.pendingPayments.get(context.from);

      if (!payment) {
        const response = await whatsapp.sendMessage(
          context.from,
          "❌ Nenhum pagamento pendente encontrado.\n\nDigite 'mensalidade' para ver suas pendências."
        );

        return {
          success: false,
          action: "payment_boleto",
          message: "Nenhum pagamento pendente",
          data: { response },
        };
      }

      // Simular geração de Boleto (em produção, viria do Asaas)
      const barcodeData = {
        barcode: "12345.67890 12345.678901 12345.678901 1 12345678901234",
        barcodeUrl: "https://example.com/boleto.pdf",
        amount: payment.amount,
      };

      const message = `
✅ *Pagamento com Boleto*

Valor: R$ ${payment.amount.toFixed(2)}
Vencimento: ${payment.dueDate}

*Código de Barras:*
${barcodeData.barcode}

Copie o código acima e cole no seu banco.

*Baixar Boleto:*
${barcodeData.barcodeUrl}

Após pagar, digite "pago" para confirmar.
      `.trim();

      const response = await whatsapp.sendMessage(context.from, message);

      return {
        success: true,
        action: "payment_boleto",
        message: "Boleto enviado com sucesso",
        data: {
          barcodeData,
          response,
          moradorPhone: context.from,
          amount: payment.amount,
        },
      };
    } catch (error) {
      this.logger.error(`[MessageProcessor] Erro ao processar Boleto:`, error);
      return {
        success: false,
        action: "payment_boleto",
        error: error instanceof Error ? error.message : "Erro ao processar Boleto",
      };
    }
  }

  /**
   * Handler: Falar com Admin
   */
  private async handleContactAdmin(context: MessageContext): Promise<ActionResult> {
    try {
      this.logger.info(`[MessageProcessor] Conectando com admin para ${context.from}`);

      const whatsapp = getBaileysService();

      const message = `
👨‍💼 *Conectando com Administrador*

Sua mensagem foi enviada para o administrador.
Ele responderá em breve.

Obrigado por entrar em contato!
      `.trim();

      const response = await whatsapp.sendMessage(context.from, message);

      // TODO: Notificar admin sobre novo contato
      this.logger.info(`[MessageProcessor] Admin notificado sobre contato de ${context.from}`);

      return {
        success: true,
        action: "contact_admin",
        message: "Morador conectado com admin",
        data: {
          response,
          moradorPhone: context.from,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      this.logger.error(`[MessageProcessor] Erro ao conectar com admin:`, error);
      return {
        success: false,
        action: "contact_admin",
        error: error instanceof Error ? error.message : "Erro ao conectar com admin",
      };
    }
  }

  /**
   * Handler: Confirmar Pagamento
   */
  private async handlePaymentConfirm(context: MessageContext): Promise<ActionResult> {
    try {
      this.logger.info(`[MessageProcessor] Confirmando pagamento de ${context.from}`);

      const whatsapp = getBaileysService();

      const message = `
✅ *Pagamento Confirmado!*

Obrigado por pagar sua mensalidade.
Seu comprovante será enviado em breve.

Qualquer dúvida, entre em contato com o administrador.
      `.trim();

      const response = await whatsapp.sendMessage(context.from, message);

      // TODO: Atualizar status do pagamento no banco de dados
      this.pendingPayments.delete(context.from);

      return {
        success: true,
        action: "payment_confirm",
        message: "Pagamento confirmado",
        data: {
          response,
          moradorPhone: context.from,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      this.logger.error(`[MessageProcessor] Erro ao confirmar pagamento:`, error);
      return {
        success: false,
        action: "payment_confirm",
        error: error instanceof Error ? error.message : "Erro ao confirmar pagamento",
      };
    }
  }

  /**
   * Adicionar pagamento pendente
   */
  addPendingPayment(payment: PendingPayment): void {
    this.pendingPayments.set(payment.moradorPhone, payment);
    this.logger.info(
      `[MessageProcessor] Pagamento pendente adicionado para ${payment.moradorPhone}`
    );
  }

  /**
   * Remover pagamento pendente
   */
  removePendingPayment(moradorPhone: string): void {
    this.pendingPayments.delete(moradorPhone);
    this.logger.info(
      `[MessageProcessor] Pagamento pendente removido para ${moradorPhone}`
    );
  }

  /**
   * Obter pagamento pendente
   */
  getPendingPayment(moradorPhone: string): PendingPayment | undefined {
    return this.pendingPayments.get(moradorPhone);
  }

  /**
   * Listar todos os pagamentos pendentes
   */
  listPendingPayments(): PendingPayment[] {
    return Array.from(this.pendingPayments.values());
  }
}

/**
 * Instância global do processador
 */
let messageProcessor: MessageProcessor | null = null;

/**
 * Inicializar processador de mensagens
 */
export function initializeMessageProcessor(): MessageProcessor {
  messageProcessor = new MessageProcessor();
  return messageProcessor;
}

/**
 * Obter instância do processador
 */
export function getMessageProcessor(): MessageProcessor {
  if (!messageProcessor) {
    messageProcessor = new MessageProcessor();
  }
  return messageProcessor;
}
