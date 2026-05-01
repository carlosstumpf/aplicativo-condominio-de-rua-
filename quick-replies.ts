/**
 * tRPC Router - Quick Replies
 */

import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import { getQuickRepliesService } from "@/server/_core/quick-replies-service";

export const quickRepliesRouter = router({
  /**
   * Criar template
   */
  createTemplate: publicProcedure
    .input(
      z.object({
        condominiumId: z.string(),
        title: z.string(),
        content: z.string(),
        category: z.string(),
        emoji: z.string().optional(),
        shortcut: z.string().optional(),
        createdBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.createTemplate(input);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao criar template",
        };
      }
    }),

  /**
   * Listar templates
   */
  listTemplates: publicProcedure
    .input(z.object({ condominiumId: z.string() }))
    .query(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.listTemplates(input.condominiumId);
        return result;
      } catch (error) {
        return {
          success: false,
          templates: [],
          error: error instanceof Error ? error.message : "Erro ao listar templates",
        };
      }
    }),

  /**
   * Atualizar template
   */
  updateTemplate: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        emoji: z.string().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.updateTemplate(input.id, input);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao atualizar template",
        };
      }
    }),

  /**
   * Deletar template
   */
  deleteTemplate: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.deleteTemplate(input.id);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao deletar template",
        };
      }
    }),

  /**
   * Registrar uso
   */
  recordUsage: publicProcedure
    .input(
      z.object({
        templateId: z.string(),
        conversationId: z.string(),
        moradorPhone: z.string(),
        moradorName: z.string(),
        responseTime: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.recordUsage(input);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao registrar uso",
        };
      }
    }),

  /**
   * Obter templates mais usados
   */
  getMostUsed: publicProcedure
    .input(z.object({ condominiumId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const templates = await service.getMostUsed(input.condominiumId, input.limit);
        return {
          success: true,
          templates,
        };
      } catch (error) {
        return {
          success: false,
          templates: [],
          error: error instanceof Error ? error.message : "Erro ao obter templates",
        };
      }
    }),

  /**
   * Obter templates por categoria
   */
  getByCategory: publicProcedure
    .input(z.object({ condominiumId: z.string(), category: z.string() }))
    .query(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const templates = await service.getByCategory(input.condominiumId, input.category);
        return {
          success: true,
          templates,
        };
      } catch (error) {
        return {
          success: false,
          templates: [],
          error: error instanceof Error ? error.message : "Erro ao obter templates",
        };
      }
    }),

  /**
   * Buscar templates
   */
  search: publicProcedure
    .input(z.object({ condominiumId: z.string(), query: z.string() }))
    .query(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const templates = await service.search(input.condominiumId, input.query);
        return {
          success: true,
          templates,
        };
      } catch (error) {
        return {
          success: false,
          templates: [],
          error: error instanceof Error ? error.message : "Erro ao buscar templates",
        };
      }
    }),

  /**
   * Obter estatísticas
   */
  getStats: publicProcedure
    .input(z.object({ condominiumId: z.string() }))
    .query(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const stats = await service.getStats(input.condominiumId);
        return {
          success: true,
          ...stats,
        };
      } catch (error) {
        return {
          success: false,
          totalTemplates: 0,
          activeTemplates: 0,
          totalUsage: 0,
          mostUsed: null,
          averageUsage: 0,
          error: error instanceof Error ? error.message : "Erro ao obter estatísticas",
        };
      }
    }),

  /**
   * Adicionar aos favoritos
   */
  addToFavorites: publicProcedure
    .input(z.object({ adminId: z.string(), templateId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.addToFavorites(input.adminId, input.templateId);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao adicionar aos favoritos",
        };
      }
    }),

  /**
   * Remover dos favoritos
   */
  removeFromFavorites: publicProcedure
    .input(z.object({ adminId: z.string(), templateId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const service = getQuickRepliesService();
        const result = await service.removeFromFavorites(input.adminId, input.templateId);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao remover dos favoritos",
        };
      }
    }),
});
