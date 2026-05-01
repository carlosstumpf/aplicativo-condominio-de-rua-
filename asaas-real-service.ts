/**
 * Asaas Real Integration Service
 * Integração real com API v3 do Asaas para PIX e Boleto
 */

import axios, { AxiosInstance } from "axios";
import pino from "pino";

export interface AsaasConfig {
  apiKey: string;
  environment: "production" | "sandbox";
}

export interface CreateChargeRequest {
  customer: string; // Email ou ID do cliente
  billingType: "PIX" | "BOLETO" | "CREDIT_CARD";
  value: number; // Valor em reais
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  notificationUrl?: string;
}

export interface ChargeResponse {
  id: string;
  status: string;
  value: number;
  netValue: number;
  billingType: string;
  dueDate: string;
  pixKey?: string;
  pixQrCode?: string;
  pixExpirationDate?: string;
  barCode?: string;
  bankSlipUrl?: string;
  customer: string;
  externalReference?: string;
  createdAt: string;
}

export interface WebhookPayload {
  event: string;
  data: {
    id: string;
    status: string;
    value: number;
    billingType: string;
    dueDate: string;
    confirmedDate?: string;
    customer: string;
    externalReference?: string;
  };
}

/**
 * Serviço de Integração com Asaas
 */
export class AsaasRealService {
  private client: AxiosInstance;
  private logger: any;
  private config: AsaasConfig;
  private baseURL: string;

