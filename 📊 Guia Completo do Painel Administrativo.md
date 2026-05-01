# 📊 Guia Completo do Painel Administrativo

## Visão Geral

O painel administrativo oferece autonomia total para gerenciar o condomínio, incluindo mensalidades, despesas, comunicados e documentos.

## 🎯 Funcionalidades Principais

### 1. Gestão de Mensalidades

#### 1.1 Definir Mensalidade Individual
- **Como**: Admin → Moradores → Selecionar Morador → Editar Mensalidade
- **Funcionalidades**:
  - Definir valor específico por morador
  - Diferentes valores por tipo de unidade (apto, sala comercial, etc.)
  - Data de vencimento personalizável
  - Histórico completo de alterações

#### 1.2 Alterar Mensalidade
- **Quando**: Necessário aumentar/diminuir valor
- **Como**:
  1. Selecionar morador
  2. Clicar "Editar Mensalidade"
  3. Inserir novo valor
  4. Adicionar motivo da alteração (opcional)
  5. Confirmar
- **Histórico**: Todas as alterações são registradas com data e motivo

#### 1.3 Aplicar Alteração em Lote
- **Para**: Aumentar mensalidade de todos os moradores
- **Como**:
  1. Admin → Mensalidades → "Alterar em Lote"
  2. Selecionar moradores (todos ou filtrados)
  3. Inserir novo valor ou percentual de aumento
  4. Revisar alterações
  5. Confirmar
- **Resultado**: Todos recebem notificação de alteração

#### 1.4 Histórico de Mensalidades
- Ver todas as alterações de cada morador
- Gráfico mostrando evolução de valores
- Exportar relatório em PDF/Excel

### 2. Gestão de Despesas

#### 2.1 Registrar Despesa
- **Como**: Admin → Despesas → "Nova Despesa"
- **Informações**:
  - Descrição
  - Categoria (Manutenção, Limpeza, Segurança, Reforma, Utilidades, Outro)
  - Valor
  - Data
  - Fornecedor (opcional)
  - Observações

#### 2.2 Categorizar Despesas
- **Categorias Disponíveis**:
  - 🔧 Manutenção (Consertos, Reparos)
  - 🧹 Limpeza (Limpeza geral, Dedetização)
  - 👮 Segurança (Vigilância, Portaria)
  - 🏗️ Reforma (Obras, Melhorias)
  - 💡 Utilidades (Água, Luz, Internet)
  - 📋 Outro

#### 2.3 Anexar Documentos
- **Tipos Aceitos**: PDF, Imagem (JPG, PNG), Word (DOCX)
- **Como**:
  1. Ao registrar despesa, clicar "Anexar Documento"
  2. Selecionar arquivo
  3. Sistema valida tamanho (máx. 5MB por arquivo)
  4. Arquivo é armazenado e vinculado à despesa
- **Documentos Aceitos**:
  - Notas Fiscais
  - Recibos
  - Orçamentos
  - Comprovantes de Pagamento
  - Fotos de Serviço Realizado

#### 2.4 Visualizar Despesas
- Lista com filtros por:
  - Período (data inicial/final)
  - Categoria
  - Fornecedor
  - Valor (mínimo/máximo)
- Cada despesa mostra:
  - Descrição
  - Valor
  - Data
  - Documentos anexados
  - Opção para editar/deletar

### 3. Comunicados

#### 3.1 Enviar Comunicado
- **Canais**: WhatsApp + Notificação no App
- **Como**:
  1. Admin → Comunicados → "Novo Comunicado"
  2. Escrever mensagem
  3. Selecionar destinatários (todos ou filtrados)
  4. Escolher canais (WhatsApp, App, ou ambos)
  5. Agendar ou enviar imediatamente
  6. Confirmar

#### 3.2 Agendar Comunicado
- **Opções**:
  - Enviar agora
  - Agendar para data/hora específica
  - Enviar em dias úteis (seg-sex)
  - Enviar em horário comercial (8h-18h)
- **Exemplo**: Agendar avisos de vencimento para 3 dias antes

#### 3.3 Salvar como Template
- **Como**:
  1. Ao criar comunicado, clicar "Salvar como Template"
  2. Dar nome ao template
  3. Reutilizar em futuros comunicados
- **Exemplos de Templates**:
  - "Aviso de Vencimento"
  - "Comunicado de Manutenção"
  - "Avisos Importantes"
  - "Reunião de Condomínio"

#### 3.4 Filtrar Destinatários
- **Opções**:
  - Todos os moradores
  - Apenas inadimplentes
  - Apenas adimplentes
  - Por bloco/ala
  - Por tipo de unidade
  - Moradores específicos (seleção manual)

#### 3.5 Histórico de Comunicados
- Ver todos os comunicados enviados
- Status de entrega (enviado, lido, falha)
- Reagendar comunicado
- Duplicar comunicado

### 4. Multi-Admin com Permissões

#### 4.1 Gerenciar Admins
- **Como**: Admin Principal → Configurações → Admins
- **Ações**:
  - Adicionar novo admin
  - Editar permissões
  - Remover admin
  - Ver atividade do admin

#### 4.2 Níveis de Permissão
- **Admin Principal** (Acesso Total):
  - Gerenciar todos os recursos
  - Adicionar/remover admins
  - Alterar configurações gerais

