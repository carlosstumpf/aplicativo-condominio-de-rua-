# Funcionalidade de Reenvio Manual de Links de Pagamento

## 📋 Visão Geral

Sistema completo para reenviar links de pagamento manualmente aos moradores através de múltiplos canais (WhatsApp, Email, SMS, App).

## 🎯 Funcionalidades

### 1. Reenvio por Canal

- **WhatsApp** - Enviar Flow com PIX/Boleto
- **Email** - Enviar link de pagamento por email
- **SMS** - Enviar código de barras via SMS
- **App** - Notificação push no app

### 2. Rastreamento

- Histórico completo de reenvios
- Status de cada tentativa (pendente, enviado, falha)
- Número de tentativas
- Motivo do reenvio
- Erros registrados

### 3. Estatísticas

- Total de reenvios
- Reenvios bem-sucedidos
- Reenvios falhados
- Taxa de sucesso por canal
- Análise por período

### 4. Ações em Lote

- Selecionar múltiplos pagamentos
- Reenviar todos de uma vez
- Rastreamento de progresso

## 🔧 Arquitetura

### Banco de Dados

```sql
CREATE TABLE payment_resends (
  id SERIAL PRIMARY KEY,
  condominio_id INTEGER NOT NULL,
  morador_id INTEGER NOT NULL,
  asaas_payment_id VARCHAR(50) NOT NULL,
  canal VARCHAR(20) NOT NULL, -- WHATSAPP, EMAIL, SMS, APP
  numero_destinatario VARCHAR(255),
  status VARCHAR(20) NOT NULL, -- pendente, enviado, falha
  motivo VARCHAR(255),
  admin_id INTEGER,
  tentativas INTEGER DEFAULT 1,
  ultima_tentativa TIMESTAMP,
  erro TEXT,
  metadados JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_resends_condominio ON payment_resends(condominio_id);
CREATE INDEX idx_payment_resends_morador ON payment_resends(morador_id);
CREATE INDEX idx_payment_resends_asaas_payment ON payment_resends(asaas_payment_id);
CREATE INDEX idx_payment_resends_status ON payment_resends(status);
CREATE INDEX idx_payment_resends_canal ON payment_resends(canal);
```

### Fluxo de Reenvio

```
Admin clica "Reenviar" no painel
        ↓
Sistema valida pagamento
        ↓
Cria registro de reenvio (status: pendente)
        ↓
Envia via canal escolhido
        ↓
Atualiza status (enviado/falha)
        ↓
Registra erro se houver
        ↓
Admin vê confirmação
```

## 📱 Interface do Painel

### Aba "Pendentes"

Mostra pagamentos que podem ser reenviados:

```
┌─────────────────────────────────────┐
│ 📋 Pagamentos Pendentes             │
├─────────────────────────────────────┤
│ ☐ João Silva                        │
│   R$ 500.00 | Vence: 10/05/2026    │
│   [💬 WhatsApp] [📧 Email]         │
├─────────────────────────────────────┤
│ ☐ Maria Santos                      │
│   R$ 300.00 | Vence: 15/05/2026    │
│   [💬 WhatsApp] [📧 Email]         │
├─────────────────────────────────────┤
│ 2 selecionado(s)                    │
│ [Reenviar em Lote]                  │
└─────────────────────────────────────┘
```

### Aba "Histórico"

Mostra todos os reenvios realizados:

```
┌─────────────────────────────────────┐
│ 📜 Histórico de Reenvios            │
├─────────────────────────────────────┤
│ 💬 WHATSAPP          [✓ Enviado]   │
│ Morador solicitou                   │
│ Tentativas: 1                       │
│ 27/04/2026 14:30                    │
├─────────────────────────────────────┤
│ 📧 EMAIL             [✗ Falha]     │
│ Link expirado                       │
│ Tentativas: 2                       │
│ Erro: Email inválido                │
│ 27/04/2026 14:25                    │
└─────────────────────────────────────┘
```

