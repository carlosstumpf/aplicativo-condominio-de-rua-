# Flows History - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades](#funcionalidades)
4. [Como Usar](#como-usar)
5. [Filtros e Busca](#filtros-e-busca)
6. [Detalhes do Flow](#detalhes-do-flow)
7. [Exportação](#exportação)
8. [API](#api)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A tela de **Flows History** permite que moradores visualizem o histórico completo de flows enviados (via WhatsApp ou App) com status, timeline, dados e resultados.

**Funcionalidades**:
- ✅ Listar todos os flows enviados
- ✅ Filtrar por tipo, status, origem e data
- ✅ Buscar por conteúdo
- ✅ Ver detalhes completos de cada flow
- ✅ Reenviar flows com falha
- ✅ Exportar histórico em CSV
- ✅ Ver timeline de eventos

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│              Mobile App (React Native)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Flows History Screen                            │   │
│  │  ├─ List View (FlatList)                         │   │
│  │  ├─ Filters (Type, Status, Source)              │   │
│  │  ├─ Search Bar                                   │   │
│  │  └─ Detail Modal                                 │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend API (tRPC)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  flows.getHistory()                              │   │
│  │  flows.getDetail()                               │   │
│  │  flows.getStats()                                │   │
│  │  flows.resend()                                  │   │
│  │  flows.export()                                  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL/MySQL)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  flowsHistory Table                              │   │
│  │  ├─ id                                           │   │
│  │  ├─ moradorId                                    │   │
│  │  ├─ flowId                                       │   │
│  │  ├─ flowType                                     │   │
│  │  ├─ status                                       │   │
│  │  ├─ sentAt                                       │   │
│  │  ├─ completedAt                                 │   │
│  │  ├─ data (JSON)                                 │   │
│  │  ├─ result (JSON)                               │   │
│  │  └─ errorMessage                                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades

### 1. Listar Flows

Todos os flows enviados aparecem em uma lista ordenada por data (mais recentes primeiro).

**Informações exibidas**:
- Tipo do flow (💰 Pagamento, 🔧 Manutenção, 📊 Saldo, ❓ Ajuda)
- Status (⏳ Pendente, ✅ Concluído, ❌ Falha, 🚫 Cancelado)
- Origem (💬 WhatsApp ou 📱 App)
- Data de envio
- Duração (tempo entre envio e conclusão)

### 2. Filtros

Filtrar flows por:
- **Tipo**: Pagamento, Manutenção, Saldo, Ajuda
- **Status**: Pendente, Concluído, Falha, Cancelado
- **Origem**: WhatsApp, App
- **Data**: Período customizável

### 3. Busca

Buscar por conteúdo dos flows:
- Descrição
- Valor
- Categoria
- Qualquer dado enviado

### 4. Detalhes do Flow

Ao clicar em um flow, abre modal com:
- **Tipo e Status**
- **Timeline completa** (envio, conclusão, erro)
- **Dados enviados** (JSON)
- **Resultado** (PIX, Boleto, etc)
- **Mensagem de erro** (se aplicável)
- **Botão de Reenvio** (se falhou)

### 5. Reenviar

Se um flow falhou, pode ser reenviado com um clique.

Novo flow é criado com:
- Mesmos dados do original
- Status "Pendente"
- Novo timestamp

### 6. Exportar

Exportar histórico em CSV com:
- ID, Tipo, Status, Data, Origem
- Dados e Resultado em JSON
- Compatível com Excel/Sheets

### 7. Estatísticas

Dashboard mostra:
- Total de flows
- Taxa de conclusão
- Tempo médio de processamento
- Flows pendentes

---

## 🎮 Como Usar

### Acessar Flows History

1. Abra o app de Gestão de Condomínio
2. Vá para aba "Serviços" ou "Histórico"
3. Clique em "📜 Histórico de Flows"

### Filtrar Flows

1. Clique nos botões de filtro no topo
2. Selecione o tipo, status ou origem desejado
3. A lista atualiza automaticamente

### Buscar Flows

1. Digite na barra de busca
2. Resultados aparecem em tempo real
3. Limpe para ver todos novamente

### Ver Detalhes

1. Clique em um flow na lista
2. Modal abre mostrando:
   - Timeline de eventos
   - Dados enviados
   - Resultado ou erro
3. Clique "Fechar" ou fora do modal

### Reenviar Flow

1. Abra detalhes de um flow com falha
2. Clique em "Reenviar"
3. Novo flow é criado
4. Você será notificado quando concluir

### Exportar Histórico

1. Clique em "⬇️ Exportar"
2. Escolha filtros (opcional)
3. Selecione formato (CSV)
4. Arquivo é baixado

---

## 🔍 Filtros e Busca

### Filtros Disponíveis

| Filtro | Opções | Descrição |
|--------|--------|-----------|
| **Tipo** | Pagamento, Manutenção, Saldo, Ajuda | Tipo de flow |
| **Status** | Pendente, Concluído, Falha, Cancelado | Status atual |
| **Origem** | WhatsApp, App | De onde foi enviado |
| **Data** | Customizável | Período de tempo |

### Exemplos de Busca

```
"PIX"           → Busca flows de pagamento com PIX
"vazamento"     → Busca flows de manutenção sobre vazamento
"2024-04"       → Busca flows de abril de 2024
"erro"          → Busca flows com erro
```

### Combinar Filtros

Você pode combinar múltiplos filtros:

```
Tipo: Pagamento
Status: Falha
Origem: WhatsApp
Data: Últimos 7 dias

Resultado: Todos os pagamentos via WhatsApp que falharam na última semana
```

---

## 📊 Detalhes do Flow

### Modal de Detalhes

Ao clicar em um flow, você vê:

#### 1. Informações Básicas
- Tipo do flow
- Status atual
- Origem (WhatsApp/App)

#### 2. Timeline
```
📤 Enviado
   2024-04-27 14:30:00

✅ Concluído
   2024-04-27 14:30:15
   (15 segundos depois)
```

#### 3. Dados Enviados
```json
{
  "month": "2024-04",
  "paymentMethod": "PIX",
  "value": 500
}
```

#### 4. Resultado
```json
{
  "pixKey": "12345678901234567890123456789012",
  "expiresIn": 86400
}
```

#### 5. Erro (se aplicável)
```
❌ Erro: Cliente não encontrado no Asaas
```

### Ações Disponíveis

- **Fechar**: Fecha o modal
- **Reenviar**: Reenvia o flow (apenas se falhou)
- **Copiar Dados**: Copia dados para clipboard
- **Compartilhar**: Compartilha detalhes

---

## 📤 Exportação

### Formatos Suportados

- **CSV**: Compatível com Excel, Google Sheets, etc
- **JSON**: Para integração com sistemas
- **PDF**: Para impressão/arquivo

### Dados Exportados

```csv
ID,Tipo,Status,Data Envio,Data Conclusão,Origem,Dados,Resultado
1,payment,completed,2024-04-27T14:30:00Z,2024-04-27T14:30:15Z,whatsapp,"{...}","{...}"
2,maintenance,completed,2024-04-26T10:15:00Z,2024-04-26T10:20:00Z,app,"{...}","{...}"
3,payment,failed,2024-04-25T09:00:00Z,,whatsapp,"{...}","Erro: Cliente não encontrado"
```

### Como Exportar

1. Clique em "⬇️ Exportar"
2. Escolha filtros (opcional):
   - Tipo de flow
   - Status
   - Data inicial/final
3. Selecione formato
4. Clique "Exportar"
5. Arquivo é baixado

---

## 🔌 API

### Endpoints Disponíveis

#### `flows.getHistory()`
```typescript
const history = await trpc.flows.getHistory.query({
  flowType: "payment",
  status: "completed",
  source: "whatsapp",
  startDate: new Date("2024-04-01"),
  endDate: new Date("2024-04-30"),
  limit: 50,
  offset: 0
});
```

#### `flows.getDetail()`
```typescript
const detail = await trpc.flows.getDetail.query({
  flowHistoryId: 1
});
```

#### `flows.getStats()`
```typescript
const stats = await trpc.flows.getStats.query({
  startDate: new Date("2024-04-01"),
  endDate: new Date("2024-04-30")
});

// Retorna:
// {
//   total: 50,
//   completed: 45,
//   failed: 3,
//   pending: 2,
//   completionRate: 90,
//   averageTime: 12 (minutos)
// }
```

#### `flows.resend()`
```typescript
const newFlow = await trpc.flows.resend.mutate({
  flowHistoryId: 1
});
```

#### `flows.export()`
```typescript
const csv = await trpc.flows.export.query({
  format: "csv",
  flowType: "payment",
  status: "completed"
});
```

---

## 🐛 Troubleshooting

### Flows não aparecem

**Problema**: Lista vazia mesmo tendo enviado flows

**Solução**:
1. Verifique se está logado
2. Verifique se tem filtros muito restritivos
3. Limpe filtros e tente novamente
4. Recarregue a tela

### Detalhes não carregam

**Problema**: Modal fica em branco

**Solução**:
1. Feche e tente novamente
2. Verifique conexão de internet
3. Reinicie o app
4. Contate suporte

### Reenvio não funciona

**Problema**: Botão "Reenviar" não funciona

**Solução**:
1. Verifique se flow tem status "Falha"
2. Verifique conexão de internet
3. Tente novamente em alguns segundos
4. Contate suporte

### Exportação lenta

**Problema**: Exportação demora muito

**Solução**:
1. Use filtros para reduzir volume
2. Exporte períodos menores
3. Tente em outro momento
4. Contate suporte

### Dados incorretos

**Problema**: Dados mostram informações erradas

**Solução**:
1. Recarregue a tela
2. Limpe cache do app
3. Reinstale o app
4. Contate suporte

---

## 📱 Compatibilidade

- ✅ iOS 13+
- ✅ Android 8+
- ✅ Web (navegadores modernos)

---

## 🔐 Privacidade

- Seu histórico é privado
- Apenas você pode ver seus flows
- Dados são criptografados
- Histórico é mantido por 90 dias

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este guia
2. Contate suporte do condomínio
3. Abra um ticket no app

---

**Última atualização**: Abril 2026
**Versão**: 1.0.0
