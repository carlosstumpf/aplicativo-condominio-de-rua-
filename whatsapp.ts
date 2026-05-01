/**
 * WhatsApp tRPC Router
 * Provides API endpoints for WhatsApp management
 */

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  configurarWhatsapp,
  obterConfigWhatsapp,
  obterMenus,
  criarMenuTemplate,
  obterEstatisticasWhatsapp,
} from "../_core/whatsapp-db";
import {
  enviarMensagemWhatsapp,
  enviarMenuWhatsapp,
  enviarMensagensEmLote,
  testarConexaoWhatsapp,
  enviarNotificacaoPagamento,
  enviarComunicadoWhatsapp,
  enviarMenuSuporteWhatsapp,
  processarWebhookWhatsapp,
} from "../_core/whatsapp-service";

export const whatsappRouter = router({
  /**
   * Configure WhatsApp
   */
  configure: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeroWhatsapp: z.string(),
        twilioAccountSid: z.string(),
        twilioAuthToken: z.string(),
        twilioPhoneNumber: z.string(),
        webhookUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await configurarWhatsapp(input);
    }),

  /**
   * Get WhatsApp configuration
   */
  getConfig: publicProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      const config = await obterConfigWhatsapp(input.condominioId);
      // Don't return sensitive data
      if (config) {
        return {
          id: config.id,
          numeroWhatsapp: config.numeroWhatsapp,
          ativo: config.ativo,
          testeado: config.testeado,
          ultimoTeste: config.ultimoTeste,
        };
      }
      return null;
    }),

  /**
   * Test WhatsApp connection
   */
  testConnection: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        twilioAccountSid: z.string(),
        twilioAuthToken: z.string(),
        twilioPhoneNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await testarConexaoWhatsapp(
        input.twilioAccountSid,
        input.twilioAuthToken,
        input.twilioPhoneNumber
      );

      if (result.sucesso) {
        // Update config with test status
        await configurarWhatsapp({
          condominioId: input.condominioId,
          numeroWhatsapp: input.twilioPhoneNumber,
          twilioAccountSid: input.twilioAccountSid,
          twilioAuthToken: input.twilioAuthToken,
          twilioPhoneNumber: input.twilioPhoneNumber,
        });
      }

      return result;
    }),

  /**
   * Send message
   */
  sendMessage: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeroDestinatario: z.string(),
        conteudo: z.string(),
        tipo: z
          .enum(["texto", "imagem", "documento", "menu"])
          .optional()
          .default("texto"),
      })
    )
    .mutation(async ({ input }) => {
      return await enviarMensagemWhatsapp(input);
    }),

  /**
   * Send menu
   */
  sendMenu: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeroDestinatario: z.string(),
        mensagemInicial: z.string(),
        opcoes: z.array(
          z.object({
            numero: z.number(),
            titulo: z.string(),
            descricao: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await enviarMenuWhatsapp(input);
    }),

  /**
   * Send bulk messages
   */
  sendBulk: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeros: z.array(z.string()),
        conteudo: z.string(),
        tipo: z
          .enum(["texto", "imagem", "documento", "menu"])
          .optional()
          .default("texto"),
      })
    )
    .mutation(async ({ input }) => {
      return await enviarMensagensEmLote(
        input.condominioId,
        input.numeros,
        input.conteudo,
        input.tipo
      );
    }),

  /**
   * Send payment notification
   */
  sendPaymentNotification: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeroDestinatario: z.string(),
        morador: z.string(),
        valor: z.number(),
        vencimento: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await enviarNotificacaoPagamento(input);
    }),

  /**
   * Send communication
   */
  sendCommunication: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeroDestinatario: z.string(),
        titulo: z.string(),
        conteudo: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await enviarComunicadoWhatsapp(input);
    }),

  /**
   * Send support menu
   */
  sendSupportMenu: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        numeroDestinatario: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await enviarMenuSuporteWhatsapp(
        input.condominioId,
        input.numeroDestinatario
      );
    }),

  /**
   * Get menu templates
   */
  getMenus: publicProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return await obterMenus(input.condominioId);
    }),

  /**
   * Create menu template
   */
  createMenu: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        nome: z.string(),
        descricao: z.string().optional(),
        mensagemInicial: z.string(),
        opcoes: z.array(
          z.object({
            numero: z.number(),
            titulo: z.string(),
            descricao: z.string().optional(),
            acao: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await criarMenuTemplate(input);
    }),

  /**
   * Get statistics
   */
  getStats: publicProcedure
    .input(z.object({ condominioId: z.number() }))
    .query(async ({ input }) => {
      return await obterEstatisticasWhatsapp(input.condominioId);
    }),

  /**
   * Process webhook
   */
  webhook: publicProcedure
    .input(
      z.object({
        condominioId: z.number(),
        From: z.string(),
        To: z.string(),
        Body: z.string(),
        MessageSid: z.string(),
        NumMedia: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await processarWebhookWhatsapp(input);
    }),
});
