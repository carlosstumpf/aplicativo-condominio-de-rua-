/**
 * Asaas Webhook Endpoint
 * Express routes for receiving and processing Asaas webhooks
 */

import { Router, Request, Response } from "express";
import {
  validateWebhookSignature,
  processWebhookEvent,
  parseWebhookPayload,
  getWebhookSignature,
  isValidWebhookPayload,
} from "./asaas-webhook-handler";
import {
  handlePaymentStatusUpdate,
  handlePaymentNotification,
  logWebhookEvent,
  mapAsaasStatusToCobrancaStatus,
} from "./asaas-webhook-db";

export function createAsaasWebhookRouter() {
  const router = Router();

  /**
   * POST /api/webhooks/asaas
   * Receive webhook from Asaas
   */
  router.post("/asaas", async (req: Request, res: Response) => {
    try {
      const signature = getWebhookSignature(req.headers as Record<string, any>);
      const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

      // Log webhook receipt
      console.log("[Asaas Webhook] Received event:", {
        timestamp: new Date().toISOString(),
        event: req.body?.event,
        paymentId: req.body?.payment?.id,
        hasSignature: !!signature,
      });

      // Validate signature if secret is configured
      if (webhookSecret && signature) {
        const rawBody = JSON.stringify(req.body);
        const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);

        if (!isValid) {
          console.warn("[Asaas Webhook] Invalid signature");
          return res.status(401).json({ error: "Invalid signature" });
        }
      } else if (webhookSecret && !signature) {
        console.warn("[Asaas Webhook] Missing signature");
        return res.status(401).json({ error: "Missing signature" });
      }

      // Parse and validate payload
      const payload = parseWebhookPayload(req.body);
      if (!payload || !isValidWebhookPayload(payload)) {
        console.error("[Asaas Webhook] Invalid payload structure");
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Process webhook event with database operations
      const result = await processWebhookEvent(payload, {
        updatePaymentStatus: async (paymentId: string, status: string) => {
          const updateResult = await handlePaymentStatusUpdate(
            paymentId,
            status,
            payload.payment
          );
          if (!updateResult.success) {
            console.error(
              `[Asaas Webhook] Failed to update payment status: ${updateResult.error}`
            );
          }
        },
        createNotification: async (data) => {
          const notificationResult = await handlePaymentNotification(
            payload.payment.id,
            payload.event,
            payload.payment
          );
          if (!notificationResult.success) {
            console.error(
              `[Asaas Webhook] Failed to create notification: ${notificationResult.error}`
            );
          }
        },
        logWebhookEvent: async (event, paymentId, status) => {
          await logWebhookEvent(event, paymentId, status, payload.payment);
        },
      });

      // Always return 200 to prevent Asaas from retrying
      res.status(200).json({
        success: result.success,
        event: result.event,
        paymentId: result.paymentId,
        statusUpdated: result.statusUpdated,
        notificationCreated: result.notificationCreated,
      });

      if (!result.success) {
        console.error("[Asaas Webhook] Processing failed:", result.error);
      }
    } catch (error: any) {
      console.error("[Asaas Webhook] Error processing webhook:", error);
      // Always return 200 to prevent Asaas from retrying
      res.status(200).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/webhooks/health
   * Health check endpoint
   */
  router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      webhookConfigured: !!process.env.ASAAS_WEBHOOK_SECRET,
    });
  });

  /**
   * POST /api/webhooks/test
   * Test webhook endpoint (for development)
   */
  router.post("/test", async (req: Request, res: Response) => {
    try {
      const testPayload = {
        event: "payment.received" as const,
        payment: {
          id: "pay_test_" + Date.now(),
          customer: "cus_test_123",
          billingType: "PIX" as const,
          value: 100.0,
          status: "RECEIVED",
          dueDate: new Date().toISOString().split("T")[0],
          description: "Test payment",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          receivedDate: new Date().toISOString(),
        },
        timestamp: Date.now(),
      };

      const result = await processWebhookEvent(testPayload, {
        updatePaymentStatus: async (paymentId: string, status: string) => {
          console.log(`[Test Webhook] Would update payment ${paymentId} to ${status}`);
        },
        createNotification: async (data) => {
          console.log(`[Test Webhook] Would create notification:`, data);
        },
      });

      res.status(200).json({
        success: true,
        message: "Test webhook processed successfully",
        result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  return router;
}
