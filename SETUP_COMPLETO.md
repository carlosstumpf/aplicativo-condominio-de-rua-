# 🚀 Guia Completo de Setup - Gestão de Condomínio

## 📋 Índice

1. [Acesso ao Aplicativo](#1-acesso-ao-aplicativo)
2. [Configurar WhatsApp Business](#2-configurar-whatsapp-business)
3. [Configurar Asaas (Pagamentos)](#3-configurar-asaas-pagamentos)
4. [Integrar WhatsApp com Flows](#4-integrar-whatsapp-com-flows)
5. [Testar Tudo](#5-testar-tudo)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Acesso ao Aplicativo

### 1.1 Acessar pelo Celular (iOS/Android)

**Opção A: Expo Go (Desenvolvimento)**

1. Baixe o app **Expo Go** na App Store ou Google Play
2. Abra o app
3. Escaneie o QR code que aparece no painel
4. O app carregará automaticamente

**QR Code:**
```
exps://8081-icoaf8540ivqbwcmazgl6-e16ef6a2.us2.manus.computer
```

### 1.2 Acessar pelo Computador (Web)

**Opção B: Navegador Web**

1. Abra seu navegador (Chrome, Firefox, Safari)
2. Acesse: `https://8081-icoaf8540ivqbwcmazgl6-e16ef6a2.us2.manus.computer`
3. O app carregará no navegador

**Funciona em:**
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Tablet
- ✅ Celular (qualquer navegador)

### 1.3 Tela de Login

Ao abrir o app, você verá a tela de login com 2 opções:

**👨‍💼 Administrador**
- Email: `admin@condominio.com`
- Senha: `admin123`
- Acesso: Painel completo com todas as funcionalidades

**👤 Morador**
- Email: `morador@condominio.com`
- Senha: `morador123`
- Acesso: Apenas seu perfil e pagamentos

---

## 2. Configurar WhatsApp Business

### 2.1 Criar Conta Meta Business

1. Acesse [Meta Business Manager](https://business.facebook.com)
2. Clique em **Criar Conta**
3. Preencha seus dados:
   - Nome da empresa
   - Email
   - Telefone
   - Localização

### 2.2 Registrar Número WhatsApp

1. No Meta Business Manager, vá para **Ferramentas → WhatsApp Manager**
2. Clique em **Começar**
3. Escolha **Usar número de telefone existente**
4. Digite seu número (ex: +55 11 99999-9999)
5. Você receberá um código de verificação via SMS
6. Insira o código para confirmar

### 2.3 Obter Credenciais da API

1. Vá para **Configurações → Integrações → API**
2. Copie seu **Access Token** (token de acesso)
3. Copie seu **Phone Number ID** (ID do número)
4. Copie seu **Business Account ID** (ID da conta)

**Exemplo:**
```
Access Token: EAABsbCS1iHgBAKZCxxxxxxxxxxx
Phone Number ID: 102345678901234
Business Account ID: 123456789012345
```

### 2.4 Configurar no App

1. Abra o app como **Administrador**
2. Vá para **Configurações → WhatsApp**
3. Clique em **Configurar WhatsApp**
4. Preencha os campos:
   - **Access Token**: Cole seu token
   - **Phone Number ID**: Cole o ID do número
   - **Business Account ID**: Cole o ID da conta
   - **Ambiente**: Escolha "teste" ou "produção"
5. Clique em **Testar Conexão**
6. Se OK, clique em **Salvar**

---

## 3. Configurar Asaas (Pagamentos)

### 3.1 Criar Conta Asaas

1. Acesse [Asaas](https://www.asaas.com)
2. Clique em **Criar Conta**
3. Escolha **Pessoa Física** ou **Jurídica**
4. Preencha seus dados
5. Verifique seu email

### 3.2 Obter API Key

1. Faça login na sua conta Asaas
2. Vá para **Configurações → Integrações → API**
3. Copie sua **API Key**
4. Escolha o ambiente:
   - **Teste**: Para testar sem cobrar
   - **Produção**: Para cobrar de verdade

**Exemplo:**
```
API Key (Teste): $aact_test_xxxxxxxxxxxxxxxxxxxxx
API Key (Produção): $aact_prod_xxxxxxxxxxxxxxxxxxxxx
```

### 3.3 Configurar no App

1. Abra o app como **Administrador**
2. Vá para **Configurações → Asaas**
3. Clique em **Configurar Asaas**
4. Preencha os campos:
   - **API Key**: Cole sua chave
   - **Ambiente**: Escolha "teste" ou "produção"
5. Clique em **Testar Conexão**
6. Se OK, clique em **Salvar**

### 3.4 Configurar Webhook (Opcional)

Para receber notificações quando os pagamentos são confirmados:

1. No Asaas, vá para **Configurações → Integrações → Webhooks**
2. Clique em **Adicionar Webhook**
3. Cole a URL: `https://seu-dominio.com/webhook/asaas`
4. Escolha os eventos:
   - ✅ PAYMENT_CREATED
   - ✅ PAYMENT_RECEIVED
   - ✅ PAYMENT_OVERDUE
5. Clique em **Salvar**

---

## 4. Integrar WhatsApp com Flows

### 4.1 O que é WhatsApp Flow?

Um **Flow** é um menu interativo no WhatsApp que permite:
- Escolher forma de pagamento (PIX ou Boleto)
- Ver o código de barras
- Escanear QR Code
- Confirmar pagamento

### 4.2 Criar um Flow

1. No app, vá para **Comunicados → Criar Novo**
2. Escolha **Tipo: Flow de Pagamento**
3. Preencha:
   - **Nome**: "Pagamento de Mensalidade"
   - **Descrição**: "Escolha PIX ou Boleto"
4. Clique em **Criar**

### 4.3 Enviar Flow para Morador

**Opção A: Manual (Uma pessoa)**

1. Vá para **Mensalidades**
2. Procure o morador
3. Clique em **Reenviar Link**
4. Escolha **WhatsApp**
5. O Flow será enviado automaticamente

**Opção B: Automático (Vários)**

1. Vá para **Mensalidades**
2. Selecione múltiplos moradores
3. Clique em **Reenviar em Lote**
4. Escolha **WhatsApp**
5. Todos receberão o Flow

### 4.4 Morador Recebe o Flow

O morador verá no WhatsApp:

```
┌─────────────────────────────┐
│ Olá João Silva!             │
│                             │
│ Sua mensalidade de R$ 500   │
│ vence em 10/05/2026         │
│                             │
│ Escolha a forma de pag:     │
│                             │
│ [💰 Pagar com PIX]         │
│ [📋 Pagar com Boleto]      │
└─────────────────────────────┘
```

Ao clicar em **PIX**, verá:

```
┌─────────────────────────────┐
│ Escaneie o QR Code          │
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    [QR CODE AQUI]       │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Ou copie a chave PIX:       │
│ 00020126580014...           │
│                             │
│ [✓ Pagamento Realizado]    │
└─────────────────────────────┘
```

---

## 5. Testar Tudo

### 5.1 Teste de WhatsApp

1. Abra o app como **Admin**
2. Vá para **Configurações → WhatsApp → Testar Conexão**
3. Se aparecer ✅, está funcionando

### 5.2 Teste de Asaas

1. Abra o app como **Admin**
2. Vá para **Configurações → Asaas → Testar Conexão**
3. Se aparecer ✅, está funcionando

### 5.3 Teste Completo (Passo a Passo)

**Passo 1: Criar Pagamento**

1. Vá para **Mensalidades**
2. Clique em **Novo Pagamento**
3. Preencha:
   - Morador: "João Silva"
   - Valor: R$ 50,00 (valor pequeno para teste)
   - Vencimento: Hoje
4. Clique em **Criar**

**Passo 2: Gerar PIX/Boleto**

1. Clique no pagamento criado
2. Clique em **Gerar PIX**
3. Você verá o QR Code e a chave PIX

**Passo 3: Enviar via WhatsApp**

1. Clique em **Reenviar via WhatsApp**
2. Insira o número: +55 11 99999-9999 (seu número)
3. Clique em **Enviar**
4. Você receberá o Flow no seu WhatsApp

**Passo 4: Confirmar Pagamento**

1. No Asaas, vá para **Meus Pagamentos**
2. Procure pelo pagamento de teste
3. Clique em **Confirmar Pagamento** (para teste)
4. Volte ao app e veja o status atualizar

---

## 6. Troubleshooting

### Problema: "Erro ao conectar WhatsApp"

**Causas possíveis:**
- Access Token inválido
- Phone Number ID incorreto
- Número não verificado

**Solução:**
1. Verifique se copiou corretamente
2. Confirme que não tem espaços em branco
3. Teste novamente a conexão

### Problema: "Asaas não conecta"

**Causas possíveis:**
- API Key inválida
- Ambiente errado (teste vs produção)
- Conta não ativada

**Solução:**
1. Verifique sua API Key
2. Confirme o ambiente correto
3. Verifique se sua conta está ativa no Asaas

### Problema: "Flow não aparece no WhatsApp"

**Causas possíveis:**
- Número não verificado
- Flow não publicado
- Atraso de propagação

**Solução:**
1. Aguarde 15 minutos para propagação
2. Tente enviar novamente
3. Verifique se o número está correto

### Problema: "QR Code não funciona"

**Causas possíveis:**
- PIX expirou (válido por 10 minutos)
- Dados incorretos no Asaas

**Solução:**
1. Gere um novo PIX
2. Teste com um valor pequeno
3. Verifique seus dados no Asaas

### Problema: "Não consigo fazer login"

**Causas possíveis:**
- Email/senha incorretos
- Sessão expirada
- Cache do navegador

**Solução:**
1. Verifique email e senha
2. Limpe o cache do navegador
3. Tente em modo incógnito
4. Faça logout e login novamente

---

## 📱 Resumo das Credenciais Necessárias

| Serviço | O que Você Precisa | Onde Encontrar |
|---------|-------------------|----------------|
| **WhatsApp** | Access Token | Meta Business Manager → API |
| **WhatsApp** | Phone Number ID | Meta Business Manager → API |
| **WhatsApp** | Business Account ID | Meta Business Manager → API |
| **Asaas** | API Key | Asaas → Configurações → API |
| **Asaas** | Wallet ID (opcional) | Asaas → Configurações → API |

---

## ✅ Checklist de Setup

- [ ] Criei conta Meta Business
- [ ] Registrei meu número WhatsApp
- [ ] Copiei Access Token
- [ ] Copiei Phone Number ID
- [ ] Copiei Business Account ID
- [ ] Configurei WhatsApp no app
- [ ] Testei conexão WhatsApp
- [ ] Criei conta Asaas
- [ ] Copiei API Key
- [ ] Configurei Asaas no app
- [ ] Testei conexão Asaas
- [ ] Criei um pagamento de teste
- [ ] Gerei PIX/Boleto
- [ ] Enviei Flow via WhatsApp
- [ ] Recebi o Flow no meu celular
- [ ] Testei o pagamento

---

## 🎯 Próximos Passos

Após completar o setup:

1. **Criar Moradores** - Adicione seus moradores no app
2. **Criar Mensalidades** - Defina as mensalidades
3. **Enviar Comunicados** - Comece a enviar avisos
4. **Acompanhar Pagamentos** - Veja os pagamentos em tempo real
5. **Gerar Relatórios** - Analise dados financeiros

---

## 📞 Suporte

Se tiver dúvidas:

1. Verifique este guia novamente
2. Consulte a seção de Troubleshooting
3. Entre em contato com o suporte

---

**Versão**: 1.0.0  
**Data**: 27/04/2026  
**Status**: ✅ Pronto para Usar
