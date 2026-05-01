# Guia Completo: Geração de Cobranças em Lote

## 📋 Visão Geral

A funcionalidade de **Geração de Cobranças em Lote** permite que administradores criem cobranças para todos os moradores de uma vez, facilitando a emissão de mensalidades mensais.

## 🎯 Casos de Uso

1. **Mensalidade Mensal**: Cobrar taxa mensal de todos os moradores
2. **Manutenção Extraordinária**: Cobrar manutenção especial para todos
3. **Melhoria Predial**: Cobrar melhoria do condomínio
4. **Personalizado**: Criar cobrança customizada com valores específicos

## 🚀 Como Usar

### Opção 1: Usar Modelos Pré-configurados

1. Abra o app e vá para **Cobrança → Gerar Lote**
2. Escolha um modelo:
   - 📅 **Mensalidade Mensal** (R$ 500/morador)
   - 🔧 **Manutenção Extraordinária** (R$ 250/morador)
   - 🏗️ **Melhoria Predial** (R$ 300/morador)
   - ➕ **Personalizado** (valor customizado)
3. Preencha os dados:
   - **Nome**: Ex: "Taxa de Maio"
   - **Descrição**: Ex: "Taxa mensal de maio"
   - **Data de Vencimento**: Escolha a data
   - **Valor por Morador**: Defina o valor
4. Revise o resumo (total estimado)
5. Clique em **Gerar Lote**

### Opção 2: Importar via CSV

1. Acesse o painel de **Batch Billing**
2. Clique em **Importar CSV**
3. Baixe o template:
   ```
   moradorId,moradorName,email,amount,dueDate,description
   1,João Silva,joao@example.com,500.00,2026-05-31,Taxa de maio
   2,Maria Santos,maria@example.com,500.00,2026-05-31,Taxa de maio
   ```
4. Preencha com seus dados
5. Faça upload do arquivo
6. Revise os dados validados
7. Confirme a importação

## 📊 Estrutura do CSV

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| `moradorId` | ID do morador | 1 |
| `moradorName` | Nome completo | João Silva |
| `email` | Email | joao@example.com |
| `amount` | Valor em reais | 500.00 |
| `dueDate` | Data de vencimento (YYYY-MM-DD) | 2026-05-31 |
| `description` | Descrição da cobrança | Taxa de maio |

## ⚙️ Processamento em Lote

### Fluxo Automático

```
1. Validação
   ↓
2. Criação de Cobrança para cada Morador
   ↓
3. Geração de PIX/Boleto via Asaas
   ↓
4. Envio de Notificação (WhatsApp/App)
   ↓
5. Atualização de Status
```

### Monitoramento

Durante o processamento, você verá:
- ⏳ **Processando**: Número de moradores processados
- ✓ **Criadas**: Cobranças criadas com sucesso
- ✗ **Falhadas**: Cobranças que falharam
- 📊 **Progresso**: Percentual de conclusão
- ⏱️ **Tempo Restante**: Estimativa de conclusão

### Exemplo de Progresso

```
Processando Lote #42
━━━━━━━━━━━━━━━━━━━━ 75%

Moradores: 50
✓ Criadas: 38
✗ Falhadas: 2
⏳ Pendentes: 10

Tempo restante: ~2 minutos
Processando: Maria Santos
```

## 📈 Histórico de Lotes

Acesse **Cobrança → Histórico** para ver:

- **Status**: Pendente, Processando, Concluído, Falhou
- **Moradores**: Total de moradores no lote
- **Criadas**: Cobranças criadas com sucesso
- **Falhadas**: Cobranças que falharam
- **Valor Total**: Valor total do lote
- **Data**: Quando foi criado

### Ações Disponíveis

- 👁️ **Visualizar Detalhes**: Ver todos os moradores e status
- 📥 **Exportar CSV**: Baixar relatório completo
- 🔄 **Reprocessar Falhas**: Tentar novamente os que falharam
- ❌ **Cancelar**: Parar o processamento (se ainda estiver em andamento)

## 🔍 Validação de Dados

### Validações Automáticas

✅ **Obrigatórios**:
- Nome da cobrança
- Descrição
- Data de vencimento (no futuro)
- Valor (maior que zero)

✅ **CSV**:
- Email válido
- Valor numérico
- Data em formato YYYY-MM-DD
- Data no futuro

### Tratamento de Erros

Se houver erros na validação:

```
❌ Erro na Linha 5
   Email inválido: "joao@invalido"

❌ Erro na Linha 7
   Data no passado: "2020-05-31"

❌ Erro na Linha 9
   Valor inválido: "abc"
```

## 💡 Boas Práticas

### ✅ Recomendado

1. **Agendar com Antecedência**: Gere cobranças 3-5 dias antes do vencimento
2. **Usar Modelos**: Reutilize modelos para cobranças recorrentes
3. **Validar CSV**: Revise o arquivo antes de importar
4. **Monitorar Progresso**: Acompanhe o processamento
5. **Exportar Relatórios**: Guarde cópias dos lotes criados

### ❌ Evitar

1. **Valores Muito Altos**: Pode causar rejeição de pagamento
2. **Datas Muito Próximas**: Dê tempo para moradores pagarem
3. **Lotes Duplicados**: Verifique antes de criar novo lote
4. **Dados Incompletos**: Sempre preencha todos os campos

## 📱 Notificações para Moradores

Quando um lote é criado, moradores recebem:

### Via WhatsApp (Flows)
```
Olá João!

Você tem uma nova cobrança:
📋 Taxa de Maio
💰 R$ 500,00
📅 Vencimento: 31/05/2026

[Botão: Pagar com PIX]
[Botão: Pagar com Boleto]
```

### No App
```
🔔 Nova Cobrança
Taxa de Maio
R$ 500,00 - Vence em 31/05

[Visualizar] [Pagar]
```

## 🔗 Integração com Asaas

Quando uma cobrança é criada:

1. ✅ Sistema cria registro no banco
2. ✅ Gera PIX via Asaas
3. ✅ Gera Boleto via Asaas
4. ✅ Envia dados de Transferência Bancária
5. ✅ Notifica morador

### Status de Sincronização

```
Lote #42 - Status
├─ ✓ Criado no BD
├─ ✓ PIX Gerado (50/50)
├─ ✓ Boleto Gerado (50/50)
├─ ✓ Transferência Configurada (50/50)
├─ ✓ Notificações Enviadas (48/50)
└─ ✓ Concluído
```

## 📊 Relatórios e Análise

### Exportar Lote

```csv
Lote de Cobrança #42
Taxa de Maio
Data de Criação: 27/04/2026

Morador ID,Nome,Email,Valor,Status,Data de Criação
1,João Silva,joao@example.com,500.00,Criada,27/04/2026
2,Maria Santos,maria@example.com,500.00,Criada,27/04/2026
3,Pedro Oliveira,pedro@example.com,500.00,Falha,27/04/2026
...
```

### Estatísticas

- **Total de Lotes**: 12
- **Total de Cobranças**: 600
- **Taxa de Sucesso**: 98.5%
- **Valor Total**: R$ 300.000,00
- **Valor Recebido**: R$ 285.000,00

## 🆘 Solução de Problemas

### Problema: "Lote não foi criado"

**Solução**:
1. Verifique se há conexão com internet
2. Tente novamente em alguns minutos
3. Verifique se Asaas está respondendo
4. Contate suporte se persistir

### Problema: "Algumas cobranças falharam"

**Solução**:
1. Veja o relatório de erros
2. Corrija os dados (email, valor, etc)
3. Use "Reprocessar Falhas" para tentar novamente
4. Ou crie novo lote com dados corretos

### Problema: "CSV não foi aceito"

**Solução**:
1. Verifique o formato das colunas
2. Confirme que emails são válidos
3. Verifique datas (YYYY-MM-DD)
4. Baixe o template e preencha novamente

## 📞 Suporte

Se tiver dúvidas:
- 📧 Email: suporte@condominio.com
- 💬 WhatsApp: (11) 99999-9999
- 🕐 Horário: Seg-Sex, 9h-18h

## 🔐 Segurança

- ✅ Dados criptografados em trânsito
- ✅ Validação em tempo real
- ✅ Auditoria de todas as ações
- ✅ Backup automático de lotes
- ✅ Confirmação antes de processar

## 📚 Recursos Adicionais

- [Guia de Pagamentos](./BILLING_AUTOMATION_GUIDE.md)
- [Integração Asaas](./ASAAS_INTEGRATION.md)
- [WhatsApp Flows](./WHATSAPP_FLOWS_SETUP.md)
- [API Reference](./API.md)

---

**Última atualização**: 27/04/2026
**Versão**: 1.0.0
