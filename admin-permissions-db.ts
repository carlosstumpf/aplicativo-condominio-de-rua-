/**
 * Multi-Admin Support with Role-Based Permissions
 * Handle admin roles, permissions, and access control
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

export type AdminRole = "super_admin" | "admin" | "financeiro" | "comunicacao" | "relatorios";

export interface AdminPermission {
  id: number;
  role: AdminRole;
  permissao: string;
  descricao?: string;
  ativo: boolean;
}

export interface AdminUser {
  id: number;
  nome: string;
  email: string;
  role: AdminRole;
  ativo: boolean;
  ultimoAcesso?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface AdminAuditLog {
  id: number;
  adminId: number;
  acao: string;
  recurso: string;
  detalhes?: Record<string, any>;
  ipAddress?: string;
  criadoEm: Date;
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    "view_dashboard",
    "manage_fees",
    "manage_expenses",
    "manage_communications",
    "manage_admins",
    "view_reports",
    "export_data",
    "manage_webhooks",
    "manage_flows",
    "manage_billing",
    "audit_logs",
  ],
  admin: [
    "view_dashboard",
    "manage_fees",
    "manage_expenses",
    "manage_communications",
    "view_reports",
    "export_data",
    "manage_webhooks",
    "manage_flows",
    "manage_billing",
  ],
  financeiro: [
    "view_dashboard",
    "manage_fees",
    "manage_expenses",
    "view_reports",
    "export_data",
    "manage_billing",
  ],
  comunicacao: [
    "view_dashboard",
    "manage_communications",
    "manage_flows",
    "view_reports",
  ],
  relatorios: [
    "view_dashboard",
    "view_reports",
    "export_data",
  ],
};

/**
 * Create admin user
 */
export async function createAdminUser(data: {
  nome: string;
  email: string;
  role: AdminRole;
}): Promise<AdminUser | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO admin_usuarios (
        nome,
        email,
        role,
        ativo,
        criado_em,
        atualizado_em
      ) VALUES (
        ${data.nome},
        ${data.email},
        ${data.role},
        true,
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as AdminUser | null;
  } catch (error) {
    console.error("Error creating admin user:", error);
    return null;
  }
}

/**
 * Get admin user by ID
 */
export async function getAdminUser(id: number): Promise<AdminUser | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM admin_usuarios WHERE id = ${id}
    `);

    return result.rows?.[0] as AdminUser | null;
  } catch (error) {
    console.error("Error getting admin user:", error);
    return null;
  }
}

/**
 * Get admin user by email
 */
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM admin_usuarios WHERE email = ${email}
    `);

    return result.rows?.[0] as AdminUser | null;
  } catch (error) {
    console.error("Error getting admin user by email:", error);
    return null;
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers(): Promise<AdminUser[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM admin_usuarios
      WHERE ativo = true
      ORDER BY nome
    `);

    return (result.rows || []) as AdminUser[];
  } catch (error) {
    console.error("Error getting all admin users:", error);
    return [];
  }
}

/**
 * Update admin user
 */
export async function updateAdminUser(
  id: number,
  data: Partial<{
    nome: string;
    email: string;
    role: AdminRole;
    ativo: boolean;
  }>
): Promise<AdminUser | null> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.nome !== undefined) {
      updates.push(`nome = $${updates.length + 1}`);
      values.push(data.nome);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${updates.length + 1}`);
      values.push(data.email);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${updates.length + 1}`);
      values.push(data.role);
    }
    if (data.ativo !== undefined) {
      updates.push(`ativo = $${updates.length + 1}`);
      values.push(data.ativo);
    }

    updates.push(`atualizado_em = NOW()`);

    const query = `UPDATE admin_usuarios SET ${updates.join(", ")} WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await db.execute(sql.raw(query, values));

    return result.rows?.[0] as AdminUser | null;
  } catch (error) {
    console.error("Error updating admin user:", error);
    return null;
  }
}

/**
 * Check if admin has permission
 */
