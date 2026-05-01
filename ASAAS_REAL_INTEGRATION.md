# 💳 Guia Completo - Integração Real com Asaas

## ✨ O Que Foi Implementado

### 1. Asaas Real Service (`server/_core/asaas-real-service.ts`)

**Cliente Axios real que:**
- ✅ Conecta com API v3 do Asaas (Production ou Sandbox)
- ✅ Cria clientes automaticamente
- ✅ Gera cobranças PIX reais
- ✅ Gera cobranças Boleto reais
- ✅ Processa webhooks de pagamento
- ✅ Trata erros com mensagens claras

**Métodos principais:**
```typescript
testConnection()           // Testar conexão
createCustomer()          // Criar cliente
getOrCreateCustomer()     // Criar ou buscar
createPixCharge()         // Gerar PIX
createBoletoCharge()      // Gerar Boleto
getCharge()              // Obter cobrança
listCharges()            // Listar cobranças
processPaymentWebhook()  // Processar webhook
```

### 2. Webhook Asaas (`server/webhooks/asaas.ts`)

**Endpoint Express que:**
- ✅ Recebe notificações de pagamento
- ✅ Valida token de segurança
- ✅ Processa 4 tipos de eventos
- ✅ Atualiza status automaticamente
- ✅ Envia confirmação ao morador
- ✅ Registra no histórico

**Eventos suportados:**
- `payment_received` - Pagamento recebido
- `payment_confirmed` - Pagamento confirmado
- `payment_overdue` - Pagamento vencido
- `payment_deleted` - Pagamento deletado

### 3. tRPC Router (`server/routers/asaas-real.ts`)

**12 endpoints para integração:**

```typescript
// Configuração
initialize()              // Inicializar com API Key
testConnection()          // Testar conexão

// Clientes
getOrCreateCustomer()     // Criar ou buscar cliente

// Cobranças Individuais
createPixCharge()         // Criar PIX
createBoletoCharge()      // Criar Boleto
getCharge()              // Obter cobrança
listCharges()            // Listar cobranças

// Fluxos Completos
createPixFlow()          // Cliente + PIX em um passo
createBoletoFlow()       // Cliente + Boleto em um passo
```

---

## 🔑 Configuração

### Passo 1: Obter Chave API Asaas