- **Admin Financeiro**:
  - Gerenciar mensalidades
  - Registrar despesas
  - Ver relatórios financeiros
  - Não pode: Gerenciar admins, Enviar comunicados

- **Admin de Comunicação**:
  - Enviar comunicados
  - Gerenciar templates
  - Ver histórico de comunicados
  - Não pode: Alterar mensalidades, Gerenciar despesas

- **Admin Operacional**:
  - Registrar despesas
  - Anexar documentos
  - Ver relatórios
  - Não pode: Alterar mensalidades, Enviar comunicados

#### 4.3 Auditoria de Ações
- Log de todas as ações do admin:
  - Quem fez
  - O que fez
  - Quando fez
  - De qual IP/dispositivo
- Útil para rastreabilidade

### 5. Relatórios e Exportação

#### 5.1 Relatório Financeiro
- **Inclui**:
  - Total arrecadado (mês/ano)
  - Total de despesas (mês/ano)
  - Saldo (arrecadação - despesas)
  - Taxa de adimplência
  - Inadimplência
  - Gráficos de tendência

- **Período**: Customizável (mês, trimestre, ano)
- **Exportar**: PDF ou Excel

#### 5.2 Relatório de Inadimplência
- **Mostra**:
  - Moradores inadimplentes
  - Quanto devem
  - Há quanto tempo estão inadimplentes
  - Histórico de pagamentos
  - Ações tomadas (comunicados, cobranças)

- **Ações Rápidas**:
  - Enviar comunicado de cobrança
  - Gerar boleto de cobrança
  - Registrar acordo de pagamento

#### 5.3 Relatório de Despesas
- **Inclui**:
  - Despesas por categoria
  - Despesas por período
  - Despesas por fornecedor
  - Gráfico de distribuição
  - Documentos anexados

- **Filtros**: Período, categoria, fornecedor

#### 5.4 Relatório de Comunicados
- **Mostra**:
  - Comunicados enviados
  - Taxa de leitura
  - Canais utilizados
  - Horários mais efetivos

#### 5.5 Exportar Dados
- **Formatos**: PDF, Excel, CSV
- **O que exportar**:
  - Relatórios completos
  - Listas de moradores
  - Histórico de mensalidades
  - Histórico de despesas
  - Comunicados enviados

## 📱 Fluxos de Uso Comum

### Fluxo 1: Aumentar Mensalidade
```
1. Admin acessa Painel
2. Clica em "Mensalidades"
3. Seleciona "Alterar em Lote"
4. Escolhe moradores (todos)
5. Insere novo valor (ex: +10%)
6. Revisa alterações
7. Confirma
8. Sistema envia notificação a todos
9. Histórico é registrado
```

### Fluxo 2: Registrar Despesa com Documentos
```
1. Admin acessa Painel
2. Clica em "Despesas" → "Nova Despesa"
3. Preenche:
   - Descrição: "Reparo de Portão"
   - Categoria: Manutenção
   - Valor: R$ 500,00
   - Data: 27/04/2026
   - Fornecedor: "Serralharia Silva"
4. Clica "Anexar Documento"
5. Seleciona Nota Fiscal (PDF)
6. Sistema valida arquivo
7. Clica "Salvar"
8. Despesa é registrada e aparece em relatórios
```

### Fluxo 3: Enviar Comunicado Agendado
```
1. Admin acessa Painel
2. Clica em "Comunicados" → "Novo"
3. Escreve mensagem (ex: "Aviso de Vencimento")
4. Seleciona destinatários (todos)
5. Escolhe canais (WhatsApp + App)
6. Clica "Agendar"
7. Seleciona data/hora (ex: 3 dias antes do vencimento)
8. Clica "Confirmar"
9. Sistema envia automaticamente na hora agendada
10. Admin recebe confirmação
```

### Fluxo 4: Gerar Relatório Financeiro
```
1. Admin acessa Painel
2. Clica em "Relatórios" → "Financeiro"
3. Seleciona período (ex: Abril/2026)
4. Sistema calcula:
   - Arrecadação
   - Despesas
   - Saldo
   - Taxa de adimplência
5. Visualiza gráficos
6. Clica "Exportar" → "PDF"
7. Arquivo é gerado e baixado
```

## 🔐 Segurança

- Todas as ações são auditadas
- Senhas são criptografadas
- Sessões expiram após inatividade
- Backup automático de dados
- Acesso baseado em permissões

## 📲 Acesso

- **Web**: Acessar via navegador
- **Mobile**: Usar app no smartphone
- **Sincronização**: Dados sincronizam em tempo real

## ❓ Dúvidas Frequentes

**P: Posso ter múltiplos admins?**
R: Sim! Você pode adicionar até 5 admins com diferentes permissões.

**P: Quanto tempo os documentos ficam armazenados?**
R: Indefinidamente. Você pode deletar manualmente quando necessário.

**P: Posso agendar comunicados para datas futuras?**
R: Sim! Você pode agendar com até 1 ano de antecedência.

**P: Os moradores veem as despesas?**
R: Não. Despesas são apenas para admins. Moradores veem apenas a mensalidade.

**P: Posso editar um comunicado já enviado?**
R: Não, mas você pode enviar um comunicado adicional corrigindo a informação.

## 📞 Suporte

Para dúvidas sobre o painel administrativo, contate o time de desenvolvimento.
