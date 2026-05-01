# 📅 Guia: Agendamento Automático de Reenvios de Flows

## Visão Geral

O sistema de agendamento automático de reenvios permite que moradores agendem automaticamente o reenvio de flows que falharam, escolhendo data, hora e frequência específicas.

## 🎯 Funcionalidades

### 1. **Agendamento Flexível**
- Agendar reenvio para data/hora específica
- Escolher frequência (uma vez, diariamente, semanalmente, automática)
- Definir máximo de tentativas (1-10)
- Adicionar notas/observações

### 2. **Gerenciamento de Reenvios**
- Visualizar todos os reenvios agendados
- Filtrar por status (pendentes, concluídos, falhados)
- Buscar reenvios específicos
- Reagendar ou cancelar reenvios

### 3. **Histórico Completo**
- Ver histórico de tentativas
- Acompanhar status de cada tentativa
- Visualizar erros e motivos de falha
- Exportar histórico em CSV

### 4. **Automação Inteligente**
- Reenvios automáticos com backoff exponencial
- Notificações de sucesso/falha
- Sincronização com WhatsApp Flows
- Integração com Asaas

## 🚀 Como Usar

### Agendar um Reenvio

**No Histórico de Flows:**

1. Abra a tela "📜 Histórico de Flows"
2. Encontre um flow com status "❌ Falhado"
3. Clique no flow para ver detalhes
4. Clique em "⏰ Agendar Reenvio"
5. Configure:
   - **Data**: Quando quer reenviar
   - **Horário**: Que hora do dia
   - **Frequência**: Uma vez / Diário / Semanal / Automático
   - **Tentativas**: Quantas vezes tentar
   - **Notas**: Observações opcionais
6. Clique em "✓ Agendar Reenvio"

**Reenvio Rápido:**

1. No detalhe do flow, clique em "Reenviar em:"
2. Escolha: 1h, 3h ou 24h
3. Pronto! Reenvio agendado automaticamente

### Gerenciar Reenvios Agendados

**Acessar Painel de Reenvios:**

1. Abra o app
2. Vá para "📅 Reenvios Agendados"
3. Veja todos os reenvios com status

**Filtrar Reenvios:**

- 📋 **Todos**: Mostra todos os reenvios
- ⏳ **Pendentes**: Aguardando execução
- ✅ **Concluídos**: Reenvios bem-sucedidos
- ❌ **Falhados**: Reenvios que falharam

**Reagendar um Reenvio:**

1. Encontre o reenvio na lista
2. Clique em "Reagendar"
3. Altere data/hora/frequência
4. Clique em "✓ Atualizar"

**Cancelar um Reenvio:**

1. Encontre o reenvio pendente
2. Clique em "Cancelar"
3. Confirme a ação

### Visualizar Histórico

**Histórico de Tentativas:**

1. Abra o detalhe do flow
2. Veja a seção "📜 Histórico de Reenvios"
3. Cada tentativa mostra:
   - Número da tentativa
   - Data e hora
   - Status (✅ Sucesso / ❌ Falha / ⏳ Pendente)
   - Erro (se houver)

**Exportar Histórico:**

1. Abra "📅 Reenvios Agendados"
2. Clique em "📥 Exportar"
3. Escolha formato (CSV)
4. Arquivo é baixado automaticamente

## ⚙️ Configuração

### Frequências de Reenvio

| Frequência | Descrição | Exemplo |
|-----------|-----------|---------|
| **Uma vez** | Reenvio único | Agendar para amanhã às 10h |
| **Diário** | Reenvio todo dia | Tentar todo dia até suceder |
| **Semanal** | Reenvio toda semana | Tentar toda segunda-feira |
| **Automático** | Backoff exponencial | 5min → 15min → 1h → 4h → 24h |

### Máximo de Tentativas

- **1**: Reenvio único (não recomendado)
- **3**: Padrão (recomendado)
- **5**: Para flows críticos
- **10**: Para casos especiais

## 📊 Estatísticas

**Painel de Reenvios mostra:**

- **Total**: Número total de reenvios agendados
- **⏳ Pendentes**: Aguardando execução
- **✅ Concluídos**: Sucesso
- **❌ Falhados**: Falha após todas tentativas
- **Taxa de Sucesso**: Percentual de sucesso

## 🔔 Notificações

### Quando Você Recebe Notificações

- ✅ **Reenvio bem-sucedido**: Seu flow foi reprocessado
- ❌ **Reenvio falhado**: Todas as tentativas falharam
- ⏳ **Próxima tentativa**: Reenvio será feito em X horas
- 🔄 **Reenvio agendado**: Confirmação do agendamento

### Onde Ver Notificações

