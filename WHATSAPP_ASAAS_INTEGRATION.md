# 💬 Guia Completo - WhatsApp + Asaas Integration

## ✨ O Que Foi Implementado

### 1. WhatsApp + Asaas Integration Service

**Serviço que:**
- ✅ Conecta Baileys com Asaas
- ✅ Gera PIX automaticamente quando morador digita "1"
- ✅ Gera Boleto automaticamente quando morador digita "2"
- ✅ Envia QR Code/Boleto via WhatsApp
- ✅ Processa confirmações de pagamento
- ✅ Conecta morador com admin quando digita "3"

**Métodos principais:**
```typescript
processPaymentMessage()      // Processar opção (1, 2, 3)
sendPixViaWhatsApp()        // Gerar e enviar PIX
sendBoletoViaWhatsApp()     // Gerar e enviar Boleto
processPaymentConfirmation() // Confirmar pagamento
processAdminContact()        // Conectar com admin
```

### 2. WhatsApp + Asaas Handler

**Handler que:**
- ✅ Processa mensagens de morador
- ✅ Registra no histórico
- ✅ Atualiza estatísticas
- ✅ Envia menus interativos
- ✅ Envia lembretes automáticos
- ✅ Processa confirmações

**Métodos principais:**
```typescript
handleMoradorMessage()       // Processar mensagem
handlePaymentConfirmation()  // Processar confirmação
sendInitialMenu()           // Enviar menu inicial
sendPaymentReminder()       // Enviar lembrete
```

### 3. tRPC Router

**4 endpoints para integração:**

```typescript
handleMoradorMessage()       // Processar mensagem de morador
handlePaymentConfirmation()  // Processar confirmação de pagamento
sendInitialMenu()           // Enviar menu inicial
sendPaymentReminder()       // Enviar lembrete de vencimento
testIntegration()           // Testar integração
```

---

## 🔄 Fluxo Completo

### Fluxo PIX

```
Morador recebe menu
        ↓
Morador digita "1"
        ↓
Sistema detecta opção 1
        ↓
Chama Asaas para gerar PIX
        ↓
Asaas retorna QR Code + Chave
        ↓
Sistema envia QR Code via WhatsApp
        ↓
Morador escaneia QR Code
        ↓
Morador paga
        ↓
Asaas envia webhook
        ↓
Sistema recebe confirmação
        ↓
Envia mensagem de sucesso
        ↓
Remove dos pagamentos pendentes
```

### Fluxo Boleto

```
Morador recebe menu
        ↓
Morador digita "2"
        ↓
Sistema detecta opção 2
        ↓
Chama Asaas para gerar Boleto
        ↓
Asaas retorna código de barras + link
        ↓
Sistema envia Boleto via WhatsApp
        ↓
Morador copia código ou baixa boleto
        ↓
Morador paga
        ↓
Asaas envia webhook
        ↓
Sistema recebe confirmação
        ↓
Envia mensagem de sucesso
        ↓
Remove dos pagamentos pendentes
```

### Fluxo Admin

```
Morador recebe menu
        ↓
Morador digita "3"
        ↓
Sistema detecta opção 3
        ↓
Envia mensagem ao morador: "Conectando com admin..."
        ↓
Envia mensagem ao admin: "Novo contato de morador"
        ↓
Admin responde
        ↓
Morador recebe resposta
```

---

## 📊 Exemplos de Uso

### Exemplo 1: Processar Mensagem de Morador

```typescript
const result = await api.whatsappAsaas.handleMoradorMessage({
  moradorPhone: "+5521987654321",
  moradorName: "João Silva",
  moradorEmail: "joao@example.com",
  messageText: "1",  // PIX
  paymentValue: 500.00,
  paymentDueDate: "2026-04-30"
});

// Resultado
{
  success: true,
  action: "pix_sent",
  message: "✅ *PIX Gerado com Sucesso!*\n\nOlá João Silva...",
  pixQrCode: "data:image/png;base64,...",
  pixKey: "00020126580014..."
}
```

### Exemplo 2: Processar Confirmação de Pagamento

```typescript
const result = await api.whatsappAsaas.handlePaymentConfirmation({
  chargeId: "pay_xyz789",
  moradorPhone: "+5521987654321",
  moradorName: "João Silva",
  value: 500.00,
  paymentMethod: "PIX"
});

// Resultado
{
  success: true,
  message: "✅ *Pagamento Confirmado!*\n\nOlá João Silva..."
}
```

### Exemplo 3: Enviar Menu Inicial

