/**
 * AI Message Analyzer
 * Análise de mensagens com detecção de intenção e extração de palavras-chave
 */

import pino from "pino";

export interface MessageAnalysis {
  originalMessage: string;
  intent: string; // "payment", "info", "support", "complaint", "greeting", "unknown"
  confidence: number; // 0-1
  keywords: string[];
  entities: {
    amount?: number;
    date?: string;
    phone?: string;
  };
  sentiment: "positive" | "negative" | "neutral";
}

export interface SuggestedReply {
  templateId: string;
  title: string;
  content: string;
  emoji: string;
  relevanceScore: number; // 0-1
  matchedKeywords: string[];
  reason: string;
}

/**
 * Palavras-chave por categoria
 */
const INTENT_KEYWORDS = {
  payment: {
    keywords: [
      "pagar",
      "pagamento",
      "boleto",
      "pix",
      "débito",
      "crédito",
      "link",
      "como pagar",
      "onde pagar",
      "valor",
      "preço",
      "custa",
      "custa quanto",
      "quanto custa",
      "fatura",
      "conta",
      "mensalidade",
      "taxa",
      "tarifa",
    ],
    confidence: 0.9,
  },
  info: {
    keywords: [
      "quando",
      "qual",
      "quais",
      "como",
      "onde",
      "por que",
      "porque",
      "vencimento",
      "data",
      "horário",
      "endereço",
      "telefone",
      "email",
      "informação",
      "dados",
      "detalhes",
      "informações",
    ],
    confidence: 0.85,
  },
  support: {
    keywords: [
      "problema",
      "erro",
      "não funciona",
      "não consegui",
      "dificuldade",
      "dúvida",
      "ajuda",
      "socorro",
      "help",
      "suporte",
      "técnico",
      "bug",
      "crash",
      "travou",
      "lento",
      "quebrado",
    ],
    confidence: 0.88,
  },
  complaint: {
    keywords: [
      "reclamação",
      "reclamar",
      "insatisfeito",
      "desapontado",
      "ruim",
      "péssimo",
      "horrível",
      "terrível",
      "não gostei",
      "decepção",
      "decepcionante",
      "problema",
      "erro",
      "falha",
    ],
    confidence: 0.87,
  },
  greeting: {
    keywords: [
      "olá",
      "oi",
      "opa",
      "e aí",
      "tudo bem",
      "como vai",
      "bom dia",
      "boa tarde",
      "boa noite",
      "boa noite",
      "obrigado",
      "obrigada",
      "valeu",
      "thanks",
    ],
    confidence: 0.8,
  },
};

/**
 * Padrões de entidades
 */
const ENTITY_PATTERNS = {
  amount: /R\$\s*(\d+(?:[.,]\d{2})?)|(\d+(?:[.,]\d{2})?)\s*reais?/gi,
  date: /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/g,
  phone: /\(?(\d{2})\)?\s*(\d{4,5})[- ]?(\d{4})/g,
};

/**
 * Serviço de Análise de Mensagens com IA
 */
