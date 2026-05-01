# Guia de Entrega Automática de Recibos de Pagamento

## Visão Geral

O sistema de entrega automática de recibos envia confirmações de pagamento aos moradores via email e WhatsApp assim que o pagamento é confirmado pelo Asaas.

## Componentes Principais

### 1. Gerador de Recibos (`payment-receipt-generator.ts`)

Gera recibos em múltiplos formatos (HTML, Texto Plano).

**Funcionalidades:**
- Geração de HTML responsivo
- Geração de texto plano
- Formatação de dados
- Geração de IDs únicos

**Uso:**
```typescript
import {
  generateHTMLReceipt,
  generatePlainTextReceipt,
  generateReceiptId,
  PaymentReceiptData,
} from "@/server/_core/payment-receipt-generator";

const receiptData: PaymentReceiptData = {
  receiptId: generateReceiptId(),
  receiptDate: new Date(),
  paymentDate: new Date(),
  moradorId: 1,
  moradorName: "João Silva",
  moradorEmail: "joao@example.com",
  moradorPhone: "+5511999999999",
  condominiumName: "Condomínio Teste",
  billingId: 1,
  billingDescription: "Mensalidade Abril",
  billingDueDate: new Date("2026-04-30"),
  amount: 500,
  paymentMethod: "pix",
  transactionId: "PIX-123456",
};

// Gerar HTML
const html = generateHTMLReceipt(receiptData);

// Gerar texto plano
const text = generatePlainTextReceipt(receiptData);
```

### 2. Serviço de Email (`payment-receipt-email.ts`)

Envia recibos via email usando Nodemailer.

**Configuração:**
```typescript
import { emailService, initializeEmailService } from "@/server/_core/payment-receipt-email";

// Inicializar com variáveis de ambiente
initializeEmailService();

// Ou configurar manualmente
emailService.initialize({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "seu-email@gmail.com",
    pass: "sua-senha",
  },
  from: {
    name: "Gestão de Condomínio",
    email: "noreply@condominio.com",
  },
});
```

**Enviar Recibo:**
```typescript
import { sendPaymentReceiptEmail } from "@/server/_core/payment-receipt-email";

const result = await sendPaymentReceiptEmail(receiptData);

if (result.success) {
  console.log("Email enviado:", result.messageId);
} else {
  console.error("Erro ao enviar email:", result.error);
}
```

**Enviar com CC/BCC:**
```typescript
import { sendPaymentReceiptEmailWithCopy } from "@/server/_core/payment-receipt-email";

const result = await sendPaymentReceiptEmailWithCopy(
  receiptData,
  ["admin1@example.com", "admin2@example.com"], // CC
  ["bcc@example.com"] // BCC
);
```

### 3. Serviço WhatsApp (`payment-receipt-whatsapp.ts`)

Envia recibos via WhatsApp usando Twilio.

**Configuração:**
```typescript
import { whatsappService } from "@/server/_core/payment-receipt-whatsapp";

// Twilio é inicializado automaticamente com variáveis de ambiente
// TWILIO_ACCOUNT_SID
// TWILIO_AUTH_TOKEN
// TWILIO_WHATSAPP_NUMBER
```

**Enviar Recibo:**
```typescript
import { sendPaymentReceiptViaWhatsApp } from "@/server/_core/payment-receipt-whatsapp";

const result = await sendPaymentReceiptViaWhatsApp(receiptData);

if (result.success) {
  console.log("WhatsApp enviado:", result.messageId);
} else {
  console.error("Erro ao enviar WhatsApp:", result.error);
}
```

**Enviar Lote:**
```typescript
import { sendBatchPaymentReceiptsViaWhatsApp } from "@/server/_core/payment-receipt-whatsapp";

const results = await sendBatchPaymentReceiptsViaWhatsApp([
  receiptData1,
  receiptData2,
  receiptData3,
]);

results.forEach((result, index) => {
  console.log(`Recibo ${index + 1}:`, result.success ? "Enviado" : "Falhou");
});
```

### 4. Webhook Handler (`payment-receipt-webhook.ts`)

Processa confirmações de pagamento e envia recibos automaticamente.

**Uso:**
```typescript
import {
  handlePaymentConfirmationAndSendReceipts,
  PaymentConfirmationWebhook,
} from "@/server/_core/payment-receipt-webhook";

const webhook: PaymentConfirmationWebhook = {
  billingId: 1,
  moradorId: 1,
  amount: 500,
  paymentMethod: "pix",
  transactionId: "PIX-123456",
  paymentDate: new Date(),
  condominiumName: "Condomínio Teste",
};

const result = await handlePaymentConfirmationAndSendReceipts(webhook, {
  sendEmail: true,
  sendWhatsApp: true,
});

console.log("Email enviado:", result.emailSent);
console.log("WhatsApp enviado:", result.whatsappSent);
```

### 5. Rastreamento de Recibos (`receipt-tracking-db.ts`)

Rastreia status de entrega de recibos.

**Criar Log:**
```typescript
import { createReceiptDeliveryLog } from "@/server/_core/receipt-tracking-db";

const log = await createReceiptDeliveryLog({
  receiptId: "REC-123456",
  billingId: 1,
  moradorId: 1,
  emailSent: true,
  whatsappSent: true,
});
```

