# 📱 Guia de Integração WhatsApp - Gestão de Condomínio

## 📋 Resumo Executivo

Este documento descreve como integrar WhatsApp no seu sistema de Gestão de Condomínio para que moradores possam:
- ✅ Solicitar PIX/Boleto para pagamento
- ✅ Relatar problemas e solicitar manutenção
- ✅ Receber avisos e notificações do condomínio
- ✅ Obter suporte administrativo

**Escala**: 50 moradores, ~20 mensagens/dia
**Integração**: Asaas (pagamentos) + WhatsApp Business API

---

## 🎯 Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────┐
│                  MORADORES (WhatsApp)                   │
│         Enviam mensagens pelo WhatsApp pessoal          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Mensagem recebida
                     ▼
┌─────────────────────────────────────────────────────────┐
│          WHATSAPP BUSINESS API (Meta/Twilio)            │
│     Recebe e envia mensagens programaticamente          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Webhook
                     ▼
┌─────────────────────────────────────────────────────────┐
│        NOSSA APLICAÇÃO (Gestão Condomínio)             │
├─────────────────────────────────────────────────────────┤
│  1. Recebe mensagem                                     │
│  2. Processa com IA/Chatbot                            │
│  3. Extrai intenção (pagar, manutenção, etc)          │
│  4. Executa ação apropriada                            │
│  5. Envia resposta via WhatsApp                        │
└────────┬──────────────────────────────────────────────┘
         │
    ┌────┴──────────────┬──────────────┐
    │                   │              │
    ▼                   ▼              ▼
┌─────────────┐  ┌──────────────┐  ┌──────────┐
│ Asaas API   │  │ Banco Dados  │  │ Notifs   │
│ (Pagamentos)│  │ (Registros)  │  │ (Email)  │
└─────────────┘  └──────────────┘  └──────────┘
```

---

## 🔧 Opções de Integração

### Opção 1: WhatsApp Business API (Meta) - ⭐ RECOMENDADO

**Melhor para**: Condomínios com 50+ moradores

**Características**:
- ✅ Oficial da Meta (WhatsApp)
- ✅ Suporte completo
- ✅ Escalável
- ✅ Seguro e confiável

**Custo**: R$ 0,50 - R$ 5 por mensagem (depende do tipo)

**Implementação**: 2-3 semanas

**Passos**:
1. Criar conta Business no Meta
2. Solicitar acesso à API
3. Configurar webhook
4. Implementar chatbot
5. Testar e publicar

### Opção 2: Twilio WhatsApp - ⭐ ALTERNATIVA

**Melhor para**: Integração rápida

**Características**:
- ✅ Fácil de integrar
- ✅ Suporte excelente
- ✅ Sandbox para testes
- ✅ Documentação clara

**Custo**: R$ 0,30 - R$ 0,80 por mensagem

**Implementação**: 1-2 semanas

**Passos**:
1. Criar conta Twilio
2. Ativar WhatsApp Sandbox
3. Implementar webhook
4. Testar com números
5. Migrar para produção

### Opção 3: Baileys (Simulador) - ⚠️ NÃO RECOMENDADO

**Melhor para**: Prototipagem/Testes

**Características**:
- ⚠️ Não oficial
- ⚠️ Pode ser bloqueado
- ⚠️ Sem suporte
- ⚠️ Violação de ToS

**Não recomendado para produção!**

---

## 💡 Recomendação: Twilio WhatsApp

Para seu caso (50 moradores, 20 msg/dia), recomendo **Twilio** porque:

1. **Rápido de Implementar** - Começa em 1-2 semanas
2. **Custo Baixo** - ~R$ 300-400/mês
3. **Fácil de Testar** - Sandbox gratuito
4. **Suporte Excelente** - Documentação e comunidade
5. **Escalável** - Cresce com você

---

## 📱 Arquitetura Detalhada com Twilio

### Fluxo Completo

```
1. MORADOR ENVIA MENSAGEM
   ├─ Abre WhatsApp
   ├─ Busca número do condomínio
   ├─ Escreve: "Quero pagar com PIX"
   └─ Envia

2. TWILIO RECEBE
   ├─ Recebe mensagem
   ├─ Valida número
   ├─ Envia webhook para nosso servidor
   └─ Aguarda resposta

