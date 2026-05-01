# 🤖 Sistema de Sugestões Inteligentes com IA

## Visão Geral

O sistema de **Sugestões Inteligentes** usa análise de IA para recomendar automaticamente as melhores respostas rápidas baseado na mensagem recebida do morador. O sistema aprende com o tempo e melhora suas sugestões.

---

## 🎯 Funcionalidades

### 1. **Análise de Mensagens**
- ✅ Detecção automática de intenção (Pagamento, Info, Suporte, Reclamação, Saudação)
- ✅ Extração de palavras-chave relevantes
- ✅ Análise de sentimento (Positivo, Negativo, Neutro)
- ✅ Extração de entidades (Valores, Datas, Telefones)

### 2. **Motor de Sugestões**
- ✅ Scoring de relevância (0-100%)
- ✅ Top 3 recomendações ordenadas por relevância
- ✅ Motivo da sugestão explicado
- ✅ Palavras-chave que combinaram destacadas

### 3. **Integração com Respostas Rápidas**
- ✅ Sugestões baseadas em templates existentes
- ✅ Um clique para usar sugestão
- ✅ Rastreamento de uso de sugestões
- ✅ Aprendizado com feedback

### 4. **Análise em Tempo Real**
- ✅ Análise instantânea quando mensagem chega
- ✅ Sugestões aparecem automaticamente
- ✅ Confiança geral exibida (0-100%)
- ✅ Sentimento do morador indicado

---

## 🧠 Como Funciona

### Fluxo de Análise

```
Mensagem Recebida
        ↓
Análise de IA
├─ Detectar Intenção (90% de confiança)
├─ Extrair Palavras-chave
├─ Analisar Sentimento
└─ Extrair Entidades
        ↓
Scoring de Relevância
├─ Comparar com templates (50%)
├─ Palavras-chave (30%)
└─ Confiança (20%)
        ↓
Ordenar Sugestões
├─ Top 1: 92% (Informar Vencimento)
├─ Top 2: 78% (Enviar Link)
└─ Top 3: 65% (Acompanhamento)
        ↓
Exibir ao Admin
└─ Clique para usar
```

### Exemplo Prático

**Mensagem do Morador:**
> "Qual é a data de vencimento da minha mensalidade?"

**Análise:**
- Intenção: `info` (92% confiança)
- Palavras-chave: `["vencimento", "data", "mensalidade"]`
- Sentimento: `neutral`
- Entidades: Nenhuma

**Sugestões Geradas:**
1. 📅 **Informar Vencimento** (92%) - Correspondência alta com intenção
2. 💳 **Enviar Link de Pagamento** (78%) - Palavras-chave encontradas
3. 👋 **Acompanhamento** (65%) - Contexto similar

---

## 📊 Estrutura de Dados

### Análise de Mensagem

```typescript
interface MessageAnalysis {
  originalMessage: string;
  intent: "payment" | "info" | "support" | "complaint" | "greeting" | "unknown";
  confidence: number;  // 0-1
  keywords: string[];
  entities: {
    amount?: number;
    date?: string;
    phone?: string;
  };
  sentiment: "positive" | "negative" | "neutral";
}
```

### Sugestão Recomendada

```typescript
interface SuggestedReply {
  templateId: string;
  title: string;
  content: string;
  emoji: string;
  relevanceScore: number;  // 0-1
  matchedKeywords: string[];
  reason: string;
}
```

---

## 🔌 API / tRPC Endpoints

### Gerar Sugestões
```typescript
api.aiSuggestions.generateSuggestions({
  message: "Qual é a data de vencimento?",
  condominiumId: "cond_123"
})
// Retorna:
// {
//   success: true,
//   analysis: { intent, confidence, keywords, sentiment, entities },
//   suggestions: [{ templateId, title, content, emoji, relevanceScore, matchedKeywords, reason }],
//   topSuggestion: { ... },
//   confidence: 92
// }
```

### Analisar Intenção
```typescript
api.aiSuggestions.analyzeMessage({
  message: "Não consegui escanear o QR Code"
})
// Retorna:
// {
//   success: true,
//   analysis: { intent: "support", confidence: 0.88, ... }
// }
```

### Filtrar por Score Mínimo
```typescript
api.aiSuggestions.filterSuggestions({
  suggestions: [...],
  minScore: 0.6
})
// Retorna apenas sugestões com score >= 60%
```

### Agrupar por Categoria
```typescript
api.aiSuggestions.groupSuggestions({
  suggestions: [...]
})
// Retorna:
// {
//   payment: [{ ... }, { ... }],
//   info: [{ ... }],
//   support: [{ ... }]
// }
```

### Recomendação Personalizada
```typescript
api.aiSuggestions.getPersonalizedRecommendation({
  suggestions: [...],
  preferredCategories: ["payment", "info"],
  minConfidence: 0.7
})
// Retorna melhor sugestão conforme preferências
```

---

## 🎨 Interface Visual

### Painel de Conversas com Sugestões

