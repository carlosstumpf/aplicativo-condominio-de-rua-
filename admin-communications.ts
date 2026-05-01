/**
 * Admin Communication System Router
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  createCommunicationTemplate,
  getCommunicationTemplates,
  createCommunication,
  getCommunication,
  getCommunications,
  createCommunicationLog,
  getCommunicationLogs,
  updateCommunicationStatus,
  updateCommunicationStats,
  getScheduledCommunications,
  getCommunicationStatistics,
} from "@/server/_core/admin-communications-db";

export const adminCommunicationsRouter = router({
  /**
   * Create communication template
   */
  createTemplate: publicProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
        tipo: z.enum(["whatsapp", "app", "ambos"]),
        conteudo: z.string().min(1),
        variaveis: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      return await createCommunicationTemplate(input);
    }),

  /**
   * Get all communication templates
   */
  getTemplates: publicProcedure.query(async () => {
    return await getCommunicationTemplates();
  }),

  /**
   * Create communication
   */
  create: publicProcedure
    .input(
      z.object({
        titulo: z.string().min(1),
        conteudo: z.string().min(1),
        tipo: z.enum(["whatsapp", "app", "email"]),
        destinatarios: z.enum(["todos", "selecionados", "por_filtro"]),
        moradorIds: z.array(z.number()).optional(),
        filtro: z.record(z.any()).optional(),
        agendado: z.boolean(),
        dataAgendamento: z.date().optional(),
        templateId: z.number().optional(),
        totalDestinatarios: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await createCommunication(input);
    }),

  /**
   * Get communication by ID
   */
  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await getCommunication(input.id);
  }),

  /**
   * Get all communications
   */
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        tipo: z.string().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getCommunications(input);
    }),

  /**
   * Create communication log entry
   */
  createLog: publicProcedure
    .input(
      z.object({
        comunicacaoId: z.number(),
        moradorId: z.number(),
        tipo: z.enum(["whatsapp", "app", "email"]),
        status: z.enum(["pendente", "enviado", "erro"]),
        mensagem: z.string().optional(),
        erro: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createCommunicationLog(input);
    }),

  /**
   * Get communication logs
   */
  getLogs: publicProcedure
    .input(z.object({ comunicacaoId: z.number() }))
    .query(async ({ input }) => {
      return await getCommunicationLogs(input.comunicacaoId);
    }),

  /**
   * Update communication status
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["rascunho", "agendado", "enviado", "erro"]),
      })
    )
    .mutation(async ({ input }) => {
      return await updateCommunicationStatus(input.id, input.status);
    }),

  /**
   * Update communication statistics
   */
  updateStats: publicProcedure
    .input(
      z.object({
        id: z.number(),
        enviados: z.number(),
        erros: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await updateCommunicationStats(input.id, input.enviados, input.erros);
    }),

  /**
   * Get scheduled communications ready to send
   */
  getScheduled: publicProcedure.query(async () => {
    return await getScheduledCommunications();
  }),

  /**
   * Get communication statistics
   */
  getStatistics: publicProcedure.query(async () => {
    return await getCommunicationStatistics();
  }),
});
