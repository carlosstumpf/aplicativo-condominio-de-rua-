import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db-queries";

export const moradoresRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        status: z.enum(["ativo", "inativo", "todos"]).default("todos"),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, search, status } = input;
      const offset = (page - 1) * limit;

      // Get all moradores
      let moradores = await db.getMoradores();

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        moradores = moradores.filter(
          (m: any) =>
            m.nomeCompleto.toLowerCase().includes(searchLower) ||
            m.identificacaoCasa.toLowerCase().includes(searchLower) ||
            m.telefone.includes(search)
        );
      }

      // Filter by status
      if (status === "ativo") {
        moradores = moradores.filter((m: any) => m.statusAtivo === 1);
      } else if (status === "inativo") {
        moradores = moradores.filter((m: any) => m.statusAtivo === 0);
      }

      // Calculate pagination
      const total = moradores.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedMoradores = moradores.slice(offset, offset + limit);

      return {
        data: paginatedMoradores,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await db.getMoradorById(input.id);
  }),

  getByTelefone: publicProcedure.input(z.object({ telefone: z.string() })).query(async ({ input }) => {
    return await db.getMoradorByTelefone(input.telefone);
  }),

  create: protectedProcedure
    .input(
      z.object({
        telefone: z.string(),
        nomeCompleto: z.string(),
        cpf: z.string().optional().default("00000000000"),
        identificacaoCasa: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Strip CPF formatting (dots and dashes) and truncate to 11 digits
      const cpfDigits = (input.cpf || "00000000000").replace(/[^0-9]/g, "").slice(0, 11).padStart(11, "0");
      return await db.createMorador({
        telefone: input.telefone,
        nomeCompleto: input.nomeCompleto,
        cpf: cpfDigits,
        identificacaoCasa: input.identificacaoCasa,
        statusAtivo: 1,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        cpf: z.string().optional(),
        identificacaoCasa: z.string().optional(),
        statusAtivo: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.updateMorador(id, data);
    }),

  getInadimplentes: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const inadimplentes = await db.getMoradoresInadimplentes();
      const total = inadimplentes.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedData = inadimplentes.slice(offset, offset + limit);

      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),

  // Inativar morador (cancelar cadastro sem excluir)
  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.updateMorador(input.id, { statusAtivo: 0 });
    }),

  // Reativar morador
  reactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.updateMorador(input.id, { statusAtivo: 1 });
    }),

  // Excluir/inativar morador
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // Inativar o morador (cancelar cadastro)
      await db.updateMorador(input.id, { statusAtivo: 0 });
      return { success: true, action: "inativado", message: "Morador cancelado com sucesso" };
    }),

  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const { query, page, limit } = input;
      const offset = (page - 1) * limit;

      let moradores = await db.getMoradores();
      const searchLower = query.toLowerCase();

      moradores = moradores.filter(
        (m: any) =>
          m.nomeCompleto.toLowerCase().includes(searchLower) ||
          m.identificacaoCasa.toLowerCase().includes(searchLower) ||
          m.telefone.includes(query) ||
          m.cpf.includes(query)
      );

      const total = moradores.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedMoradores = moradores.slice(offset, offset + limit);

      return {
        data: paginatedMoradores,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),
});
