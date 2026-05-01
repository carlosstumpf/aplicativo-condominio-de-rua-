/**
 * Suggestion Engine
 * Motor de sugestões de respostas rápidas baseado em análise de IA
 */

import pino from "pino";
import {
  AIMessageAnalyzer,
  MessageAnalysis,
  SuggestedReply,
  getAIMessageAnalyzer,
} from "@/server/_core/ai-message-analyzer";

export interface SuggestionRequest {
  message: string;
  condominiumId: string;
  availableTemplates: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    emoji: string;
    keywords?: string[];
  }>;
}

export interface SuggestionResult {
  success: boolean;
  message: string;
  analysis: MessageAnalysis;
  suggestions: SuggestedReply[];
  topSuggestion: SuggestedReply | null;
}

/**
 * Serviço de Sugestões
 */
export class SuggestionEngine {
  private logger: any;
  private analyzer: AIMessageAnalyzer;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    });

    this.analyzer = getAIMessageAnalyzer();
  }

  /**
   * Gerar sugestões
   */
  async generateSuggestions(request: SuggestionRequest): Promise<SuggestionResult> {
    try {
      this.logger.info(`[Suggestions] Gerando sugestões para: "${request.message}"`);

      // Analisar mensagem
      const analysis = await this.analyzer.analyzeMessage(request.message);

      // Calcular scores
      const suggestionsWithScores = request.availableTemplates.map((template) => {
        const score = this.analyzer.calculateRelevanceScore(analysis, template);

        // Extrair palavras-chave que combinaram
        const matchedKeywords = analysis.keywords.filter((k) =>
          template.keywords?.some((tk) => tk.includes(k) || k.includes(tk))
        );

        const reason = this.analyzer.generateReason(analysis, matchedKeywords, score);

        return {
          templateId: template.id,
          title: template.title,
          content: template.content,
          emoji: template.emoji,
          relevanceScore: score,
          matchedKeywords,
          reason,
        };
      });

      // Ordenar por score (descendente)
      const suggestions = suggestionsWithScores
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3); // Top 3

      const topSuggestion = suggestions.length > 0 ? suggestions[0] : null;

      this.logger.info(
        `[Suggestions] Sugestões geradas: ${suggestions.length} (top: ${topSuggestion?.title})`
      );

      return {
        success: true,
        message: "Sugestões geradas com sucesso",
        analysis,
        suggestions,
        topSuggestion,
      };
    } catch (error) {
      this.logger.error("[Suggestions] Erro ao gerar sugestões:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro ao gerar sugestões",
        analysis: {
          originalMessage: request.message,
          intent: "unknown",
          confidence: 0,
          keywords: [],
          entities: {},
          sentiment: "neutral",
        },
        suggestions: [],
        topSuggestion: null,
      };
    }
  }

  /**
   * Filtrar sugestões por score mínimo
   */
  filterByMinimumScore(suggestions: SuggestedReply[], minScore: number = 0.5): SuggestedReply[] {
    return suggestions.filter((s) => s.relevanceScore >= minScore);
  }

  /**
   * Agrupar sugestões por categoria
   */
  groupByCategory(
    suggestions: SuggestedReply[]
  ): Record<string, SuggestedReply[]> {
    const grouped: Record<string, SuggestedReply[]> = {};

    for (const suggestion of suggestions) {
      // Extrair categoria do title ou usar "other"
      const category = this.extractCategory(suggestion.title);

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(suggestion);
    }

    return grouped;
  }

  /**
   * Extrair categoria do título
   */
  private extractCategory(title: string): string {
    if (title.includes("Pagamento") || title.includes("Pagar")) return "payment";
    if (title.includes("Vencimento") || title.includes("Data")) return "info";
    if (title.includes("Suporte") || title.includes("Técnico")) return "support";
    if (title.includes("Olá") || title.includes("Acompanhamento")) return "follow-up";
    return "other";
  }

  /**
   * Calcular confiança geral
   */
  calculateOverallConfidence(suggestions: SuggestedReply[]): number {
    if (suggestions.length === 0) return 0;

    const avgScore = suggestions.reduce((sum, s) => sum + s.relevanceScore, 0) / suggestions.length;
    return Math.round(avgScore * 100);
  }

  /**
   * Obter recomendação personalizada
   */
  getPersonalizedRecommendation(
    suggestions: SuggestedReply[],
    adminPreferences?: {
      preferredCategories?: string[];
      minConfidence?: number;
    }
  ): SuggestedReply | null {
    if (suggestions.length === 0) return null;

    const minConfidence = adminPreferences?.minConfidence || 0.5;

    // Filtrar por confiança mínima
    let filtered = suggestions.filter((s) => s.relevanceScore >= minConfidence);

    // Filtrar por categorias preferidas
    if (adminPreferences?.preferredCategories && adminPreferences.preferredCategories.length > 0) {
      filtered = filtered.filter((s) => {
        const category = this.extractCategory(s.title);
        return adminPreferences.preferredCategories?.includes(category);
      });
    }

    // Retornar melhor sugestão
    return filtered.length > 0 ? filtered[0] : suggestions[0];
  }
}

/**
 * Instância global
 */
let engine: SuggestionEngine | null = null;

/**
 * Inicializar engine
 */
export function initializeSuggestionEngine(): SuggestionEngine {
  engine = new SuggestionEngine();
  return engine;
}

/**
 * Obter instância
 */
export function getSuggestionEngine(): SuggestionEngine {
  if (!engine) {
    engine = new SuggestionEngine();
  }
  return engine;
}