3. NOSSA APLICAÇÃO PROCESSA
   ├─ Recebe webhook
   ├─ Extrai texto da mensagem
   ├─ Identifica morador pelo número
   ├─ Processa com IA/Chatbot
   ├─ Extrai intenção (pagar)
   └─ Executa ação

4. GERA PIX VIA ASAAS
   ├─ Cria cobrança no Asaas
   ├─ Gera QR Code PIX
   ├─ Formata mensagem
   └─ Envia para Twilio

5. TWILIO ENVIA RESPOSTA
   ├─ Recebe mensagem
   ├─ Envia para WhatsApp
   └─ Morador recebe

6. MORADOR PAGA
   ├─ Lê mensagem
   ├─ Escaneia QR Code
   ├─ Completa pagamento
   └─ Asaas confirma

7. WEBHOOK ASAAS ATUALIZA
   ├─ Recebe payment.received
   ├─ Atualiza BD
   ├─ Envia confirmação via WhatsApp
   └─ Morador vê: "✅ Pagamento Confirmado"
```

---

## 🛠️ Implementação Passo-a-Passo

### Fase 1: Configuração Twilio (1-2 dias)

#### Passo 1: Criar Conta Twilio

```
1. Ir para https://www.twilio.com
2. Clicar "Sign Up"
3. Preencher dados
4. Verificar email
5. Confirmar número de telefone
6. Receber crédito inicial (R$ 50)
```

#### Passo 2: Ativar WhatsApp Sandbox

```
1. No dashboard Twilio
2. Ir para "Messaging" → "Try it out" → "Send a WhatsApp message"
3. Clicar "Get Started"
4. Seguir instruções para conectar seu WhatsApp pessoal
5. Enviar "join <code>" para número Twilio
6. Receber confirmação
```

#### Passo 3: Obter Credenciais

```
Salvar em .env:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+5511999999999
```

#### Passo 4: Configurar Webhook

```
1. No dashboard Twilio
2. Ir para "Messaging" → "Settings" → "Webhooks"
3. URL do Webhook: https://seu-dominio.com/api/webhooks/whatsapp
4. Método: POST
5. Salvar
```

### Fase 2: Implementação Backend (3-5 dias)

#### Passo 1: Criar Módulo WhatsApp

Arquivo: `server/_core/whatsapp-handler.ts`

```typescript
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<void> {
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
    body: message,
  });
}

