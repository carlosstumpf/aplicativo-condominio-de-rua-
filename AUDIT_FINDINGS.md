# Auditoria Completa - Problemas Identificados

## PROBLEMA CENTRAL
As 6 telas visíveis (tabs) estão quase todas usando dados MOCK/HARDCODED em vez de conectar ao backend real via tRPC.

## Telas Visíveis (6 tabs) - Status

### 1. Início (index.tsx) - PARCIALMENTE FUNCIONAL
- ✅ Chama `trpc.relatorios.resumoMes` (backend real)
- ❌ Requer autenticação (protectedProcedure) - funciona se logado
- ❌ Morador view usa dados hardcoded (R$ 150,00)

### 2. Dashboard (admin-dashboard.tsx) - 100% MOCK
- ❌ Todos os dados são hardcoded (strings estáticas)
- ❌ Nenhuma chamada tRPC ou fetch
- ❌ Botões de ação não navegam para lugar nenhum
- ❌ 6 sub-tabs internas todas com dados fake

### 3. Mensalidades (admin-fees.tsx) - PARCIALMENTE MOCK
- ❌ Precisa verificar se chama tRPC
- ❌ adminFeesRouter NÃO está registrado no appRouter principal!

### 4. Comunicados (admin-communications.tsx) - 100% MOCK
- ❌ Todos os dados são hardcoded
- ❌ Nenhuma chamada tRPC
- ❌ Botões não funcionam
- ❌ adminCommunicationsRouter NÃO está registrado no appRouter!

### 5. Notificações (notification-center.tsx) - 100% MOCK
- ❌ Listas populadas com arrays inline mock
- ❌ Nenhuma chamada tRPC
- ❌ Ações (marcar como lida, arquivar) são UI-only
- ❌ notificationsRouter NÃO está registrado no appRouter!

### 6. Config (admin-settings.tsx) - 100% MOCK
- ❌ Todos os dados hardcoded
- ❌ Nenhuma integração com backend
- ❌ Botões não funcionam

## Routers NÃO Registrados no appRouter
Os seguintes routers existem mas NÃO estão no appRouter (server/routers.ts):
- adminFeesRouter (admin-fees.ts)
- adminCommunicationsRouter (admin-communications.ts)
- notificationsRouter (notifications.ts)
- adminPermissionsRouter (admin-permissions.ts)
- adminReportsRouter (admin-reports.ts)
- billingRouter (billing.ts)
- batchBillingRouter (batch-billing.ts)
- paymentResendRouter (payment-resend.ts)
- quickRepliesRouter (quick-replies.ts)
- reminderSchedulerRouter (reminder-scheduler.ts)
- whatsappRouter (whatsapp.ts)
- whatsappSimpleRouter (whatsapp-simple.ts)
- whatsappRealRouter (whatsapp-real.ts)
- whatsappAsaasRouter (whatsapp-asaas.ts)
- aiSuggestionsRouter (ai-suggestions.ts)
- messageProcessorRouter (message-processor.ts)

## Plano de Correção (Prioridade)
1. Registrar routers necessários no appRouter
2. Reescrever Dashboard com dados reais do backend
3. Reescrever Mensalidades com CRUD real
4. Reescrever Comunicados com envio real
5. Reescrever Notificações com dados reais
6. Reescrever Config com funcionalidades reais (WhatsApp, Asaas, etc.)
