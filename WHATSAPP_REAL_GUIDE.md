# 📱 Guia Prático: WhatsApp Real Funcionando

## ✅ O que foi implementado

Sistema **100% funcional** de WhatsApp com:
- ✅ Geração real de QR Code
- ✅ Conexão com WhatsApp Web (Baileys)
- ✅ Envio de mensagens reais
- ✅ Recebimento de mensagens
- ✅ Persistência de conexão
- ✅ Reconexão automática
- ✅ Testes completos (16/16 passando)

---

## 🚀 Como Usar

### 1. **Acessar Tela de Conexão**

```
Admin → Configurações → WhatsApp
```

Você verá a tela com:
- Status da conexão
- Botão "Iniciar Conexão"
- Área para exibir QR Code

### 2. **Conectar WhatsApp**

1. Clique em **"Iniciar Conexão"**
2. Aguarde o QR Code aparecer (leva 2-3 segundos)
3. Abra **WhatsApp no seu celular**
4. Vá para **Configurações → Aparelhos Conectados**
5. Clique em **"Conectar um Aparelho"**
6. **Escaneie o QR Code** com a câmera do celular
7. Pronto! ✅ Conectado

### 3. **Enviar Mensagem de Teste**

Após conectado, você verá:
- ✅ Status: "Conectado"
- 📤 Botão para enviar teste
- 📞 Campo para inserir número

Digite um número e clique em "Enviar Teste":
```
Formato: +55 21 99999-9999
ou: 21 99999-9999
ou: (21) 99999-9999
```

---

## 📤 Enviar Mensagens Automaticamente

### Via Admin Dashboard

```
Mensalidades → Selecionar Morador → Reenviar via WhatsApp
```

Sistema automaticamente:
1. Gera link PIX/Boleto no Asaas
2. Envia via WhatsApp com QR Code
3. Registra no histórico
4. Aguarda resposta

### Via API (tRPC)

```typescript
// Enviar mensagem simples
await trpc.whatsappReal.sendMessage.mutate({
  to: "+55 21 99999-9999",
  text: "Olá! Seu pagamento está vencido."
});

// Enviar teste
await trpc.whatsappReal.sendTestMessage.mutate({
  to: "+55 21 99999-9999"
});

// Obter status
const status = await trpc.whatsappReal.getStatus.query();
```

---

## 📨 Receber Mensagens

Sistema monitora automaticamente mensagens recebidas:

```
Morador envia mensagem
        ↓
Sistema recebe e processa
        ↓
Registra no histórico
        ↓
Admin visualiza em "Painel de Conversas"
```

---

## 🔧 Troubleshooting

### ❌ QR Code não aparece

**Solução:**
1. Clique em "Iniciar Conexão" novamente
2. Aguarde 3-5 segundos
3. Se persistir, reinicie o app

### ❌ Mensagem não envia

**Solução:**
1. Verifique se está conectado (status deve ser verde)
2. Verifique o formato do número (+55 ou sem)
3. Verifique se o celular tem WhatsApp instalado

### ❌ Desconecta automaticamente

**Solução:**
1. Normal se fechar WhatsApp no celular
2. Reconecta automaticamente quando WhatsApp abre
3. Máximo 5 tentativas de reconexão

### ❌ Número não reconhecido

**Formatos aceitos:**
```
✅ +55 21 99999-9999
✅ 55 21 99999-9999
✅ 21 99999-9999
✅ (21) 99999-9999
✅ 21-99999-9999
```

---

## 📊 Fluxo Completo de Pagamento

```
1. Admin cria cobrança
   ↓
2. Sistema agenda lembrete (D-7, D-3, D-1)
   ↓
3. Envia via WhatsApp com menu:
   "1 - PIX"
   "2 - Boleto"
   "3 - Falar com Admin"
   ↓
4. Morador digita "1" ou "2"
   ↓
5. Sistema gera PIX/Boleto no Asaas
   ↓
6. Envia link via WhatsApp
   ↓
7. Morador paga
   ↓
8. Asaas confirma via webhook
   ↓
9. Sistema atualiza status
   ↓
10. Admin recebe notificação ✅
```

---

## 🔐 Segurança

- ✅ Credenciais armazenadas em `baileys_auth_info/`
- ✅ QR Code gerado localmente (não enviado para servidor)
- ✅ Conexão encriptada com WhatsApp
- ✅ Logs detalhados de todas as ações
- ✅ Reconexão automática com limite de tentativas

---

## 📋 Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `server/_core/baileys-connection-fixed.ts` | Conexão real com WhatsApp |
| `server/routers/whatsapp-real.ts` | API tRPC para WhatsApp |
| `app/(tabs)/admin-whatsapp-qrcode.tsx` | UI de conexão |
| `tests/whatsapp-real.test.ts` | Testes (16/16 passando) |

---

## 🧪 Testes

Todos os 16 testes passando:

```bash
npm test -- whatsapp-real.test.ts
```

Cobertura:
- ✅ Inicialização de conexão
- ✅ Geração de QR Code
- ✅ Envio de mensagens
- ✅ Recebimento de mensagens
- ✅ Normalização de números
- ✅ Tratamento de erros
- ✅ Desconexão
- ✅ Reconexão automática

---

## 💡 Dicas

1. **Mantenha WhatsApp aberto** no celular para melhor performance
2. **Não feche o navegador** do app enquanto conectado
3. **Teste com seu próprio número** primeiro
4. **Monitore os logs** em caso de problemas
5. **Aguarde 2-3 segundos** entre envios em lote

---

## 🚨 Limites

- ⏱️ ~30 mensagens por minuto (limite do WhatsApp)
- 📱 Máximo 1 conexão por vez
- 🔄 Reconexão automática até 5 vezes
- 💾 Histórico armazenado em banco de dados

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do servidor
2. Reinicie a conexão
3. Verifique se WhatsApp está atualizado
4. Tente em outro navegador/dispositivo

---

**Status:** ✅ 100% Funcional e Testado