export async function sendWhatsAppMedia(
  phoneNumber: string,
  mediaUrl: string,
  caption?: string
): Promise<void> {
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${phoneNumber}`,
    mediaUrl: [mediaUrl],
    body: caption,
  });
}
```

#### Passo 2: Criar Webhook Endpoint

Arquivo: `server/_core/whatsapp-webhook.ts`

```typescript
import { Router, Request, Response } from "express";
import { processWhatsAppMessage } from "./whatsapp-processor";

const router = Router();

router.post("/webhooks/whatsapp", async (req: Request, res: Response) => {
  try {
    const { Body, From, To } = req.body;

    // Extrair número do morador
    const phoneNumber = From.replace("whatsapp:", "");

    // Processar mensagem
    const result = await processWhatsAppMessage(phoneNumber, Body);

    // Enviar resposta
    if (result.response) {
      await sendWhatsAppMessage(phoneNumber, result.response);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao processar WhatsApp:", error);
    res.status(500).json({ error: "Erro ao processar mensagem" });
  }
});

export default router;
```

#### Passo 3: Criar Processador de Mensagens

Arquivo: `server/_core/whatsapp-processor.ts`

```typescript
import { getMoradorByPhone } from "../db-queries";
import { createCobrancaAsaas } from "./asaas-real";

export async function processWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ response: string }> {
  try {
    // 1. Identificar morador
    const morador = await getMoradorByPhone(phoneNumber);
    if (!morador) {
      return {
        response:
          "Desculpe, não consegui identificar você. Por favor, contate o administrador.",
      };
    }

    // 2. Processar intenção da mensagem
    const intent = extractIntent(message);

    // 3. Executar ação apropriada
    switch (intent) {
      case "pagar":
        return await handlePaymentRequest(morador);

      case "manutencao":
        return await handleMaintenanceRequest(morador, message);

      case "saldo":
        return await handleBalanceQuery(morador);

      case "ajuda":
        return await handleHelpRequest();

      default:
        return await handleUnknownIntent(message);
    }
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    return {
      response: "Desculpe, ocorreu um erro. Tente novamente mais tarde.",
    };
  }
}

function extractIntent(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("pagar") ||
    lower.includes("pix") ||
    lower.includes("boleto")
  ) {
    return "pagar";
  }

  if (
    lower.includes("manutenção") ||
    lower.includes("problema") ||
    lower.includes("quebrado")
  ) {
    return "manutencao";
  }

  if (lower.includes("saldo") || lower.includes("devo")) {
    return "saldo";
  }

  if (lower.includes("ajuda") || lower.includes("help")) {
    return "ajuda";
  }

  return "unknown";
}

async function handlePaymentRequest(morador: any): Promise<{ response: string }> {
  try {
    // Criar cobrança no Asaas
    const cobranca = await createCobrancaAsaas({
      customerId: morador.asaasCustomerId,
      billingType: "PIX",
      value: morador.taxaMensal,
      dueDate: new Date().toISOString().split("T")[0],
      description: "Taxa Condominial",
    });

    // Gerar QR Code PIX
    const qrCode = await generatePixQRCode(cobranca.id);

    return {
      response: `Olá ${morador.nome}! 👋\n\nSua taxa condominial é R$ ${morador.taxaMensal.toFixed(2)}.\n\nEscaneia o QR Code abaixo para pagar com PIX:\n\n[QR Code]\n\nOu copia a chave: ${qrCode.pixKey}`,
    };
  } catch (error) {
    return {
      response:
        "Desculpe, não consegui gerar o PIX. Contate o administrador.",
    };
  }
}

async function handleMaintenanceRequest(
  morador: any,
  message: string
): Promise<{ response: string }> {
  try {
    // Registrar solicitação de manutenção
    await createMaintenanceRequest({
      moradorId: morador.id,
      description: message,
      status: "pending",
      createdAt: new Date(),
    });

    return {
      response: `Obrigado ${morador.nome}! 🔧\n\nSua solicitação de manutenção foi registrada.\n\nNosso time entrará em contato em breve.`,
    };
  } catch (error) {
    return {
      response:
        "Desculpe, não consegui registrar sua solicitação. Tente novamente.",
    };
  }
}

async function handleBalanceQuery(morador: any): Promise<{ response: string }> {
  try {
    // Buscar saldo devedor
    const cobrancas = await getCobrancasPendentes(morador.id);
    const totalDevido = cobrancas.reduce((sum, c) => sum + c.value, 0);

    if (totalDevido === 0) {
      return {
        response: `Parabéns ${morador.nome}! ✅\n\nVocê está em dia com suas taxas condominiais.`,
      };
    }

    return {
      response: `${morador.nome}, você tem R$ ${totalDevido.toFixed(2)} em aberto.\n\nDigite "pagar" para gerar um PIX.`,
    };
  } catch (error) {
    return {
      response: "Desculpe, não consegui consultar seu saldo.",
    };
  }
}

function handleHelpRequest(): Promise<{ response: string }> {
  return Promise.resolve({
    response: `Olá! 👋 Aqui está o que posso fazer:\n\n📱 *Comandos Disponíveis:*\n\n💰 *Pagar* - Gera PIX para pagamento\n🔧 *Manutenção* - Solicita reparo\n💳 *Saldo* - Consulta débitos\n❓ *Ajuda* - Mostra este menu\n\nDigite um dos comandos acima!`,
  });
}

function handleUnknownIntent(message: string): Promise<{ response: string }> {
  return Promise.resolve({
    response: `Desculpe, não entendi sua mensagem.\n\nDigite "ajuda" para ver os comandos disponíveis.`,
  });
}
```

#### Passo 4: Integrar com Banco de Dados

Adicionar a `db-queries.ts`:

```typescript
export async function getMoradorByPhone(phoneNumber: string): Promise<any> {
  return db
    .select()
    .from(moradores)
    .where(eq(moradores.telefone, phoneNumber))
    .limit(1)
    .then((rows) => rows[0]);
}

export async function getCobrancasPendentes(moradorId: number): Promise<any[]> {
  return db
    .select()
    .from(cobrancas)
    .where(
      and(
        eq(cobrancas.moradorId, moradorId),
        eq(cobrancas.status, "pending")
      )
    );
}

export async function createMaintenanceRequest(data: any): Promise<void> {
  await db.insert(manutencoes).values(data);
}
```

#### Passo 5: Registrar Webhook no Express

No `server/_core/index.ts`:

```typescript
import whatsappRouter from "./whatsapp-webhook";

app.use("/api", whatsappRouter);
```

### Fase 3: Integração com Asaas (2-3 dias)

#### Passo 1: Gerar PIX QR Code

```typescript
export async function generatePixQRCode(cobrancaId: string): Promise<any> {
  const response = await fetch(
    `${ASAAS_BASE_URL}/payments/${cobrancaId}/qr-code`,
    {
      headers: {
        Authorization: `Bearer ${ASAAS_API_KEY}`,
      },
    }
  );

  return response.json();
}
```

#### Passo 2: Enviar Confirmação de Pagamento

Quando webhook de pagamento chegar:

```typescript
export async function notifyPaymentConfirmation(
  moradorId: number,
  amount: number
): Promise<void> {
  const morador = await getMoradorById(moradorId);

  await sendWhatsAppMessage(
    morador.telefone,
    `✅ Pagamento Confirmado!\n\nValor: R$ ${amount.toFixed(2)}\nData: ${new Date().toLocaleDateString("pt-BR")}\n\nObrigado! 🙏`
  );
}
```

### Fase 4: Testes (2-3 dias)

#### Teste 1: Enviar Mensagem Simples

```typescript
import { sendWhatsAppMessage } from "./whatsapp-handler";

await sendWhatsAppMessage(
  "+5511999999999",
  "Olá! Este é um teste de WhatsApp."
);
```

#### Teste 2: Processar Mensagem Recebida

```typescript
import { processWhatsAppMessage } from "./whatsapp-processor";

const result = await processWhatsAppMessage("+5511999999999", "pagar");
console.log(result.response);
```

#### Teste 3: Fluxo Completo

1. Enviar mensagem "pagar" via WhatsApp
2. Receber PIX QR Code
3. Pagar via PIX
4. Receber confirmação

---

## 📊 Estrutura de Dados

### Adicionar à Tabela de Moradores

```sql
ALTER TABLE moradores ADD COLUMN (
  telefone VARCHAR(20),
  whatsappOptIn BOOLEAN DEFAULT true,
  lastWhatsAppMessage TIMESTAMP,
  whatsappNotifications BOOLEAN DEFAULT true
);
```

### Criar Tabela de Manutenção

```sql
CREATE TABLE manutencoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  moradorId INT NOT NULL,
  description TEXT,
  status VARCHAR(50),
  createdAt TIMESTAMP,
  resolvedAt TIMESTAMP,
  FOREIGN KEY (moradorId) REFERENCES moradores(id)
);
```

### Criar Tabela de Mensagens WhatsApp

```sql
CREATE TABLE whatsappMessages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  moradorId INT NOT NULL,
  phoneNumber VARCHAR(20),
  direction VARCHAR(10), -- 'inbound' ou 'outbound'
  message TEXT,
  status VARCHAR(50),
  createdAt TIMESTAMP,
  FOREIGN KEY (moradorId) REFERENCES moradores(id)
);
```

---

## 💬 Exemplos de Conversas

### Exemplo 1: Solicitar PIX

```
Morador: "Oi, quero pagar com PIX"

Bot: "Olá João! 👋

Sua taxa condominial é R$ 500,00.

Escaneia o QR Code abaixo para pagar com PIX:

[QR Code]

Ou copia a chave: 00020126580014br.gov.bcb.pix..."

Morador: [Escaneia QR Code e paga]

Bot: "✅ Pagamento Confirmado!

Valor: R$ 500,00
Data: 27/04/2024

Obrigado! 🙏"
```

### Exemplo 2: Solicitar Manutenção

```
Morador: "Meu chuveiro está quebrado"

Bot: "Obrigado João! 🔧

Sua solicitação de manutenção foi registrada.

Nosso time entrará em contato em breve."

[Admin recebe notificação]
Admin: "Manutenção solicitada por João - Chuveiro quebrado"
```

### Exemplo 3: Consultar Saldo

```
Morador: "Quanto devo?"

Bot: "João, você tem R$ 1.500,00 em aberto.

Digita 'pagar' para gerar um PIX."
```

---

## 🔒 Segurança

### 1. Validação de Números

```typescript
function isValidPhoneNumber(phone: string): boolean {
  // Validar formato brasileiro
  const regex = /^55\d{2}9\d{8}$/;
  return regex.test(phone);
}
```

### 2. Autenticação de Webhook

```typescript
function validateTwilioWebhook(req: Request): boolean {
  const twilio = require("twilio");
  const token = process.env.TWILIO_AUTH_TOKEN;
  const url = `https://${req.hostname}${req.originalUrl}`;

  return twilio.validateRequest(token, req.headers["x-twilio-signature"], url, req.body);
}
```

### 3. Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 mensagens por IP
});

router.post("/webhooks/whatsapp", limiter, async (req, res) => {
  // ...
});
```

