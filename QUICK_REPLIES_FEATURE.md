# 🚀 Sistema de Respostas Rápidas

## Visão Geral

O sistema de **Respostas Rápidas** permite que administradores respondam rapidamente às mensagens dos moradores usando templates pré-configurados. Isso agiliza o atendimento e garante consistência nas respostas.

---

## 🎯 Funcionalidades

### 1. **Templates de Respostas**
- ✅ Criar templates personalizados
- ✅ Categorizar por tipo (Pagamento, Informação, Suporte, Acompanhamento)
- ✅ Adicionar emoji para visualização rápida
- ✅ Rastrear uso e estatísticas

### 2. **Botões de Ação Rápida**
- ✅ Clique único para usar template
- ✅ Filtrar por categoria
- ✅ Mostrar contador de uso
- ✅ Favoritos para acesso rápido

### 3. **Gerenciamento de Templates**
- ✅ Criar, editar, deletar templates
- ✅ Ativar/desativar templates
- ✅ Buscar templates
- ✅ Obter mais usados

### 4. **Estatísticas**
- ✅ Total de templates
- ✅ Templates ativos
- ✅ Total de uso
- ✅ Template mais usado
- ✅ Uso médio

---

## 📊 Estrutura de Dados

### Tabelas

#### `quick_reply_templates`
```sql
id                 TEXT PRIMARY KEY
condominium_id     TEXT NOT NULL
title              TEXT NOT NULL        -- "Confirmar Pagamento"
content            TEXT NOT NULL        -- Conteúdo da resposta
category           TEXT NOT NULL        -- "payment", "info", "support", "follow-up"
emoji              TEXT                 -- "✅", "📅", "💳", "🔧", "👋"
shortcut           TEXT                 -- "Ctrl+1"
usage_count        INTEGER DEFAULT 0
is_active          BOOLEAN DEFAULT true
created_by         TEXT NOT NULL
created_at         INTEGER
updated_at         INTEGER
```

#### `quick_reply_usage`
```sql
id                 TEXT PRIMARY KEY
template_id        TEXT NOT NULL
conversation_id    TEXT NOT NULL
morador_phone      TEXT NOT NULL
morador_name       TEXT NOT NULL
message_id         TEXT
used_at            INTEGER
response_time      INTEGER              -- Tempo em ms
```

#### `quick_reply_categories`
```sql
id                 TEXT PRIMARY KEY
condominium_id     TEXT NOT NULL
name               TEXT NOT NULL        -- "Pagamento", "Informações", etc
description        TEXT
color              TEXT DEFAULT "#3B82F6"
order              INTEGER DEFAULT 0
is_active          BOOLEAN DEFAULT true
created_at         INTEGER
```

#### `quick_reply_favorites`
```sql
id                 TEXT PRIMARY KEY
admin_id           TEXT NOT NULL
template_id        TEXT NOT NULL
order              INTEGER DEFAULT 0
added_at           INTEGER
```

---

## 🎨 Interface Visual

### Painel de Conversas com Respostas Rápidas

```
┌─────────────────────────────────────────────────┐
│ ← João Silva                                    │
│   +5521987654321                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Admin: Olá! Você tem uma mensalidade pendente  │
│ 10:30                                           │
│                                                 │
│                  Qual é a data?                 │
│                                           10:35 │
│                                                 │
│ Admin: O vencimento é 30/04                    │
│ 10:36                                           │
│                                                 │
├─────────────────────────────────────────────────┤
│ 💬 Respostas Rápidas                            │
│ [Todas] [Pagamento] [Info] [Suporte] [Acomp.] │
│                                                 │
│ [✅ Confirmar] [📅 Vencimento] [💳 Link]      │
│ [Pagamento]    [Informação]     [Pagamento]    │
│ 45x            32x              28x             │
│                                                 │
│ [🔧 Suporte]  [👋 Olá]                        │
│ [Suporte]     [Acompanhamento]                 │
│ 15x           22x                              │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Digite sua resposta...]              [Enviar] │
└─────────────────────────────────────────────────┘
```

### Tela de Gerenciamento de Templates

```
┌─────────────────────────────────────┐
│ ⚙️ Respostas Rápidas                │
├─────────────────────────────────────┤
│ [Criar Template]                    │
│                                     │
│ Total: 5 | Ativos: 5 | Uso: 142    │
│ Mais usado: Confirmar Pagamento (45x)
│                                     │
│ ✅ Confirmar Pagamento              │
│    Pagamento • 45x • Ativo          │
│    [Editar] [Deletar] [⭐ Favorito] │
│                                     │
│ 📅 Informar Vencimento              │
│    Informação • 32x • Ativo         │
│    [Editar] [Deletar] [⭐ Favorito] │
│                                     │
│ 💳 Enviar Link de Pagamento         │
│    Pagamento • 28x • Ativo          │
│    [Editar] [Deletar] [⭐ Favorito] │
│                                     │
│ 🔧 Suporte Técnico                  │
│    Suporte • 15x • Ativo            │
│    [Editar] [Deletar] [⭐ Favorito] │
│                                     │
│ 👋 Acompanhamento                   │
│    Acompanhamento • 22x • Ativo     │
│    [Editar] [Deletar] [⭐ Favorito] │
└─────────────────────────────────────┘
```

---

## 🔌 API / tRPC Endpoints

