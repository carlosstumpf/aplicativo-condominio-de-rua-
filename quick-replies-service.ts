/**
 * Quick Replies Service
 * Gerenciamento de templates de respostas rápidas
 */

import pino from "pino";
import { quickRepliesDb } from "@/server/_core/quick-replies-db";

export interface QuickReplyTemplate {
  id: string;
  condominiumId: string;
  title: string;
  content: string;
  category: string;
  emoji: string;
  shortcut?: string;
  usage_count: number;
  is_active: boolean;
  created_by: string;
  created_at: number;
  updated_at: number;
}

/**
 * Serviço de Respostas Rápidas
 */
export class QuickRepliesService {
  private logger: any;
  private templates: Map<string, QuickReplyTemplate> = new Map();

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
  }): Promise<{
    success: boolean;
    template?: QuickReplyTemplate;
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Criando template: ${data.title}`);

      const result = await quickRepliesDb.createTemplate(data);

      if (result.success) {
        const template: QuickReplyTemplate = {
          id: `template_${Date.now()}`,
          condominiumId: data.condominiumId,
          title: data.title,
          content: data.content,
          category: data.category,
          emoji: data.emoji || "💬",
          shortcut: data.shortcut,
          usage_count: 0,
          is_active: true,
          created_by: data.createdBy,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        };

        this.templates.set(template.id, template);
        return { success: true, template };
      }

      return result;
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao criar template:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar template",
      };
    }
  }

  /**
   * Listar templates
   */
  async listTemplates(condominiumId: string): Promise<{
    success: boolean;
    templates?: QuickReplyTemplate[];
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Listando templates do condomínio ${condominiumId}`);

      const result = await quickRepliesDb.listTemplates(condominiumId);
      return result;
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao listar templates:", error);
      return {
        success: false,
        templates: [],
        error: error instanceof Error ? error.message : "Erro ao listar templates",
      };
    }
  }

  /**
   * Obter template por ID
   */
  async getTemplate(id: string): Promise<QuickReplyTemplate | null> {
    return this.templates.get(id) || null;
  }

  /**
   * Atualizar template
   */
  async updateTemplate(
    id: string,
    data: Partial<QuickReplyTemplate>
  ): Promise<{
    success: boolean;
    template?: QuickReplyTemplate;
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Atualizando template: ${id}`);

      const template = this.templates.get(id);
      if (!template) {
        return {
          success: false,
          error: "Template não encontrado",
        };
      }

      const updated: QuickReplyTemplate = {
        ...template,
        ...data,
        updated_at: Math.floor(Date.now() / 1000),
      };

      this.templates.set(id, updated);

      return { success: true, template: updated };
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao atualizar template:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar template",
      };
    }
  }

  /**
   * Deletar template
   */
  async deleteTemplate(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Deletando template: ${id}`);

      this.templates.delete(id);

      return { success: true };
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao deletar template:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao deletar template",
      };
    }
  }

  /**
   * Registrar uso
   */
  async recordUsage(data: {
    templateId: string;
    conversationId: string;
    moradorPhone: string;
    moradorName: string;
    responseTime: number;
  }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Registrando uso: ${data.templateId}`);

      const template = this.templates.get(data.templateId);
      if (template) {
        template.usage_count++;
      }

      const result = await quickRepliesDb.recordUsage(data);
      return result;
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao registrar uso:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao registrar uso",
      };
    }
  }

  /**
   * Obter templates mais usados
   */
  async getMostUsed(condominiumId: string, limit: number = 5): Promise<QuickReplyTemplate[]> {
    const templates = Array.from(this.templates.values())
      .filter((t) => t.condominiumId === condominiumId)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit);

    return templates;
  }

  /**
   * Obter templates por categoria
   */
  async getByCategory(
    condominiumId: string,
    category: string
  ): Promise<QuickReplyTemplate[]> {
    const templates = Array.from(this.templates.values()).filter(
      (t) => t.condominiumId === condominiumId && t.category === category
    );

    return templates;
  }

  /**
   * Buscar templates
   */
  async search(
    condominiumId: string,
    query: string
  ): Promise<QuickReplyTemplate[]> {
    const lowerQuery = query.toLowerCase();

    const templates = Array.from(this.templates.values()).filter(
      (t) =>
        t.condominiumId === condominiumId &&
        (t.title.toLowerCase().includes(lowerQuery) ||
          t.content.toLowerCase().includes(lowerQuery))
    );

    return templates;
  }

  /**
   * Obter estatísticas
   */
  async getStats(condominiumId: string): Promise<{
    totalTemplates: number;
    activeTemplates: number;
    totalUsage: number;
    mostUsed: QuickReplyTemplate | null;
    averageUsage: number;
  }> {
    const templates = Array.from(this.templates.values()).filter(
      (t) => t.condominiumId === condominiumId
    );

    const activeTemplates = templates.filter((t) => t.is_active).length;
    const totalUsage = templates.reduce((sum, t) => sum + t.usage_count, 0);
    const mostUsed = templates.length > 0 ? templates[0] : null;
    const averageUsage = templates.length > 0 ? totalUsage / templates.length : 0;

    return {
      totalTemplates: templates.length,
      activeTemplates,
      totalUsage,
      mostUsed,
      averageUsage,
    };
  }

  /**
   * Adicionar aos favoritos
   */
  async addToFavorites(adminId: string, templateId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Adicionando aos favoritos: ${templateId}`);

      const result = await quickRepliesDb.addToFavorites(adminId, templateId);
      return result;
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao adicionar aos favoritos:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao adicionar aos favoritos",
      };
    }
  }

  /**
   * Remover dos favoritos
   */
  async removeFromFavorites(adminId: string, templateId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      this.logger.info(`[Quick Replies] Removendo dos favoritos: ${templateId}`);

      const result = await quickRepliesDb.removeFromFavorites(adminId, templateId);
      return result;
    } catch (error) {
      this.logger.error("[Quick Replies] Erro ao remover dos favoritos:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao remover dos favoritos",
      };
    }
  }
}

/**
 * Instância global
 */
let service: QuickRepliesService | null = null;

/**
 * Inicializar serviço
 */
export function initializeQuickRepliesService(): QuickRepliesService {
  service = new QuickRepliesService();
  return service;
}

/**
 * Obter instância
 */
export function getQuickRepliesService(): QuickRepliesService {
  if (!service) {
    service = new QuickRepliesService();
  }
  return service;
}
