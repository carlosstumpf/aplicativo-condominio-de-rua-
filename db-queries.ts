import {
  moradores,
  cobrancas,
  despesas,
  chamados,
  respostasChamados,
  InsertMorador,
  InsertCobranca,
  InsertDespesa,
  InsertChamado,
  InsertRespostaChamado,
} from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ============================================================
// MORADORES (Residents) Queries
// ============================================================

export async function createMorador(data: InsertMorador) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(moradores).values(data);
  return result;
}

export async function getMoradores() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(moradores).where(eq(moradores.statusAtivo, 1));
}

export async function getMoradorById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(moradores).where(eq(moradores.id, id)).limit(1);
  return result[0];
}

export async function getMoradorByTelefone(telefone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(moradores).where(eq(moradores.telefone, telefone)).limit(1);
  return result[0];
}

export async function updateMorador(id: number, data: Partial<InsertMorador>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(moradores).set(data).where(eq(moradores.id, id));
}

export async function getMoradoresInadimplentes() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const mesAtual = new Date().toISOString().slice(0, 7);
  
  // Get residents with no RECEIVED payment in current month
  const result = await db
    .select({ id: moradores.id, telefone: moradores.telefone, nomeCompleto: moradores.nomeCompleto })
    .from(moradores)
    .where(eq(moradores.statusAtivo, 1));
  
  const inadimplentes = [];
  for (const m of result) {
    const pagamentos = await db
      .select()
      .from(cobrancas)
      .where(
        and(
          eq(cobrancas.moradorId, m.id),
          eq(cobrancas.mesReferencia, mesAtual),
          eq(cobrancas.status, "RECEIVED")
        )
      );
    
    if (pagamentos.length === 0) {
      inadimplentes.push(m);
    }
  }
  
  return inadimplentes;
}

// ============================================================
// COBRANÇAS (Charges) Queries
// ============================================================

export async function createCobranca(data: InsertCobranca) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(cobrancas).values(data);
}

export async function getCobrancas(filtros?: {
  status?: string;
  mesReferencia?: string;
  tipo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (filtros?.status) {
    conditions.push(eq(cobrancas.status, filtros.status as any));
  }
  if (filtros?.mesReferencia) {
    conditions.push(eq(cobrancas.mesReferencia, filtros.mesReferencia));
  }
  if (filtros?.tipo) {
    conditions.push(eq(cobrancas.tipo, filtros.tipo as any));
  }
  
  if (conditions.length > 0) {
    return await db
      .select()
      .from(cobrancas)
      .where(and(...conditions))
      .orderBy(desc(cobrancas.criadoEm));
  }
  
  return await db
    .select()
    .from(cobrancas)
    .orderBy(desc(cobrancas.criadoEm));
}

export async function getCobrancaByAsaasId(asaasPaymentId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(cobrancas)
    .where(eq(cobrancas.asaasPaymentId, asaasPaymentId))
    .limit(1);
  
  return result[0];
}

export async function updateCobrancaStatus(asaasPaymentId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(cobrancas)
    .set({ status: status as any })
    .where(eq(cobrancas.asaasPaymentId, asaasPaymentId));
}

export async function getCobrancasPorMes(mesReferencia: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(cobrancas)
    .where(eq(cobrancas.mesReferencia, mesReferencia))
    .orderBy(desc(cobrancas.criadoEm));
}

/**
 * Get charges for a date range (startDate to endDate)
 */
export async function getCobrancasPeriodo(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return await db
    .select()
    .from(cobrancas)
    .where(
      and(
        gte(cobrancas.criadoEm, start),
        lte(cobrancas.criadoEm, end)
      )
    )
    .orderBy(desc(cobrancas.criadoEm));
}

// ============================================================
// DESPESAS (Expenses) Queries
// ============================================================

export async function createDespesa(data: InsertDespesa) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(despesas).values(data);
}