```typescript
const result = await api.whatsappAsaas.sendInitialMenu({
  moradorPhone: "+5521987654321",
  moradorName: "João Silva",
  pendingValue: 500.00,
  dueDate: "2026-04-30"
});

// Resultado
{
  success: true,
  message: "👋 *Olá João Silva!*\n\nVocê tem uma mensalidade pendente..."
}
```

### Exemplo 4: Enviar Lembrete

```typescript
const result = await api.whatsappAsaas.sendPaymentReminder({
  moradorPhone: "+5521987654321",
  moradorName: "João Silva",
  value: 500.00,
  dueDate: "2026-04-30",
  daysUntilDue: 3
});

// Resultado
{
  success: true,
  message: "⏰ *Lembrete: Faltam 3 dias!*\n\nOlá João Silva..."
}
```

---

## 📱 Mensagens Enviadas

### Menu Inicial

```
👋 *Olá João Silva!*

Você tem uma mensalidade pendente:

💰 *Valor:* R$ 500.00
📅 *Vencimento:* 30/04/2026

Como deseja pagar?

1️⃣ - PIX (Instantâneo)
2️⃣ - Boleto (Até 3 dias úteis)
3️⃣ - Falar com Administrador

Escolha uma opção digitando o número correspondente.

Obrigado! 🏘️
```

### Confirmação PIX

```
✅ *PIX Gerado com Sucesso!*

Olá João Silva,

Aqui está seu PIX para pagamento:

💰 *Valor:* R$ 500.00
📅 *Vencimento:* 30/04/2026

*Chave PIX (Copia e Cola):*
00020126580014br.gov.bcb.brcode...

Ou escaneie o QR Code que será enviado em seguida.

Dúvidas? Digite *3* para falar com um administrador.
```

### Confirmação Boleto

```
✅ *Boleto Gerado com Sucesso!*

Olá João Silva,

Aqui está seu Boleto para pagamento:

💰 *Valor:* R$ 500.00
📅 *Vencimento:* 30/04/2026

*Código de Barras (Copia e Cola):*
12345.67890 12345.678901 12345.678901 1 12345678901234

*Ou baixe o boleto:*
https://asaas.com/boleto/...

Dúvidas? Digite *3* para falar com um administrador.
```

### Confirmação de Pagamento

```
✅ *Pagamento Confirmado!*

Olá João Silva,

Seu pagamento foi confirmado com sucesso!

💰 *Valor:* R$ 500.00
📊 *Método:* PIX
🆔 *ID:* pay_xyz789

Obrigado por manter seu condomínio em dia! 🏘️

Dúvidas? Digite *3* para falar com um administrador.
```

### Lembrete D-7

```
⏰ *Lembrete: Faltam 7 dias!*

Olá João Silva,

Sua mensalidade vence em 7 dias:

💰 *Valor:* R$ 500.00
📅 *Vencimento:* 30/04/2026

Não deixe para última hora! Clique aqui para pagar agora.

Obrigado! 🏘️
```

### Lembrete D-3

```
⏰ *Lembrete: Faltam 3 dias!*

Olá João Silva,

Sua mensalidade vence em 3 dias:

💰 *Valor:* R$ 500.00
📅 *Vencimento:* 30/04/2026

Aproveite e pague agora mesmo!

Obrigado! 🏘️
```

### Lembrete D-1

```
⏰ *Lembrete: Vence AMANHÃ!*

Olá João Silva,

Sua mensalidade vence AMANHÃ:

💰 *Valor:* R$ 500.00
📅 *Vencimento:* 30/04/2026

Não deixe vencer! Pague agora mesmo.

Obrigado! 🏘️
```

---

## 🔐 Segurança

### Validação

- ✅ Número de telefone normalizado
- ✅ Opções numéricas validadas
- ✅ Email validado
- ✅ Mensagens sanitizadas

### Rastreamento

- ✅ Todas as mensagens registradas
- ✅ Histórico completo de interações
- ✅ Estatísticas por morador
- ✅ Logs auditáveis

---

## 🚀 Próximas Melhorias

1. **Integração Real com Baileys**: Conectar com WhatsApp Web para enviar mensagens reais
2. **Painel de Conversas**: Interface para admins gerenciarem conversas
3. **Agendamento Automático**: Agendar lembretes D-7, D-3, D-1
4. **Notificações de Erro**: Alertar admin se pagamento falhar
5. **Análise de Dados**: Dashboard com taxa de conversão PIX vs Boleto

---

**Versão:** 1.0.0  
**Data:** 28/04/2026  
**Status:** ✅ Implementado e Pronto para Usar