export async function hasPermission(adminId: number, permissao: string): Promise<boolean> {
  try {
    const admin = await getAdminUser(adminId);

    if (!admin || !admin.ativo) {
      return false;
    }

    const permissions = DEFAULT_PERMISSIONS[admin.role];
    return permissions.includes(permissao);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Get admin permissions
 */
export async function getAdminPermissions(adminId: number): Promise<string[]> {
  try {
    const admin = await getAdminUser(adminId);

    if (!admin) {
      return [];
    }

    return DEFAULT_PERMISSIONS[admin.role] || [];
  } catch (error) {
    console.error("Error getting admin permissions:", error);
    return [];
  }
}

/**
 * Create audit log entry
 */
export async function createAuditLog(data: {
  adminId: number;
  acao: string;
  recurso: string;
  detalhes?: Record<string, any>;
  ipAddress?: string;
}): Promise<AdminAuditLog | null> {
  try {
    const result = await db.execute(sql`
      INSERT INTO admin_audit_logs (
        admin_id,
        acao,
        recurso,
        detalhes,
        ip_address,
        criado_em
      ) VALUES (
        ${data.adminId},
        ${data.acao},
        ${data.recurso},
        ${data.detalhes ? JSON.stringify(data.detalhes) : null},
        ${data.ipAddress || null},
        NOW()
      )
      RETURNING *
    `);

    return result.rows?.[0] as AdminAuditLog | null;
  } catch (error) {
    console.error("Error creating audit log:", error);
    return null;
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(filtros?: {
  adminId?: number;
  acao?: string;
  recurso?: string;
  dataInicio?: Date;
  dataFim?: Date;
}): Promise<AdminAuditLog[]> {
  try {
    let query = "SELECT * FROM admin_audit_logs WHERE 1=1";
    const params: any[] = [];

    if (filtros?.adminId) {
      query += ` AND admin_id = $${params.length + 1}`;
      params.push(filtros.adminId);
    }

    if (filtros?.acao) {
      query += ` AND acao = $${params.length + 1}`;
      params.push(filtros.acao);
    }

    if (filtros?.recurso) {
      query += ` AND recurso = $${params.length + 1}`;
      params.push(filtros.recurso);
    }

    if (filtros?.dataInicio) {
      query += ` AND criado_em >= $${params.length + 1}`;
      params.push(filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      query += ` AND criado_em <= $${params.length + 1}`;
      params.push(filtros.dataFim);
    }

    query += " ORDER BY criado_em DESC";

    const result = await db.execute(sql.raw(query, params));

    return (result.rows || []) as AdminAuditLog[];
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return [];
  }
}

/**
 * Update last access time
 */
export async function updateLastAccess(adminId: number): Promise<boolean> {
  try {
    await db.execute(sql`
      UPDATE admin_usuarios
      SET ultimo_acesso = NOW()
      WHERE id = ${adminId}
    `);

    return true;
  } catch (error) {
    console.error("Error updating last access:", error);
    return false;
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStatistics(): Promise<{
  totalAdmins: number;
  porRole: Record<AdminRole, number>;
  ultimosAcessos: Array<{
    nome: string;
    role: AdminRole;
    ultimoAcesso?: Date;
  }>;
}> {
  try {
    const admins = await getAllAdminUsers();

    const porRole: Record<AdminRole, number> = {
      super_admin: 0,
      admin: 0,
      financeiro: 0,
      comunicacao: 0,
      relatorios: 0,
    };

    admins.forEach((admin) => {
      porRole[admin.role]++;
    });

    const ultimosAcessos = admins
      .sort((a, b) => {
        const dateA = a.ultimoAcesso ? new Date(a.ultimoAcesso).getTime() : 0;
        const dateB = b.ultimoAcesso ? new Date(b.ultimoAcesso).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10)
      .map((admin) => ({
        nome: admin.nome,
        role: admin.role,
        ultimoAcesso: admin.ultimoAcesso,
      }));

    return {
      totalAdmins: admins.length,
      porRole,
      ultimosAcessos,
    };
  } catch (error) {
    console.error("Error getting admin statistics:", error);
    return {
      totalAdmins: 0,
      porRole: {
        super_admin: 0,
        admin: 0,
        financeiro: 0,
        comunicacao: 0,
        relatorios: 0,
      },
      ultimosAcessos: [],
    };
  }
}
