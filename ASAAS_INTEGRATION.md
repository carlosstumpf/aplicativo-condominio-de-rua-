# Integração Real com Asaas

Este documento descreve como configurar a integração real com a API do Asaas para processar pagamentos em produção.

## Visão Geral

O aplicativo suporta dois modos de operação:

1. **Modo Mock (Desenvolvimento)** - Simula a API do Asaas sem credenciais reais
2. **Modo Real (Produção)** - Conecta à API real do Asaas com credenciais autênticas

O sistema detecta automaticamente qual modo usar baseado nas variáveis de ambiente.

## Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Aplicação Mobile/Web                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                    tRPC Client
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   tRPC Routers                              │
│  ├─ cobrancas (Pagamentos)                                  │
│  ├─ webhooks (Gerenciamento de Webhooks)                    │
│  └─ relatorios (Relatórios Financeiros)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Asaas Adapter (Camada de Abstração)            │
│  ├─ Detecta modo (Real ou Mock)                             │
│  ├─ Fornece interface unificada                             │
│  └─ Roteia para implementação apropriada                     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼─────────┐          ┌─────────▼────┐
    │ Asaas Real   │          │ Asaas Mock   │
    │ (asaas-real) │          │ (asaas-mock) │
    └────┬─────────┘          └──────────────┘
         │
    ┌────▼──────────────────────────────┐
    │  API Real do Asaas                │
    │  https://api.asaas.com/v3         │
    │  https://sandbox.asaas.com/v3     │
    └───────────────────────────────────┘
```

### Fluxo de Webhook

```
┌──────────────────────┐
│   Asaas (Servidor)   │
└──────────────┬───────┘
               │ POST /api/webhooks/asaas
               │ (com assinatura HMAC)
               │
┌──────────────▼─────────────────────────────┐
│  Webhook Endpoint (Express)                │
│  ├─ Valida assinatura                      │
│  ├─ Valida payload                         │
│  └─ Processa evento                        │
└──────────────┬─────────────────────────────┘
               │
┌──────────────▼─────────────────────────────┐
│  Webhook Handler                           │
│  ├─ Mapeia status Asaas → interno          │
│  ├─ Atualiza BD (TODO)                     │
│  ├─ Cria notificação (TODO)                │
│  └─ Registra evento                        │
└───────────────────────────────────────────┘
```

## Configuração do Ambiente

### 1. Obter Credenciais do Asaas

#### Passo 1: Criar Conta
1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Crie uma conta ou faça login
3. Acesse o Dashboard

#### Passo 2: Gerar Chave de API
1. Vá para **Configurações** → **Integrações**
2. Clique em **Gerar Nova Chave**
3. Copie a chave (formato: `aac_...`)

#### Passo 3: Gerar Secret do Webhook
1. Vá para **Configurações** → **Webhooks**
2. Clique em **Gerar Novo Secret**
3. Copie o secret (será usado para validar assinaturas)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Credenciais Asaas
ASAAS_API_KEY=aac_sua_chave_aqui
ASAAS_ENVIRONMENT=production  # ou 'sandbox' para testes
ASAAS_WEBHOOK_SECRET=seu_secret_webhook_aqui
ASAAS_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/asaas

# URL da aplicação (para gerar URLs de callback)
APP_URL=https://seu-dominio.com
```

### 3. Registrar Webhook no Asaas

Após configurar as variáveis de ambiente, registre o webhook:

```bash
# Via tRPC (recomendado)
POST /api/trpc/webhooks.register
{
  "url": "https://seu-dominio.com/api/webhooks/asaas",
  "events": [
    "payment.pending",
    "payment.confirmed",
    "payment.received",
    "payment.overdue",
    "payment.refunded",
    "payment.deleted",
    "payment.chargeback_requested",
    "payment.chargeback_dispute"
  ]
}
```

Ou manualmente no Dashboard do Asaas:
1. Vá para **Configurações** → **Webhooks**
2. Clique em **Novo Webhook**
3. Cole a URL: `https://seu-dominio.com/api/webhooks/asaas`
4. Selecione os eventos desejados
5. Salve

## Endpoints tRPC

### Cobrancas (Pagamentos)

#### Criar Cobrança
```typescript
POST /api/trpc/cobrancas.create
{
  "morador_id": "123",
  "valor": 150.00,
  "data_vencimento": "2026-05-15",
  "tipo": "PIX",  // "PIX", "BOLETO", "CREDIT_CARD"
  "descricao": "Mensalidade de Maio"
}
```

#### Listar Cobrancas
```typescript
GET /api/trpc/cobrancas.list?skip=0&take=10&status=PENDING
```

#### Obter QR Code PIX
```typescript
GET /api/trpc/cobrancas.getPixQrCode?paymentId=pay_123
```

#### Obter URL Boleto
```typescript
GET /api/trpc/cobrancas.getBankSlipUrl?paymentId=pay_123
```

### Webhooks

#### Registrar Webhook
```typescript
POST /api/trpc/webhooks.register
{
  "url": "https://seu-dominio.com/api/webhooks/asaas",
  "events": ["payment.received", "payment.overdue"]
}
```

#### Listar Webhooks
```typescript
GET /api/trpc/webhooks.list
```

#### Deletar Webhook
```typescript
POST /api/trpc/webhooks.delete
{
  "webhookId": "webhook_123"
}
```

#### Status do Webhook
```typescript
GET /api/trpc/webhooks.getStatus
```

#### Testar Webhook
```typescript
POST /api/trpc/webhooks.test
```

#### Documentação de Eventos
```typescript
GET /api/trpc/webhooks.getEventsDocs
```

## Eventos de Webhook

O sistema suporta os seguintes eventos:

| Evento | Descrição | Ação |
|--------|-----------|------|
| `payment.pending` | Cobrança criada | Registra como pendente |
| `payment.confirmed` | Cobrança confirmada | Atualiza status |
| `payment.received` | Pagamento recebido | Marca como pago, cria notificação |
| `payment.overdue` | Cobrança vencida | Marca como vencida, alerta |
| `payment.refunded` | Pagamento reembolsado | Marca como cancelado |
| `payment.deleted` | Cobrança cancelada | Remove da lista |
| `payment.chargeback_requested` | Chargeback aberto | Alerta crítico |
| `payment.chargeback_dispute` | Chargeback em disputa | Alerta crítico |

## Validação de Webhook

Cada webhook é assinado com HMAC-SHA256 usando o secret configurado.

### Validação Manual

```typescript
import crypto from "crypto";

function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}
```

### Cabeçalho de Assinatura

```
asaas-signature: 5e5cd7c3a8f4d9c1b2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
```

## Fluxo de Pagamento

### 1. Criar Cobrança

```typescript
const payment = await cobrancasRouter.create({
  morador_id: "123",
  valor: 150.00,
  data_vencimento: "2026-05-15",
  tipo: "PIX",
  descricao: "Mensalidade"
});

// Resposta
{
  id: "pay_123456",
  customer: "cus_789012",
  billingType: "PIX",
  value: 150.00,
  status: "PENDING",
  pixQrCode: "00020126...",
  pixCopyPaste: "00020126...",
  dueDate: "2026-05-15"
}
```

### 2. Exibir QR Code ou Boleto

```typescript
// Para PIX
const qrCode = await cobrancasRouter.getPixQrCode(paymentId);
// Exibir qrCode.qrCode como imagem

// Para Boleto
const slip = await cobrancasRouter.getBankSlipUrl(paymentId);
// Abrir slip.url ou exibir slip.barCode
```

### 3. Receber Webhook de Pagamento

```
POST /api/webhooks/asaas
{
  "event": "payment.received",
  "payment": {
    "id": "pay_123456",
    "status": "RECEIVED",
    "value": 150.00,
    "receivedDate": "2026-04-27"
  },
  "timestamp": 1777300234171
}
```

### 4. Processar Webhook

- Validar assinatura
- Atualizar status do pagamento no BD
- Criar notificação para o usuário
- Registrar evento para auditoria

## Tratamento de Erros

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `Invalid signature` | Secret incorreto | Verificar `ASAAS_WEBHOOK_SECRET` |
| `Customer not found` | ID do cliente inválido | Criar cliente primeiro |
| `Invalid payment` | Dados incompletos | Verificar campos obrigatórios |
| `API rate limit` | Muitas requisições | Implementar retry com backoff |

### Retry Policy

- **Asaas**: Retenta 5 vezes em caso de falha
- **Seu servidor**: Sempre retorna 200 para evitar retries
- **Processamento**: Implementar idempotência (verificar se já foi processado)

## Migração Mock → Real

### Passo 1: Verificar Código

O código já suporta ambos os modos. Nenhuma mudança é necessária.

### Passo 2: Configurar Variáveis

```bash
# Antes (Mock)
# ASAAS_API_KEY não configurada

# Depois (Real)
ASAAS_API_KEY=aac_sua_chave_real
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_SECRET=seu_secret_real
```

### Passo 3: Testar

```bash
# Verificar status
GET /api/trpc/webhooks.getStatus

# Testar webhook
POST /api/trpc/webhooks.test

# Listar webhooks registrados
GET /api/trpc/webhooks.list
```

### Passo 4: Deploy

1. Atualizar variáveis no servidor
2. Reiniciar aplicação
3. Monitorar logs de webhook
4. Testar fluxo completo de pagamento

## Monitoramento

### Logs

```bash
# Webhook recebido
[Asaas Webhook] Received event: { event: "payment.received", paymentId: "pay_123" }

# Webhook processado
[Asaas Webhook] Processing failed: ...

# Webhook registrado
[Asaas] Using REAL API (production/sandbox)
```

### Métricas

- Total de webhooks recebidos
- Taxa de sucesso/falha
- Tempo de processamento
- Eventos por tipo

## Troubleshooting

### Webhook não está sendo recebido

1. Verificar se a URL está correta
2. Verificar se o servidor está acessível externamente
3. Testar com `POST /api/webhooks/test`
4. Verificar logs do servidor

### Assinatura inválida

1. Verificar se `ASAAS_WEBHOOK_SECRET` está correto
2. Verificar se o payload não foi modificado
3. Testar com webhook de teste

### Pagamento não está sendo atualizado

1. Verificar se o webhook foi recebido (logs)
2. Verificar se a assinatura foi validada
3. Verificar se o BD foi atualizado (query)
4. Verificar se há erros no processamento

## Segurança

### Boas Práticas

1. **Nunca** exponha `ASAAS_API_KEY` no cliente
2. **Sempre** valide a assinatura do webhook
3. **Sempre** use HTTPS para webhooks
4. **Implemente** idempotência para webhooks
5. **Registre** todos os eventos para auditoria
6. **Monitore** falhas de webhook

### Variáveis de Ambiente

```bash
# Nunca commitar no git
# Usar .env.local ou secrets do servidor
ASAAS_API_KEY=aac_...
ASAAS_WEBHOOK_SECRET=...
```

## Referências

- [Documentação Asaas](https://docs.asaas.com)
- [API Reference](https://docs.asaas.com/reference)
- [Webhooks Guide](https://docs.asaas.com/docs/webhooks)
- [Sandbox Environment](https://sandbox.asaas.com)

## Suporte

Para dúvidas ou problemas:

1. Verificar logs do servidor
2. Testar com webhook de teste
3. Consultar documentação do Asaas
4. Abrir issue no repositório do projeto
