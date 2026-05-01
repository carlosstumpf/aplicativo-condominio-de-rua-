# Guia de Automação de Cobrança

## 📋 Visão Geral

Este guia descreve como funciona a rotina automática de cobrança no sistema de Gestão de Condomínio. O sistema envia notificações automáticas **3 dias antes do vencimento** e oferece múltiplas formas de pagamento (PIX, Boleto, Transferência Bancária).

## 🎯 Funcionalidades Principais

### 1. **Notificações Automáticas**
- ✅ Aviso 3 dias antes do vencimento
- ✅ Notificação de atraso para boletos não pagos
- ✅ Lembretes periódicos
- ✅ Integração com WhatsApp Flows

### 2. **Formas de Pagamento**
- ✅ **PIX**: Transferência instantânea com QR Code
- ✅ **Boleto**: Código de barras para pagar em qualquer banco
- ✅ **Transferência Bancária**: Dados da conta do condomínio

### 3. **Sincronização em Tempo Real**
- ✅ Status atualizado automaticamente via webhooks Asaas
- ✅ Confirmação instantânea de pagamento
- ✅ Histórico completo de transações

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Billing Automation                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Scheduler (A cada hora)                               │
│  ├─ Verifica cobranças com vencimento em 3 dias       │
│  ├─ Envia notificações via WhatsApp Flows             │
│  ├─ Envia notificações no app                         │
│  └─ Registra tentativas de envio                      │
│                                                         │
│  Payment Generation (Sob demanda)                      │
│  ├─ PIX: Gera QR Code via Asaas                       │
│  ├─ Boleto: Gera código de barras via Asaas           │
│  └─ Transfer: Retorna dados bancários                 │
│                                                         │
│  Webhook Receiver (Em tempo real)                      │
│  ├─ Recebe confirmação de pagamento Asaas             │
│  ├─ Atualiza status no banco de dados                 │
│  ├─ Envia confirmação para morador                    │
│  └─ Gera notificação de sucesso                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📅 Fluxo de Cobrança

### Dia 1: Criação da Cobrança
```
Admin cria cobrança para maio
├─ Data: 15 de maio
├─ Valor: R$ 500,00
├─ Descrição: Taxa de Condomínio - Maio/2026
└─ Status: Pendente
```

### Dia 12 (3 dias antes): Notificação de Aviso
```
Sistema detecta que cobrança vence em 3 dias
├─ Envia WhatsApp Flow para morador
│  └─ "Sua taxa de R$ 500 vence em 3 dias"
│     "Escolha: PIX | Boleto | Transferência"
├─ Envia notificação no app
└─ Registra tentativa de envio
```

### Dia 13-14: Morador Escolhe Forma de Pagamento
```
Morador abre WhatsApp Flow ou App
├─ Escolhe PIX
├─ Sistema gera QR Code via Asaas
├─ Morador escaneia e paga
└─ Asaas envia webhook de confirmação
```

### Dia 15: Pagamento Confirmado
```
Webhook Asaas chega ao servidor
├─ Sistema atualiza status para "Pago"
├─ Envia confirmação para morador
├─ Remove de cobranças pendentes
└─ Atualiza relatórios
```

### Dia 16+: Cobrança Atrasada
```
Se não pagou até dia 16
├─ Sistema detecta atraso
├─ Envia notificação de atraso
├─ Aumenta frequência de lembretes
└─ Registra para relatório de inadimplência
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

```bash
# .env
ASAAS_API_KEY=aac_prod_...
ASAAS_WEBHOOK_SECRET=seu_secret_...
BILLING_REMINDER_DAYS=3
BILLING_SCHEDULER_INTERVAL=3600000  # 1 hora em ms
```

### 2. Iniciar Scheduler

```typescript
import { startBillingNotificationScheduler } from "@/server/_core/billing-notification-service";

// Inicia scheduler ao iniciar servidor
startBillingNotificationScheduler(3600000); // A cada 1 hora
```

### 3. Criar Cobrança

```typescript
import { createBillingSchedule } from "@/server/_core/billing-schedule-db";

