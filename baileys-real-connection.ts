/**
 * Baileys Real Connection Service
 * Integração real com WhatsApp Web para envio/recebimento de mensagens
 */

import {
  makeWASocket,
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  useMultiFileAuthState,
  DisconnectReason,
  proto,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";

export interface MessageData {
  from: string;
  to: string;
  text: string;
  timestamp?: number;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "document";
}

export interface ConnectionStatus {
  connected: boolean;
  phoneNumber?: string;
  lastUpdate?: number;
  qrCode?: string;
}

/**
 * Serviço de Conexão Real com Baileys
 */
export class BaileysRealConnection {
  private socket: any = null;
  private logger: any;
  private authState: any = null;
  private saveCreds: any = null;
  private messageHandlers: Map<string, Function> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
  };

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
   * Inicializar conexão com WhatsApp
   */
  async initialize(): Promise<{
    success: boolean;
    qrCode?: string;
    message?: string;
    error?: string;
  }> {
    try {
      this.logger.info("[Baileys] Inicializando conexão com WhatsApp...");

      // Carregar autenticação
      const { state, saveCreds } = await useMultiFileAuthState(
        path.join(process.cwd(), "baileys_auth_info")
      );

      this.authState = state;
      this.saveCreds = saveCreds;

      // Criar socket
      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Gestão de Condomínio", "Chrome", "1.0.0"],
        syncFullHistory: false,
        shouldIgnoreJid: (jid: string) => isJidBroadcast(jid),
      });

      // Listeners
      this.setupListeners();

      this.logger.info("[Baileys] Socket criado com sucesso");

      return {
        success: true,
        message: "Conexão inicializada. Aguardando QR Code...",
      };
    } catch (error) {
      this.logger.error("[Baileys] Erro ao inicializar:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao inicializar",
      };
    }
  }

  /**
   * Configurar listeners
   */
  private setupListeners(): void {
    // Evento: Conexão
    this.socket.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.info("[Baileys] QR Code gerado");
        this.connectionStatus.qrCode = qr;
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        this.logger.warn(
          `[Baileys] Conexão fechada. Reconectando: ${shouldReconnect}`
        );

        this.connectionStatus.connected = false;

        if (shouldReconnect) {
          setTimeout(() => this.initialize(), 3000);
        }
      } else if (connection === "open") {
        this.logger.info("[Baileys] Conexão aberta com sucesso!");
        this.connectionStatus.connected = true;
        this.connectionStatus.lastUpdate = Date.now();
      }
    });

    // Evento: Credenciais atualizadas
    this.socket.ev.on("creds.update", this.saveCreds);

    // Evento: Mensagens
    this.socket.ev.on("messages.upsert", async (m: any) => {
      const msg = m.messages[0];

      if (!msg.message) return;

      const from = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      this.logger.info(`[Baileys] Mensagem recebida de ${from}: ${text}`);

      // Chamar handlers registrados
      for (const [, handler] of this.messageHandlers) {
        try {
          await handler({
            from,
            text,
            timestamp: msg.messageTimestamp,
            messageId: msg.key.id,
          });
        } catch (error) {
          this.logger.error("[Baileys] Erro ao processar handler:", error);
        }
      }
    });

    this.logger.info("[Baileys] Listeners configurados");
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
      if (!this.socket || !this.connectionStatus.connected) {
        return {
          success: false,
          error: "WhatsApp não conectado",
        };
      }

      this.logger.info(`[Baileys] Enviando mensagem para ${to}`);

      // Normalizar número
      const jid = this.normalizeJid(to);

      // Enviar
      const response = await this.socket.sendMessage(jid, {
        text,
      });

      this.logger.info(`[Baileys] Mensagem enviada: ${response.key.id}`);

      return {
        success: true,
        messageId: response.key.id,
      };
    } catch (error) {
      this.logger.error("[Baileys] Erro ao enviar mensagem:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar",
      };
    }
  }

  /**
   * Enviar mensagem com imagem
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.socket || !this.connectionStatus.connected) {
        return {
          success: false,
          error: "WhatsApp não conectado",
        };
      }

      this.logger.info(`[Baileys] Enviando imagem para ${to}`);

      const jid = this.normalizeJid(to);

      // Fetch imagem
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();

      // Enviar
      const result = await this.socket.sendMessage(jid, {
        image: Buffer.from(buffer),
        caption: caption || "",
      });

      this.logger.info(`[Baileys] Imagem enviada: ${result.key.id}`);

      return {
        success: true,
        messageId: result.key.id,
      };
    } catch (error) {
      this.logger.error("[Baileys] Erro ao enviar imagem:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar imagem",
      };
    }
  }

  /**
   * Enviar QR Code como imagem
   */
  async sendQrCode(to: string, qrCodeDataUrl: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.socket || !this.connectionStatus.connected) {
        return {
          success: false,
          error: "WhatsApp não conectado",
        };
      }

      this.logger.info(`[Baileys] Enviando QR Code para ${to}`);

      const jid = this.normalizeJid(to);

      // Converter data URL para buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Enviar
      const result = await this.socket.sendMessage(jid, {
        image: buffer,
        caption: "📱 Escaneie este QR Code para pagar com PIX",
      });

      this.logger.info(`[Baileys] QR Code enviado: ${result.key.id}`);

      return {
        success: true,
        messageId: result.key.id,
      };
    } catch (error) {
      this.logger.error("[Baileys] Erro ao enviar QR Code:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar QR Code",
      };
    }
  }

  /**
   * Registrar handler para mensagens
   */
  registerMessageHandler(name: string, handler: Function): void {
    this.messageHandlers.set(name, handler);
    this.logger.info(`[Baileys] Handler registrado: ${name}`);
  }

  /**
   * Remover handler
   */
  unregisterMessageHandler(name: string): void {
    this.messageHandlers.delete(name);
    this.logger.info(`[Baileys] Handler removido: ${name}`);
  }

  /**
   * Obter status de conexão
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Obter QR Code
   */
  getQrCode(): string | undefined {
    return this.connectionStatus.qrCode;
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    try {
      if (this.socket) {
        await this.socket.end();
        this.socket = null;
        this.connectionStatus.connected = false;
        this.logger.info("[Baileys] Desconectado");
      }
    } catch (error) {
      this.logger.error("[Baileys] Erro ao desconectar:", error);
    }
  }

  /**
   * Normalizar JID
   */
  private normalizeJid(phone: string): string {
    // Remover caracteres especiais
    const cleaned = phone.replace(/\D/g, "");

    // Adicionar código do país se não tiver
    if (!cleaned.startsWith("55")) {
      return `55${cleaned}@s.whatsapp.net`;
    }

    return `${cleaned}@s.whatsapp.net`;
  }
}

/**
 * Instância global
 */
let connection: BaileysRealConnection | null = null;

/**
 * Inicializar conexão
 */
export async function initializeBaileysConnection(): Promise<BaileysRealConnection> {
  if (!connection) {
    connection = new BaileysRealConnection();
    await connection.initialize();
  }
  return connection;
}

/**
 * Obter instância
 */
export function getBaileysConnection(): BaileysRealConnection {
  if (!connection) {
    connection = new BaileysRealConnection();
  }
  return connection;
}
