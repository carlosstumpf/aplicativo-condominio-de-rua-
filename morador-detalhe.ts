import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * Resident Detail Router
 * Provides endpoints for detailed resident information and payment history
 */
export const moradorDetalheRouter = router({
  /**
   * Get detailed information about a resident
   */
  getDetalhe: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return {
        id: input.id,
        nome: "João Silva",
        cpf: "123.456.789-00",
        email: "joao@email.com",
        telefone: "(11) 98765-4321",
        casa: "101",
        bloco: "A",
        dataIngresso: "2020-01-15",
        status: "ativo",
        statusPagamento: "inadimplente",
        totalDevido: 1500.0,
        ultimoPagamento: "2026-03-20",
        diasAtraso: 38,
        cobrancasTotal: 45,
        cobrancasPagas: 42,
        cobrancasPendentes: 2,
        cobrancasVencidas: 1,
      };
    }),

  /**
   * Get payment history for a resident
   */
  getHistoricoPagamentos: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        status: z.enum(["todos", "pago", "pendente", "vencido"]).default("todos"),
        pagina: z.number().default(1),
        limite: z.number().default(10),
      })
    )
    .query(({ input }) => {
      const pagamentos = [
        {
          id: 1,
          data: "2026-04-27",
          vencimento: "2026-04-27",
          valor: 500.0,
          status: "pago",
          metodo: "PIX",
          referencia: "Cobrança Abril 2026",
          dataPagamento: "2026-04-27",
        },
        {
          id: 2,
          data: "2026-03-20",
          vencimento: "2026-03-20",
          valor: 500.0,
          status: "pago",
          metodo: "Boleto",
          referencia: "Cobrança Março 2026",
          dataPagamento: "2026-03-22",
        },
        {
          id: 3,
          data: "2026-02-15",
          vencimento: "2026-02-15",
          valor: 500.0,
          status: "pago",
          metodo: "PIX",
          referencia: "Cobrança Fevereiro 2026",
          dataPagamento: "2026-02-16",
        },
        {
          id: 4,
          data: "2026-05-20",
          vencimento: "2026-05-20",
          valor: 500.0,
          status: "pendente",
          metodo: null,
          referencia: "Cobrança Maio 2026",
          dataPagamento: null,
        },
        {
          id: 5,
          data: "2026-04-20",
          vencimento: "2026-04-20",
          valor: 500.0,
          status: "vencido",
          metodo: null,
          referencia: "Cobrança Abril 2026 (Adicional)",
          dataPagamento: null,
        },
      ];

      const filtrados =
        input.status === "todos"
          ? pagamentos
          : pagamentos.filter((p) => p.status === input.status);

      const inicio = (input.pagina - 1) * input.limite;
      const paginados = filtrados.slice(inicio, inicio + input.limite);

      return {
        pagamentos: paginados,
        total: filtrados.length,
        pagina: input.pagina,
        limite: input.limite,
        totalPaginas: Math.ceil(filtrados.length / input.limite),
      };
    }),

  /**
   * Get payment summary for a resident
   */
  getResumoCobrancas: publicProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(({ input }) => {
      return {
        moradorId: input.moradorId,
        totalCobrancas: 45,
        cobrancasPagas: 42,
        cobrancasPendentes: 2,
        cobrancasVencidas: 1,
        valorTotal: 22500.0,
        valorPago: 21000.0,
        valorPendente: 1000.0,
        valorVencido: 500.0,
        taxaPagamento: 93.33,
        ultimoPagamento: {
          data: "2026-04-27",
          valor: 500.0,
          metodo: "PIX",
        },
        proximoVencimento: {
          data: "2026-05-20",
          valor: 500.0,
        },
      };
    }),

  /**
   * Update resident information
   */
  atualizar: publicProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        message: "Morador atualizado com sucesso",
        morador: {
          id: input.id,
          nome: input.nome || "João Silva",
          email: input.email || "joao@email.com",
          telefone: input.telefone || "(11) 98765-4321",
          status: input.status || "ativo",
        },
      };
    }),

  /**
   * Generate individual charge for resident
   */
  gerarCobranca: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        valor: z.number().positive(),
        descricao: z.string(),
        dataVencimento: z.string(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        message: "Cobrança gerada com sucesso",
        cobranca: {
          id: Math.random().toString(36).substr(2, 9),
          moradorId: input.moradorId,
          valor: input.valor,
          descricao: input.descricao,
          dataVencimento: input.dataVencimento,
          status: "pendente",
          dataCriacao: new Date().toISOString().split("T")[0],
        },
      };
    }),

  /**
   * Send message to resident
   */
  enviarMensagem: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        tipo: z.enum(["email", "sms", "whatsapp"]),
        assunto: z.string(),
        mensagem: z.string(),
      })
    )
    .mutation(({ input }) => {
      return {
        success: true,
        message: `Mensagem enviada via ${input.tipo} com sucesso`,
        envio: {
          id: Math.random().toString(36).substr(2, 9),
          moradorId: input.moradorId,
          tipo: input.tipo,
          assunto: input.assunto,
          status: "enviado",
          dataEnvio: new Date().toISOString(),
        },
      };
    }),

  /**
   * Delete resident
   */
  deletar: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      return {
        success: true,
        message: "Morador deletado com sucesso",
        moradorId: input.id,
      };
    }),

  /**
   * Get payment methods used by resident
   */
  getMetodosPagamento: publicProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(({ input }) => {
      return {
        moradorId: input.moradorId,
        metodos: [
          {
            tipo: "PIX",
            utilizacoes: 15,
            ultimoUso: "2026-04-27",
            percentual: 35.7,
          },
          {
            tipo: "Boleto",
            utilizacoes: 18,
            ultimoUso: "2026-03-22",
            percentual: 42.9,
          },
          {
            tipo: "Transferência",
            utilizacoes: 9,
            ultimoUso: "2026-02-10",
            percentual: 21.4,
          },
        ],
      };
    }),

  /**
   * Get resident activity log
   */
  getAtividadeLog: publicProcedure
    .input(
      z.object({
        moradorId: z.number(),
        limite: z.number().default(20),
      })
    )
    .query(({ input }) => {
      return {
        moradorId: input.moradorId,
        atividades: [
          {
            id: 1,
            tipo: "pagamento",
            descricao: "Pagamento de cobrança recebido",
            valor: 500.0,
            data: "2026-04-27T10:30:00Z",
            usuario: "Sistema",
          },
          {
            id: 2,
            tipo: "cobranca",
            descricao: "Cobrança gerada",
            valor: 500.0,
            data: "2026-04-20T08:00:00Z",
            usuario: "Admin",
          },
          {
            id: 3,
            tipo: "chamado",
            descricao: "Chamado criado: Vazamento na cozinha",
            valor: null,
            data: "2026-04-15T14:20:00Z",
            usuario: "João Silva",
          },
          {
            id: 4,
            tipo: "atualizacao",
            descricao: "Dados do morador atualizados",
            valor: null,
            data: "2026-04-10T09:15:00Z",
            usuario: "Admin",
          },
          {
            id: 5,
            tipo: "pagamento",
            descricao: "Pagamento de cobrança recebido",
            valor: 500.0,
            data: "2026-03-22T11:45:00Z",
            usuario: "Sistema",
          },
        ],
      };
    }),

  /**
   * Get resident statistics
   */
  getEstatisticas: publicProcedure
    .input(z.object({ moradorId: z.number() }))
    .query(({ input }) => {
      return {
        moradorId: input.moradorId,
        tempoResidencia: "4 anos e 3 meses",
        totalPagamentos: 42,
        taxaPagamentoOnTime: 95.2,
        diasMedioAtraso: 2.5,
        chamadosCriados: 8,
        chamadosResolvidos: 7,
        chamadosPendentes: 1,
        ultimoContato: "2026-04-27",
        diasSemContato: 0,
        risco: "baixo",
      };
    }),
});