### Aba "Estatísticas"

Mostra análise de reenvios:

```
┌─────────────────────────────────────┐
│ 📊 Estatísticas                     │
├─────────────────────────────────────┤
│ Total: 150                          │
│ ✓ Enviados: 120 (80%)              │
│ ✗ Falhas: 30 (20%)                 │
│                                     │
│ Reenvios por Canal:                 │
│ 💬 WhatsApp: 45%                    │
│ 📧 Email: 30%                       │
│ 📲 App: 20%                         │
│ 📱 SMS: 5%                          │
└─────────────────────────────────────┘
```

## 🔌 API Endpoints

### Reenviar via WhatsApp

```typescript
POST /api/payment-resend/whatsapp

{
  condominioId: 1,
  moradorId: 1,
  asaasPaymentId: "pay_123456",
  numeroWhatsapp: "+55 11 99999-9999",
  flowId: "flow_pagamento_123",
  motivo: "Morador solicitou",
  adminId: 1
}

Response:
{
  sucesso: true,
  reenvioId: 1,
  messageSid: "msg_123456",
  pagamento: { ... }
}
```

### Reenviar via Email

```typescript
POST /api/payment-resend/email

{
  condominioId: 1,
  moradorId: 1,
  asaasPaymentId: "pay_123456",
  email: "joao@email.com",
  motivo: "Reenvio manual",
  adminId: 1
}

Response:
{
  sucesso: true,
  reenvioId: 1,
  email: "joao@email.com",
  pagamento: { ... }
}
```

### Reenviar via SMS

```typescript
POST /api/payment-resend/sms

{
  condominioId: 1,
  moradorId: 1,
  asaasPaymentId: "pay_123456",
  telefone: "+55 11 99999-9999",
  motivo: "Código de barras",
  adminId: 1
}

Response:
{
  sucesso: true,
  reenvioId: 1,
  telefone: "+55 11 99999-9999",
  pagamento: { ... }
}
```

### Reenviar via App

```typescript
POST /api/payment-resend/app

{
  condominioId: 1,
  moradorId: 1,
  asaasPaymentId: "pay_123456",
  motivo: "Notificação push",
  adminId: 1
}

Response:
{
  sucesso: true,
  reenvioId: 1,
  pagamento: { ... }
}
```

### Obter Histórico

```typescript
GET /api/payment-resend/history/:asaasPaymentId

Response:
{
  sucesso: true,
  total: 3,
  reenvios: [
    {
      id: 1,
      canal: "WHATSAPP",
      status: "enviado",
      motivo: "Morador solicitou",
      tentativas: 1,
      criadoEm: "2026-04-27T14:30:00Z",
      ultimaTentativa: "2026-04-27T14:30:00Z"
    },
    ...
  ]
}
```

### Obter Estatísticas

```typescript
GET /api/payment-resend/statistics/:condominioId

Response:
{
  total: 150,
  enviados: 120,
  falhas: 30,
  taxaSucesso: 80,
  porCanal: [
    { canal: "WHATSAPP", count: 67 },
    { canal: "EMAIL", count: 45 },
    { canal: "APP", count: 30 },
    { canal: "SMS", count: 8 }
  ]
}
```

### Reenviar em Lote

```typescript
POST /api/payment-resend/bulk

{
  condominioId: 1,
  pagamentos: [
    {
      moradorId: 1,
      asaasPaymentId: "pay_001",
      numeroWhatsapp: "+55 11 99999-0001",
      flowId: "flow_123"
    },
    {
      moradorId: 2,
      asaasPaymentId: "pay_002",
      numeroWhatsapp: "+55 11 99999-0002",
      flowId: "flow_123"
    }
  ],
  adminId: 1
}

Response:
{
  total: 2,
  sucessos: 2,
  falhas: 0,
  resultados: [...]
}
```

## 💾 Banco de Dados