export async function getDespesas(filtros?: {
  categoria?: string;
  dataInicio?: Date;
  dataFim?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (filtros?.categoria) {
    conditions.push(eq(despesas.categoria, filtros.categoria as any));
  }
  if (filtros?.dataInicio) {
    conditions.push(gte(despesas.criadoEm, filtros.dataInicio));
  }
  if (filtros?.dataFim) {
    conditions.push(lte(despesas.criadoEm, filtros.dataFim));
  }
  
  if (conditions.length > 0) {
    return await db
      .select()
      .from(despesas)
      .where(and(...conditions))
      .orderBy(desc(despesas.criadoEm));
  }
  
  return await db
    .select()
    .from(despesas)
    .orderBy(desc(despesas.criadoEm));
}

export async function getDespesasPorMes(mesReferencia: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [ano, mes] = mesReferencia.split("-");
  const dataInicio = new Date(`${ano}-${mes}-01`);
  const dataFim = new Date(parseInt(ano), parseInt(mes), 0);
  
  return await getDespesas({ dataInicio, dataFim });
}

/**
 * Get expenses for a date range (startDate to endDate)
 */
export async function getDespesasPeriodo(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return await getDespesas({ dataInicio: start, dataFim: end });
}

// ============================================================
// CHAMADOS (Support Tickets) Queries
// ============================================================

export async function createChamado(data: InsertChamado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(chamados).values(data);
}

export async function getChamados(filtros?: {
  status?: string;
  prioridade?: string;
  moradorId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  if (filtros?.status) {
    conditions.push(eq(chamados.status, filtros.status as any));
  }
  if (filtros?.prioridade) {
    conditions.push(eq(chamados.prioridade, filtros.prioridade as any));
  }
  if (filtros?.moradorId) {
    conditions.push(eq(chamados.moradorId, filtros.moradorId));
  }
  
  if (conditions.length > 0) {
    return await db
      .select()
      .from(chamados)
      .where(and(...conditions))
      .orderBy(desc(chamados.criadoEm));
  }
  
  return await db
    .select()
    .from(chamados)
    .orderBy(desc(chamados.criadoEm));
}

/**
 * Get support tickets for a date range
 */
export async function getChamadosPeriodo(startDate: string, endDate: string, filtros?: { status?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const conditions = [
    gte(chamados.criadoEm, start),
    lte(chamados.criadoEm, end),
  ];
  
  if (filtros?.status) {
    conditions.push(eq(chamados.status, filtros.status as any));
  }
  
  return await db
    .select()
    .from(chamados)
    .where(and(...conditions))
    .orderBy(desc(chamados.criadoEm));
}

export async function createRespostaChamado(data: InsertRespostaChamado) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(respostasChamados).values(data);
}

export async function getRespostasChamado(chamadoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(respostasChamados)
    .where(eq(respostasChamados.chamadoId, chamadoId))
    .orderBy(desc(respostasChamados.criadoEm));
}

// ============================================================
// RELATÓRIOS (Reports) Queries
// ============================================================

export async function getResumoMes(mesReferencia: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Receitas do mês
  const receitasResult = await db
    .select()
    .from(cobrancas)
    .where(
      and(
        eq(cobrancas.mesReferencia, mesReferencia),
        eq(cobrancas.status, "RECEIVED")
      )
    );
  
  const receitas = receitasResult.reduce((sum, c) => sum + c.valor, 0);
  
  // Despesas do mês
  const [ano, mes] = mesReferencia.split("-");
  const dataInicio = new Date(`${ano}-${mes}-01`);
  const dataFim = new Date(parseInt(ano), parseInt(mes), 0);
  
  const despesasResult = await db
    .select()
    .from(despesas)
    .where(
      and(
        gte(despesas.criadoEm, dataInicio),
        lte(despesas.criadoEm, dataFim)
      )
    );
  
  const despesasTotal = despesasResult.reduce((sum, d) => sum + d.valor, 0);
  
  // Total de moradores
  const moradoresResult = await db
    .select()
    .from(moradores)
    .where(eq(moradores.statusAtivo, 1));
  
  return {
    receitas,
    despesas: despesasTotal,
    saldo: receitas - despesasTotal,
    moradores: moradoresResult.length,
    mes: mesReferencia,
  };
}

/**
 * Get financial summary for a date range
 */
export async function getResumoPeriodo(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Receitas do período
  const receitasResult = await db
    .select()
    .from(cobrancas)
    .where(
      and(
        gte(cobrancas.criadoEm, start),
        lte(cobrancas.criadoEm, end),
        eq(cobrancas.status, "RECEIVED")
      )
    );
  
  const receitas = receitasResult.reduce((sum, c) => sum + c.valor, 0);
  
  // Despesas do período
  const despesasResult = await db
    .select()
    .from(despesas)
    .where(
      and(
        gte(despesas.criadoEm, start),
        lte(despesas.criadoEm, end)
      )
    );
  
  const despesasTotal = despesasResult.reduce((sum, d) => sum + d.valor, 0);
  
  // Total de moradores
  const moradoresResult = await db
    .select()
    .from(moradores)
    .where(eq(moradores.statusAtivo, 1));
  
  return {
    receitas,
    despesas: despesasTotal,
    saldo: receitas - despesasTotal,
    moradores: moradoresResult.length,
    startDate,
    endDate,
  };
}

export async function getDespesasPorCategoria(mesReferencia: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [ano, mes] = mesReferencia.split("-");
  const dataInicio = new Date(`${ano}-${mes}-01`);
  const dataFim = new Date(parseInt(ano), parseInt(mes), 0);
  
  const result = await db
    .select()
    .from(despesas)
    .where(
      and(
        gte(despesas.criadoEm, dataInicio),
        lte(despesas.criadoEm, dataFim)
      )
    );
  
  const porCategoria: Record<string, number> = {};
  for (const d of result) {
    if (!porCategoria[d.categoria]) {
      porCategoria[d.categoria] = 0;
    }
    porCategoria[d.categoria] += d.valor;
  }
  
  return porCategoria;
}

/**
 * Get expenses by category for a date range
 */
export async function getDespesasCategoriaPeriodo(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const result = await db
    .select()
    .from(despesas)
    .where(
      and(
        gte(despesas.criadoEm, start),
        lte(despesas.criadoEm, end)
      )
    );
  
  const porCategoria: Record<string, number> = {};
  for (const d of result) {
    if (!porCategoria[d.categoria]) {
      porCategoria[d.categoria] = 0;
    }
    porCategoria[d.categoria] += d.valor;
  }
  
  return porCategoria;
}

// ============================================================
// NOTIFICACOES (Notifications) Queries
// ============================================================

export async function getNotificacoes(filtros: any) {
  // Mock implementation for notifications
  const mockNotificacoes = [
    {
      id: 1,
      userId: filtros.userId,
      tipo: "PAGAMENTO",
      titulo: "Pagamento Confirmado",
      mensagem: "Pagamento de R$ 500.00 foi confirmado com sucesso",
      referenceId: 1,
      lida: false,
      criadoEm: new Date(),
    },
  ];
  return mockNotificacoes;
}

export async function getUnreadNotificationsCount(userId: number) {
  // Mock implementation
  return 0;
}

/**
 * Create a notification for a payment event
 */
export async function createNotificacao(data: {
  userId?: number;
  moradorId?: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  referenceId?: number;
  referenceType?: string;
  lida?: boolean;
}) {
  // Mock implementation - notifications are stored in memory or via webhooks
  const targetId = data.userId || data.moradorId || 0;
  console.log(`[Notification] Created: ${data.tipo} - ${data.titulo} for user ${targetId}`);
  return {
    id: Math.random(),
    ...data,
    lida: data.lida ?? false,
    criadoEm: new Date(),
  };
}

/**
 * Get notification statistics for a user
 */
export async function getNotificacoesStatistics(userId: number) {
  // Mock implementation
  return {
    totalUnread: 0,
    byType: {
      PAGAMENTO: 0,
      CHAMADO: 0,
      COMUNICADO: 0,
    },
  };
}

/**
 * Get notifications filtered by type
 */
export async function getNotificacoesByType(userId: number, tipo: string) {
  // Mock implementation
  return [];
}
