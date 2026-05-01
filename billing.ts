/**
 * Billing Router
 * tRPC endpoints for billing operations
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  getMoradorBillings,
  getMoradorBillingStats,
  getUpcomingBillings,
  createBillingSchedule,
} from "@/server/_core/billing-schedule-db";
import {
  generatePayment,
  getPaymentStatus,
  formatPixPayment,
  formatBoletoPayment,
  formatBankTransferPayment,
  createPaymentRecord,
} from "@/server/_core/billing-asaas-integration";
import {
  sendBillingReminders,
  sendOverdueNotifications,
  getBillingNotificationSchedulerStatus,
  startBillingNotificationScheduler,
  stopBillingNotificationScheduler,
} from "@/server/_core/billing-notification-service";

export const billingRouter = router({
  /**
   * Get billing information for current user
   */
  getMoradorBillings: publicProcedure
    .input(
      z.object({
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      // TODO: Get morador ID from user
      const moradorId = ctx.user.id;

      const billings = await getMoradorBillings(moradorId, {
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        billings,
        total: billings.length,
      };
    }),

  /**
   * Get billing statistics
   */
  getBillingStats: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new Error("Unauthorized");
    }

    const moradorId = ctx.user.id;
    const stats = await getMoradorBillingStats(moradorId);

    return stats;
  }),

  /**
   * Get upcoming billings (next 30 days)
   */
  getUpcomingBillings: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new Error("Unauthorized");
    }

    const moradorId = ctx.user.id;
    const billings = await getUpcomingBillings(moradorId);

    return billings;
  }),

  /**
   * Generate payment for billing
   */
  generatePayment: publicProcedure
    .input(
      z.object({
        billingId: z.number(),
        method: z.enum(["pix", "boleto", "transfer"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error("Unauthorized");
      }

      try {
        // TODO: Get customer ID from Asaas
        const customerId = `COND-${ctx.user.id}`;

        const paymentData = await generatePayment(input.billingId, customerId, input.method);

        // Create payment record
        await createPaymentRecord(input.billingId, paymentData);

        // Format response based on method
        let formattedPayment = "";
        switch (input.method) {
          case "pix":
            formattedPayment = formatPixPayment(paymentData);
            break;
          case "boleto":
            formattedPayment = formatBoletoPayment(paymentData);
            break;
          case "transfer":
            formattedPayment = formatBankTransferPayment(paymentData);
            break;
        }

        return {
          success: true,
          paymentId: paymentData.paymentId,
          method: input.method,
          amount: paymentData.amount,
          dueDate: paymentData.dueDate,
          pixQrCode: paymentData.pixQrCode,
          pixCopyPaste: paymentData.pixCopyPaste,
          boletoBarcode: paymentData.boletoBarcode,
          boletoUrl: paymentData.boletoUrl,
          bankDetails: paymentData.bankDetails,
          formattedPayment,
        };
      } catch (error) {
        console.error("Error generating payment:", error);
        throw new Error(
          `Failed to generate payment: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get payment status
   */
  getPaymentStatus: publicProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const status = await getPaymentStatus(input.paymentId);
        return status;
      } catch (error) {
        console.error("Error getting payment status:", error);
        throw new Error(
          `Failed to get payment status: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Send billing reminders (admin only)
   */
  sendBillingReminders: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.isAdmin) {
      throw new Error("Unauthorized - Admin only");
    }

    try {
      const result = await sendBillingReminders();
      return result;
    } catch (error) {
      console.error("Error sending billing reminders:", error);
      throw new Error(
        `Failed to send reminders: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Send overdue notifications (admin only)
   */
  sendOverdueNotifications: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.isAdmin) {
      throw new Error("Unauthorized - Admin only");
    }

    try {
      const result = await sendOverdueNotifications();
      return result;
    } catch (error) {
      console.error("Error sending overdue notifications:", error);
      throw new Error(
        `Failed to send notifications: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Get billing notification scheduler status (admin only)
   */
  getSchedulerStatus: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.isAdmin) {
      throw new Error("Unauthorized - Admin only");
    }

    try {
      const status = await getBillingNotificationSchedulerStatus();
      return status;
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      throw new Error(
        `Failed to get scheduler status: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Start billing notification scheduler (admin only)
   */
  startScheduler: publicProcedure
    .input(z.object({ intervalMs: z.number().min(60000).default(3600000) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.isAdmin) {
        throw new Error("Unauthorized - Admin only");
      }

      try {
        startBillingNotificationScheduler(input.intervalMs);
        return { success: true, message: "Billing scheduler started" };
      } catch (error) {
        console.error("Error starting scheduler:", error);
        throw new Error(
          `Failed to start scheduler: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Stop billing notification scheduler (admin only)
   */
  stopScheduler: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.isAdmin) {
      throw new Error("Unauthorized - Admin only");
    }

    try {
      stopBillingNotificationScheduler();
      return { success: true, message: "Billing scheduler stopped" };
    } catch (error) {
      console.error("Error stopping scheduler:", error);
      throw new Error(
        `Failed to stop scheduler: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }),

  /**
   * Create billing schedule (admin only)
   */
  createBilling: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        dueDate: z.date(),
        amount: z.number().min(0.01),
        description: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.isAdmin) {
        throw new Error("Unauthorized - Admin only");
      }

      try {
        const billing = await createBillingSchedule({
          moradorId: input.moradorId,
          dueDate: input.dueDate,
          amount: input.amount,
          description: input.description,
        });

        return {
          success: true,
          billing,
        };
      } catch (error) {
        console.error("Error creating billing:", error);
        throw new Error(
          `Failed to create billing: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