**Obter Status:**
```typescript
import { getReceiptDeliveryStatus } from "@/server/_core/receipt-tracking-db";

const status = await getReceiptDeliveryStatus("REC-123456");

console.log("Email:", status.emailStatus); // "sent", "failed", "pending"
console.log("WhatsApp:", status.whatsappStatus);
```

**Obter Estatísticas:**
```typescript
import { getReceiptDeliveryStats } from "@/server/_core/receipt-tracking-db";

const stats = await getReceiptDeliveryStats();

console.log("Total de recibos:", stats.totalReceipts);
console.log("Taxa de sucesso (email):", stats.emailSuccessRate + "%");
console.log("Taxa de sucesso (WhatsApp):", stats.whatsappSuccessRate + "%");
console.log("Entregas falhadas:", stats.failedDeliveries);
```

## Fluxo Completo

```
1. Morador faz pagamento via PIX/Boleto
   ↓
2. Asaas envia webhook de confirmação
   ↓
3. Sistema recebe webhook
   ↓
4. handlePaymentConfirmationAndSendReceipts() é chamado
   ↓
5. Gera recibo (HTML + Texto)
   ↓
6. Envia email (se configurado)
   ↓
7. Envia WhatsApp (se configurado)
   ↓
8. Registra status de entrega
   ↓
9. Morador recebe confirmação
```

## Configuração de Ambiente

### Email (Gmail)

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app
EMAIL_FROM_NAME="Gestão de Condomínio"
EMAIL_FROM_ADDRESS=noreply@condominio.com
```

### WhatsApp (Twilio)

```bash
TWILIO_ACCOUNT_SID=seu-account-sid
TWILIO_AUTH_TOKEN=seu-auth-token
TWILIO_WHATSAPP_NUMBER=+55119999999999
TWILIO_RECEIPT_TEMPLATE_SID=seu-template-sid
```

## Exemplos de Recibos

### Email HTML

O recibo em HTML inclui:
- Logo/Header com status "✓ Pagamento Confirmado"
- Informações do condomínio
- Dados do morador
- Detalhes do pagamento
- Valor pago em destaque
- Número do recibo e data
- Footer com informações legais

### WhatsApp

Exemplo de mensagem:
```
✓ *Pagamento Confirmado*

Olá João!

Seu pagamento foi processado com sucesso.

*Detalhes do Recibo:*
• Número: REC-ABC123-XYZ789
• Valor: R$ 500,00
• Descrição: Mensalidade Abril
• Data do Pagamento: 27/04/2026
• Método: PIX

Obrigado! 🙏
```

## Testes

Testes unitários estão em `tests/payment-receipt-delivery.test.ts`.

```bash
# Executar testes
pnpm test payment-receipt-delivery

# Executar com coverage
pnpm test -- --coverage payment-receipt-delivery
```

## Tratamento de Erros

### Email Falhou

Se o email falhar:
1. Erro é registrado no log
2. Sistema tenta novamente (retry automático)
3. Morador ainda recebe via WhatsApp (se configurado)
4. Admin é notificado de falhas recorrentes

### WhatsApp Falhou

Se WhatsApp falhar:
1. Erro é registrado no log
2. Sistema tenta novamente
3. Morador ainda recebe via email (se configurado)
4. Admin pode reenviar manualmente

### Ambos Falharam

Se ambos falharem:
1. Erro é registrado
2. Admin é notificado
3. Recibo fica disponível no painel para download manual

## Retry Automático

O sistema tenta reenviar automaticamente:
- **1ª tentativa**: Imediato
- **2ª tentativa**: 5 minutos depois
- **3ª tentativa**: 15 minutos depois
- **4ª tentativa**: 1 hora depois
- **5ª tentativa**: 4 horas depois

Após 5 tentativas, o recibo é marcado como "falha permanente".

## Segurança

### Validação de Webhook

Todos os webhooks são validados:
- Assinatura HMAC-SHA256
- Timestamp (evita replay attacks)
- Dados obrigatórios verificados

### Dados Sensíveis

- Senhas de email não são logadas
- Tokens Twilio não são expostos
- Números de telefone são mascarados em logs

## Troubleshooting

### Email não é enviado

1. Verificar configuração de ambiente
2. Verificar logs do servidor
3. Testar conexão SMTP manualmente
4. Verificar se "Aplicativos menos seguros" está ativado (Gmail)

### WhatsApp não é enviado

1. Verificar credenciais Twilio
2. Verificar número de telefone do morador
3. Verificar se número está registrado no Twilio
4. Testar com número de teste Twilio

### Recibos não aparecem no histórico

1. Verificar se banco de dados está funcionando
2. Verificar logs de erro
3. Executar sincronização manual

## Próximos Passos

1. **Agendamento**: Agendar reenvios para horários específicos
2. **Templates Personalizados**: Permitir customização de templates
3. **Múltiplos Idiomas**: Suporte para português, inglês, espanhol
4. **PDF**: Gerar recibos em PDF além de HTML
5. **Assinatura Digital**: Assinar recibos digitalmente

## Suporte

Para dúvidas ou problemas, contate o time de desenvolvimento.
