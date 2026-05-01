# Gestão de Condomínio de Rua — Design da Interface Móvel

## Visão Geral

Aplicativo móvel para gerenciamento completo de condominios de rua, com foco em:
- **Cobrança de mensalidades** (Pix e Boleto via Asaas)
- **Gestão de despesas** e categorização
- **Prestação de contas** transparente
- **Conciliação bancária** automática
- **Atendimento aos moradores** com suporte e notificações

---

## Orientação & Princípios

- **Orientação**: Portrait (9:16) — uso com uma mão
- **Padrão iOS**: Seguir Apple Human Interface Guidelines (HIG)
- **Tipografia**: Hierarquia clara (títulos, subtítulos, corpo)
- **Cores**: Paleta consistente com feedback visual claro
- **Acessibilidade**: Contraste adequado, tamanho de toque mínimo 44pt

---

## Paleta de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| **Primary** | `#0a7ea4` (Azul Teal) | Botões principais, destaque |
| **Success** | `#22C55E` (Verde) | Pagamentos confirmados, sucesso |
| **Warning** | `#F59E0B` (Âmbar) | Vencimentos próximos, atenção |
| **Error** | `#EF4444` (Vermelho) | Erros, inadimplência |
| **Background** | `#FFFFFF` (Branco) | Fundo principal |
| **Surface** | `#F5F5F5` (Cinza claro) | Cards, superfícies |
| **Foreground** | `#11181C` (Preto) | Texto principal |
| **Muted** | `#687076` (Cinza) | Texto secundário |
| **Border** | `#E5E7EB` (Cinza claro) | Divisores |

---

## Lista de Telas

### 1. **Tela de Autenticação (Login)**
- **Conteúdo**: Logo da associação, campo de telefone, campo de senha
- **Funcionalidade**: Login com credenciais, recuperação de senha
- **Fluxo**: Login → Dashboard (admin) ou Home (morador)

### 2. **Dashboard Administrativo (Home - Admin)**
- **Conteúdo**: 
  - Cards de resumo: Receitas (mês), Despesas (mês), Saldo, Moradores ativos
  - Gráfico de receitas vs despesas (últimos 3 meses)
  - Lista de cobranças pendentes (últimas 5)
  - Botões de ação rápida: Gerar cobrança, Registrar despesa, Ver relatório
- **Funcionalidade**: Visão geral financeira, acesso rápido a funções principais

### 3. **Dashboard Morador (Home - Morador)**
- **Conteúdo**:
  - Card com status de pagamento (em dia / atrasado)
  - Valor da próxima mensalidade e data de vencimento
  - Botões: Pagar via Pix, Pagar via Boleto, Ver histórico
  - Notificações recentes
- **Funcionalidade**: Visualizar situação financeira pessoal

### 4. **Tela de Moradores (Listagem)**
- **Conteúdo**: 
  - Lista com busca/filtro por nome, casa, status
  - Cards com: Nome, Casa, Telefone, Status (ativo/inativo), Última cobrança
  - Botão de ação por morador: Editar, Cobrar, Ver histórico
- **Funcionalidade**: Gerenciar cadastro de moradores

### 5. **Tela de Detalhe do Morador**
- **Conteúdo**: 
  - Informações pessoais (nome, CPF, telefone, casa)
  - Histórico de pagamentos (últimas 10)
  - Saldo devedor (se houver)
  - Botões: Editar, Gerar cobrança, Enviar mensagem
- **Funcionalidade**: Visualizar e gerenciar morador individual

### 6. **Tela de Cobranças**
- **Conteúdo**:
  - Filtros: Status (pendente, recebido, vencido), Período, Tipo (Pix/Boleto)
  - Lista de cobranças com: Morador, Valor, Vencimento, Status
  - Ação por cobrança: Visualizar, Reenviar, Cancelar
- **Funcionalidade**: Acompanhar cobranças em tempo real

### 7. **Tela de Gerar Cobrança**
- **Conteúdo**:
  - Seleção de morador (dropdown ou busca)
  - Tipo de cobrança (Pix / Boleto)
  - Valor (pré-preenchido com mensalidade padrão, editável)
  - Data de vencimento (padrão: próximo dia útil)
  - Descrição (opcional)
  - Botão: Gerar cobrança
- **Funcionalidade**: Criar nova cobrança para morador

### 8. **Tela de Despesas**
- **Conteúdo**:
  - Filtros: Categoria, Período, Valor mínimo/máximo
  - Lista de despesas: Data, Categoria, Descrição, Valor
  - Botão flutuante: Adicionar despesa
- **Funcionalidade**: Registrar e acompanhar despesas da associação

### 9. **Tela de Registrar Despesa**
- **Conteúdo**:
  - Data (padrão: hoje)
  - Categoria (dropdown: Manutenção, Limpeza, Segurança, Utilidades, Outros)
  - Descrição
  - Valor
  - Comprovante (opcional, upload de imagem)
  - Botão: Salvar
- **Funcionalidade**: Registrar nova despesa