```
┌─────────────────────────────────────────────────┐
│ ← João Silva                                    │
│   +5521987654321                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Admin: Qual é a data de vencimento?            │
│ 10:30                                           │
│                                                 │
│                  Qual é a data?                 │
│                                           10:35 │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🤖 Análise de IA                                │
│ Intenção: Informação | Sentimento: 😐          │
│ Confiança: 92%                                  │
│                                                 │
│ 💡 Sugestões Recomendadas                       │
│                                                 │
│ [📅 92%] [💳 78%] [👋 65%]                     │
│ Informar  Enviar   Acomp.                       │
│ Vencimento Link    anhamento                    │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Digite sua resposta...]              [Enviar] │
└─────────────────────────────────────────────────┘
```

### Indicadores de Confiança

| Score | Cor | Significado |
|-------|-----|-------------|
| 80-100% | 🟢 Verde | Muito relevante |
| 60-79% | 🟡 Amarelo | Relevante |
| 40-59% | 🟠 Laranja | Moderadamente relevante |
| <40% | 🔴 Vermelho | Pouco relevante |

---

## 🧠 Palavras-chave por Intenção

### Pagamento (💳)
`pagar`, `pagamento`, `boleto`, `pix`, `débito`, `crédito`, `link`, `valor`, `preço`, `mensalidade`, `taxa`, `fatura`

### Informação (📅)
`quando`, `qual`, `como`, `onde`, `vencimento`, `data`, `horário`, `endereço`, `telefone`, `email`, `informação`, `detalhes`

### Suporte (🔧)
`problema`, `erro`, `não funciona`, `dificuldade`, `dúvida`, `ajuda`, `socorro`, `suporte`, `técnico`, `bug`, `travou`, `lento`

### Reclamação (😞)
`reclamação`, `reclamar`, `insatisfeito`, `desapontado`, `ruim`, `péssimo`, `horrível`, `não gostei`, `decepção`, `problema`, `falha`

### Saudação (👋)
`olá`, `oi`, `opa`, `e aí`, `tudo bem`, `como vai`, `bom dia`, `boa tarde`, `boa noite`, `obrigado`, `valeu`

---

## 📈 Análise de Sentimento

### Palavras Positivas
`obrigado`, `obrigada`, `valeu`, `thanks`, `ótimo`, `excelente`, `bom`, `legal`, `adorei`, `amei`

### Palavras Negativas
`ruim`, `péssimo`, `horrível`, `terrível`, `problema`, `erro`, `reclamação`, `insatisfeito`, `decepção`, `não gostei`

### Resultado
- **Positivo** 😊: Mais palavras positivas
- **Negativo** 😞: Mais palavras negativas
- **Neutro** 😐: Equilíbrio ou nenhuma

---

## 🚀 Benefícios

1. **Agilidade**: Sugestões aparecem automaticamente
2. **Precisão**: Análise baseada em intenção e contexto
3. **Aprendizado**: Melhora com o tempo
4. **Rastreamento**: Saber qual sugestão foi usada
5. **Personalização**: Adapta-se ao padrão de respostas

---

## 🔄 Integração com Outros Sistemas

### Com Painel de Conversas
- Sugestões aparecem automaticamente quando mensagem chega
- Um clique para usar sugestão
- Registra qual sugestão foi usada

### Com Respostas Rápidas
- Usa templates como base para sugestões
- Rastreia uso de sugestões
- Melhora ranking de templates

### Com WhatsApp + Baileys
- Análise de mensagens recebidas via WhatsApp
- Sugestões aparecem no painel
- Envio automático de resposta

---

## 📊 Métricas e Análise

### Dados Coletados
- Intenção detectada vs. intenção real
- Score de relevância vs. taxa de uso
- Tempo de resposta com sugestão
- Feedback do admin (usou ou não)

### Dashboard de Análise
```
┌─────────────────────────────────────┐
│ 📊 Análise de Sugestões             │
├─────────────────────────────────────┤
│ Taxa de Acurácia: 87%               │
│ Sugestões Usadas: 142/165 (86%)     │
│ Tempo Médio de Resposta: 2.3s       │
│ Intenção Mais Comum: Info (45%)     │
│ Sentimento Mais Comum: Neutro (62%) │
│                                     │
│ Top Sugestões Usadas:               │
│ 1. Informar Vencimento (45x)        │
│ 2. Enviar Link (32x)                │
│ 3. Confirmar Pagamento (28x)        │
└─────────────────────────────────────┘
```

---

## 🎓 Aprendizado com Feedback

### Feedback Positivo
Admin usa sugestão → Score aumenta para template similar

### Feedback Negativo
Admin ignora sugestão → Score diminui para template similar

### Resultado
Sugestões melhoram com o tempo conforme padrão de uso

---

## 🚀 Próximos Passos

1. **Machine Learning Real**: Integrar com modelo de IA real (OpenAI, Hugging Face)
2. **Treinamento Personalizado**: Modelo treinado com histórico do condomínio
3. **Análise Multilíngue**: Suporte a múltiplos idiomas
4. **Integração com CRM**: Histórico de interações do morador
5. **Recomendações Dinâmicas**: Adaptar conforme hora do dia, tipo de morador, etc.

---

## 🔒 Privacidade e Segurança

- ✅ Análise local (sem enviar dados para servidor externo)
- ✅ Sem armazenamento de mensagens pessoais
- ✅ Apenas análise de intenção/sentimento
- ✅ Conformidade com LGPD

---

**Versão:** 1.0.0  
**Data:** 28/04/2026  
**Status:** ✅ Implementado e Pronto para Usar