### Tabela: payment_resends

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único |
| condominio_id | INTEGER | ID do condomínio |
| morador_id | INTEGER | ID do morador |
| asaas_payment_id | VARCHAR(50) | ID do pagamento no Asaas |
| canal | VARCHAR(20) | Canal de envio (WHATSAPP, EMAIL, SMS, APP) |
| numero_destinatario | VARCHAR(255) | Telefone, email ou ID do destinatário |
| status | VARCHAR(20) | Status (pendente, enviado, falha) |
| motivo | VARCHAR(255) | Motivo do reenvio |
| admin_id | INTEGER | ID do admin que solicitou |
| tentativas | INTEGER | Número de tentativas |
| ultima_tentativa | TIMESTAMP | Data da última tentativa |
| erro | TEXT | Mensagem de erro se houver |
| metadados | JSONB | Dados adicionais (flowId, etc) |
| criado_em | TIMESTAMP | Data de criação |
| atualizado_em | TIMESTAMP | Data de atualização |

## 🧪 Testes

### Executar Testes

```bash
npm test -- payment-resend.test.ts
```

### Cobertura de Testes

- ✅ Salvar registro de reenvio
- ✅ Atualizar status
- ✅ Rastrear tentativas
- ✅ Registrar erros
- ✅ Obter histórico
- ✅ Filtrar por status
- ✅ Filtrar por canal
- ✅ Calcular estatísticas
- ✅ Agrupar por canal
- ✅ Calcular taxa de sucesso
- ✅ Reenvios recentes
- ✅ Reenvios falhados
- ✅ Casos extremos

## 📊 Casos de Uso

### 1. Morador Solicita Reenvio

```
Morador entra em contato com admin
        ↓
Admin abre painel de reenvios
        ↓
Procura pelo morador
        ↓
Clica "Reenviar via WhatsApp"
        ↓
Sistema envia Flow com PIX/Boleto
        ↓
Morador recebe no WhatsApp
        ↓
Admin vê confirmação no histórico
```

### 2. Reenvio em Lote

```
Admin precisa reenviar para 50 moradores
        ↓
Seleciona todos os pagamentos pendentes
        ↓
Clica "Reenviar em Lote"
        ↓
Sistema envia para todos
        ↓
Admin acompanha progresso
        ↓
Vê relatório de sucesso/falha
```

### 3. Retry Automático

```
Reenvio falha (email inválido)
        ↓
Sistema registra erro
        ↓
Admin vê na aba "Falhas"
        ↓
Clica "Reenviar via SMS"
        ↓
Sistema envia código de barras
        ↓
Morador recebe e paga
```

## 🔐 Segurança

- ✅ Validação de permissões (apenas admins)
- ✅ Rastreamento de quem fez o reenvio
- ✅ Audit log de todas as ações
- ✅ Rate limiting para evitar spam
- ✅ Validação de dados de entrada

## 🐛 Troubleshooting

### Problema: "Reenvio falhou"

**Solução:**
1. Verifique o número/email do morador
2. Confirme que o pagamento existe no Asaas
3. Veja o erro específico no histórico
4. Tente outro canal

### Problema: "Status não atualiza"

**Solução:**
1. Verifique se o webhook está configurado
2. Confirme que o Asaas está enviando notificações
3. Verifique logs do servidor

### Problema: "Reenvio em lote lento"

**Solução:**
1. Reduza o número de itens por lote
2. Implemente fila de processamento
3. Use processamento assíncrono

## 📈 Próximas Melhorias

1. **Agendamento de Reenvios** - Agendar reenvios para horários específicos
2. **Templates Personalizados** - Criar mensagens customizadas por condomínio
3. **Integração com CRM** - Sincronizar com sistema de gestão de relacionamento
4. **Dashboard de Análise** - Gráficos detalhados de performance
5. **Automação de Retry** - Reenviar automaticamente após falha

---

**Versão**: 1.0.0  
**Última Atualização**: 27/04/2026  
**Status**: ✅ Pronto para Produção