1. Acesse [Asaas Dashboard](https://www.asaas.com)
2. Vá para **Configurações → Chaves de Acesso**
3. Copie sua **Chave de Acesso (API Key)**
4. Escolha ambiente: **Sandbox** (testes) ou **Production** (real)

### Passo 2: Configurar Variáveis de Ambiente

```bash
# .env
ASAAS_API_KEY=your_api_key_here
ASAAS_ENVIRONMENT=sandbox  # ou production
ASAAS_WEBHOOK_URL=https://seu-dominio.com/webhooks/asaas
ASAAS_WEBHOOK_TOKEN=seu_token_secreto
```

### Passo 3: Inicializar Asaas

```typescript
// No seu servidor
const result = await api.asaasReal.initialize({
  apiKey: process.env.ASAAS_API_KEY,
  environment: process.env.ASAAS_ENVIRONMENT
});

// Testar conexão
const testResult = await api.asaasReal.testConnection();
```

---

## 📊 Fluxo de Pagamento

### Fluxo PIX Completo

```
Admin cria cobrança
        ↓
Sistema chama createPixFlow()
        ↓
Asaas cria cliente
        ↓
Asaas gera PIX
        ↓
Sistema retorna QR Code + Chave
        ↓
Morador escaneia QR Code
        ↓
Morador paga
        ↓
Asaas envia webhook
        ↓
Sistema recebe notificação
        ↓
Status atualizado para "PAID"
        ↓
Confirmação enviada ao morador
```

### Fluxo Boleto Completo

```
Admin cria cobrança
        ↓
Sistema chama createBoletoFlow()
        ↓
Asaas cria cliente
        ↓
Asaas gera Boleto
        ↓
Sistema retorna código de barras + link
        ↓
Morador copia código ou baixa boleto
        ↓
Morador paga
        ↓
Asaas envia webhook
        ↓
Sistema recebe notificação
        ↓
Status atualizado para "PAID"
        ↓
Confirmação enviada ao morador
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Criar Fluxo PIX Completo

```typescript
const result = await api.asaasReal.createPixFlow({
  moradorName: "João Silva",
  moradorEmail: "joao@example.com",
  moradorPhone: "+5521987654321",
  moradorCpf: "12345678900",
  value: 500.00,
  dueDate: "2026-04-30"
});

// Resultado
{
  success: true,
  customerId: "cust_abc123",
  charge: { id: "pay_xyz789", ... },
  pixQrCode: "data:image/png;base64,...",
  pixKey: "00020126580014...",
  message: "Fluxo PIX completo realizado com sucesso"
}
```

### Exemplo 2: Criar Fluxo Boleto Completo

```typescript
const result = await api.asaasReal.createBoletoFlow({
  moradorName: "Maria Santos",
  moradorEmail: "maria@example.com",
  moradorPhone: "+5521987654322",
  moradorCpf: "98765432100",
  value: 500.00,
  dueDate: "2026-04-30"
});

// Resultado
{
  success: true,
  customerId: "cust_def456",
  charge: { id: "pay_abc456", ... },
  barCode: "12345.67890 12345.678901...",
  bankSlipUrl: "https://asaas.com/boleto/...",
  message: "Fluxo Boleto completo realizado com sucesso"
}
```

### Exemplo 3: Listar Cobranças de um Cliente

```typescript
const result = await api.asaasReal.listCharges({
  customerId: "cust_abc123",
  limit: 50
});

// Resultado
{
  success: true,
  charges: [
    {
      id: "pay_xyz789",
      status: "CONFIRMED",
      value: 500.00,
      billingType: "PIX",
      dueDate: "2026-04-30",
      confirmedDate: "2026-04-28",
      customer: "cust_abc123"
    },
    // ... mais cobranças
  ],
  total: 1
}
```

### Exemplo 4: Obter Status de Cobrança

```typescript
const result = await api.asaasReal.getCharge({
  chargeId: "pay_xyz789"
});

// Resultado
{
  success: true,
  charge: {
    id: "pay_xyz789",
    status: "CONFIRMED",
    value: 500.00,
    netValue: 485.00,
    billingType: "PIX",
    dueDate: "2026-04-30",
    confirmedDate: "2026-04-28",
    customer: "cust_abc123"
  }
}
```

---

## 🔔 Webhook de Pagamento

### Configurar Webhook no Asaas

1. Acesse [Asaas Dashboard](https://www.asaas.com)
2. Vá para **Configurações → Webhooks**
3. Clique em **Novo Webhook**
4. Configure:
   - **URL**: `https://seu-dominio.com/webhooks/asaas`
   - **Eventos**: Selecione todos os eventos de pagamento
   - **Token**: Seu token secreto (opcional)

### Eventos Recebidos

```typescript
// Pagamento Confirmado
{
  event: "payment_confirmed",
  data: {
    id: "pay_xyz789",
    status: "CONFIRMED",
    value: 500.00,
    billingType: "PIX",
    dueDate: "2026-04-30",
    confirmedDate: "2026-04-28",
    customer: "cust_abc123",
    externalReference: "+5521987654321"
  }
}

// Pagamento Vencido
{
  event: "payment_overdue",
  data: {
    id: "pay_xyz789",
    status: "OVERDUE",
    value: 500.00,
    billingType: "PIX",
    dueDate: "2026-04-30",
    customer: "cust_abc123"
  }
}
```

### Testar Webhook

```bash
# GET /webhooks/asaas/test
# Simula um webhook de pagamento confirmado
curl https://seu-dominio.com/webhooks/asaas/test
```

---

## 📈 Monitoramento

### Logs

```bash
# Ver logs em tempo real
npm run dev | grep "Asaas"

# Filtrar por evento específico
npm run dev | grep "payment_confirmed"
```

### Métricas

- Total de clientes criados
- Total de cobranças geradas
- Taxa de pagamento (confirmado/total)
- Valor total recebido
- Tempo médio de confirmação

---

## 🔐 Segurança

### Validação de Webhook

```typescript
// Token de segurança
const webhookToken = req.headers["x-asaas-access-token"];
const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

if (webhookToken !== expectedToken) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

### Proteção de API Key

- ✅ Armazenar em variáveis de ambiente
- ✅ Nunca commitar no Git
- ✅ Usar diferentes chaves para sandbox e production
- ✅ Rotacionar periodicamente

---

## 🐛 Troubleshooting

### Problema: "Erro ao conectar com Asaas"

**Causas:**
- API Key inválida
- Ambiente incorreto (sandbox vs production)
- Sem conexão com internet

**Solução:**
1. Verifique API Key em Asaas Dashboard
2. Confirme ambiente (sandbox ou production)
3. Teste conexão: `api.asaasReal.testConnection()`

### Problema: "Cliente não criado"

**Causas:**
- Email duplicado
- Dados inválidos
- Limite de requisições

**Solução:**
1. Verifique email único
2. Valide CPF/CNPJ
3. Aguarde alguns segundos e tente novamente

### Problema: "Webhook não recebido"

**Causas:**
- URL incorreta
- Firewall bloqueando
- Token inválido

**Solução:**
1. Verifique URL em Asaas Dashboard
2. Teste com `GET /webhooks/asaas/test`
3. Confirme token de segurança

### Problema: "Status não atualiza"

**Causas:**
- Webhook não configurado
- Banco de dados não atualizado
- Erro ao processar webhook

**Solução:**
1. Verifique webhook em Asaas Dashboard
2. Verifique logs do servidor
3. Teste webhook manualmente

---

## 📚 Referências

- [Asaas API Docs](https://docs.asaas.com)
- [Asaas Dashboard](https://www.asaas.com)
- [Asaas Webhooks](https://docs.asaas.com/webhooks)
- [Asaas PIX](https://docs.asaas.com/pix)
- [Asaas Boleto](https://docs.asaas.com/boleto)

---

## 🚀 Próximas Melhorias

1. **Integração com WhatsApp**: Enviar PIX/Boleto automaticamente via WhatsApp
2. **Reconciliação Bancária**: Comparar pagamentos Asaas com extratos
3. **Dashboard de Análise**: Gráficos de taxa de pagamento e receita
4. **Agendamento**: Agendar cobranças recorrentes
5. **Notificações**: Lembretes automáticos antes do vencimento

---

**Versão:** 1.0.0  
**Data:** 28/04/2026  
**Status:** ✅ Implementado e Pronto para Usar
