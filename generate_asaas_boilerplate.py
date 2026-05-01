#!/usr/bin/env python3
"""
Generate Asaas webhook integration boilerplate code.

Usage:
    python generate_asaas_boilerplate.py <project_path> [--mock-only]

Example:
    python generate_asaas_boilerplate.py /home/ubuntu/my-app
    python generate_asaas-boilerplate.py /home/ubuntu/my-app --mock-only
"""

import os
import sys
import argparse
from pathlib import Path


def generate_adapter_file(project_path: str) -> str:
    """Generate asaas-adapter.ts"""
    return '''/**
 * Asaas API Adapter
 * Switches between real and mock implementations based on environment
 */

import { AsaasRealClient } from "./asaas-real";
import { AsaasMockClient } from "./asaas-mock";

export type AsaasClient = AsaasRealClient | AsaasMockClient;

/**
 * Get Asaas client based on environment
 * Uses real client if ASAAS_API_KEY is set, otherwise uses mock
 */
export function getAsaasClient(): AsaasClient {
  const apiKey = process.env.ASAAS_API_KEY;

  if (apiKey && apiKey.startsWith("aac_")) {
    console.log("[Asaas] Using real API client");
    return new AsaasRealClient(apiKey);
  }

  console.log("[Asaas] Using mock client (set ASAAS_API_KEY to use real API)");
  return new AsaasMockClient();
}

export const asaasClient = getAsaasClient();
'''


def generate_webhook_handler_file(project_path: str) -> str:
    """Generate asaas-webhook-handler.ts"""
    return '''/**
 * Asaas Webhook Handler
 * Processes webhook events from Asaas
 */

import { logWebhookEvent, updatePaymentStatus } from "./asaas-webhook-db";

export interface WebhookData {
  event: string;
  data: Record<string, any>;
  timestamp: string;
}

/**
 * Process webhook event
 */
export async function processWebhookEvent(
  event: string,
  data: Record<string, any>
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log(`[Webhook] Processing event: ${event}`);

    // Extract IDs
    const paymentId = data.id || data.paymentId;
    const customerId = data.customer?.id || data.customerId;

    if (!paymentId) {
      throw new Error("Missing payment ID in webhook data");
    }

    // Map Asaas status to internal status
    const status = mapAsaasStatus(data.status);

    // Update database
    await updatePaymentStatus(paymentId, status, data);

    // Log event
    await logWebhookEvent({
      event,
      asaasPaymentId: paymentId,
      asaasCustomerId: customerId,
      status,
      success: true,
      payload: JSON.stringify(data),
    });

    console.log(`[Webhook] Event processed successfully: ${event}`);

    return {
      success: true,
      message: `Event ${event} processed successfully`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Webhook] Error processing event: ${errorMessage}`);

    // Log failed event
    await logWebhookEvent({
      event,
      asaasPaymentId: data.id || data.paymentId || "unknown",
      asaasCustomerId: data.customer?.id || data.customerId,
      status: "error",
      success: false,
      errorMessage,
      payload: JSON.stringify(data),
    });

    return {
      success: false,
      message: `Error processing event: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Map Asaas payment status to internal status
 */
function mapAsaasStatus(asaasStatus: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "pending",
    RECEIVED: "received",
    CONFIRMED: "confirmed",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
    RECEIVED_IN_CASH: "received",
    CHARGEBACK: "chargeback",
  };

  return statusMap[asaasStatus] || asaasStatus.toLowerCase();
}

/**
 * Get event type category
 */
export function getEventCategory(
  event: string
): "payment" | "notification" | "other" {
  if (event.startsWith("payment.")) return "payment";
  if (event.startsWith("notification.")) return "notification";
  return "other";
}

/**
 * Check if event is critical
 */
export function isCriticalEvent(event: string): boolean {
  const criticalEvents = [
    "payment.received",
    "payment.overdue",
    "payment.cancelled",
    "payment.chargeback",
  ];
  return criticalEvents.includes(event);
}
'''


