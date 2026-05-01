# Integração WhatsApp Business - Documentação Completa

## 📱 Visão Geral

O sistema de integração WhatsApp permite que administradores gerenciem comunicações com moradores através do WhatsApp Business API, utilizando Twilio como provedor. O sistema suporta envio de mensagens automáticas, menus interativos e rastreamento completo de conversas.

## 🎯 Funcionalidades Principais

### 1. Configuração do WhatsApp Business

A integração utiliza **Twilio** como provedor de WhatsApp Business API. O processo de configuração envolve:

**Passo 1: Criar Conta Twilio**
- Acesse [twilio.com](https://www.twilio.com)
- Crie uma conta gratuita ou paga
- Ative WhatsApp Business API
- Obtenha suas credenciais (Account SID e Auth Token)

**Passo 2: Configurar no App**
- Vá para Admin → WhatsApp → Configuração
- Insira o número do condomínio (+55 11 99999-9999)
- Cole suas credenciais Twilio
- Teste a conexão
- Salve a configuração

**Passo 3: Configurar Webhook**
- O URL do webhook será preenchido automaticamente
- Configure no Twilio para receber mensagens de entrada
- Valide a conexão

### 2. Envio de Mensagens

#### Tipos de Mensagens

**Mensagens de Texto**
- Notificações simples
- Comunicados
- Alertas
- Suporte

**Menus Interativos**
- Opções numeradas (1, 2, 3, etc)
- Respostas automáticas
- Fluxos de conversação

**Mensagens em Lote**
- Enviar para múltiplos moradores
- Rastreamento individual
- Relatório de entrega

#### Fluxo de Envio

```
Admin → Seleciona Moradores → Escreve Mensagem → Envia
                                                    ↓
                                            Twilio API
                                                    ↓
                                            WhatsApp
                                                    ↓
                                            Morador Recebe
                                                    ↓
                                            Status Atualizado
```

### 3. Menus Interativos

#### Menu de Suporte Padrão

```
👋 Bem-vindo ao Suporte do Condomínio!
Como podemos ajudá-lo?

1 - 💰 Pagar Mensalidade (Gerar link de pagamento)
2 - 📋 Consultar Saldo (Ver débitos pendentes)
3 - 📢 Comunicados (Últimos avisos)
4 - 🔧 Manutenção (Reportar problema)
5 - 👨‍💼 Falar com Admin (Contato direto)

Digite o número da opção desejada.
```

#### Criando Menus Personalizados

```typescript
// Exemplo de criação de menu
const menu = await criarMenuTemplate({
  condominioId: 1,
  nome: "Menu de Pagamento",
  descricao: "Opções de pagamento",
  mensagemInicial: "Escolha sua forma de pagamento:",
  opcoes: [
    { numero: 1, titulo: "Pix", descricao: "Pagamento instantâneo" },
    { numero: 2, titulo: "Boleto", descricao: "Prazo de 3 dias" },
    { numero: 3, titulo: "Débito", descricao: "Débito em conta" },
  ],
});
```

### 4. Rastreamento de Conversas

#### Status de Mensagens

- **Pendente**: Aguardando envio
- **Enviada**: Enviada para Twilio
- **Entregue**: Entregue ao WhatsApp do morador
- **Lida**: Morador leu a mensagem
- **Falhou**: Erro na entrega

#### Histórico de Conversas

- Todas as mensagens são armazenadas
- Histórico completo por morador
- Timestamps precisos
- Rastreamento de interações

### 5. Notificações Automáticas

#### Notificação de Pagamento

```
💰 Notificação de Pagamento

Olá João!

Sua mensalidade no valor de R$ 500,00 vence em 15/05/2026.

Faça seu pagamento através do app ou do nosso site.

Dúvidas? Responda esta mensagem.
```

#### Notificação de Comunicado

```
📢 Aviso Importante

Prezados Moradores,

Informamos que haverá manutenção na caixa d'água no próximo sábado, das 08:00 às 12:00.

Atenciosamente,
Administração do Condomínio
```

## 🔧 Arquitetura Técnica

### Banco de Dados

#### Tabelas Principais

**whatsapp_config**
- Armazena credenciais Twilio
- Configurações por condomínio
- Status de teste

**whatsapp_mensagens**
- Todas as mensagens enviadas e recebidas
- Status de entrega
- Timestamps
- Metadados

**whatsapp_menus**
- Templates de menus
- Opções disponíveis
- Descrições

**whatsapp_conversas**
- Conversas ativas
- Histórico de interações
- Última mensagem

**whatsapp_interacoes**
- Rastreamento de seleções de menu
- Respostas de texto livre
- Confirmações

### API tRPC

**Endpoints Disponíveis:**

| Endpoint | Tipo | Descrição |
|----------|------|-----------|
| `whatsapp.configure` | Mutation | Configurar WhatsApp |
| `whatsapp.getConfig` | Query | Obter configuração |
| `whatsapp.testConnection` | Mutation | Testar conexão |
| `whatsapp.sendMessage` | Mutation | Enviar mensagem |
| `whatsapp.sendMenu` | Mutation | Enviar menu |
| `whatsapp.sendBulk` | Mutation | Enviar em lote |
| `whatsapp.sendPaymentNotification` | Mutation | Notificação de pagamento |
| `whatsapp.sendCommunication` | Mutation | Enviar comunicado |
| `whatsapp.sendSupportMenu` | Mutation | Enviar menu de suporte |
| `whatsapp.getMenus` | Query | Listar menus |
| `whatsapp.createMenu` | Mutation | Criar menu |
| `whatsapp.getStats` | Query | Estatísticas |
| `whatsapp.webhook` | Mutation | Processar webhook |

### Serviço WhatsApp

**Funções Principais:**

- `initializeTwilio()`: Inicializar cliente Twilio
- `enviarMensagemWhatsapp()`: Enviar mensagem única
- `enviarMenuWhatsapp()`: Enviar menu interativo
- `enviarMensagensEmLote()`: Enviar para múltiplos
- `processarWebhookWhatsapp()`: Processar entrada
- `testarConexaoWhatsapp()`: Validar credenciais
- `enviarNotificacaoPagamento()`: Template pagamento
- `enviarComunicadoWhatsapp()`: Template comunicado
- `enviarMenuSuporteWhatsapp()`: Menu padrão

## 📊 Fluxos de Trabalho

### Fluxo 1: Envio de Notificação de Pagamento

```
1. Admin vai para Admin → Gestão de Mensalidades
2. Seleciona morador com pagamento vencido
3. Clica em "Enviar Notificação WhatsApp"
4. Sistema envia mensagem automática
5. Morador recebe notificação no WhatsApp
6. Morador pode responder com dúvidas
7. Admin vê resposta em "Conversas"
```

### Fluxo 2: Menu Interativo de Suporte

```
1. Morador inicia conversa com o condomínio
2. Sistema envia menu de suporte automático
3. Morador digita "1" para pagar
4. Sistema registra seleção
5. Sistema envia link de pagamento
6. Admin vê interação no dashboard
```

### Fluxo 3: Comunicado em Lote

```
1. Admin cria comunicado no sistema
2. Seleciona "Enviar via WhatsApp"
3. Escolhe lista de moradores
4. Confirma envio
5. Sistema envia para todos
6. Rastreamento de entrega em tempo real
7. Relatório de entrega ao final
```

## 🔐 Segurança

### Proteção de Dados

- **Criptografia**: Credenciais armazenadas criptografadas
- **Tokens**: Auth tokens nunca expostos na UI
- **Audit**: Todas as ações registradas
- **Permissões**: Apenas admins podem configurar

### Boas Práticas

- Não compartilhe credenciais Twilio
- Use variáveis de ambiente para dados sensíveis
- Valide números de telefone antes de enviar
- Monitore taxa de falhas de entrega

## 📈 Estatísticas e Análise

### Métricas Disponíveis

- Total de mensagens enviadas
- Total de mensagens recebidas
- Conversas ativas
- Taxa de entrega
- Tempo de resposta médio
- Opções mais selecionadas

### Relatórios

- Relatório diário de mensagens
- Análise de interações
- Taxa de sucesso por tipo
- Histórico de conversas

## 🧪 Testes

### Testes Unitários (50+)

- Configuração WhatsApp
- Envio de mensagens
- Rastreamento de status
- Menus interativos
- Conversas
- Interações
- Estatísticas
- Edge cases

### Teste Manual

1. Configure credenciais Twilio
2. Teste conexão
3. Envie mensagem de teste
4. Verifique recebimento
5. Responda mensagem
6. Verifique recebimento de resposta

## 🚀 Integração com Outros Módulos

### Gestão de Mensalidades

- Notificação automática de vencimento
- Notificação de pagamento recebido
- Lembretes de atraso

### Comunicações

- Envio de comunicados via WhatsApp
- Rastreamento de leitura
- Respostas automáticas

### Notificações

- Alertas críticos via WhatsApp
- Priorização de canais
- Preferências de usuário

## 📞 Suporte e Troubleshooting

### Problema: Mensagens não são entregues

**Soluções:**
1. Verifique credenciais Twilio
2. Valide número de telefone
3. Teste conexão
4. Verifique logs de erro

### Problema: Webhook não recebe mensagens

**Soluções:**
1. Configure URL webhook no Twilio
2. Valide HTTPS
3. Verifique firewall
4. Teste endpoint manualmente

### Problema: Credenciais inválidas

**Soluções:**
1. Regenere tokens no Twilio
2. Copie novamente Account SID
3. Teste conexão
4. Verifique permissões da conta

## 📚 Recursos Adicionais

- [Documentação Twilio](https://www.twilio.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Guia de Boas Práticas](https://www.twilio.com/docs/whatsapp/best-practices)

## 🔄 Próximas Melhorias

- [ ] Integração com WhatsApp Cloud API (Meta)
- [ ] Suporte a mídia (imagens, documentos)
- [ ] Automação de fluxos complexos
- [ ] AI para respostas automáticas
- [ ] Integração com CRM

---

**Versão**: 1.0.0  
**Última Atualização**: 27/04/2026  
**Status**: ✅ Produção  
**Suporte**: support@condominio.com
