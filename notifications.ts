/**
 * Notifications tRPC Router
 * Provides API endpoints for notification management
 */

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  createNotificacao,
  getNotificacoes,
  marcarComoLida,
  arquivarNotificacao,
  getNotificacoesNaoLidas,
  criarTarefaPendente,
  getTarefasPendentes,
  completarTarefa,
  getNotificacaoStats,
  rastrearEntrega,
  getPreferencias,
  atualizarPreferencias,
} from "../_core/notifications-db";

export const notificationsRouter = router({
  /**
   * Create notification
   */
  create: publicProcedure
    .input(
      z.object({
        adminId: z.number(),
        titulo: z.string(),
        descricao: z.string().optional(),
        tipo: z.enum([
          "tarefa",
          "mensagem",
          "alerta",
          "pagamento",
          "despesa",
          "comunicado",
        ]),
        prioridade: z
          .enum(["baixa", "normal", "alta", "crítica"])
          .optional()
          .default("normal"),
        acao: z.string().optional(),
        dados: z.record(z.any()).optional(),
        expiradoEm: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createNotificacao(input);
    }),

  /**
   * Get notifications for admin
   */
  list: publicProcedure
    .input(
      z.object({
        adminId: z.number(),
        status: z.string().optional(),
        tipo: z.string().optional(),
        prioridade: z.string().optional(),
        limite: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      return await getNotificacoes(input.adminId, {
        status: input.status,
        tipo: input.tipo,
        prioridade: input.prioridade,
        limite: input.limite,
        offset: input.offset,
      });
    }),

  /**
   * Mark notification as read
   */
  markAsRead: publicProcedure
    .input(z.object({ notificacaoId: z.number() }))
    .mutation(async ({ input }) => {
      return await marcarComoLida(input.notificacaoId);
    }),

  /**
   * Archive notification
   */
  archive: publicProcedure
    .input(z.object({ notificacaoId: z.number() }))
    .mutation(async ({ input }) => {
      return await arquivarNotificacao(input.notificacaoId);
    }),

  /**
   * Get unread count
   */
  unreadCount: publicProcedure
    .input(z.object({ adminId: z.number() }))
    .query(async ({ input }) => {
      return await getNotificacoesNaoLidas(input.adminId);
    }),

  /**
   * Create pending task
   */
  createTask: publicProcedure
    .input(
      z.object({
        titulo: z.string(),
        descricao: z.string().optional(),
        tipo: z.enum([
          "cobranca",
          "despesa_pendente",
          "comunicado",
          "manutencao",
        ]),
        prioridade: z
          .enum(["baixa", "normal", "alta"])
          .optional()
          .default("normal"),
        recursoTipo: z.string().optional(),
        recursoId: z.number().optional(),
        atribuidoA: z.number().optional(),
        dataVencimento: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await criarTarefaPendente(input);
    }),

  /**
   * Get pending tasks
   */
  listTasks: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        prioridade: z.string().optional(),
        atribuidoA: z.number().optional(),
        tipo: z.string().optional(),
        limite: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      return await getTarefasPendentes({
        status: input.status,
        prioridade: input.prioridade,
        atribuidoA: input.atribuidoA,
        tipo: input.tipo,
        limite: input.limite,
      });
    }),

  /**
   * Complete task
   */
  completeTask: publicProcedure
    .input(z.object({ tarefaId: z.number() }))
    .mutation(async ({ input }) => {
      return await completarTarefa(input.tarefaId);
    }),

  /**
   * Get notification statistics
   */
  stats: publicProcedure
    .input(z.object({ adminId: z.number() }))
    .query(async ({ input }) => {
      return await getNotificacaoStats(input.adminId);
    }),

  /**
   * Track notification delivery
   */
  trackDelivery: publicProcedure
    .input(
      z.object({
        notificacaoId: z.number(),
        canal: z.enum(["push", "email", "whatsapp", "in_app"]),
        status: z.enum(["pendente", "enviada", "entregue", "falhou"]),
        erro: z.string().optional(),
        resposta: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await rastrearEntrega(input);
    }),

  /**
   * Get notification preferences
   */
  getPreferences: publicProcedure
    .input(z.object({ adminId: z.number() }))
    .query(async ({ input }) => {
      return await getPreferencias(input.adminId);
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: publicProcedure
    .input(
      z.object({
        adminId: z.number(),
        tipo: z.string(),
        pushHabilitado: z.boolean().optional(),
        emailHabilitado: z.boolean().optional(),
        whatsappHabilitado: z.boolean().optional(),
        silencioAte: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { adminId, tipo, ...data } = input;
      return await atualizarPreferencias(adminId, tipo, data);
    }),

  /**
   * Bulk create notifications (for system events)
   */
  bulkCreate: publicProcedure
    .input(
      z.object({
        notificacoes: z.array(
          z.object({
            adminId: z.number(),
            titulo: z.string(),
            descricao: z.string().optional(),
            tipo: z.string(),
            prioridade: z.string().optional(),
            acao: z.string().optional(),
            dados: z.record(z.any()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.notificacoes.map((notif) => createNotificacao(notif))
      );
      return {
        total: input.notificacoes.length,
        criadas: results.filter((r) => r !== null).length,
        falhadas: results.filter((r) => r === null).length,
      };
    }),

  /**
   * Mark all as read for admin
   */
  markAllAsRead: publicProcedure
    .input(z.object({ adminId: z.number() }))
    .mutation(async ({ input }) => {
      const notificacoes = await getNotificacoes(input.adminId, {
        status: "nao_lida",
      });

      const results = await Promise.all(
        notificacoes.map((n) => marcarComoLida(n.id))
      );

      return {
        total: notificacoes.length,
        atualizadas: results.filter((r) => r !== null).length,
      };
    }),
});
