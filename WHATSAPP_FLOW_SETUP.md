# WhatsApp Flow Integration - Guia Completo

## 📱 O que é WhatsApp Flow?

**WhatsApp Flow** é a solução moderna da Meta para criar experiências interativas no WhatsApp. Diferente de menus de texto, Flows oferecem:

- ✅ Interface visual nativa (não é texto)
- ✅ Formulários interativos
- ✅ Melhor UX para usuários
- ✅ Rastreamento completo de interações
- ✅ Integração com sistemas backend

## 🎯 Fluxo de Funcionamento

```
Admin cria Flow → Publica no WhatsApp → Envia para Morador
                                              ↓
                                    Morador interage
                                              ↓
                                    Webhook recebe dados
                                              ↓
                                    Sistema processa
                                              ↓
                                    Admin vê resultado
```

## 🔧 Configuração Inicial

### Passo 1: Criar Conta Meta Business

1. Acesse [Meta Business Manager](https://business.facebook.com)
2. Crie uma conta comercial (se não tiver)
3. Verifique seu negócio

### Passo 2: Configurar WhatsApp Business API

1. Vá para **Configurações** → **WhatsApp Business**
2. Clique em **Começar**
3. Escolha seu número de telefone
4. Siga as instruções de verificação

### Passo 3: Obter Credenciais

Você precisará de:

| Credencial | Onde Encontrar | Formato |
|-----------|----------------|---------|
| **Access Token** | Meta Business Manager → Configurações → Tokens | `EAAxxxxxxxxxxxxxxxx` |
| **Phone Number ID** | WhatsApp Business → Configurações → Números de Telefone | `1234567890` |
| **Business Account ID** | WhatsApp Business → Configurações | `1234567890` |

### Passo 4: Configurar no App

1. Vá para **Admin → WhatsApp → Configuração**
2. Cole suas credenciais Meta
3. Clique em **Testar Conexão**
4. Salve a configuração

## 📋 Tipos de Flows Disponíveis

### 1. Flow de Pagamento

```
Morador recebe: "Escolha forma de pagamento"
                ├─ Pix
                ├─ Boleto
                └─ Débito
                
Morador escolhe → Sistema gera link → Morador paga
```

**Criar:**
```typescript
await whatsappFlows.createPaymentFlow({
  condominioId: 1,
  flowId: "flow_pagamento_123"
});
```

### 2. Flow de Suporte

```
Morador recebe: "Como podemos ajudar?"
                ├─ Pagar Mensalidade
                ├─ Consultar Saldo
                ├─ Comunicados
                ├─ Manutenção
                └─ Falar com Admin
```

**Criar:**
```typescript
await whatsappFlows.createSupportFlow({
  condominioId: 1,
  flowId: "flow_suporte_123"
});
```

### 3. Flow de Comunicado

```
Morador recebe: "Aviso Importante"
                + Conteúdo do comunicado
                └─ Botão "Entendido"
```

**Criar:**
```typescript
await whatsappFlows.createCommunicationFlow({
  condominioId: 1,
  flowId: "flow_comunicado_123",
  titulo: "Manutenção Programada",
  conteudo: "Haverá manutenção no sábado..."
});
```

## 🚀 Enviando Flows

### Enviar para Um Morador

```typescript
const resultado = await whatsappFlows.sendFlow({
  condominioId: 1,
  numeroDestinatario: "+55 11 99999-9999",
  flowId: "flow_pagamento_123"
});
```

### Enviar em Lote

```typescript
const resultado = await whatsappFlows.sendFlowsBulk({
  condominioId: 1,
  numeros: [
    "+55 11 99999-0001",
    "+55 11 99999-0002",
    "+55 11 99999-0003"
  ],
  flowId: "flow_suporte_123"
});
```

## 📊 Rastreando Interações

### Obter Interações de um Flow

```typescript
const interacoes = await whatsappFlows.getFlowInteractions({
  flowId: 1,
  status: "concluido", // "em_progresso", "concluido", "abandonado"
  limite: 100
});

// Resultado:
// [
//   {
//     id: 1,
//     numeroWhatsapp: "+55 11 99999-0001",
//     respostas: {
//       forma_pagamento: "pix",
//       confirmado: true
//     },
//     status: "concluido",
//     resultado: "pagamento_iniciado",
//     tempoDecorrido: 120 // segundos
//   }
// ]
```

### Obter Estatísticas

```typescript
const stats = await whatsappFlows.getFlowStats({
  flowId: 1
});

// Resultado:
// {
//   total: 150,
//   concluidas: 120,
//   abandonadas: 30,
//   taxaConclusao: 80,
//   tempoMedio: 180 // segundos
// }
```

### Obter Analytics

```typescript
const analytics = await whatsappFlows.getFlowAnalytics({
  flowId: 1
});

// Resultado:
// {
//   total: 150,
//   concluidas: 120,
//   abandonadas: 30,
//   taxaConclusao: 80.00,
//   tempoMedioSegundos: 180,
//   tempoMedioMinutos: 3
// }
```

## 🔗 Webhook - Recebendo Dados

Quando um morador completa um Flow, o WhatsApp envia um webhook com os dados.

### Configurar Webhook

1. Vá para **Admin → WhatsApp → Configuração**
2. Copie a URL do Webhook (será preenchida automaticamente)
3. Configure no Meta Business Manager:
   - Vá para **Configurações → Webhooks**
   - Cole a URL
   - Escolha eventos: `messages`, `message_template_status_update`

### Exemplo de Payload Recebido

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "55119999999",
              "phone_number_id": "1234567890"
            },
            "messages": [
              {
                "from": "5511999990001",
                "id": "wamid.xxx",
                "timestamp": "1234567890",
                "type": "interactive",
                "interactive": {
                  "type": "nfm_reply",
                  "nfm_reply": {
                    "response_json": "{\"forma_pagamento\":\"pix\",\"confirmado\":true}",
                    "body": "Resposta do Flow"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 🎨 Criando Flows Customizados

### Estrutura de um Flow

```typescript
const flowDefinicao = {
  version: "3.0",
  screens: [
    {
      id: "screen_1",
      title: "Título da Tela",
      lottie: {
        url: "https://assets.lottiefiles.com/..." // Animação (opcional)
      },
      layout: {
        type: "SingleColumnLayout",
        children: [
          {
            type: "TextHeading",
            text: "Título"
          },
          {
            type: "TextBody",
            text: "Descrição"
          },
          {
            type: "TextInput",
            input_type: "email",
            name: "email",
            label: "Seu Email"
          },
          {
            type: "ButtonGroup",
            buttons: [
              {
                id: "btn_1",
                text: "Enviar",
                style: "FILLED"
              }
            ]
          }
        ]
      }
    }
  ]
};

await whatsappFlows.createFlow({
  condominioId: 1,
  flowId: "flow_customizado_123",
  nome: "Meu Flow Customizado",
  definicao: flowDefinicao,
  tipo: "customizado"
});
```

### Componentes Disponíveis

| Componente | Descrição | Exemplo |
|-----------|-----------|---------|
| `TextHeading` | Título grande | `{ type: "TextHeading", text: "Título" }` |
| `TextBody` | Texto normal | `{ type: "TextBody", text: "Descrição" }` |
| `TextInput` | Campo de entrada | `{ type: "TextInput", name: "email", label: "Email" }` |
| `SelectionList` | Lista de opções | `{ type: "SelectionList", items: [...] }` |
| `ButtonGroup` | Grupo de botões | `{ type: "ButtonGroup", buttons: [...] }` |
| `Footer` | Rodapé | `{ type: "Footer", text: "Rodapé" }` |

## 🔐 Segurança

### Boas Práticas

- ✅ Armazene credenciais em variáveis de ambiente
- ✅ Valide tokens de webhook
- ✅ Use HTTPS para webhook
- ✅ Registre todas as interações
- ✅ Implemente rate limiting

### Validar Webhook

```typescript
import crypto from "crypto";

function validarWebhook(payload: string, signature: string, token: string) {
  const hash = crypto
    .createHmac("sha256", token)
    .update(payload)
    .digest("hex");

  return hash === signature;
}
```

## 📈 Casos de Uso

### 1. Notificação de Pagamento Vencido

```
Admin cria Flow de Pagamento
Admin envia para moradores com atraso
Morador recebe e escolhe forma de pagamento
Sistema registra escolha
Admin vê que morador iniciou pagamento
```

### 2. Pesquisa de Satisfação

```
Admin cria Flow com perguntas
Admin envia para todos os moradores
Moradores respondem
Sistema coleta respostas
Admin analisa resultados
```

### 3. Comunicado com Confirmação

```
Admin cria Flow de Comunicado
Admin envia para todos
Morador lê e clica "Entendido"
Sistema registra confirmação
Admin vê taxa de leitura
```

## 🧪 Testando Flows

### Teste Local

```typescript
// 1. Criar flow de teste
const flow = await whatsappFlows.createPaymentFlow({
  condominioId: 1,
  flowId: "flow_teste_123"
});

// 2. Publicar
await whatsappFlows.publishFlow(flow.id);

// 3. Enviar para seu número
const resultado = await whatsappFlows.sendFlow({
  condominioId: 1,
  numeroDestinatario: "+55 11 99999-9999", // Seu número
  flowId: "flow_teste_123"
});

// 4. Interagir no WhatsApp
// 5. Verificar webhook recebido
// 6. Analisar dados
```

## 🐛 Troubleshooting

### Problema: "Credenciais inválidas"

**Solução:**
1. Verifique Access Token no Meta Business Manager
2. Confirme que o token não expirou
3. Teste conexão novamente

### Problema: "Webhook não recebe dados"

**Solução:**
1. Confirme URL webhook está correta
2. Verifique HTTPS está ativo
3. Valide token de webhook
4. Teste manualmente com curl

### Problema: "Flow não aparece no WhatsApp"

**Solução:**
1. Confirme que flow foi publicado
2. Verifique que número de telefone está correto
3. Teste com seu número primeiro
4. Aguarde propagação (até 15 minutos)

## 📚 Recursos Adicionais

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Flow Builder](https://www.whatsapp.com/business/flows)
- [Exemplos de Flows](https://developers.facebook.com/docs/whatsapp/flows/examples)

## 🔄 Próximas Etapas

1. **Obter Credenciais Meta** - Siga os passos acima
2. **Configurar no App** - Insira as credenciais
3. **Testar Conexão** - Valide que tudo funciona
4. **Criar Primeiro Flow** - Use um template
5. **Enviar para Moradores** - Comece com um grupo pequeno
6. **Analisar Resultados** - Veja as métricas

---

**Versão**: 1.0.0  
**Última Atualização**: 27/04/2026  
**Status**: ✅ Pronto para Produção  
**Suporte**: support@condominio.com