### 4. Criptografia de Dados Sensíveis

```typescript
import crypto from "crypto";

function encryptPhoneNumber(phone: string): string {
  const cipher = crypto.createCipher("aes-256-cbc", process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(phone, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}
```

---

## 📈 Escalabilidade

### Para 50 Moradores (Atual)

- ✅ Twilio Sandbox (gratuito)
- ✅ 1 servidor
- ✅ Banco de dados local
- ✅ Custo: ~R$ 300-400/mês

### Para 500 Moradores

- ✅ Twilio Produção
- ✅ 2-3 servidores
- ✅ Banco de dados escalável
- ✅ Cache (Redis)
- ✅ Custo: ~R$ 3.000-4.000/mês

### Para 5.000+ Moradores

- ✅ WhatsApp Business API (Meta)
- ✅ Múltiplos servidores
- ✅ Banco de dados distribuído
- ✅ Message queue (RabbitMQ)
- ✅ Custo: ~R$ 30.000-50.000/mês

---

## ⏱️ Timeline de Implementação

```
Semana 1: Configuração Twilio + Setup Webhook
Semana 2: Implementar Processador de Mensagens
Semana 3: Integrar com Asaas
Semana 4: Testes e Ajustes
Semana 5: Deploy em Produção
```

**Total: 5 semanas**

