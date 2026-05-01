/**
 * Baileys WhatsApp Service - Real Implementation
 * Integração com WhatsApp Web via Baileys
 * Monitora mensagens e responde automaticamente
 */

import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidGroup,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";
import pino from "pino";
import path from "path";
import fs from "fs";

export interface WhatsAppMessage {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  messageId: string;
  isGroup?: boolean;
}

export interface MenuOption {
  number: number;
  label: string;
  action: string;
  description?: string;
}

export interface AutoReplyConfig {
  trigger: string;
  menu: MenuOption[];
  timeout?: number;
}

export interface QRCodeData {
  qrCode: string;
  timestamp: number;
  connected: boolean;
}

/**
 * Serviço de WhatsApp com Baileys - Implementação Real
 */
export class BaileysWhatsAppService {
  private adminPhoneNumber: string;
  private sock: any = null;
  private isConnected = false;
  private autoReplies: Map<string, AutoReplyConfig> = new Map();
  private messageHandlers: Array<(msg: WhatsAppMessage) => Promise<void>> = [];
  private qrCodeData: QRCodeData | null = null;
  private logger: any;
  private authDir: string;

  constructor(adminPhoneNumber: string) {
    this.adminPhoneNumber = this.normalizePhoneNumber(adminPhoneNumber);
    this.authDir = path.join(process.cwd(), "auth_info");

    // Criar diretório de autenticação se não existir
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    // Configurar logger
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
   * Normalizar número de telefone
   */
  private normalizePhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned.startsWith("55")) {
      cleaned = "55" + cleaned;
    }
    return cleaned;
  }

  /**
   * Inicializar conexão com WhatsApp
   */
  async connect(): Promise<boolean> {
    try {
      this.logger.info(`[Baileys] Conectando ao WhatsApp...`);
      this.logger.info(`[Baileys] Número: ${this.adminPhoneNumber}`);

      // Carregar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      // Criar socket
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: this.logger,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
      });

      // Evento: QR Code gerado
      this.sock.ev.on("connection.update", async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.logger.info(`[Baileys] QR Code gerado`);
          try {
            const qrCodeString = await qrcode.toDataURL(qr);
            this.qrCodeData = {
              qrCode: qrCodeString,
              timestamp: Date.now(),
              connected: false,
            };
            this.logger.info(`[Baileys] QR Code disponível para escanear`);
          } catch (error) {
            this.logger.error(`[Baileys] Erro ao gerar QR Code:`, error);
          }
        }

        if (connection === "open") {
          this.isConnected = true;
          this.qrCodeData = null;
          this.logger.info(`[Baileys] ✅ Conectado com sucesso!`);
        }

        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          this.isConnected = false;
          this.logger.warn(
            `[Baileys] Desconectado. Reconectando: ${shouldReconnect}`
          );

          if (shouldReconnect) {
            await this.connect();
          }
        }
      });

      // Evento: Salvar credenciais
      this.sock.ev.on("creds.update", saveCreds);

      // Evento: Mensagem recebida
      this.sock.ev.on("messages.upsert", async (m: any) => {
        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) return;

        const whatsappMessage: WhatsAppMessage = {
          from,
          to: this.adminPhoneNumber,
          text,
          timestamp: msg.messageTimestamp,
          messageId: msg.key.id,
          isGroup: isJidGroup(from),
        };

        this.logger.info(`[Baileys] Mensagem recebida de ${from}: ${text}`);

        // Processar mensagem
        await this.processMessage(whatsappMessage);
      });

      return true;
    } catch (error) {
      this.logger.error(`[Baileys] Erro ao conectar:`, error);
      return false;
    }
  }

  /**
   * Desconectar do WhatsApp
   */
  async disconnect(): Promise<void> {
    try {
      this.logger.info(`[Baileys] Desconectando...`);
      if (this.sock) {
        this.sock.end(undefined);
      }
      this.isConnected = false;
    } catch (error) {
      this.logger.error(`[Baileys] Erro ao desconectar:`, error);
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendMessage(to: string, text: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.isConnected) {
        return { success: false, error: "WhatsApp não conectado" };
      }

      const normalizedTo = this.normalizePhoneNumber(to) + "@s.whatsapp.net";

      this.logger.info(`[Baileys] Enviando mensagem para ${to}`);

      const result = await this.sock.sendMessage(normalizedTo, { text });

      return {
        success: true,
        messageId: result.key.id,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro ao enviar mensagem";
      this.logger.error(`[Baileys] Erro ao enviar:`, error);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Enviar menu interativo
   */
  async sendMenu(to: string, title: string, options: MenuOption[]): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.isConnected) {
        return { success: false, error: "WhatsApp não conectado" };
      }

      const normalizedTo = this.normalizePhoneNumber(to) + "@s.whatsapp.net";

      let menuText = `*${title}*\n\n`;
      options.forEach((opt) => {
        menuText += `${opt.number} - ${opt.label}`;
        if (opt.description) {
          menuText += ` (${opt.description})`;
        }
        menuText += `\n`;
      });
      menuText += `\nDigite o número da opção desejada.`;

      this.logger.info(`[Baileys] Enviando menu para ${to}`);

      const result = await this.sock.sendMessage(normalizedTo, { text: menuText });

      return {
        success: true,
        messageId: result.key.id,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro ao enviar menu";
      this.logger.error(`[Baileys] Erro ao enviar menu:`, error);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Registrar resposta automática
   */
  registerAutoReply(config: AutoReplyConfig): void {
    this.autoReplies.set(config.trigger, config);
    this.logger.info(`[Baileys] Auto-reply registrada para: "${config.trigger}"`);
  }

  /**
   * Remover resposta automática
   */
  removeAutoReply(trigger: string): void {
    this.autoReplies.delete(trigger);
    this.logger.info(`[Baileys] Auto-reply removida: "${trigger}"`);
  }

  /**
   * Registrar handler de mensagem
   */
  onMessage(handler: (msg: WhatsAppMessage) => Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Processar mensagem recebida
   */
  async processMessage(message: WhatsAppMessage): Promise<void> {
    try {
      this.logger.info(`[Baileys] Processando mensagem de ${message.from}`);

      // Executar todos os handlers
      for (const handler of this.messageHandlers) {
        await handler(message);
      }

      // Verificar auto-replies
      const trigger = message.text.toLowerCase().trim();
      const autoReply = this.autoReplies.get(trigger);

      if (autoReply) {
        this.logger.info(`[Baileys] Auto-reply acionada: "${trigger}"`);
        await this.sendMenu(message.from, "Escolha uma opção:", autoReply.menu);
      }
    } catch (error) {
      this.logger.error(`[Baileys] Erro ao processar mensagem:`, error);
    }
  }

  /**
   * Processar resposta do morador
   */
  async processMenuResponse(
    from: string,
    optionNumber: number,
    config: AutoReplyConfig
  ): Promise<{
    success: boolean;
    action?: string;
    message?: string;
  }> {
    try {
      const option = config.menu.find((opt) => opt.number === optionNumber);

      if (!option) {
        return {
          success: false,
          message: "Opção inválida",
        };
      }

      this.logger.info(
        `[Baileys] Opção ${optionNumber} selecionada por ${from}`
      );

      return {
        success: true,
        action: option.action,
        message: `Opção ${option.number} selecionada: ${option.label}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao processar opção",
      };
    }
  }

  /**
   * Obter QR Code
   */
  getQRCode(): QRCodeData | null {
    return this.qrCodeData;
  }

  /**
   * Obter status de conexão
   */
  getStatus(): {
    connected: boolean;
    phoneNumber: string;
    autoReplies: number;
    hasQRCode: boolean;
  } {
    return {
      connected: this.isConnected,
      phoneNumber: this.adminPhoneNumber,
      autoReplies: this.autoReplies.size,
      hasQRCode: this.qrCodeData !== null,
    };
  }

  /**
   * Testar conexão
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.isConnected) {
        return {
          success: false,
          message: "WhatsApp não conectado",
        };
      }

      const result = await this.sendMessage(
        this.adminPhoneNumber,
        "✅ Teste de conexão Baileys - Sistema funcionando!"
      );

      if (result.success) {
        return {
          success: true,
          message: "Conexão testada com sucesso!",
        };
      } else {
        return {
          success: false,
          message: `Erro ao enviar mensagem de teste: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao testar conexão",
      };
    }
  }
}

/**
 * Instância global do serviço
 */
let baileysService: BaileysWhatsAppService | null = null;

/**
 * Inicializar serviço Baileys
 */
export function initializeBaileysService(
  phoneNumber: string
): BaileysWhatsAppService {
  baileysService = new BaileysWhatsAppService(phoneNumber);
  return baileysService;
}

/**
 * Obter instância do serviço
 */
export function getBaileysService(): BaileysWhatsAppService {
  if (!baileysService) {
    throw new Error("Baileys service não inicializado");
  }
  return baileysService;
}