const billing = await createBillingSchedule({
  moradorId: 1,
  dueDate: new Date("2026-05-15"),
  amount: 500,
  description: "Taxa de Condomínio - Maio/2026",
});
```

## 📱 Uso no App

### Tela de Cobranças

```
┌─────────────────────────────────┐
│    Resumo de Cobranças          │
├─────────────────────────────────┤
│ Pendente: R$ 500,00             │
│ Atrasado: R$ 0,00               │
│ Total: R$ 500,00                │
├─────────────────────────────────┤
│ Cobranças                       │
│                                 │
│ Taxa Maio/2026                  │
│ Vence: 15/05/2026               │
│ R$ 500,00                       │
│ ⏳ Vence em 3 dias              │
│ [Pagar Agora]                   │
└─────────────────────────────────┘
```

### Modal de Pagamento

```
┌─────────────────────────────────┐
│ Escolha a Forma de Pagamento    │
├─────────────────────────────────┤
│ Valor: R$ 500,00                │
├─────────────────────────────────┤
│ ☐ PIX                           │
│   Transferência instantânea     │
│                                 │
│ ☐ Boleto                        │
│   Código de barras para banco   │
│                                 │
│ ☐ Transferência Bancária        │
│   Dados da conta do condomínio  │
├─────────────────────────────────┤
│ [Gerar QR Code]                 │
│ [Cancelar]                      │
└─────────────────────────────────┘
```

## 💬 WhatsApp Flows

### Flow de Pagamento

```
TELA 1: Bem-vindo
"Olá João! Sua taxa de R$ 500,00 vence em 3 dias.
Como deseja pagar?"

[PIX] [Boleto] [Transferência]

TELA 2: PIX (se escolher)
"QR Code gerado! Escaneia para pagar."
[QR Code]
"Após pagar, confirme aqui:"
[Confirmei o pagamento]

TELA 3: Confirmação
"✅ Pagamento recebido!
Obrigado por pagar sua taxa."
```

## 🔐 Segurança

### Validação de Webhook

```typescript
import { validateWebhookSignature } from "@/server/_core/asaas-webhook-endpoint";

const isValid = validateWebhookSignature(
  body,
  signature,
  process.env.ASAAS_WEBHOOK_SECRET
);

if (!isValid) {
  throw new Error("Invalid webhook signature");
}
```

### Autenticação de Usuário

- Apenas moradores autenticados podem gerar pagamentos
- Apenas admins podem criar/editar cobranças
- Apenas admins podem ver relatórios de inadimplência

## 📊 Relatórios

### Cobranças Pendentes

```
Morador | Mês | Valor | Dias até Vencer | Status
--------|-----|-------|-----------------|--------
João    | Mai | 500   | 3               | Pendente
Maria   | Mai | 500   | 3               | Pendente
Pedro   | Abr | 500   | -5              | Atrasado
```

### Taxa de Sucesso

```
Total de Cobranças: 50
Pagas: 48 (96%)
Pendentes: 1 (2%)
Atrasadas: 1 (2%)
```

## 🐛 Troubleshooting

### Problema: Notificações não estão sendo enviadas

**Solução**:
1. Verifique se scheduler está rodando
2. Verifique logs do servidor
3. Confirme credenciais Asaas

```bash
# Ver status do scheduler
curl http://localhost:3000/api/billing/scheduler-status
```

### Problema: PIX não está gerando QR Code

**Solução**:
1. Confirme credenciais Asaas
2. Verifique se cliente existe em Asaas
3. Verifique limite de requisições

### Problema: Webhook não está atualizando status

**Solução**:
1. Confirme webhook URL está correta
2. Verifique se webhook secret está correto
3. Confirme que servidor está recebendo requisições

## 🚀 Próximos Passos

1. **Integração com Email**: Enviar recibos por email
2. **Relatórios Avançados**: Gráficos de arrecadação
3. **Pagamento Parcelado**: Permitir parcelar cobranças
4. **Multa e Juros**: Calcular automaticamente
5. **Integração com Banco**: Sincronizar com extrato bancário

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com o suporte técnico.

---

**Última atualização**: 27 de abril de 2026
**Versão**: 1.0.0
