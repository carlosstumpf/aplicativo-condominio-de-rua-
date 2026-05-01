import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";

export const chamadosRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        status: z.string().optional(),
        categoria: z.string().optional(),
        prioridade: z.string().optional(),
        moradorId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await db.getChamados(input);
        const chamadosList = Array.isArray(result) ? result : (result as any)?.data || [];
        return {
          success: true,
          data: chamadosList,
          pagination: !Array.isArray(result) ? (result as any)?.pagination : undefined,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to list tickets";
        throw new Error(message);
      }
    }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await db.getChamadoById(input.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        moradorId: z.number(),
        titulo: z.string().min(5).max(100),
        descricao: z.string().min(10).max(1000),
        categoria: z.enum(["MANUTENCAO", "SEGURANCA", "LIMPEZA", "OUTRO"]).optional(),
        prioridade: z.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
        anexo: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const chamado = await db.createChamado({
          moradorId: input.moradorId,
          titulo: input.titulo,
          descricao: input.descricao,
          categoria: input.categoria || "OUTRO",
          prioridade: input.prioridade,
          anexo: input.anexo,
          status: "ABERTO",
        });
        return {
          success: true,
          chamado,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create ticket";
        throw new Error(message);
      }
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["ABERTO", "EM_ANDAMENTO", "RESOLVIDO", "FECHADO"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const chamado = await db.updateChamadoStatus(input.id, input.status);
        return {
          success: true,
          chamado,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update ticket status";
        throw new Error(message);
      }
    }),

  addResposta: protectedProcedure
    .input(
      z.object({
        chamadoId: z.number(),
        texto: z.string().min(1).max(500),
        tipo: z.enum(["MORADOR", "ADMIN"]).default("ADMIN"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user?.id) throw new Error("User not authenticated");
        const resposta = await db.addRespostaChamado({
          chamadoId: input.chamadoId,
          userId: ctx.user.id,
          resposta: input.texto,
        });
        return {
          success: true,
          resposta,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add response";
        throw new Error(message);
      }
    }),

  getRespostas: protectedProcedure
    .input(z.object({ chamadoId: z.number() }))
    .query(async ({ input }) => {
      try {
        const respostas = await db.getRespostasChamado(input.chamadoId);
        return {
          success: true,
          respostas,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get responses";
        throw new Error(message);
      }
    }),

  getStatistics: protectedProcedure.query(async () => {
    try {
      const allChamados = await db.getChamados({});
      const chamadosList = Array.isArray(allChamados) ? allChamados : (allChamados as any)?.data || [];
      const stats = {
        total: chamadosList.length,
        abertos: chamadosList.filter((c: any) => c.status === "ABERTO").length,
        emAndamento: chamadosList.filter((c: any) => c.status === "EM_ANDAMENTO").length,
        resolvidos: chamadosList.filter((c: any) => c.status === "RESOLVIDO").length,
        fechados: chamadosList.filter((c: any) => c.status === "FECHADO").length,
      };
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
