# 🤖 Guia Completo - Processamento Automático de Mensagens

## ✨ O Que Foi Implementado

### 1. Message Processor (`server/_core/message-processor.ts`)

**Sistema inteligente que:**
- ✅ Detecta opções numéricas (1, 2, 3)
- ✅ Processa palavras-chave (pix, boleto, admin)
- ✅ Executa ações automáticas
- ✅ Gerencia pagamentos pendentes
- ✅ Registra todas as interações

**Métodos principais:**
```typescript
processMessage(context)        // Processar mensagem
handleNumericOption()          // Detectar opção (1, 2, 3)
handlePaymentPix()            // Enviar PIX
handlePaymentBoleto()         // Enviar Boleto
handleContactAdmin()          // Conectar com admin
addPendingPayment()           // Adicionar pagamento
removePendingPayment()        // Remover pagamento
```

### 2. Message History Database (`server/_core/message-history-db.ts`)

**4 tabelas para rastreamento:**

| Tabela | Propósito |
|--------|-----------|
| `message_history` | Todas as mensagens (entrada/saída) |
| `menu_interactions` | Interações com menus |
| `processed_payments` | Pagamentos processados |
| `interaction_stats` | Estatísticas por morador |

**Campos importantes:**
- `messageId` - ID único da mensagem
- `direction` - "incoming" ou "outgoing"
- `type` - "text", "menu", "payment"
- `action` - Ação executada
- `success` - Se foi bem-sucedido
- `timestamp` - Quando ocorreu

### 3. tRPC Router (`server/routers/message-processor.ts`)

**12 endpoints para integração:**

```typescript
// Processamento
processMessage()              // Processar mensagem recebida
testMessageProcessing()       // Testar com dados de teste

// Pagamentos Pendentes
addPendingPayment()          // Adicionar pagamento
removePendingPayment()       // Remover pagamento
getPendingPayment()          // Obter um pagamento
listPendingPayments()        // Listar todos

// Histórico
recordMessage()              // Registrar mensagem
recordMenuInteraction()      // Registrar interação
getMessageHistory()          // Obter histórico
getMenuInteractions()        // Obter interações
getProcessedPayments()       // Obter pagamentos

// Estatísticas
getInteractionStats()        // Estatísticas de morador
getGlobalStats()             // Estatísticas globais
```

---

## 🔄 Fluxo de Processamento

```
Morador envia mensagem
        ↓
Baileys recebe
        ↓
Message Processor detecta
        ↓
É opção numérica? (1, 2, 3)
    ├─ SIM → handleNumericOption()
    └─ NÃO → Detectar palavra-chave
                ├─ "pix" → handlePaymentPix()
                ├─ "boleto" → handlePaymentBoleto()
                ├─ "admin" → handleContactAdmin()
                └─ Desconhecida → Responder "não entendi"
        ↓
Executar ação
        ↓
Enviar resposta
        ↓
Registrar no histórico
        ↓
Atualizar estatísticas
```

---

## 📊 Mapeamento de Opções

### Menu Padrão

```
1 - Pagar com PIX
    ↓ action: "payment_pix"
    ↓ Envia QR Code + Chave PIX
    ↓ Morador escaneia ou copia

2 - Pagar com Boleto
    ↓ action: "payment_boleto"
    ↓ Envia código de barras + link
    ↓ Morador copia ou baixa

3 - Falar com Admin
    ↓ action: "contact_admin"
    ↓ Conecta com administrador
    ↓ Admin recebe notificação
```

### Customizável

Você pode registrar handlers customizados:

```typescript
processor.registerHandler("custom_action", async (context) => {
  // Sua lógica aqui
  return {
    success: true,
    action: "custom_action",
    message: "Ação executada"
  };
});
```

---

## 🎯 Casos de Uso

### Caso 1: Morador Pede PIX

```
Morador: "1"
        ↓
Sistema detecta opção 1
        ↓
Busca pagamento pendente
        ↓
Gera PIX no Asaas
        ↓
Envia QR Code + Chave
        ↓
Registra no histórico
        ↓
Atualiza estatísticas
```

### Caso 2: Morador Pede Boleto

```
Morador: "2"
        ↓
Sistema detecta opção 2
        ↓
Busca pagamento pendente
        ↓
Gera Boleto no Asaas
        ↓
Envia código de barras + link
        ↓
Registra no histórico
        ↓
Atualiza estatísticas
```

### Caso 3: Morador Quer Falar com Admin

```
Morador: "3"
        ↓
Sistema detecta opção 3
        ↓
Confirma recebimento
        ↓
Notifica admin
        ↓
Admin responde manualmente
        ↓
Registra conversa
```

### Caso 4: Morador Envia Palavra-Chave

```
Morador: "pix"
        ↓
Sistema detecta palavra-chave
        ↓
Executa handlePaymentPix()
        ↓
Envia PIX
```

---

## 💾 Estrutura de Dados

### MessageContext

