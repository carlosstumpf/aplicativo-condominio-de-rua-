/**
 * Baileys Connection Fixed
 * Conexão real com WhatsApp Web com QR Code persistente e funcional
 */

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

export interface MessageData {
  from: string;
  to: string;
  text: string;
  timestamp?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  phoneNumber?: string;
  lastUpdate?: number;
  qrCode?: string;
  status: "disconnected" | "connecting" | "connected" | "qr_waiting";
}

/**
 * Gerenciador de Conexão Baileys
 */
export class BaileysConnectionFixed {
  private socket: any = null;
  private logger: any;
  private authState: any = null;
  private saveCreds: any = null;
  private messageHandlers: Map<string, Function> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    status: "disconnected",
  };
  private qrCodePath: string;
  private statusPath: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

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

    // Caminhos para armazenar QR Code e status
    this.qrCodePath = path.join(process.cwd(), ".whatsapp", "qrcode.txt");
    this.statusPath = path.join(process.cwd(), ".whatsapp", "status.json");

    // Criar diretório se não existir
    const dir = path.dirname(this.qrCodePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Inicializar conexão
   */
  async initialize(): Promise<{
    success: boolean;
    message: string;
    status: string;
  }> {
    try {
      this.logger.info("[Baileys] Inicializando conexão com WhatsApp...");
      this.connectionStatus.status = "connecting";
      this.saveStatus();

      // Carregar autenticação
      const authPath = path.join(process.cwd(), "baileys_auth_info");
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

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
        markOnlineOnConnect: true,
      });

      // Configurar listeners
      this.setupListeners();

      this.logger.info("[Baileys] Socket criado com sucesso");

      return {
        success: true,
        message: "Conexão inicializada",
        status: this.connectionStatus.status,
      };
    } catch (error) {
      this.logger.error("[Baileys] Erro ao inicializar:", error);
      this.connectionStatus.status = "disconnected";
      this.saveStatus();

      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao inicializar",
        status: "disconnected",
      };
    }
  }

  /**
   * Configurar listeners
   */
  private setupListeners(): void {
    // Evento: Atualização de conexão
    this.socket.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code gerado
      if (qr) {
        this.logger.info("[Baileys] QR Code gerado - escaneie com seu celular");

        // Gerar imagem QR Code
        try {
          const qrCodeImage = await QRCode.toDataURL(qr);
          this.connectionStatus.qrCode = qrCodeImage;
          this.connectionStatus.status = "qr_waiting";

          // Salvar QR Code em arquivo
          fs.writeFileSync(this.qrCodePath, qrCodeImage);
          this.saveStatus();

          this.logger.info("[Baileys] QR Code salvo em arquivo");
        } catch (error) {
          this.logger.error("[Baileys] Erro ao gerar QR Code:", error);
        }
      }

      // Conexão fechada
      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        this.logger.warn(
          `[Baileys] Conexão fechada. Reconectando: ${shouldReconnect}`
        );

        this.connectionStatus.connected = false;
        this.connectionStatus.status = "disconnected";
        this.saveStatus();

        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.logger.info(
            `[Baileys] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
          );
          setTimeout(() => this.initialize(), 3000);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.logger.error("[Baileys] Máximo de tentativas de reconexão atingido");
        }
      }

      // Conexão aberta
      if (connection === "open") {
        this.logger.info("[Baileys] ✅ Conectado com sucesso ao WhatsApp!");

        this.connectionStatus.connected = true;
        this.connectionStatus.status = "connected";
        this.connectionStatus.lastUpdate = Date.now();
        this.reconnectAttempts = 0;

        // Obter número de telefone
        if (this.socket.user) {
          this.connectionStatus.phoneNumber = this.socket.user.id;
          this.logger.info(`[Baileys] Número: ${this.socket.user.id}`);
        }

        // Limpar QR Code
        try {
          if (fs.existsSync(this.qrCodePath)) {
            fs.unlinkSync(this.qrCodePath);
          }
        } catch (error) {
          this.logger.error("[Baileys] Erro ao limpar QR Code:", error);
        }

        this.saveStatus();
      }
    });

    // Evento: Credenciais atualizadas
    this.socket.ev.on("creds.update", this.saveCreds);

    // Evento: Mensagens recebidas
    this.socket.ev.on("messages.upsert", async (m: any) => {
      try {
        const msg = m.messages[0];

        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) return;

        this.logger.info(`[Baileys] 📨 Mensagem recebida de ${from}: ${text}`);

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
      } catch (error) {
        this.logger.error("[Baileys] Erro ao processar mensagem:", error);
      }
    });

    this.logger.info("[Baileys] Listeners configurados");
  }

  /**
   * Enviar mensagem
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
          error: "WhatsApp não conectado. Escaneie o QR Code primeiro.",
        };
      }

      this.logger.info(`[Baileys] 📤 Enviando mensagem para ${to}`);

      // Normalizar número
      const jid = this.normalizeJid(to);

      // Enviar mensagem
      const response = await this.socket.sendMessage(jid, {
        text,
      });

      this.logger.info(`[Baileys] ✅ Mensagem enviada: ${response.key.id}`);

      return {
        success: true,
        messageId: response.key.id,
      };
    } catch (error) {
      this.logger.error("[Baileys] Erro ao enviar mensagem:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
      };
    }
  }

  /**
   * Normalizar JID (formato WhatsApp)
   */
  private normalizeJid(phone: string): string {
    // Remover caracteres especiais
    let cleaned = phone.replace(/\D/g, "");

    // Se começar com 55 (Brasil), manter como está
    if (!cleaned.startsWith("55")) {
      cleaned = "55" + cleaned;
    }

    return cleaned + "@s.whatsapp.net";
  }

  /**
   * Obter QR Code
   */
  getQRCode(): string | null {
    try {
      if (fs.existsSync(this.qrCodePath)) {
        return fs.readFileSync(this.qrCodePath, "utf-8");
      }
    } catch (error) {
      this.logger.error("[Baileys] Erro ao ler QR Code:", error);
    }

    return this.connectionStatus.qrCode || null;
  }

  /**
   * Obter status
   */
  getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Salvar status em arquivo
   */
  private saveStatus(): void {
    try {
      fs.writeFileSync(
        this.statusPath,
        JSON.stringify(
          {
            connected: this.connectionStatus.connected,
            status: this.connectionStatus.status,
            phoneNumber: this.connectionStatus.phoneNumber,
            lastUpdate: this.connectionStatus.lastUpdate,
          },
          null,
          2
        )
      );
    } catch (error) {
      this.logger.error("[Baileys] Erro ao salvar status:", error);
    }
  }

  /**
   * Registrar handler de mensagem
   */
  onMessage(handler: Function): void {
    const id = Date.now().toString();
    this.messageHandlers.set(id, handler);
    this.logger.info(`[Baileys] Handler registrado: ${id}`);
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    try {
      if (this.socket) {
        await this.socket.end();
        this.socket = null;
      }

      this.connectionStatus.connected = false;
      this.connectionStatus.status = "disconnected";
      this.saveStatus();

      this.logger.info("[Baileys] Desconectado");
    } catch (error) {
      this.logger.error("[Baileys] Erro ao desconectar:", error);
    }
  }
}

/**
 * Instância global
 */
let connection: BaileysConnectionFixed | null = null;

/**
 * Inicializar
 */
export async function initializeBaileysConnection(): Promise<BaileysConnectionFixed> {
  if (!connection) {
    connection = new BaileysConnectionFixed();
    await connection.initialize();
  }

  return connection;
}

/**
 * Obter instância
 */
export function getBaileysConnection(): BaileysConnectionFixed {
  if (!connection) {
    connection = new BaileysConnectionFixed();
  }

  return connection;
}
