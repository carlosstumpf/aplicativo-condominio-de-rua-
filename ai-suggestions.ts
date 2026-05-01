/**
 * tRPC Router - AI Suggestions
 */

import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import { getSuggestionEngine } from "@/server/_core/suggestion-engine";
import { getQuickRepliesService } from "@/server/_core/quick-replies-service";

export const aiSuggestionsRouter = router({
  /**
   * Gerar sugestões para uma mensagem
   */
  generateSuggestions: publicProcedure
    .input(
      z.object({
        message: z.string(),
        condominiumId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const engine = getSuggestionEngine();
        const quickRepliesService = getQuickRepliesService();

        // Obter templates disponíveis
        const templatesResult = await quickRepliesService.listTemplates(input.condominiumId);

        if (!templatesResult.success || !templatesResult.templates) {
          return {
            success: false,
            suggestions: [],
            error: "Erro ao carregar templates",
          };
        }

        // Gerar sugestões
        const result = await engine.generateSuggestions({
          message: input.message,
          condominiumId: input.condominiumId,
          availableTemplates: templatesResult.templates.map((t) => ({
            id: t.id,
            title: t.title,
            content: t.content,
            category: t.category,
            emoji: t.emoji,
            keywords: t.title.split(" ").map((w) => w.toLowerCase()),
          })),
        });

        return {
          success: result.success,
          analysis: result.analysis,
          suggestions: result.suggestions,
          topSuggestion: result.topSuggestion,
          confidence: engine.calculateOverallConfidence(result.suggestions),
        };
      } catch (error) {
        return {
          success: false,
          suggestions: [],
          error: error instanceof Error ? error.message : "Erro ao gerar sugestões",
        };
      }
    }),

  /**
   * Analisar intenção de uma mensagem
   */
  analyzeMessage: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(async ({ input }) => {
      try {
        const engine = getSuggestionEngine();
        const analyzer = engine["analyzer"];

        const analysis = await analyzer.analyzeMessage(input.message);

        return {
          success: true,
          analysis,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao analisar mensagem",
        };
      }
    }),

  /**
   * Filtrar sugestões por score mínimo
   */
  filterSuggestions: publicProcedure
    .input(
      z.object({
        suggestions: z.array(
          z.object({
            templateId: z.string(),
            title: z.string(),
            content: z.string(),
            emoji: z.string(),
            relevanceScore: z.number(),
            matchedKeywords: z.array(z.string()),
            reason: z.string(),
          })
        ),
        minScore: z.number().default(0.5),
      })
    )
    .query(async ({ input }) => {
      try {
        const engine = getSuggestionEngine();
        const filtered = engine.filterByMinimumScore(input.suggestions, input.minScore);

        return {
          success: true,
          suggestions: filtered,
          count: filtered.length,
        };
      } catch (error) {
        return {
          success: false,
          suggestions: [],
          error: error instanceof Error ? error.message : "Erro ao filtrar sugestões",
        };
      }
    }),

  /**
   * Agrupar sugestões por categoria
   */
  groupSuggestions: publicProcedure
    .input(
      z.object({
        suggestions: z.array(
          z.object({
            templateId: z.string(),
            title: z.string(),
            content: z.string(),
            emoji: z.string(),
            relevanceScore: z.number(),
            matchedKeywords: z.array(z.string()),
            reason: z.string(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const engine = getSuggestionEngine();
        const grouped = engine.groupByCategory(input.suggestions);

        return {
          success: true,
          grouped,
        };
      } catch (error) {
        return {
          success: false,
          grouped: {},
          error: error instanceof Error ? error.message : "Erro ao agrupar sugestões",
        };
      }
    }),

  /**
   * Obter recomendação personalizada
   */
  getPersonalizedRecommendation: publicProcedure
    .input(
      z.object({
        suggestions: z.array(
          z.object({
            templateId: z.string(),
            title: z.string(),
            content: z.string(),
            emoji: z.string(),
            relevanceScore: z.number(),
            matchedKeywords: z.array(z.string()),
            reason: z.string(),
          })
        ),
        preferredCategories: z.array(z.string()).optional(),
        minConfidence: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const engine = getSuggestionEngine();
        const recommendation = engine.getPersonalizedRecommendation(input.suggestions, {
          preferredCategories: input.preferredCategories,
          minConfidence: input.minConfidence,
        });

        return {
          success: true,
          recommendation,
        };
      } catch (error) {
        return {
          success: false,
          recommendation: null,
          error: error instanceof Error ? error.message : "Erro ao obter recomendação",
        };
      }
    }),

  /**
   * Calcular confiança geral
   */
  calculateConfidence: publicProcedure
    .input(
      z.object({
        suggestions: z.array(
          z.object({
            templateId: z.string(),
            title: z.string(),
            content: z.string(),
            emoji: z.string(),
            relevanceScore: z.number(),
            matchedKeywords: z.array(z.string()),
            reason: z.string(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      try {
        const engine = getSuggestionEngine();
        const confidence = engine.calculateOverallConfidence(input.suggestions);

        return {
          success: true,
          confidence,
        };
      } catch (error) {
        return {
          success: false,
          confidence: 0,
          error: error instanceof Error ? error.message : "Erro ao calcular confiança",
        };
      }
    }),
});
