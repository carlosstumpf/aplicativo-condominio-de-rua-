/**
 * Webhooks Router
 * tRPC endpoints for managing Asaas webhooks
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as AsaasAdapter from "../_core/asaas-adapter";

export const webhooksRouter = router({
  /**
   * Register a webhook with Asaas
   * Only available when using real Asaas API
   */
  register: publicProcedure
    .input(
      z.object({
        url: z.string().url("URL inválida"),
        events: z.array(z.string()).min(1, "Pelo menos um evento deve ser selecionado"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!AsaasAdapter.isUsingRealAsaas()) {
          throw new Error("Webhook registration only available with real Asaas API");
        }

        const result = await AsaasAdapter.registerWebhook(input.url, input.events);

        return {
          success: true,
          webhook: result,
          message: "Webhook registrado com sucesso",
        };
      } catch (error: any) {
        throw new Error(`Falha ao registrar webhook: ${error.message}`);
      }
    }),

  /**
   * List all registered webhooks
   */
  list: publicProcedure.query(async () => {
    try {
      if (!AsaasAdapter.isUsingRealAsaas()) {
        return {
          webhooks: [],
          message: "Usando API mock - webhooks não disponíveis",
        };
      }

      const webhooks = await AsaasAdapter.listWebhooks();

      return {
        webhooks,
        total: webhooks.length,
        message: "Webhooks listados com sucesso",
      };
    } catch (error: any) {
      throw new Error(`Falha ao listar webhooks: ${error.message}`);
    }
  }),

  /**
   * Delete a webhook
   */
  delete: publicProcedure
    .input(
      z.object({
        webhookId: z.string().min(1, "ID do webhook é obrigatório"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (!AsaasAdapter.isUsingRealAsaas()) {
          throw new Error("Webhook deletion only available with real Asaas API");
        }

        await AsaasAdapter.deleteWebhook(input.webhookId);

        return {
          success: true,
          message: "Webhook deletado com sucesso",
        };
      } catch (error: any) {
        throw new Error(`Falha ao deletar webhook: ${error.message}`);
      }
    }),

  /**
   * Get webhook configuration status
   */
  getStatus: publicProcedure.query(async () => {
    const isUsingReal = AsaasAdapter.isUsingRealAsaas();
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
    const webhookUrl = process.env.ASAAS_WEBHOOK_URL;
    const environment = process.env.ASAAS_ENVIRONMENT || "sandbox";

    return {
      usingRealApi: isUsingReal,
      environment,
      webhookConfigured: !!webhookSecret,
      webhookUrl: webhookUrl || "Not configured",
      apiKeyConfigured: !!process.env.ASAAS_API_KEY,
      recommendedWebhookUrl: `${process.env.APP_URL || "https://seu-dominio.com"}/api/webhooks/asaas`,
      events: [
        "payment.pending",
        "payment.confirmed",
        "payment.received",
        "payment.overdue",
        "payment.refunded",
        "payment.deleted",
        "payment.chargeback_requested",
        "payment.chargeback_dispute",
        "payment.chargeback_reversal",
        "payment.anticipation_received",
        "payment.anticipation_confirmed",
        "payment.anticipation_cancelled",
        "payment.settlement_received",
      ],
    };
  }),

  /**
   * Test webhook connection
   */
  test: publicProcedure.mutation(async () => {
    try {
      // Simulate a webhook test by making a request to the test endpoint
      const testUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/webhooks/test`;

      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "payment.received",
          payment: {
            id: "pay_test_" + Date.now(),
            customer: "cus_test_123",
            billingType: "PIX",
            value: 100.0,
            status: "RECEIVED",
            dueDate: new Date().toISOString().split("T")[0],
            description: "Test payment",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Test webhook failed with status ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: "Webhook de teste processado com sucesso",
        result,
      };
    } catch (error: any) {
      throw new Error(`Falha no teste de webhook: ${error.message}`);
    }
  }),

  /**
   * Get webhook events documentation
   */
  getEventsDocs: publicProcedure.query(async () => {
    return {
      events: [
        {
          name: "payment.pending",
          description: "Cobrança criada e aguardando pagamento",
          triggerCondition: "Quando uma cobrança é criada",
        },
        {
          name: "payment.confirmed",
          description: "Cobrança confirmada pelo cliente",
          triggerCondition: "Quando o cliente confirma o pagamento",
        },
        {
          name: "payment.received",
          description: "Pagamento recebido e confirmado",
          triggerCondition: "Quando o banco confirma o recebimento",
        },
        {
          name: "payment.overdue",
          description: "Cobrança vencida sem pagamento",
          triggerCondition: "Quando a data de vencimento passa",
        },
        {
          name: "payment.refunded",
          description: "Pagamento reembolsado",
          triggerCondition: "Quando um reembolso é processado",
        },
        {
          name: "payment.deleted",
          description: "Cobrança cancelada",
          triggerCondition: "Quando uma cobrança é deletada",
        },
        {
          name: "payment.chargeback_requested",
          description: "Chargeback solicitado",
          triggerCondition: "Quando um chargeback é aberto",
        },
        {
          name: "payment.chargeback_dispute",
          description: "Chargeback em disputa",
          triggerCondition: "Durante o processo de disputa",
        },
        {
          name: "payment.chargeback_reversal",
          description: "Chargeback revertido",
          triggerCondition: "Quando o chargeback é revertido",
        },
      ],
      documentation: {
        signatureValidation: "Use HMAC-SHA256 com a chave secreta do webhook",
        retryPolicy: "Asaas retenta 5 vezes em caso de falha",
        timeout: "30 segundos por requisição",
        headers: {
          "asaas-signature": "HMAC-SHA256 signature",
          "content-type": "application/json",
        },
      },
    };
  }),
});