  constructor(config: AsaasConfig) {
    this.config = config;
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });

    // Selecionar URL base conforme ambiente
    this.baseURL =
      config.environment === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/v3";

    // Criar cliente Axios
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "access_token": config.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    this.logger.info(`[Asaas] Serviço inicializado em ambiente: ${config.environment}`);
  }

  /**
   * Testar conexão com Asaas
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    accountInfo?: any;
  }> {
    try {
      this.logger.info("[Asaas] Testando conexão...");

      const response = await this.client.get("/accounts");

      this.logger.info("[Asaas] Conexão bem-sucedida!");

      return {
        success: true,
        message: "Conectado com sucesso ao Asaas",
        accountInfo: response.data,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao testar conexão:", error);

      return {
        success: false,
        message: `Erro ao conectar: ${errorMsg}`,
      };
    }
  }

  /**
   * Criar cliente no Asaas
   */
  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj?: string;
  }): Promise<{
    success: boolean;
    customerId?: string;
    error?: string;
  }> {
    try {
      this.logger.info(`[Asaas] Criando cliente: ${data.email}`);

      const response = await this.client.post("/customers", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpfCnpj: data.cpfCnpj,
      });

      this.logger.info(`[Asaas] Cliente criado: ${response.data.id}`);

      return {
        success: true,
        customerId: response.data.id,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao criar cliente:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Obter ou criar cliente
   */
  async getOrCreateCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj?: string;
  }): Promise<{
    success: boolean;
    customerId?: string;
    error?: string;
  }> {
    try {
      // Tentar buscar cliente existente
      const searchResponse = await this.client.get("/customers", {
        params: {
          email: data.email,
        },
      });

      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        this.logger.info(`[Asaas] Cliente encontrado: ${searchResponse.data.data[0].id}`);
        return {
          success: true,
          customerId: searchResponse.data.data[0].id,
        };
      }

      // Cliente não existe, criar novo
      return this.createCustomer(data);
    } catch (error) {
      // Se erro ao buscar, tentar criar
      return this.createCustomer(data);
    }
  }

  /**
   * Criar cobrança PIX
   */
  async createPixCharge(data: {
    customerId: string;
    value: number;
    dueDate: string; // YYYY-MM-DD
    description?: string;
    externalReference?: string;
  }): Promise<{
    success: boolean;
    charge?: ChargeResponse;
    pixQrCode?: string;
    pixKey?: string;
    error?: string;
  }> {
    try {
      this.logger.info(
        `[Asaas] Criando cobrança PIX: ${data.customerId} - R$ ${data.value}`
      );

      const response = await this.client.post("/payments", {
        customer: data.customerId,
        billingType: "PIX",
        value: data.value,
        dueDate: data.dueDate,
        description: data.description || "Mensalidade",
        externalReference: data.externalReference,
        notificationUrl: process.env.ASAAS_WEBHOOK_URL,
      });

      const charge = response.data;

      this.logger.info(`[Asaas] Cobrança PIX criada: ${charge.id}`);

      return {
        success: true,
        charge,
        pixQrCode: charge.pixQrCode,
        pixKey: charge.pixKey,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao criar cobrança PIX:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Criar cobrança Boleto
   */
  async createBoletoCharge(data: {
    customerId: string;
    value: number;
    dueDate: string; // YYYY-MM-DD
    description?: string;
    externalReference?: string;
  }): Promise<{
    success: boolean;
    charge?: ChargeResponse;
    barCode?: string;
    bankSlipUrl?: string;
    error?: string;
  }> {
    try {
      this.logger.info(
        `[Asaas] Criando cobrança Boleto: ${data.customerId} - R$ ${data.value}`
      );

      const response = await this.client.post("/payments", {
        customer: data.customerId,
        billingType: "BOLETO",
        value: data.value,
        dueDate: data.dueDate,
        description: data.description || "Mensalidade",
        externalReference: data.externalReference,
        notificationUrl: process.env.ASAAS_WEBHOOK_URL,
      });

      const charge = response.data;

      this.logger.info(`[Asaas] Cobrança Boleto criada: ${charge.id}`);

      return {
        success: true,
        charge,
        barCode: charge.barCode,
        bankSlipUrl: charge.bankSlipUrl,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao criar cobrança Boleto:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Obter cobrança
   */
  async getCharge(chargeId: string): Promise<{
    success: boolean;
    charge?: ChargeResponse;
    error?: string;
  }> {
    try {
      this.logger.info(`[Asaas] Obtendo cobrança: ${chargeId}`);

      const response = await this.client.get(`/payments/${chargeId}`);

      return {
        success: true,
        charge: response.data,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao obter cobrança:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Listar cobranças de um cliente
   */
  async listCharges(customerId: string, limit: number = 50): Promise<{
    success: boolean;
    charges?: ChargeResponse[];
    total?: number;
    error?: string;
  }> {
    try {
      this.logger.info(`[Asaas] Listando cobranças de: ${customerId}`);

      const response = await this.client.get("/payments", {
        params: {
          customer: customerId,
          limit,
        },
      });

      return {
        success: true,
        charges: response.data.data,
        total: response.data.totalCount,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao listar cobranças:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Confirmar recebimento de webhook
   */
  async confirmWebhook(webhookId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.info(`[Asaas] Confirmando webhook: ${webhookId}`);

      await this.client.post(`/webhooks/${webhookId}/confirm`);

      return {
        success: true,
      };
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao confirmar webhook:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Processar webhook de pagamento
   */
  async processPaymentWebhook(payload: WebhookPayload): Promise<{
    success: boolean;
    action?: string;
    message?: string;
    error?: string;
  }> {
    try {
      this.logger.info(`[Asaas] Processando webhook: ${payload.event}`);

      const { event, data } = payload;

      switch (event) {
        case "payment_received":
          this.logger.info(`[Asaas] Pagamento recebido: ${data.id}`);
          return {
            success: true,
            action: "payment_received",
            message: `Pagamento ${data.id} confirmado`,
          };

        case "payment_confirmed":
          this.logger.info(`[Asaas] Pagamento confirmado: ${data.id}`);
          return {
            success: true,
            action: "payment_confirmed",
            message: `Pagamento ${data.id} confirmado`,
          };

        case "payment_overdue":
          this.logger.warn(`[Asaas] Pagamento vencido: ${data.id}`);
          return {
            success: true,
            action: "payment_overdue",
            message: `Pagamento ${data.id} vencido`,
          };

        case "payment_deleted":
          this.logger.info(`[Asaas] Pagamento deletado: ${data.id}`);
          return {
            success: true,
            action: "payment_deleted",
            message: `Pagamento ${data.id} deletado`,
          };

        default:
          this.logger.warn(`[Asaas] Evento desconhecido: ${event}`);
          return {
            success: false,
            error: `Evento desconhecido: ${event}`,
          };
      }
    } catch (error) {
      const errorMsg = this.getErrorMessage(error);
      this.logger.error("[Asaas] Erro ao processar webhook:", error);

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Extrair mensagem de erro
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.errors) {
        return error.response.data.errors[0]?.description || "Erro desconhecido";
      }
      return error.response?.data?.message || error.message;
    }
    return error instanceof Error ? error.message : "Erro desconhecido";
  }
}

/**
 * Instância global do serviço
 */
let asaasService: AsaasRealService | null = null;

/**
 * Inicializar serviço Asaas
 */
export function initializeAsaasService(config: AsaasConfig): AsaasRealService {
  asaasService = new AsaasRealService(config);
  return asaasService;
}

/**
 * Obter instância do serviço
 */
export function getAsaasService(): AsaasRealService {
  if (!asaasService) {
    throw new Error("Asaas service não inicializado");
  }
  return asaasService;
}