def generate_webhook_endpoint_file(project_path: str) -> str:
    """Generate asaas-webhook-endpoint.ts"""
    return '''/**
 * Asaas Webhook Endpoint
 * HTTP endpoint for receiving webhooks from Asaas
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { processWebhookEvent } from "./asaas-webhook-handler";

const router = Router();

/**
 * Validate webhook signature
 */
function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

/**
 * POST /webhooks/asaas
 * Receive webhook from Asaas
 */
router.post("/webhooks/asaas", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-asaas-signature"] as string;
    const secret = process.env.ASAAS_WEBHOOK_SECRET;

    if (!secret) {
      console.warn("[Webhook] ASAAS_WEBHOOK_SECRET not configured");
      return res.status(400).json({ error: "Webhook secret not configured" });
    }

    if (!signature) {
      console.warn("[Webhook] Missing signature header");
      return res.status(401).json({ error: "Missing signature" });
    }

    // Validate signature
    const body = JSON.stringify(req.body);
    if (!validateWebhookSignature(body, signature, secret)) {
      console.warn("[Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Process webhook
    const { event, data, timestamp } = req.body;

    if (!event || !data) {
      console.warn("[Webhook] Missing event or data");
      return res.status(400).json({ error: "Missing event or data" });
    }

    const result = await processWebhookEvent(event, data);

    // Return 200 OK immediately (async processing)
    res.status(200).json({ success: true, message: "Webhook received" });

    // Log result
    if (!result.success) {
      console.error(`[Webhook] Processing failed: ${result.error}`);
    }
  } catch (error) {
    console.error("[Webhook] Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /webhooks/asaas/health
 * Health check endpoint
 */
router.get("/webhooks/asaas/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
'''


def generate_env_example_file(project_path: str) -> str:
    """Generate .env.example"""
    return '''# Asaas API Configuration

# Test Environment (Sandbox)
# ASAAS_API_KEY=aac_test_...
# ASAAS_WEBHOOK_SECRET=test_secret_...
# ASAAS_BASE_URL=https://sandbox.asaas.com/v3

# Production Environment
# ASAAS_API_KEY=aac_prod_...
# ASAAS_WEBHOOK_SECRET=prod_secret_...
# ASAAS_BASE_URL=https://api.asaas.com/v3

# Webhook Configuration
# WEBHOOK_URL=https://yourdomain.com/api/webhooks/asaas
'''


def generate_files(project_path: str, mock_only: bool = False) -> None:
    """Generate all boilerplate files"""

    # Create server/_core directory if it doesn't exist
    core_dir = Path(project_path) / "server" / "_core"
    core_dir.mkdir(parents=True, exist_ok=True)

    files = {
        "asaas-adapter.ts": generate_adapter_file(project_path),
        "asaas-webhook-handler.ts": generate_webhook_handler_file(project_path),
        "asaas-webhook-endpoint.ts": generate_webhook_endpoint_file(project_path),
    }

    # Generate files
    for filename, content in files.items():
        filepath = core_dir / filename
        if filepath.exists():
            print(f"⏭️  Skipping {filename} (already exists)")
        else:
            filepath.write_text(content)
            print(f"✅ Created {filename}")

    # Create .env.example
    env_file = Path(project_path) / ".env.example"
    env_content = generate_env_example_file(project_path)
    if env_file.exists():
        print("⏭️  Skipping .env.example (already exists)")
    else:
        env_file.write_text(env_content)
        print("✅ Created .env.example")

    print("\n📋 Next steps:")
    print("1. Review generated files in server/_core/")
    print("2. Implement asaas-real.ts with actual API calls")
    print("3. Implement asaas-webhook-db.ts with database operations")
    print("4. Register webhook endpoint in your Express app")
    print("5. Set ASAAS_API_KEY and ASAAS_WEBHOOK_SECRET in .env")
    print("6. Test webhook with Asaas sandbox")


def main():
    parser = argparse.ArgumentParser(
        description="Generate Asaas webhook integration boilerplate"
    )
    parser.add_argument("project_path", help="Path to project root")
    parser.add_argument(
        "--mock-only", action="store_true", help="Only generate mock client"
    )

    args = parser.parse_args()

    if not Path(args.project_path).exists():
        print(f"❌ Project path does not exist: {args.project_path}")
        sys.exit(1)

    print(f"🚀 Generating Asaas boilerplate in {args.project_path}")
    generate_files(args.project_path, args.mock_only)
    print("\n✨ Boilerplate generation complete!")


if __name__ == "__main__":
    main()
