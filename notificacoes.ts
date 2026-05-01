import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";

export const notificacoesRouter = router({
  /**
   * List notifications with filters
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        tipo: z.enum(["PAGAMENTO", "VENCIMENTO", "CHAMADO", "TODOS"]).optional(),
        lidas: z.enum(["lidas", "naoLidas", "todas"]).default("todas"),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const filtros: any = {
          page: input.page,
          limit: input.limit,
          userId: ctx.user?.id,
        };

        if (input.tipo && input.tipo !== "TODOS") filtros.tipo = input.tipo;
        if (input.lidas === "lidas") filtros.lida = true;
        if (input.lidas === "naoLidas") filtros.lida = false;

        const result = await db.getNotificacoes(filtros);
        return {
          success: true,
          data: Array.isArray(result) ? result : (result as any)?.data || [],
          pagination: !Array.isArray(result) ? (result as any)?.pagination : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to list notifications";
        throw new Error(message);
      }
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const count = await db.getUnreadNotificationsCount(ctx.user?.id || 0);
      return {
        success: true,
        count,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get unread count";
      throw new Error(message);
    }
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const notificacao = await db.markNotificacaoAsRead(input.id);
        return {
          success: true,
          notificacao,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to mark as read";
        throw new Error(message);
      }
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db.markAllNotificacoesAsRead(ctx.user?.id || 0);
      return {
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to mark all as read";
      throw new Error(message);
    }
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await db.deleteNotificacao(input.id);
        return {
          success: true,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete notification";
        throw new Error(message);
      }
    }),

  /**
   * Delete all notifications
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db.deleteAllNotificacoes(ctx.user?.id || 0);
      return {
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete all notifications";
      throw new Error(message);
    }
  }),

  /**
   * Create notification (for testing/manual creation)
   */
  create: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(["PAGAMENTO", "VENCIMENTO", "CHAMADO"]),
        titulo: z.string().min(5).max(100),
        mensagem: z.string().min(10).max(500),
        referenceId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const notificacao = await db.createNotificacao({
          userId: ctx.user?.id || 0,
          tipo: input.tipo,
          titulo: input.titulo,
          mensagem: input.mensagem,
          referenceId: input.referenceId,
          lida: false,
        });

        return {
          success: true,
          notificacao,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create notification";
        throw new Error(message);
      }
    }),

  /**
   * Get notifications by type
   */
  getByType: protectedProcedure
    .input(z.object({ tipo: z.enum(["PAGAMENTO", "VENCIMENTO", "CHAMADO"]) }))
    .query(async ({ input, ctx }) => {
      try {
        const notificacoes = await db.getNotificacoesByType(ctx.user?.id || 0, input.tipo);
        return {
          success: true,
          data: notificacoes,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get notifications by type";
        throw new Error(message);
      }
    }),

  /**
   * Get statistics
   */
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await db.getNotificacoesStatistics(ctx.user?.id || 0);
      return {
        success: true,
        stats,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get statistics";
      throw new Error(message);
    }
  }),
});