### Criar Template
```typescript
api.quickReplies.createTemplate({
  condominiumId: "cond_123",
  title: "Confirmar Pagamento",
  content: "✅ Pagamento confirmado! Obrigado.",
  category: "payment",
  emoji: "✅",
  shortcut: "Ctrl+1",
  createdBy: "admin@condominio.com"
})
```

### Listar Templates
```typescript
api.quickReplies.listTemplates({
  condominiumId: "cond_123"
})
// Retorna: { success: true, templates: [...] }
```

### Atualizar Template
```typescript
api.quickReplies.updateTemplate({
  id: "template_123",
  title: "Novo Título",
  content: "Novo conteúdo",
  is_active: true
})
```

### Deletar Template
```typescript
api.quickReplies.deleteTemplate({
  id: "template_123"
})
```

### Registrar Uso
```typescript
api.quickReplies.recordUsage({
  templateId: "template_123",
  conversationId: "conv_123",
  moradorPhone: "+5521987654321",
  moradorName: "João Silva",
  responseTime: 2500  // ms
})
```

### Obter Mais Usados
```typescript
api.quickReplies.getMostUsed({
  condominiumId: "cond_123",
  limit: 5
})
// Retorna: { success: true, templates: [...] }
```

### Buscar Templates
```typescript
api.quickReplies.search({
  condominiumId: "cond_123",
  query: "pagamento"
})
// Retorna: { success: true, templates: [...] }
```

### Obter Estatísticas
```typescript
api.quickReplies.getStats({
  condominiumId: "cond_123"
})
// Retorna: {
//   success: true,
//   totalTemplates: 5,
//   activeTemplates: 5,
//   totalUsage: 142,
//   mostUsed: { id, title, usage_count },
//   averageUsage: 28.4
// }
```

### Adicionar aos Favoritos
```typescript
api.quickReplies.addToFavorites({
  adminId: "admin_123",
  templateId: "template_123"
})
```

### Remover dos Favoritos
```typescript
api.quickReplies.removeFromFavorites({
  adminId: "admin_123",
  templateId: "template_123"
})
```

---

## 📱 Uso no Painel de Conversas

### Fluxo de Uso

```
1. Admin abre conversa com morador
2. Admin vê mensagem do morador
3. Admin clica em botão de resposta rápida
4. Template é inserido no campo de texto
5. Admin revisa/edita se necessário
6. Admin clica "Enviar"
7. Sistema registra uso e atualiza estatísticas
```

### Exemplo Prático

```
Morador: "Qual é a data de vencimento?"

Admin clica em [📅 Informar Vencimento]
↓
Campo de texto é preenchido com:
"📅 Sua mensalidade vence em 30/04/2026. Valor: R$ 500.00"

Admin clica [Enviar]
↓
Sistema registra:
- Template usado: "Informar Vencimento"
- Tempo de resposta: 45 segundos
- Contador de uso: 33x (antes era 32x)
```

---

## 📊 Categorias Padrão

| Categoria | Emoji | Descrição | Exemplos |
|-----------|-------|-----------|----------|
| **payment** | 💳 | Respostas sobre pagamentos | Confirmar pagamento, enviar link, informar vencimento |
| **info** | 📅 | Informações gerais | Datas, valores, procedimentos |
| **support** | 🔧 | Suporte técnico | Problemas, dúvidas técnicas |
| **follow-up** | 👋 | Acompanhamento | Saudações, acompanhamento de casos |

---

## 🎯 Benefícios

1. **Agilidade**: Responder em 1 clique em vez de digitar
2. **Consistência**: Mesmas respostas para mesmas perguntas
3. **Rastreamento**: Saber qual resposta foi mais usada
4. **Análise**: Tempo de resposta e padrões de atendimento
5. **Personalização**: Criar templates específicos do condomínio

---

## 🔄 Integração com Outros Sistemas

### Com Painel de Conversas
- Botões aparecem ao lado de cada conversa
- Clique usa template automaticamente
- Registra uso e tempo de resposta

### Com WhatsApp + Baileys
- Respostas rápidas são enviadas via WhatsApp real
- Histórico sincronizado
- Notificações em tempo real

### Com Reminder Scheduler
- Templates para lembretes automáticos
- Respostas pré-configuradas para respostas de moradores

---

## 📈 Métricas e Análise

### Dados Coletados
- Template mais usado
- Tempo médio de resposta
- Taxa de uso por categoria
- Favoritos por admin
- Histórico de uso por morador

### Dashboard de Análise
```
┌─────────────────────────────────────┐
│ 📊 Análise de Respostas Rápidas     │
├─────────────────────────────────────┤
│ Total de Usos: 142                  │
│ Tempo Médio de Resposta: 2.5s       │
│ Template Mais Usado: Confirmar (45x)│
│ Categoria Mais Usada: Pagamento (73x)
│                                     │
│ Gráfico: Uso por Categoria          │
│ Pagamento ████████████ 73x          │
│ Info      ████████ 32x              │
│ Suporte   ████ 15x                  │
│ Acomp.    ██████ 22x                │
└─────────────────────────────────────┘
```

---

## 🚀 Próximos Passos

1. **Integração com Node-Cron**: Agendar lembretes automáticos usando templates
2. **IA Sugestiva**: Sugerir templates baseado no conteúdo da mensagem do morador
3. **Multilíngue**: Suporte a múltiplos idiomas
4. **Sincronização em Tempo Real**: WebSocket para atualizar templates em tempo real
5. **Análise Avançada**: Machine Learning para otimizar respostas

---

**Versão:** 1.0.0  
**Data:** 28/04/2026  
**Status:** ✅ Implementado e Pronto para Usar
