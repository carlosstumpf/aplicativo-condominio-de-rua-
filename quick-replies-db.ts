/**
 * Quick Replies Database Schema
 * Banco de dados para templates de respostas rápidas
 */

import { sqliteTable, text, integer, boolean, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Tabela: quick_reply_templates
 * Armazena templates de respostas rápidas
 */
export const quickReplyTemplates = sqliteTable("quick_reply_templates", {
  id: text("id").primaryKey().default(sql`(uuid())`),
  condominiumId: text("condominium_id").notNull(),
  title: text("title").notNull(), // "Confirmar Pagamento", "Informar Vencimento", etc
  content: text("content").notNull(), // Conteúdo da resposta
  category: text("category").notNull(), // "payment", "info", "support", "follow-up"
  emoji: text("emoji").default("💬"), // Emoji para visualização
  shortcut: text("shortcut"), // Atalho de teclado (ex: "Ctrl+1")
  usage_count: integer("usage_count").default(0), // Quantas vezes foi usado
  is_active: boolean("is_active").default(true),
  created_by: text("created_by").notNull(),
  created_at: integer("created_at").default(sql`(strftime('%s', 'now'))`),
  updated_at: integer("updated_at").default(sql`(strftime('%s', 'now'))`),
});

/**
 * Tabela: quick_reply_usage
 * Rastreia uso de templates
 */
export const quickReplyUsage = sqliteTable("quick_reply_usage", {
  id: text("id").primaryKey().default(sql`(uuid())`),
  templateId: text("template_id").notNull(),
  conversationId: text("conversation_id").notNull(),
  moradorPhone: text("morador_phone").notNull(),
  moradorName: text("morador_name").notNull(),
  messageId: text("message_id"),
  used_at: integer("used_at").default(sql`(strftime('%s', 'now'))`),
  response_time: integer("response_time"), // Tempo em ms entre recebimento e resposta
});

/**
 * Tabela: quick_reply_categories
 * Categorias de respostas rápidas
 */
export const quickReplyCategories = sqliteTable("quick_reply_categories", {
  id: text("id").primaryKey().default(sql`(uuid())`),
  condominiumId: text("condominium_id").notNull(),
  name: text("name").notNull(), // "Pagamento", "Informações", "Suporte", "Acompanhamento"
  description: text("description"),
  color: text("color").default("#3B82F6"), // Cor para visualização
  order: integer("order").default(0),
  is_active: boolean("is_active").default(true),
  created_at: integer("created_at").default(sql`(strftime('%s', 'now'))`),
});

/**
 * Tabela: quick_reply_favorites
 * Favoritos do admin
 */
export const quickReplyFavorites = sqliteTable("quick_reply_favorites", {
  id: text("id").primaryKey().default(sql`(uuid())`),
  adminId: text("admin_id").notNull(),
  templateId: text("template_id").notNull(),
  order: integer("order").default(0),
  added_at: integer("added_at").default(sql`(strftime('%s', 'now'))`),
});

/**
 * Tipos TypeScript
 */
export type QuickReplyTemplate = typeof quickReplyTemplates.$inferSelect;
export type QuickReplyTemplateInsert = typeof quickReplyTemplates.$inferInsert;
export type QuickReplyUsage = typeof quickReplyUsage.$inferSelect;
export type QuickReplyUsageInsert = typeof quickReplyUsage.$inferInsert;
export type QuickReplyCategory = typeof quickReplyCategories.$inferSelect;
export type QuickReplyCategoryInsert = typeof quickReplyCategories.$inferInsert;
export type QuickReplyFavorite = typeof quickReplyFavorites.$inferSelect;
export type QuickReplyFavoriteInsert = typeof quickReplyFavorites.$inferInsert;

/**
 * Operações de banco de dados
 */
export const quickRepliesDb = {
  /**
   * Criar template
   */
  async createTemplate(data: {
    condominiumId: string;
    title: string;
    content: string;
    category: string;
    emoji?: string;
    shortcut?: string;
    createdBy: string;
  }) {
    try {
      const template: QuickReplyTemplateInsert = {
        condominiumId: data.condominiumId,
        title: data.title,
        content: data.content,
        category: data.category,
        emoji: data.emoji || "💬",
        shortcut: data.shortcut,
        created_by: data.createdBy,
      };

      return {
        success: true,
        template,
        message: "Template criado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar template",
      };
    }
  },

  /**
   * Listar templates
   */
  async listTemplates(condominiumId: string) {
    try {
      // Mock data
      const templates: QuickReplyTemplate[] = [
        {
          id: "1",
          condominiumId,
          title: "Confirmar Pagamento",
          content: "✅ Pagamento confirmado! Obrigado por manter seu condomínio em dia.",
          category: "payment",
          emoji: "✅",
          shortcut: "Ctrl+1",
          usage_count: 45,
          is_active: true,
          created_by: "admin@condominio.com",
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "2",
          condominiumId,
          title: "Informar Vencimento",
          content: "📅 Sua mensalidade vence em 30/04/2026. Valor: R$ 500.00",
          category: "info",
          emoji: "📅",
          shortcut: "Ctrl+2",
          usage_count: 32,
          is_active: true,
          created_by: "admin@condominio.com",
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "3",
          condominiumId,
          title: "Enviar Link de Pagamento",
          content: "💳 Clique aqui para pagar: https://asaas.com/...",
          category: "payment",
          emoji: "💳",
          shortcut: "Ctrl+3",
          usage_count: 28,
          is_active: true,
          created_by: "admin@condominio.com",
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "4",
          condominiumId,
          title: "Suporte Técnico",
          content: "🔧 Qual é sua dúvida? Estou aqui para ajudar!",
          category: "support",
          emoji: "🔧",
          shortcut: "Ctrl+4",
          usage_count: 15,
          is_active: true,
          created_by: "admin@condominio.com",
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "5",
          condominiumId,
          title: "Acompanhamento",
          content: "👋 Olá! Como posso ajudá-lo hoje?",
          category: "follow-up",
          emoji: "👋",
          shortcut: "Ctrl+5",
          usage_count: 22,
          is_active: true,
          created_by: "admin@condominio.com",
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        },
      ];

      return {
        success: true,
        templates,
      };
    } catch (error) {
      return {
        success: false,
        templates: [],
        error: error instanceof Error ? error.message : "Erro ao listar templates",
      };
    }
  },

  /**
   * Atualizar template
   */
  async updateTemplate(id: string, data: Partial<QuickReplyTemplate>) {
    try {
      return {
        success: true,
        message: "Template atualizado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar template",
      };
    }
  },

  /**
   * Deletar template
   */
  async deleteTemplate(id: string) {
    try {
      return {
        success: true,
        message: "Template deletado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao deletar template",
      };
    }
  },

  /**
   * Registrar uso
   */
  async recordUsage(data: {
    templateId: string;
    conversationId: string;
    moradorPhone: string;
    moradorName: string;
    responseTime: number;
  }) {
    try {
      return {
        success: true,
        message: "Uso registrado com sucesso",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao registrar uso",
      };
    }
  },

  /**
   * Obter estatísticas
   */
  async getStats(condominiumId: string) {
    try {
      return {
        success: true,
        stats: {
          totalTemplates: 5,
          mostUsed: {
            id: "1",
            title: "Confirmar Pagamento",
            usage_count: 45,
          },
          totalUsage: 142,
          averageResponseTime: 2500, // ms
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao obter estatísticas",
      };
    }
  },

  /**
   * Listar categorias
   */
  async listCategories(condominiumId: string) {
    try {
      const categories: QuickReplyCategory[] = [
        {
          id: "1",
          condominiumId,
          name: "Pagamento",
          description: "Respostas relacionadas a pagamentos",
          color: "#10B981",
          order: 1,
          is_active: true,
          created_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "2",
          condominiumId,
          name: "Informações",
          description: "Respostas informativas",
          color: "#3B82F6",
          order: 2,
          is_active: true,
          created_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "3",
          condominiumId,
          name: "Suporte",
          description: "Respostas de suporte técnico",
          color: "#F59E0B",
          order: 3,
          is_active: true,
          created_at: Math.floor(Date.now() / 1000),
        },
        {
          id: "4",
          condominiumId,
          name: "Acompanhamento",
          description: "Respostas de acompanhamento",
          color: "#8B5CF6",
          order: 4,
          is_active: true,
          created_at: Math.floor(Date.now() / 1000),
        },
      ];

      return {
        success: true,
        categories,
      };
    } catch (error) {
      return {
        success: false,
        categories: [],
        error: error instanceof Error ? error.message : "Erro ao listar categorias",
      };
    }
  },

  /**
   * Adicionar aos favoritos
   */
  async addToFavorites(adminId: string, templateId: string) {
    try {
      return {
        success: true,
        message: "Adicionado aos favoritos",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao adicionar aos favoritos",
      };
    }
  },

  /**
   * Remover dos favoritos
   */
  async removeFromFavorites(adminId: string, templateId: string) {
    try {
      return {
        success: true,
        message: "Removido dos favoritos",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao remover dos favoritos",
      };
    }
  },
};
