/**
 * Asaas Config Router
 * Secure panel to insert, validate, and save the Asaas API key.
 * Uses MySQL database (same as the rest of the app).
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import axios from "axios";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const ASAAS_API_PRODUCAO = "https://api.asaas.com/v3";
const ASAAS_API_TESTE = "https://sandbox.asaas.com/api/v3";

function getAsaasUrl(ambiente: string): string {
  return ambiente === "teste" ? ASAAS_API_TESTE : ASAAS_API_PRODUCAO;
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return "****";
  return key.substring(0, 8) + "..." + key.substring(key.length - 4);
}

export const asaasConfigRouter = router({
  getStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { configured: false, message: "Banco de dados indisponivel" };
      }
      const rows = await db.execute(
        sql`SELECT id, ambiente, ativo, testeado, contaNome, contaEmail, contaCpfCnpj, ultimoTeste, apiKey, criadoEm, atualizadoEm FROM asaasConfig LIMIT 1`
      );
      const results = (rows as any)[0] as any[];
      if (!results || results.length === 0) {
        return { configured: false, message: "Nenhuma chave API configurada" };
      }
      const config = results[0];
      return {
        configured: true,
        maskedKey: maskApiKey(config.apiKey),
        ambiente: config.ambiente,
        ativo: config.ativo === 1,
        testeado: config.testeado === 1,
        contaNome: config.contaNome,
        contaEmail: config.contaEmail,
        contaCpfCnpj: config.contaCpfCnpj,
        ultimoTeste: config.ultimoTeste,
        criadoEm: config.criadoEm,
        atualizadoEm: config.atualizadoEm,
      };
    } catch (error) {
      console.error("[AsaasConfig] Error getting status:", error);
      return { configured: false, message: "Erro ao verificar configuracao" };
    }
  }),

  validate: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(10, "Chave API deve ter pelo menos 10 caracteres"),
        ambiente: z.enum(["teste", "producao"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const url = getAsaasUrl(input.ambiente);
        const response = await axios.get(`${url}/myAccount`, {
          headers: { "access_token": input.apiKey },
          timeout: 15000,
        });
        return {
          valid: true,
          conta: {
            nome: response.data.name || "N/A",
            email: response.data.email || "N/A",
            cpfCnpj: response.data.cpfCnpj || "N/A",
            walletId: response.data.walletId || null,
          },
        };
      } catch (error: any) {
        const status = error?.response?.status;
        let message = "Erro desconhecido ao validar chave";
        if (status === 401) {
          message = "Chave API invalida ou sem permissao";
        } else if (status === 403) {
          message = "Acesso negado - verifique as permissoes da chave";
        } else if (error.code === "ECONNABORTED") {
          message = "Timeout - servidor Asaas nao respondeu";
        } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
          message = "Nao foi possivel conectar ao servidor Asaas";
        }
        return { valid: false, error: message };
      }
    }),

  save: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(10),
        ambiente: z.enum(["teste", "producao"]),
        walletId: z.string().optional(),
        contaNome: z.string().optional(),
        contaEmail: z.string().optional(),
        contaCpfCnpj: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Banco de dados indisponivel" };
        }
        const existing = await db.execute(sql`SELECT id FROM asaasConfig LIMIT 1`);
        const existingRows = (existing as any)[0] as any[];
        if (existingRows && existingRows.length > 0) {
          await db.execute(
            sql`UPDATE asaasConfig SET apiKey = ${input.apiKey}, ambiente = ${input.ambiente}, walletId = ${input.walletId || null}, contaNome = ${input.contaNome || null}, contaEmail = ${input.contaEmail || null}, contaCpfCnpj = ${input.contaCpfCnpj || null}, testeado = 1, ultimoTeste = NOW(), ativo = 1 WHERE id = ${existingRows[0].id}`
          );
        } else {
          await db.execute(
            sql`INSERT INTO asaasConfig (apiKey, ambiente, walletId, contaNome, contaEmail, contaCpfCnpj, testeado, ultimoTeste, ativo) VALUES (${input.apiKey}, ${input.ambiente}, ${input.walletId || null}, ${input.contaNome || null}, ${input.contaEmail || null}, ${input.contaCpfCnpj || null}, 1, NOW(), 1)`
          );
        }
        return { success: true };
      } catch (error: any) {
        console.error("[AsaasConfig] Error saving:", error);
        return { success: false, error: error?.message || "Erro ao salvar" };
      }
    }),

  remove: publicProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false, error: "Banco de dados indisponivel" };
      }
      await db.execute(sql`DELETE FROM asaasConfig`);
      return { success: true };
    } catch (error: any) {
      console.error("[AsaasConfig] Error removing:", error);
      return { success: false, error: error?.message || "Erro ao remover" };
    }
  }),
});
