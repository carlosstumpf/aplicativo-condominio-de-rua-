# 📱 Guia de Setup WhatsApp com Baileys

## ✨ Como Funciona

O sistema usa **Baileys** (biblioteca que simula WhatsApp Web) para:

1. ✅ **Monitorar mensagens** que chegam no seu número
2. ✅ **Responder automaticamente** com menu de opções
3. ✅ **Processar escolhas** do morador (1 = PIX, 2 = Boleto, etc)
4. ✅ **Enviar links** de pagamento conforme escolhido

**Sem precisar de:**
- ❌ Meta Business API
- ❌ QR Code
- ❌ Credenciais da Meta
- ❌ Tokens especiais

---

## 🚀 Como Configurar em 3 Passos

### Passo 1: Abrir o App

1. Acesse o app no seu computador ou celular
2. Faça login como **Administrador**
   - Email: `admin@condominio.com`
   - Senha: `admin123`

### Passo 2: Ir para Configurações de WhatsApp

1. Clique em **Configurações** (última aba)
2. Procure por **💬 WhatsApp**
3. Clique em **Conectar WhatsApp**

### Passo 3: Conectar seu WhatsApp

1. Uma tela aparecerá com um **QR Code**
2. Abra o WhatsApp no seu celular
3. Vá para **Configurações → Aparelhos Conectados**
4. Clique em **Conectar um aparelho**
5. **Escaneie o QR Code** com seu celular
6. Pronto! Conectado! ✅

---

## 📊 Fluxo Completo

```
Morador envia mensagem para +55 21 99823-1962
        ↓
Sistema recebe a mensagem
        ↓
Responde com menu:
  1 - Pagar com PIX
  2 - Pagar com Boleto
  3 - Falar com Admin
        ↓
Morador digita "1" ou "2"
        ↓
Sistema processa a escolha
        ↓
Envia PIX/Boleto conforme escolhido
        ↓
Morador paga
        ↓
Admin vê pagamento confirmado
```

---

## 💬 Exemplos de Conversas

### Exemplo 1: Pagamento com PIX

```
Morador: "Olá, quero pagar minha mensalidade"

Sistema: *Pagamento - João Silva*
         R$ 500.00 - Vence: 10/05/2026

         1 - Pagar com PIX (Escaneie o QR Code)
         2 - Pagar com Boleto (Copie o código de barras)
         3 - Falar com Admin (Enviar mensagem)

         Digite o número da opção desejada.

Morador: "1"

Sistema: Aqui está seu QR Code PIX:
         [QR CODE]
         
         Chave PIX: 00020126580014br.gov.bcb.brcode...
         
         Escaneie para pagar!

Morador: [Escaneia e paga]

Sistema: ✅ Pagamento recebido! Obrigado!
```

### Exemplo 2: Pagamento com Boleto

```
Morador: "Preciso do boleto"

Sistema: *Pagamento - Maria Santos*
         R$ 300.00 - Vence: 15/05/2026

         1 - Pagar com PIX (Escaneie o QR Code)
         2 - Pagar com Boleto (Copie o código de barras)
         3 - Falar com Admin (Enviar mensagem)

         Digite o número da opção desejada.

Morador: "2"

Sistema: Aqui está seu código de barras:
         
         12345.67890 12345.678901 12345.678901 1 12345678901234
         
         Copie e cole no seu banco!

Morador: [Copia e paga]

Sistema: ✅ Pagamento recebido! Obrigado!
```

---

## 🔧 Configuração de Auto-Respostas

O sistema pode ser configurado para responder automaticamente a certas palavras-chave:

| Palavra-chave | Resposta |
|--------------|----------|
| "mensalidade" | Envia menu de pagamento |
| "boleto" | Envia código de barras |
| "pix" | Envia QR Code PIX |
| "ajuda" | Envia menu de opções |
| "admin" | Conecta com administrador |

---

## 📱 Monitorando Mensagens

Na tela de **Comunicados**, você pode ver:

- 📨 Todas as mensagens recebidas
- ✅ Mensagens processadas
- ❌ Mensagens com erro
- 📊 Estatísticas de interação

---

## 🧪 Testando

### Teste 1: Conectar WhatsApp

1. Na tela de configuração, clique em **Conectar WhatsApp**
2. Escaneie o QR Code com seu celular
3. Se conectar, aparecerá ✅

### Teste 2: Enviar Mensagem Manual

1. Vá para **Mensalidades**
2. Clique em um pagamento
3. Clique em **Enviar via WhatsApp**
4. Escolha o morador
5. A mensagem será enviada

### Teste 3: Testar Auto-Resposta

1. Envie uma mensagem para seu número pelo WhatsApp
2. Digite: "mensalidade"
3. O sistema responderá com o menu
4. Escolha uma opção (1, 2 ou 3)
5. O sistema processará sua escolha

---

## ❓ Perguntas Frequentes

### P: Preciso deixar o WhatsApp Web aberto?

**R:** Não! Uma vez conectado, o sistema funciona em background. Você pode fechar o navegador.

### P: Meu celular precisa estar conectado?

**R:** Não! O sistema funciona mesmo com o celular desligado. Funciona como WhatsApp Web.

### P: Posso usar meu WhatsApp normal?

**R:** Sim! É o mesmo número que você usa normalmente. Você receberá as mensagens dos moradores como qualquer outra conversa.

### P: E se eu perder a conexão?

**R:** O sistema tenta reconectar automaticamente. Se não conseguir, você receberá uma notificação.

### P: Quantas mensagens posso enviar?

**R:** Sem limite! Você pode enviar quantas precisar.

### P: As mensagens são gratuitas?

**R:** Sim! Você usa seu próprio WhatsApp, então não há custos adicionais.

### P: Posso enviar imagens e documentos?

**R:** Sim! O sistema suporta envio de mídia (fotos, PDFs, etc).

### P: E se o morador responder?

**R:** As respostas vão para o seu WhatsApp normal. Você pode responder como faz com qualquer conversa.

### P: Posso desconectar depois?

**R:** Sim! Na tela de configuração, clique em **Desconectar WhatsApp**.

---

## 🔐 Segurança

- ✅ Seu número é armazenado com segurança
- ✅ Mensagens são criptografadas
- ✅ Nenhum dado é compartilhado com terceiros
- ✅ Você tem controle total sobre tudo

---

## 🐛 Troubleshooting

### Problema: "QR Code não aparece"

**Solução:**
1. Tente recarregar a página
2. Limpe o cache do navegador
3. Tente em outro navegador

### Problema: "Erro ao escanear QR Code"

**Solução:**
1. Verifique se o WhatsApp está atualizado
2. Tente novamente em alguns segundos
3. Reinicie o app

### Problema: "Não recebo mensagens"

**Solução:**
1. Verifique se está conectado (aba de configuração)
2. Confirme que o número está correto
3. Tente desconectar e conectar novamente

### Problema: "Sistema não responde"

**Solução:**
1. Verifique a conexão com internet
2. Reinicie o app
3. Tente desconectar e conectar novamente

---

## 📈 Próximas Melhorias

1. **Múltiplos Números** - Usar vários números para distribuir carga
2. **Agendamento** - Agendar mensagens para horários específicos
3. **Relatórios** - Gráficos de interações e conversões
4. **Integração com CRM** - Sincronizar com sistema de gestão

---

## 🎯 Workflow Completo

```
1. Admin conecta seu WhatsApp
        ↓
2. Admin cria mensalidade para morador
        ↓
3. Gera PIX/Boleto no Asaas
        ↓
4. Morador envia mensagem para o número
        ↓
5. Sistema responde com menu
        ↓
6. Morador escolhe PIX ou Boleto
        ↓
7. Sistema envia link/código
        ↓
8. Morador paga
        ↓
9. Admin vê pagamento confirmado
```

---

**Versão**: 1.0.0  
**Data**: 28/04/2026  
**Status**: ✅ Pronto para Usar