export class AIMessageAnalyzer {
  private logger: any;

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
  }

  /**
   * Analisar mensagem
   */
  async analyzeMessage(message: string): Promise<MessageAnalysis> {
    try {
      const lowerMessage = message.toLowerCase();

      // Detectar intenção
      const intentResult = this.detectIntent(lowerMessage);

      // Extrair palavras-chave
      const keywords = this.extractKeywords(lowerMessage);

      // Extrair entidades
      const entities = this.extractEntities(message);

      // Detectar sentimento
      const sentiment = this.detectSentiment(lowerMessage);

      this.logger.info(`[AI] Mensagem analisada: ${intentResult.intent} (${intentResult.confidence})`);

      return {
        originalMessage: message,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        keywords,
        entities,
        sentiment,
      };
    } catch (error) {
      this.logger.error("[AI] Erro ao analisar mensagem:", error);
      return {
        originalMessage: message,
        intent: "unknown",
        confidence: 0,
        keywords: [],
        entities: {},
        sentiment: "neutral",
      };
    }
  }

  /**
   * Detectar intenção
   */
  private detectIntent(message: string): { intent: string; confidence: number } {
    let bestMatch = { intent: "unknown", confidence: 0 };

    for (const [intent, data] of Object.entries(INTENT_KEYWORDS)) {
      let matchCount = 0;

      for (const keyword of data.keywords) {
        if (message.includes(keyword)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const confidence = (matchCount / data.keywords.length) * data.confidence;

        if (confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Extrair palavras-chave
   */
  private extractKeywords(message: string): string[] {
    const keywords: string[] = [];

    for (const [intent, data] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of data.keywords) {
        if (message.includes(keyword)) {
          keywords.push(keyword);
        }
      }
    }

    // Remover duplicatas
    return Array.from(new Set(keywords));
  }

  /**
   * Extrair entidades
   */
  private extractEntities(message: string): {
    amount?: number;
    date?: string;
    phone?: string;
  } {
    const entities: any = {};

    // Extrair valor
    const amountMatch = message.match(ENTITY_PATTERNS.amount);
    if (amountMatch) {
      const value = amountMatch[0].replace(/[^\d,]/g, "").replace(",", ".");
      entities.amount = parseFloat(value);
    }

    // Extrair data
    const dateMatch = message.match(ENTITY_PATTERNS.date);
    if (dateMatch) {
      entities.date = dateMatch[0];
    }

    // Extrair telefone
    const phoneMatch = message.match(ENTITY_PATTERNS.phone);
    if (phoneMatch) {
      entities.phone = phoneMatch[0];
    }

    return entities;
  }

  /**
   * Detectar sentimento
   */
  private detectSentiment(message: string): "positive" | "negative" | "neutral" {
    const positiveWords = [
      "obrigado",
      "obrigada",
      "valeu",
      "thanks",
      "ótimo",
      "excelente",
      "bom",
      "boa",
      "legal",
      "bacana",
      "adorei",
      "amei",
    ];
    const negativeWords = [
      "ruim",
      "péssimo",
      "horrível",
      "terrível",
      "problema",
      "erro",
      "reclamação",
      "insatisfeito",
      "decepção",
      "não gostei",
      "desapontado",
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (message.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (message.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  }

  /**
   * Calcular score de relevância
   */
  calculateRelevanceScore(
    analysis: MessageAnalysis,
    template: {
      title: string;
      content: string;
      category: string;
      keywords?: string[];
    }
  ): number {
    let score = 0;

    // Score por correspondência de intenção (50%)
    if (analysis.intent === template.category) {
      score += 50;
    } else if (this.isRelatedCategory(analysis.intent, template.category)) {
      score += 25;
    }

    // Score por palavras-chave (30%)
    const templateKeywords = template.keywords || [];
    const matchedKeywords = analysis.keywords.filter((k) =>
      templateKeywords.some((tk) => tk.includes(k) || k.includes(tk))
    );
    score += (matchedKeywords.length / Math.max(templateKeywords.length, 1)) * 30;

    // Score por confiança (20%)
    score += analysis.confidence * 20;

    return Math.min(score / 100, 1); // Normalizar para 0-1
  }

  /**
   * Verificar se categorias estão relacionadas
   */
  private isRelatedCategory(intent1: string, intent2: string): boolean {
    const related: Record<string, string[]> = {
      payment: ["info"],
      info: ["payment"],
      support: ["complaint"],
      complaint: ["support"],
    };

    return related[intent1]?.includes(intent2) || false;
  }

  /**
   * Gerar motivo da sugestão
   */
  generateReason(
    analysis: MessageAnalysis,
    matchedKeywords: string[],
    score: number
  ): string {
    if (score > 0.8) {
      return `Correspondência alta com intenção "${analysis.intent}" (${Math.round(score * 100)}%)`;
    } else if (score > 0.6) {
      return `Palavras-chave encontradas: ${matchedKeywords.slice(0, 2).join(", ")}`;
    } else {
      return `Sugestão baseada em contexto similar`;
    }
  }
}

/**
 * Instância global
 */
let analyzer: AIMessageAnalyzer | null = null;

/**
 * Inicializar analisador
 */
export function initializeAIMessageAnalyzer(): AIMessageAnalyzer {
  analyzer = new AIMessageAnalyzer();
  return analyzer;
}

/**
 * Obter instância
 */
export function getAIMessageAnalyzer(): AIMessageAnalyzer {
  if (!analyzer) {
    analyzer = new AIMessageAnalyzer();
  }
  return analyzer;
}
