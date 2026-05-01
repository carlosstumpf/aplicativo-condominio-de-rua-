/**
 * Multi-Admin Permissions Router
 */

import { router, publicProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  createAdminUser,
  getAdminUser,
  getAdminUserByEmail,
  getAllAdminUsers,
  updateAdminUser,
  hasPermission,
  getAdminPermissions,
  createAuditLog,
  getAuditLogs,
  updateLastAccess,
  getAdminStatistics,
} from "@/server/_core/admin-permissions-db";

export const adminPermissionsRouter = router({
  /**
   * Create admin user
   */
  createUser: publicProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["super_admin", "admin", "financeiro", "comunicacao", "relatorios"]),
      })
    )
    .mutation(async ({ input }) => {
      return await createAdminUser(input);
    }),

  /**
   * Get admin user by ID
   */
  getUser: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await getAdminUser(input.id);
  }),

  /**
   * Get admin user by email
   */
  getUserByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return await getAdminUserByEmail(input.email);
    }),

  /**
   * Get all admin users
   */
  getAllUsers: publicProcedure.query(async () => {
    return await getAllAdminUsers();
  }),

  /**
   * Update admin user
   */
  updateUser: publicProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["super_admin", "admin", "financeiro", "comunicacao", "relatorios"]).optional(),
        ativo: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateAdminUser(id, data);
    }),

  /**
   * Check if admin has permission
   */
  hasPermission: publicProcedure
    .input(
      z.object({
        adminId: z.number(),
        permissao: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await hasPermission(input.adminId, input.permissao);
    }),

  /**
   * Get admin permissions
   */
  getPermissions: publicProcedure
    .input(z.object({ adminId: z.number() }))
    .query(async ({ input }) => {
      return await getAdminPermissions(input.adminId);
    }),

  /**
   * Create audit log entry
   */
  createAuditLog: publicProcedure
    .input(
      z.object({
        adminId: z.number(),
        acao: z.string(),
        recurso: z.string(),
        detalhes: z.record(z.any()).optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createAuditLog(input);
    }),

  /**
   * Get audit logs
   */
  getAuditLogs: publicProcedure
    .input(
      z.object({
        adminId: z.number().optional(),
        acao: z.string().optional(),
        recurso: z.string().optional(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getAuditLogs(input);
    }),

  /**
   * Update last access time
   */
  updateLastAccess: publicProcedure
    .input(z.object({ adminId: z.number() }))
    .mutation(async ({ input }) => {
      return await updateLastAccess(input.adminId);
    }),

  /**
   * Get admin statistics
   */
  getStatistics: publicProcedure.query(async () => {
    return await getAdminStatistics();
  }),
});
