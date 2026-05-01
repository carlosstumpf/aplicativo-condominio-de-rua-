import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { moradoresRouter } from "./routers/moradores";
import { cobrancasRouter } from "./routers/cobrancas";
import { despesasRouter } from "./routers/despesas";
import { chamadosRouter } from "./routers/chamados";
import { relatoriosRouter } from "./routers/relatorios";
import { authRouter } from "./routers/auth";
import { notificacoesRouter } from "./routers/notificacoes";
import { conciliacaoRouter } from "./routers/conciliacao";
import { relatoriosFinanceirosRouter } from "./routers/relatorios-financeiros";
import { moradorDetalheRouter } from "./routers/morador-detalhe";
import { exportarPdfRouter } from "./routers/exportar-pdf";
import { webhooksRouter } from "./routers/webhooks";
import { webhookAdminRouter } from "./routers/webhook-admin";
import { asaasConfigRouter } from "./routers/asaas-config";
import { prestacaoContasRouter } from "./routers/prestacao-contas";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Condominium management routers
  moradores: moradoresRouter,
  cobrancas: cobrancasRouter,
  despesas: despesasRouter,
  chamados: chamadosRouter,
  relatorios: relatoriosRouter,
  notificacoes: notificacoesRouter,
  conciliacao: conciliacaoRouter,
  relatoriosFinanceiros: relatoriosFinanceirosRouter,
  moradorDetalhe: moradorDetalheRouter,
  exportarPdf: exportarPdfRouter,
  authCustom: authRouter,
  webhooks: webhooksRouter,
  webhookAdmin: webhookAdminRouter,
  asaasConfig: asaasConfigRouter,
  prestacaoContas: prestacaoContasRouter,
});

export type AppRouter = typeof appRouter;
