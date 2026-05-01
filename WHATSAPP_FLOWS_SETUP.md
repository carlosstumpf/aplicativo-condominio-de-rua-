# WhatsApp Flows + Asaas Integration Guide

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Setup Inicial](#setup-inicial)
4. [Configuração do WhatsApp](#configuração-do-whatsapp)
5. [Implementação](#implementação)
6. [Testes](#testes)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

WhatsApp Flows permite criar formulários interativos dentro do WhatsApp sem cobrar por mensagens. Integrado com Asaas, permite que moradores:

- ✅ Solicitar PIX/Boleto para pagar taxa
- ✅ Relatar problemas de manutenção
- ✅ Consultar saldo/débitos
- ✅ Obter suporte

**Fluxo Completo**:
```
Morador recebe mensagem no WhatsApp
    ↓
Clica em botão "Abrir Formulário"
    ↓
Preenche Flow (formulário interativo)
    ↓
Dados vão para seu servidor
    ↓
Sistema cria PIX/Boleto no Asaas
    ↓
Morador recebe confirmação com QR Code
    ↓
Paga e recebe confirmação automática
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     WhatsApp Business                        │
│  (Flows, Mensagens, Webhooks)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Seu Servidor                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Webhook Receiver (whatsapp-flows-webhook.ts)       │   │
│  │  - Valida assinatura HMAC-SHA256                     │   │
│  │  - Processa submissões de flows                      │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────↓─────────────────────────────────────┐   │
│  │  Flow Processor (whatsapp-flows-processor.ts)        │   │
│  │  - Identifica morador                                │   │
│  │  - Roteia para handler específico                    │   │
│  │  - Executa ações (pagamento, manutenção, etc)       │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────↓─────────────────────────────────────┐   │
│  │  Asaas Integration (whatsapp-flows-asaas.ts)        │   │
│  │  - Cria cobrança                                     │   │
│  │  - Gera PIX QR Code                                 │   │
│  │  - Gera Boleto                                       │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│  ┌────────────────↓─────────────────────────────────────┐   │
│  │  Sync Manager (whatsapp-flows-sync.ts)              │   │
│  │  - Sincroniza dados com app mobile                  │   │
│  │  - Envia notificações push                           │   │
│  │  - Registra auditoria                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Banco de Dados                            │
│  - Cobrançasgeradas via flows                              │
│  - Histórico de sincronização                              │
│  - Eventos de auditoria                                    │
└─────────────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Asaas API                                │
│  - Criar cobrança                                          │
│  - Gerar PIX                                               │
│  - Gerar Boleto                                            │
│  - Webhooks de pagamento                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Inicial

### Pré-requisitos

- ✅ Conta Meta Business (WhatsApp Business)
- ✅ Conta Asaas com API configurada
- ✅ Servidor Node.js rodando
- ✅ Banco de dados PostgreSQL/MySQL

### 1. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_BUSINESS_ACCOUNT_ACCESS_TOKEN=EAABsZCZBgWIBACxxx...
WHATSAPP_FLOWS_WEBHOOK_SECRET=seu_webhook_secret_aqui
WHATSAPP_FLOWS_VERIFY_TOKEN=seu_verify_token_aqui

# Asaas
ASAAS_API_KEY=aac_prod_xxx...
ASAAS_WEBHOOK_SECRET=seu_secret_asaas

# Servidor
SERVER_URL=https://seu-dominio.com
WEBHOOK_URL=https://seu-dominio.com/api/webhooks/whatsapp-flows
```

### 2. Registrar Webhook no Meta

1. Acesse [Meta App Dashboard](https://developers.facebook.com)
2. Vá para seu app → WhatsApp → Configuração
3. Em "Webhooks", adicione:
   - **URL de Callback**: `https://seu-dominio.com/api/webhooks/whatsapp-flows`
   - **Token de Verificação**: `seu_verify_token_aqui`
4. Clique em "Verificar e Salvar"

### 3. Inscrever-se em Eventos de Webhook

Na configuração de webhooks, inscreva-se em:
- `flow_request_received`
- `flow_request_completed`
- `flow_request_failed`

---

## ⚙️ Configuração do WhatsApp

### Criar Flows no Meta

Os flows são criados no Meta App Dashboard (sem código). Você pode usar os templates fornecidos:

**1. Payment Flow** (Pagamento)
- Tela 1: Bem-vindo
- Tela 2: Selecionar mês
- Tela 3: Selecionar forma de pagamento
- Tela 4: Confirmar
- Tela 5: Sucesso

**2. Maintenance Flow** (Manutenção)
- Tela 1: Bem-vindo
- Tela 2: Selecionar categoria
- Tela 3: Descrever problema
- Tela 4: Selecionar urgência
- Tela 5: Confirmar
- Tela 6: Sucesso

**3. Balance Flow** (Consultar Saldo)
- Tela 1: Carregando
- Tela 2: Exibir saldo

**4. Main Menu Flow** (Menu Principal)
- Tela 1: Menu com opções

### Enviar Flow para Morador

```bash
# Via API
curl -X POST https://graph.instagram.com/v18.0/PHONE_NUMBER_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "5511999999999",
    "type": "interactive",
    "interactive": {
      "type": "flow",
      "header": {
        "type": "text",
        "text": "Gestão de Condomínio"
      },
      "body": {
        "text": "Clique abaixo para pagar sua taxa"
      },
      "action": {
        "type": "flow",
        "flow_id": "FLOW_ID",
        "flow_cta": "Abrir",
        "flow_action": "NAVIGATE",
        "flow_action_payload": {
          "screen": "WELCOME"
        }
      }
    }
  }'
```

---

## 💻 Implementação

### 1. Registrar Webhook no Express

```typescript
// server/_core/index.ts
import whatsappFlowsRouter from "./whatsapp-flows-webhook";

app.use(whatsappFlowsRouter);
```

### 2. Processar Submissão de Flow

Quando morador submete um flow:

```typescript
// Webhook recebe dados
POST /api/webhooks/whatsapp-flows
{
  "entry": [{
    "changes": [{
      "value": {
        "webhook_event_type": "flow_request_completed",
        "from": "5511999999999",
        "flow_id": "payment_flow",
        "data": {
          "month": "2024-04",
          "payment_method": "PIX"
        }
      }
    }]
  }]
}

// Sistema processa
1. Valida assinatura HMAC-SHA256
2. Identifica morador pelo número
3. Cria cobrança no Asaas
4. Gera PIX QR Code
5. Envia resposta para Meta
6. Sincroniza com app mobile
```

### 3. Integrar com App Mobile

Na tela de flows do app:

```typescript
// app/(tabs)/whatsapp-flows.tsx
export default function WhatsAppFlowsScreen() {
  // Opção 1: Abrir flow via WhatsApp
  const handleOpenFlowViaWhatsApp = async (flowId) => {
    await fetch("/api/flows/send-whatsapp", {
      method: "POST",
      body: JSON.stringify({ flowId })
    });
  };

  // Opção 2: Abrir formulário dentro do app
  const handleOpenFlowInApp = async (flowId) => {
    const data = await fetch(`/api/flows/${flowId}/data`);
    // Renderizar formulário
  };
}
```

---

## 🧪 Testes

### 1. Testar Webhook

```bash
# Enviar evento de teste
curl -X POST http://localhost:3000/api/webhooks/whatsapp-flows \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "webhook_event_type": "flow_request_completed",
          "from": "5511999999999",
          "flow_id": "payment_flow",
          "data": {
            "month": "2024-04",
            "payment_method": "PIX"
          }
        }
      }]
    }]
  }'
```

### 2. Rodar Testes Unitários

```bash
pnpm test whatsapp-flows.test.ts
```

### 3. Testar End-to-End

1. Abra seu app mobile
2. Vá para aba "Serviços Rápidos"
3. Clique em "💰 Pagar Taxa"
4. Escolha "💬 WhatsApp"
5. Verifique seu WhatsApp
6. Preencha o formulário
7. Confirme pagamento
8. Verifique se PIX foi gerado

---

## 🔒 Segurança

### Validação de Assinatura

Todos os webhooks são assinados com HMAC-SHA256:

```typescript
function validateWebhookSignature(req, secret) {
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return signature === `sha256=${hash}`;
}
```

### Rate Limiting

Implementar rate limiting para evitar abuso:

```typescript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições por IP
});

app.use("/api/webhooks/whatsapp-flows", limiter);
```

### Validação de Dados

Sempre validar dados recebidos:

```typescript
const { validatePaymentFlowData } = require("./whatsapp-flows-asaas");

const result = validatePaymentFlowData(data);
if (!result.valid) {
  throw new Error(result.errors.join(", "));
}
```

---

## 🐛 Troubleshooting

### Webhook não recebe eventos

**Problema**: Meta não consegue acessar seu webhook

**Solução**:
1. Verifique se URL está acessível (não localhost)
2. Verifique certificado SSL
3. Verifique firewall/proxy
4. Teste com ngrok: `ngrok http 3000`

### Assinatura inválida

**Problema**: `Invalid signature` ao receber webhook

**Solução**:
1. Verifique `WHATSAPP_FLOWS_WEBHOOK_SECRET`
2. Verifique se está usando `JSON.stringify(req.body)` exato
3. Verifique se não há middleware alterando o body

### Flow não aparece no WhatsApp

**Problema**: Morador não vê o formulário

**Solução**:
1. Verifique se flow foi publicado no Meta
2. Verifique se `flow_id` está correto
3. Verifique se número tem acesso ao flow
4. Teste com número diferente

### PIX não é gerado

**Problema**: Erro ao gerar PIX após submissão

**Solução**:
1. Verifique credenciais Asaas (`ASAAS_API_KEY`)
2. Verifique se cliente existe no Asaas
3. Verifique logs do servidor
4. Teste criação de cobrança direto na API Asaas

### Sincronização não funciona

**Problema**: App não recebe notificação após pagamento

**Solução**:
1. Verifique se push notifications estão ativas
2. Verifique token do dispositivo
3. Verifique logs de sincronização
4. Teste manualmente: `forceFlowSync(moradorId)`

---

## 📊 Monitoramento

### Logs Recomendados

```typescript
// Registrar cada evento importante
console.log(`[FLOW] ${flowId} recebido de ${phoneNumber}`);
console.log(`[ASAAS] Cobrança criada: ${cobrancaId}`);
console.log(`[SYNC] Sincronizando para morador ${moradorId}`);
console.log(`[ERROR] Falha ao processar flow: ${error.message}`);
```

### Métricas para Monitorar

- Total de flows recebidos
- Taxa de sucesso/falha
- Tempo médio de processamento
- Cobrançasgeradas via flows
- Pagamentos confirmados

---

## 🎓 Exemplos de Uso

### Enviar Flow para Todos os Moradores

```typescript
const moradores = await getAllMoradores();

for (const morador of moradores) {
  await sendFlowToUser(morador.telefone, "payment_flow", {
    taxaMensal: morador.taxaMensal
  });
}
```

### Processar Pagamento Recebido

```typescript
// Webhook do Asaas
app.post("/api/webhooks/asaas", async (req) => {
  const { event, payment } = req.body;
  
  if (event === "PAYMENT_RECEIVED") {
    // Sincronizar com app
    registerFlowSyncEvent({
      type: "payment_created",
      moradorId: payment.moradorId,
      data: { cobrancaId: payment.id },
      source: "whatsapp"
    });
  }
});
```

### Consultar Status de Sincronização

```typescript
const status = getFlowSyncStatus(moradorId);

console.log(`Eventos pendentes: ${status.pendingSync.length}`);
console.log(`Última sincronização: ${status.lastSync}`);
console.log(`Sincronizando: ${status.syncInProgress}`);
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique [documentação Meta](https://developers.facebook.com/docs/whatsapp/flows)
2. Verifique [documentação Asaas](https://asaas.com/api)
3. Verifique logs do servidor
4. Contate suporte Meta/Asaas

---

**Última atualização**: Abril 2026
**Versão**: 1.0.0
