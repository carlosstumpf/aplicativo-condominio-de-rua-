# 🚀 Implementação Baileys - Guia Completo

## ✨ O Que Foi Implementado

### Backend (Real Implementation)

**Arquivo:** `server/_core/baileys-service.ts`

```typescript
// Principais métodos:
- connect() - Conecta ao WhatsApp Web
- disconnect() - Desconecta
- sendMessage() - Envia mensagem de texto
- sendMenu() - Envia menu interativo
- getQRCode() - Obtém QR Code para escanear
- getStatus() - Obtém status da conexão
- testConnection() - Testa conectividade
- processMessage() - Processa mensagens recebidas
- registerAutoReply() - Registra auto-respostas
```

**Características:**
- ✅ Geração automática de QR Code
- ✅ Monitoramento de mensagens em tempo real
- ✅ Auto-respostas configuráveis
- ✅ Logging detalhado com Pino
- ✅ Persistência de credenciais
- ✅ Reconexão automática
- ✅ Tratamento de erros robusto

### Frontend (UI)

**Arquivo:** `app/(tabs)/admin-whatsapp-connect.tsx`

```typescript
// Componentes:
- Status Card - Mostra conexão (Conectado/Desconectado)
- QR Code Display - Exibe QR Code para escanear
- Connection Info - Informações da conexão
- Action Buttons - Conectar/Desconectar
- FAQ Section - Perguntas frequentes
```

**Funcionalidades:**
- ✅ Exibição visual do QR Code
- ✅ Status em tempo real
- ✅ Instruções de escanamento
- ✅ Atualização automática
- ✅ Tratamento de erros

### API (tRPC)

**Arquivo:** `server/routers/baileys.ts`

```typescript
// Endpoints:
- connect() - Iniciar conexão
- disconnect() - Desconectar
- getQRCode() - Obter QR Code
- getStatus() - Verificar status
- testConnection() - Testar conexão
- sendMessage() - Enviar mensagem
- sendMenu() - Enviar menu
- sendPaymentMessage() - Enviar pagamento
- sendPaymentMenu() - Enviar menu de pagamento
- registerAutoReply() - Registrar auto-resposta
- removeAutoReply() - Remover auto-resposta
- sendBulk() - Enviar em lote
```

---

## 🔧 Instalação de Dependências

Já instaladas:
```bash
npm install @whiskeysockets/baileys qrcode pino pino-pretty
```

### Versões:
- `@whiskeysockets/baileys`: ^6.x (WhatsApp Web simulation)
- `qrcode`: ^1.5.x (QR Code generation)
- `pino`: ^8.x (Logging)
- `pino-pretty`: ^10.x (Pretty logging)

---

## 📱 Fluxo de Conexão

```
1. Admin clica em "Conectar WhatsApp"
        ↓
2. Sistema inicializa Baileys
        ↓
3. Gera QR Code
        ↓
4. Exibe QR Code na tela
        ↓
5. Admin escaneia com celular
        ↓
6. WhatsApp valida
        ↓
7. Conexão estabelecida ✅
        ↓
8. Sistema pronto para enviar/receber mensagens
```

---

## 🎯 Como Usar

### 1. Conectar WhatsApp

```typescript
// Frontend
const result = await api.baileys.connect({
  phoneNumber: "+55 21 99823-1962"
});

// Resposta
{
  success: true,
  message: "Conectando ao WhatsApp...",
  status: {
    connected: false,
    phoneNumber: "5521999231962",
    autoReplies: 0,
    hasQRCode: true
  }
}
```

### 2. Obter QR Code

```typescript
const result = await api.baileys.getQRCode();

// Resposta
{
  success: true,
  qrCode: "data:image/png;base64,...",
  timestamp: 1234567890,
  connected: false
}
```

### 3. Verificar Status

```typescript
const result = await api.baileys.getStatus();

// Resposta
{
  success: true,
  status: {
    connected: true,
    phoneNumber: "5521999231962",
    autoReplies: 3,
    hasQRCode: false
  }
}
```

### 4. Enviar Mensagem

```typescript
const result = await api.baileys.sendMessage({
  to: "5521987654321",
  text: "Olá! Sua mensalidade venceu."
});

// Resposta
{
  success: true,
  messageId: "msg_abc123"
}
```

### 5. Enviar Menu

```typescript
const result = await api.baileys.sendMenu({
  to: "5521987654321",
  title: "Escolha uma opção:",
  options: [
    {
      number: 1,
      label: "Pagar com PIX",
      action: "payment_pix",
      description: "Escaneie o QR Code"
    },
    {
      number: 2,
      label: "Pagar com Boleto",
      action: "payment_boleto",
      description: "Copie o código"
    }
  ]
});

// Resposta
{
  success: true,
  messageId: "menu_abc123"
}
```

### 6. Registrar Auto-Resposta