- 🔔 **App**: Notificação push (se ativado)
- 💬 **WhatsApp**: Mensagem de confirmação
- 📧 **Email**: Resumo diário (opcional)

## 🛠️ Troubleshooting

### Reenvio Não Executou

**Possíveis causas:**

1. ⏰ **Horário não chegou**: Aguarde até o horário agendado
2. 🌐 **Sem internet**: Verifique conexão
3. 📱 **App fechado**: App precisa estar aberto ou com notificações ativadas
4. 🔄 **Limite de tentativas**: Máximo de tentativas foi atingido

**Solução:**

1. Verifique a data/hora do agendamento
2. Abra o app ou ative notificações push
3. Reagende com mais tentativas se necessário

### Reenvio Falhou Novamente

**Possíveis causas:**

1. 💳 **Dados inválidos**: PIX/Boleto expirou
2. 🚫 **Bloqueio**: Conta pode estar bloqueada
3. 🔗 **Integração**: Problema com Asaas

**Solução:**

1. Verifique os dados do pagamento
2. Tente novamente manualmente
3. Contate o administrador se persistir

## 💡 Dicas e Boas Práticas

### ✅ Faça

- ✅ Agende reenvios para horários de pico de uso
- ✅ Use frequência "automática" para flows críticos
- ✅ Monitore o painel regularmente
- ✅ Exporte histórico para análise
- ✅ Configure máximo de tentativas adequado

### ❌ Não Faça

- ❌ Não agende muitos reenvios para o mesmo horário
- ❌ Não cancele reenvios sem motivo
- ❌ Não ignore notificações de falha
- ❌ Não deixe o app fechado por muito tempo
- ❌ Não configure tentativas infinitas

## 📱 Integração com App

### Telas Envolvidas

1. **Histórico de Flows** (`flows-history.tsx`)
   - Mostra todos os flows
   - Botão "⏰ Agendar Reenvio"

2. **Detalhe do Flow** (modal)
   - Botão "⏰ Agendar Reenvio"
   - Histórico de reenvios
   - Status do reenvio

3. **Reenvios Agendados** (`flows-retry-schedules.tsx`)
   - Lista de reenvios
   - Filtros e busca
   - Estatísticas

### Componentes

```typescript
// Agendador
<FlowsRetrySchedulerModal />

// Card de reenvio
<RetryScheduleCard />

// Integração no detalhe
<FlowDetailRetryButton />
<FlowRetryStatusBadge />
<FlowRetryHistory />
```

## 🔐 Segurança

- ✅ Validação de datas (não permite datas passadas)
- ✅ Limite de tentativas (máximo 10)
- ✅ Autenticação obrigatória
- ✅ Dados criptografados
- ✅ Auditoria de ações

## 📈 Performance

- ⚡ Processamento assíncrono
- 🔄 Fila de reenvios
- 📊 Índices de banco de dados
- 💾 Limpeza automática de histórico antigo
- 🚀 Escalável para 1000+ reenvios

## 🎓 Exemplos de Uso

### Exemplo 1: Pagamento com Falha Temporária

```
1. Morador tenta pagar via WhatsApp Flows
2. Falha por timeout (problema de rede)
3. Abre o app e vê "❌ Falhado"
4. Clica "⏰ Agendar Reenvio"
5. Configura: Amanhã às 10h, máx 3 tentativas
6. Próximo dia: Sistema reenvio automaticamente
7. Sucesso! ✅ Pagamento confirmado
```

### Exemplo 2: Manutenção com Múltiplas Tentativas

```
1. Morador solicita manutenção via Flow
2. Falha porque admin estava offline
3. Sistema agenda reenvio automático
4. Tenta: 5min depois → 15min depois → 1h depois
5. Admin volta online
6. Reenvio é processado com sucesso
7. Morador recebe confirmação
```

### Exemplo 3: Monitoramento de Reenvios

```
1. Admin acessa "📅 Reenvios Agendados"
2. Vê: 5 pendentes, 23 concluídos, 2 falhados
3. Taxa de sucesso: 92%
4. Clica em "Falhados" para investigar
5. Exporta CSV para análise
6. Identifica padrão de falha
7. Reagenda com configuração melhor
```

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte este guia
2. Verifique o histórico de reenvios
3. Contate o administrador do condomínio
4. Abra um ticket de suporte

## 🔄 Atualizações Futuras

- [ ] Notificações por SMS
- [ ] Webhooks customizados
- [ ] Análise de padrões de falha
- [ ] Reenvios em lote
- [ ] Agendamento por regras (ex: "reenviar se falhar 3x")

---

**Última atualização**: 27 de Abril de 2026
**Versão**: 1.0.0