---

## 📋 Checklist de Implementação

### Fase 1: Setup
- [ ] Criar conta Twilio
- [ ] Ativar WhatsApp Sandbox
- [ ] Obter credenciais
- [ ] Configurar webhook

### Fase 2: Backend
- [ ] Criar módulo WhatsApp
- [ ] Criar webhook endpoint
- [ ] Criar processador de mensagens
- [ ] Integrar com BD

### Fase 3: Asaas
- [ ] Gerar PIX QR Code
- [ ] Enviar confirmação de pagamento
- [ ] Testar fluxo completo

### Fase 4: Testes
- [ ] Teste unitário
- [ ] Teste de integração
- [ ] Teste de segurança
- [ ] Teste de carga

### Fase 5: Deploy
- [ ] Configurar produção
- [ ] Migrar números reais
- [ ] Monitorar
- [ ] Suporte

---

## 🚀 Próximos Passos

1. **Imediato**: Criar conta Twilio e testar sandbox
2. **Semana 1**: Implementar webhook básico
3. **Semana 2**: Integrar com Asaas
4. **Semana 3**: Testes completos
5. **Semana 4**: Deploy em produção

---

## 📚 Referências

- **Twilio WhatsApp**: https://www.twilio.com/whatsapp
- **Documentação Twilio**: https://www.twilio.com/docs/whatsapp
- **Asaas PIX**: https://docs.asaas.com/reference/pix
- **WhatsApp Business API**: https://www.whatsapp.com/business/api

---

**Criado em**: 2024-04-27
**Versão**: 1.0
**Status**: Pronto para Implementação ✅
