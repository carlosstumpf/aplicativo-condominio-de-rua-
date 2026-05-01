import { Router, Request, Response } from "express";
import { validateWebhookSignature, processAsaasWebhook, logWebhookEvent } from "./webhook-handler";
import { AsaasWebhookPayload } from "./webhook-handler";

const webhookRouter = Router();

/**
 * Webhook endpoint for Asaas payment events
 * POST /api/webhooks/asaas
 */
webhookRouter.post("/asaas", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["asaas-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    // Validate webhook signature
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || "test-secret";

    if (!validateWebhookSignature(rawBody, signature || "", webhookSecret)) {
      console.warn("Invalid webhook signature received");
      // Still acknowledge the webhook to prevent retries
      return res.status(200).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const payload: AsaasWebhookPayload = req.body;

    // Process the webhook
    const result = await processAsaasWebhook(payload);

    // Log the webhook event
    await logWebhookEvent(
      payload.event,
      payload,
      result.success ? "success" : "failed",
      result.success ? undefined : result.message
    );

    // Return success response
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook endpoint error:", message);

    // Log the error
    await logWebhookEvent(
      req.body?.event || "unknown",
      req.body,
      "failed",
      message
    );

    // Return error response but with 200 status to prevent Asaas retries
    res.status(200).json({
      success: false,
      message: `Error processing webhook: ${message}`,
    });
  }
});

/**
 * Health check endpoint for webhooks
 * GET /api/webhooks/health
 */
webhookRouter.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Webhook endpoint is running",
    timestamp: new Date(),
  });
});

/**
 * Test webhook endpoint for development
 * POST /api/webhooks/test
 */
webhookRouter.post("/test", async (req: Request, res: Response) => {
  try {
    const payload: AsaasWebhookPayload = req.body;

    // Process the test webhook
    const result = await processAsaasWebhook(payload);

    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Test webhook error:", message);

    res.status(500).json({
      success: false,
      message: `Error processing test webhook: ${message}`,
    });
  }
});

export { webhookRouter };