### 10. **Tela de Prestação de Contas**
- **Conteúdo**:
  - Período selecionável (mês/ano)
  - Resumo: Receitas, Despesas, Saldo
  - Gráfico de pizza: Distribuição de despesas por categoria
  - Tabela detalhada: Receitas vs Despesas
  - Botão: Exportar PDF
- **Funcionalidade**: Visualizar relatório financeiro transparente

### 11. **Tela de Conciliação Bancária**
- **Conteúdo**:
  - Saldo bancário (importado do Asaas)
  - Saldo em caixa (calculado: receitas - despesas)
  - Diferenças/discrepâncias (se houver)
  - Lista de transações não conciliadas
  - Botão: Conciliar transações
- **Funcionalidade**: Validar integridade financeira

### 12. **Tela de Atendimento/Suporte**
- **Conteúdo**:
  - Lista de chamados/problemas relatados
  - Filtros: Status (aberto, em andamento, resolvido), Prioridade
  - Card por chamado: Morador, Data, Problema, Status
  - Botão: Responder/Resolver
- **Funcionalidade**: Gerenciar comunicação com moradores

### 13. **Tela de Novo Chamado (Morador)**
- **Conteúdo**:
  - Título do problema
  - Descrição detalhada
  - Categoria (opcional: Manutenção, Segurança, Limpeza, Outro)
  - Anexo (foto, opcional)
  - Botão: Enviar
- **Funcionalidade**: Morador relatar problema

### 14. **Tela de Configurações**
- **Conteúdo**:
  - Perfil do usuário (nome, telefone, cargo)
  - Configurações da associação (nome, valor mensalidade, banco)
  - Notificações (ativar/desativar)
  - Tema (claro/escuro)
  - Logout
- **Funcionalidade**: Gerenciar preferências e dados

### 15. **Tela de Relatórios Avançados**
- **Conteúdo**:
  - Gráficos: Receitas por mês, Despesas por categoria, Taxa de inadimplência
  - Filtros: Período, Tipo de relatório
  - Exportar dados (CSV, PDF)
- **Funcionalidade**: Análise financeira detalhada

---

## Fluxos Principais

### Fluxo 1: Admin Gera Cobrança em Massa
1. Admin acessa "Cobranças" → "Gerar em Massa"
2. Seleciona período e tipo (Pix/Boleto)
3. Sistema lista moradores inadimplentes
4. Admin confirma → Sistema gera cobranças no Asaas
5. Notificação enviada aos moradores via WhatsApp/Push

### Fluxo 2: Morador Paga Mensalidade
1. Morador acessa Home → "Pagar via Pix" ou "Pagar via Boleto"
2. Sistema gera cobrança no Asaas
3. Morador recebe QR code (Pix) ou linha digitável (Boleto)
4. Após pagamento, webhook Asaas atualiza status
5. Morador recebe confirmação

### Fluxo 3: Admin Registra Despesa
1. Admin acessa "Despesas" → "Adicionar"
2. Preenche categoria, descrição, valor
3. Salva → Sistema registra no banco
4. Despesa aparece em "Prestação de Contas"

### Fluxo 4: Morador Relata Problema
1. Morador acessa "Suporte" → "Novo Chamado"
2. Descreve problema e anexa foto (opcional)
3. Envia → Admin recebe notificação
4. Admin responde/resolve → Morador recebe atualização

---

## Componentes Reutilizáveis

| Componente | Uso |
|-----------|-----|
| **Card** | Exibir informações em blocos (morador, cobrança, despesa) |
| **Button** | Ações primárias (Pagar, Salvar, Enviar) |
| **Input** | Campos de texto (nome, valor, descrição) |
| **Select** | Seleção de opções (categoria, tipo, período) |
| **Badge** | Status (Pago, Pendente, Vencido) |
| **Modal** | Confirmações, detalhes |
| **List** | Exibir múltiplos itens (moradores, cobranças, despesas) |
| **Chart** | Gráficos (receitas, despesas, inadimplência) |
| **Toast** | Notificações (sucesso, erro, aviso) |

---

## Considerações de UX

1. **Feedback Visual**: Todo botão deve ter estado de pressão (escala 0.97)
2. **Carregamento**: Mostrar spinner durante operações assíncronas
3. **Erros**: Mensagens claras e acionáveis
4. **Validação**: Validar em tempo real (ex: CPF, telefone)
5. **Persistência**: Salvar rascunhos automaticamente
6. **Acessibilidade**: Contraste 4.5:1, tamanho mínimo 12pt para corpo
7. **Performance**: Lazy load de listas, cache de dados

---

## Próximas Etapas

1. ✅ Design definido
2. ⏳ Implementar autenticação (login/logout)
3. ⏳ Implementar módulo de moradores
4. ⏳ Implementar módulo financeiro (cobranças, despesas)
5. ⏳ Implementar conciliação bancária
6. ⏳ Implementar atendimento/suporte
7. ⏳ Testes e refinamento