```typescript
const result = await api.baileys.registerAutoReply({
  trigger: "mensalidade",
  menu: [
    {
      number: 1,
      label: "Pagar com PIX",
      action: "payment_pix"
    },
    {
      number: 2,
      label: "Pagar com Boleto",
      action: "payment_boleto"
    }
  ]
});

// Agora quando morador enviar "mensalidade", sistema responde com menu
```

---

## 📊 Estrutura de Dados

### QR Code Data
```typescript
interface QRCodeData {
  qrCode: string;        // Data URL da imagem
  timestamp: number;     // Quando foi gerado
  connected: boolean;    // Se já conectou
}
```

### WhatsApp Message
```typescript
interface WhatsAppMessage {
  from: string;          // Número do remetente
  to: string;            // Número do destinatário
  text: string;          // Conteúdo
  timestamp: number;     // Quando chegou
  messageId: string;     // ID único
  isGroup?: boolean;     // Se é grupo
}
```

### Menu Option
```typescript
interface MenuOption {
  number: number;        // Número da opção (1, 2, 3)
  label: string;         // Texto exibido
  action: string;        // Ação a executar
  description?: string;  // Descrição extra
}
```

---

## 🔐 Armazenamento de Credenciais

Baileys armazena credenciais em:
```
/home/ubuntu/gestao-condominio-rua/auth_info/
├── creds.json          # Credenciais criptografadas
├── pre-keys/           # Pre-keys
├── sessions/           # Sessions
└── sender-keys/        # Sender keys
```

**Segurança:**
- ✅ Credenciais criptografadas
- ✅ Não armazenadas em banco de dados
- ✅ Isoladas por instância
- ✅ Limpas ao desconectar

---

## 🧪 Testando

### Teste 1: Conectar

```bash
# No app, clique em "Conectar WhatsApp"
# Escaneie o QR Code com seu celular
# Deve aparecer "Conectado ✅"
```

### Teste 2: Enviar Mensagem

```bash
# Vá para Mensalidades
# Clique em um pagamento
# Clique "Enviar via WhatsApp"
# Escolha um número de teste
# Deve receber a mensagem
```

### Teste 3: Auto-Resposta

```bash
# Envie mensagem para seu número: "mensalidade"
# Sistema deve responder com menu
# Escolha opção 1, 2 ou 3
# Sistema processa a escolha
```

### Teste 4: Menu Interativo

```bash
# Vá para Comunicados
# Clique "Novo Comunicado"
# Escolha "Menu Interativo"
# Selecione moradores
# Envie
# Moradores recebem menu
```

---

## 🐛 Troubleshooting

### Problema: "QR Code não aparece"

**Causas:**
- Baileys não inicializou
- Erro ao gerar QR Code
- Conexão com internet fraca

**Solução:**
1. Verifique logs: `npm run dev`
2. Tente reconectar
3. Limpe cache: `rm -rf auth_info/`
4. Reinicie o app

### Problema: "Mensagem não chega"

**Causas:**
- WhatsApp não conectado
- Número inválido
- Limite de mensagens

**Solução:**
1. Verifique status: `getStatus()`
2. Confirme número: `+55 21 99823-1962`
3. Tente testar conexão: `testConnection()`
4. Aguarde alguns segundos

### Problema: "Desconecta automaticamente"

**Causas:**
- Sessão expirou
- Outro dispositivo conectou
- Erro na conexão

**Solução:**
1. Reconecte (escanear QR novamente)
2. Verifique se outro dispositivo está usando
3. Limpe cache: `rm -rf auth_info/`

### Problema: "Erro ao escanear QR Code"

**Causas:**
- QR Code expirou (5 minutos)
- Câmera não focou bem
- WhatsApp desatualizado

**Solução:**
1. Clique "Atualizar" para novo QR Code
2. Tente escanear novamente
3. Atualize WhatsApp
4. Tente com câmera melhor

---

## 📈 Monitoramento

### Logs

```bash
# Ver logs em tempo real
npm run dev

# Filtrar por [Baileys]
npm run dev | grep Baileys
```

### Status

```typescript
// Verificar status a qualquer momento
const status = await api.baileys.getStatus();
console.log(status);

// Resposta
{
  connected: true,
  phoneNumber: "5521999231962",
  autoReplies: 3,
  hasQRCode: false
}
```

### Métricas

- Total de mensagens enviadas
- Taxa de sucesso
- Tempo de resposta
- Erros por tipo

---

## 🚀 Próximas Melhorias

1. **Webhook de Mensagens** - Processar mensagens em tempo real
2. **Dashboard de Conversas** - Visualizar histórico
3. **Agendamento** - Agendar mensagens
4. **Múltiplos Números** - Usar vários números
5. **Integração com CRM** - Sincronizar dados

---

## 📚 Referências

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Web Protocol](https://github.com/WhiskeySockets/Baileys/wiki)
- [QR Code Docs](https://www.npmjs.com/package/qrcode)
- [Pino Logger](https://getpino.io/)

---

**Versão:** 2.0.0  
**Data:** 28/04/2026  
**Status:** ✅ Implementado e Testado