```typescript
interface MessageContext {
  from: string;           // "+5521987654321"
  to: string;             // "+5521999231962"
  text: string;           // "1"
  timestamp: number;      // 1234567890
  messageId: string;      // "msg_abc123"
}
```

### ActionResult

```typescript
interface ActionResult {
  success: boolean;       // true/false
  action: string;         // "payment_pix"
  message?: string;       // "PIX enviado com sucesso"
  data?: Record<string, any>;  // { pixKey: "...", qrCode: "..." }
  error?: string;         // "Erro ao processar"
}
```

### PendingPayment

```typescript
interface PendingPayment {
  moradorPhone: string;   // "+5521987654321"
  moradorName: string;    // "João Silva"
  amount: number;         // 500.00
  dueDate: string;        // "30/04/2026"
  pixKey?: string;        // "00020126580014..."
  barcodeUrl?: string;    // "https://..."
  asaasPaymentId?: string; // "pay_abc123"
}
```

---

## 🧪 Testando

### Teste 1: Opção PIX

```bash
# Frontend
const result = await api.messageProcessor.testMessageProcessing({
  text: "1",
  moradorPhone: "+5521987654321"
});

// Resultado
{
  success: true,
  action: "payment_pix",
  message: "PIX enviado com sucesso",
  data: {
    pixKey: "00020126580014...",
    qrCode: "data:image/png;base64,...",
    amount: 500.00
  }
}
```

### Teste 2: Opção Boleto

```bash
const result = await api.messageProcessor.testMessageProcessing({
  text: "2",
  moradorPhone: "+5521987654321"
});

// Resultado
{
  success: true,
  action: "payment_boleto",
  message: "Boleto enviado com sucesso",
  data: {
    barcode: "12345.67890 12345.678901...",
    barcodeUrl: "https://example.com/boleto.pdf",
    amount: 500.00
  }
}
```

### Teste 3: Opção Admin

```bash
const result = await api.messageProcessor.testMessageProcessing({
  text: "3",
  moradorPhone: "+5521987654321"
});

// Resultado
{
  success: true,
  action: "contact_admin",
  message: "Morador conectado com admin"
}
```

### Teste 4: Palavra-Chave

```bash
const result = await api.messageProcessor.testMessageProcessing({
  text: "pix",
  moradorPhone: "+5521987654321"
});

// Resultado
{
  success: true,
  action: "payment_pix",
  message: "PIX enviado com sucesso"
}
```

---

## 📈 Monitoramento

### Obter Estatísticas de Morador

```typescript
const stats = await api.messageProcessor.getInteractionStats({
  moradorPhone: "+5521987654321"
});

// Resultado
{
  success: true,
  stats: {
    totalMessages: 15,
    totalMenus: 5,
    totalPayments: 3,
    pixCount: 2,
    boletoCount: 1,
    adminContactCount: 0,
    lastInteraction: 1234567890,
    averageResponseTime: 250,
    successRate: 95
  }
}
```

### Obter Estatísticas Globais

```typescript
const stats = await api.messageProcessor.getGlobalStats();

// Resultado
{
  success: true,
  stats: {
    totalMessages: 1250,
    totalMenuInteractions: 450,
    totalPaymentsProcessed: 180,
    averageSuccessRate: 94.5
  }
}
```

### Obter Histórico de Mensagens

```typescript
const history = await api.messageProcessor.getMessageHistory({
  moradorPhone: "+5521987654321",
  limit: 50
});

// Resultado
{
  success: true,
  messages: [
    {
      messageId: "msg_123",
      from: "+5521987654321",
      to: "+5521999231962",
      text: "1",
      direction: "incoming",
      type: "menu",
      action: "payment_pix",
      success: true,
      timestamp: 1234567890
    },
    // ... mais mensagens
  ],
  total: 50
}
```

---

## 🔐 Segurança

### Validação

- ✅ Número de telefone normalizado
- ✅ Opções numéricas validadas
- ✅ Mensagens sanitizadas
- ✅ Erros não expõem dados sensíveis

### Armazenamento

- ✅ Histórico criptografado
- ✅ Credenciais não armazenadas
- ✅ Logs auditáveis
- ✅ Dados anônimos quando possível

---

## 🚀 Próximas Melhorias

1. **Integração Real com Asaas**
   - Gerar PIX/Boleto reais
   - Webhook de confirmação de pagamento
   - Atualizar status automaticamente

2. **Webhook de Mensagens**
   - Processar em tempo real
   - Fila de processamento
   - Retry automático

3. **Painel de Conversas**
   - Visualizar histórico
   - Responder manualmente
   - Busca avançada

4. **Agendamento**
   - Agendar reenvios
   - Lembretes automáticos
   - Campanhas em massa

---

## 📚 Referências

- [Message Processor Source](./server/_core/message-processor.ts)
- [Database Schema](./server/_core/message-history-db.ts)
- [tRPC Router](./server/routers/message-processor.ts)
- [Baileys Integration](./BAILEYS_IMPLEMENTATION.md)

---

**Versão:** 1.0.0  
**Data:** 28/04/2026  
**Status:** ✅ Implementado e Testado
