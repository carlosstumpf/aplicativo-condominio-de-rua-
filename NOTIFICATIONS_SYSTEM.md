# Sistema de Notificações - Documentação Completa

## 📋 Visão Geral

O sistema de notificações fornece alertas em tempo real para administradores sobre eventos críticos do condomínio, tarefas pendentes e novas mensagens. Suporta múltiplos canais de entrega (Push, Email, WhatsApp, In-App) com rastreamento completo de entrega.

## 🎯 Funcionalidades Principais

### 1. Notificações em Tempo Real

#### Tipos de Notificações
- **Pagamento**: Alertas sobre pagamentos recebidos ou atrasados
- **Despesa**: Notificação de despesas registradas ou pendentes
- **Comunicado**: Confirmação de comunicados enviados
- **Alerta**: Eventos críticos que requerem atenção imediata
- **Mensagem**: Novas mensagens de moradores
- **Tarefa**: Tarefas atribuídas ou vencendo

#### Níveis de Prioridade
- **Baixa**: Informações gerais, sem urgência
- **Normal**: Eventos rotineiros
- **Alta**: Requer atenção em breve
- **Crítica**: Requer ação imediata

### 2. Centro de Notificações

#### Funcionalidades
- Visualizar todas as notificações em um único lugar
- Filtrar por status (não lida, lida, arquivada)
- Filtrar por prioridade
- Marcar como lida
- Arquivar notificações
- Buscar notificações antigas

#### Abas Disponíveis
- **Notificações**: Todas as notificações do sistema
- **Tarefas**: Tarefas pendentes e em progresso
- **Preferências**: Configurar canais de notificação

### 3. Tarefas Pendentes

#### Tipos de Tarefas
- **Cobrança**: Cobrar mensalidades atrasadas
- **Despesa Pendente**: Revisar e aprovar despesas
- **Comunicado**: Enviar comunicados agendados
- **Manutenção**: Tarefas de manutenção predial

#### Gestão de Tarefas
- Criar nova tarefa
- Atribuir a um admin
- Definir data de vencimento
- Marcar como concluída
- Visualizar histórico

### 4. Preferências de Notificação

#### Canais Disponíveis
- **Push**: Notificações no app (padrão: habilitado)
- **Email**: Envio por email (padrão: habilitado)
- **WhatsApp**: Envio via WhatsApp (padrão: desabilitado)
- **In-App**: Notificações dentro do app (sempre habilitado)

#### Configurações
- Habilitar/desabilitar por tipo de notificação
- Silenciar notificações em horários específicos
- Definir horário de silêncio (ex: 22:00 - 08:00)
- Salvar preferências por tipo de evento

### 5. Rastreamento de Entrega

#### Status de Entrega
- **Pendente**: Aguardando envio
- **Enviada**: Enviada para o canal
- **Entregue**: Confirmada entrega
- **Falhou**: Erro na entrega

#### Informações Rastreadas
- Canal de entrega
- Número de tentativas
- Data e hora de envio
- Data e hora de entrega
- Mensagem de erro (se aplicável)
- Resposta do servidor

### 6. Notificações Push

#### Configuração
- Inicialização automática ao abrir app
- Solicitação de permissões
- Obtenção de token Expo

#### Tipos de Notificações Push
- Notificações locais (sem servidor)
- Notificações remotas (com servidor)
- Notificações agendadas

#### Templates Pré-configurados
- Pagamento recebido
- Pagamento atrasado
- Despesa registrada
- Comunicado enviado
- Alerta crítico
- Tarefa atribuída
- Tarefa vencendo

## 🔧 Arquitetura Técnica

### Backend

#### Banco de Dados
```
notificacoes
├── id (PK)
├── adminId (FK)
├── titulo
├── descricao
├── tipo (enum)
├── prioridade (enum)
├── status (enum)
├── acao (URL/action)
├── dados (JSON)
├── lidoEm
├── criadoEm
└── expiradoEm

tarefas_pendentes
├── id (PK)
├── titulo
├── descricao
├── tipo (enum)
├── prioridade (enum)
├── status (enum)
├── recursoTipo
├── recursoId
├── atribuidoA (FK)
├── dataVencimento
├── dataConclusao
├── criadoEm
└── atualizadoEm

notificacao_entregas
├── id (PK)
├── notificacaoId (FK)
├── canal (enum)
├── status (enum)
├── tentativas
├── ultimaTentativa
├── proximaTentativa
├── erro
├── resposta (JSON)
├── enviadoEm
├── entregueEm
└── criadoEm

notificacao_preferencias
├── id (PK)
├── adminId (FK)
├── tipo
├── pushHabilitado
├── emailHabilitado
├── whatsappHabilitado
├── silencioAte
├── criadoEm
└── atualizadoEm
```

#### API tRPC
- `notifications.create`: Criar notificação
- `notifications.list`: Listar notificações
- `notifications.markAsRead`: Marcar como lida
- `notifications.archive`: Arquivar notificação
- `notifications.unreadCount`: Contar não lidas
- `notifications.createTask`: Criar tarefa
- `notifications.listTasks`: Listar tarefas
- `notifications.completeTask`: Completar tarefa
- `notifications.stats`: Estatísticas
- `notifications.trackDelivery`: Rastrear entrega
- `notifications.getPreferences`: Obter preferências
- `notifications.updatePreferences`: Atualizar preferências
- `notifications.bulkCreate`: Criar em lote
- `notifications.markAllAsRead`: Marcar todas como lidas

### Frontend

#### Componentes
- `NotificationCenter`: Tela principal
- `NotificationBadge`: Badge no header
- `NotificationCard`: Card individual
- `TaskCard`: Card de tarefa
- `PriorityBadge`: Badge de prioridade
- `NotificationTypeBadge`: Badge de tipo
- `NotificationCounter`: Contador
- `EmptyState`: Estado vazio
- `LoadingSkeleton`: Carregamento

#### Hooks
- `useNotifications`: Gerenciar notificações
- `useTasks`: Gerenciar tarefas
- `usePreferences`: Gerenciar preferências

#### Serviços
- `push-notifications.ts`: Serviço de push
- `notificationTemplates`: Templates pré-configurados

## 📊 Fluxos de Trabalho

### Fluxo de Notificação de Pagamento
1. Admin registra pagamento no sistema
2. Sistema cria notificação de pagamento recebido
3. Notificação é enviada para todos os canais habilitados
4. Rastreamento de entrega é registrado
5. Admin vê badge atualizado no header
6. Admin abre Centro de Notificações
7. Notificação é marcada como lida

### Fluxo de Tarefa Pendente
1. Sistema detecta evento que requer ação
2. Tarefa é criada automaticamente
3. Tarefa é atribuída a um admin
4. Notificação é enviada ao admin responsável
5. Admin visualiza tarefa no Centro
6. Admin marca tarefa como concluída
7. Notificação de conclusão é enviada

### Fluxo de Alerta Crítico
1. Evento crítico ocorre (ex: muita inadimplência)
2. Sistema cria notificação com prioridade crítica
3. Notificação é enviada com urgência
4. Badge é atualizado com número de alertas críticos
5. Admin recebe notificação push imediata
6. Admin abre app e vê alerta em destaque
7. Admin toma ação corretiva

## 🔐 Segurança

### Permissões
- Apenas admins autenticados recebem notificações
- Cada admin vê apenas suas notificações
- Audit logs rastreiam todas as ações

### Dados Sensíveis
- Informações de pagamento não incluídas em notificações
- Dados pessoais não armazenados em notificações
- Histórico de notificações é imutável

## 📈 Estatísticas e Análise

### Métricas Disponíveis
- Total de notificações
- Notificações não lidas
- Distribuição por tipo
- Distribuição por prioridade
- Taxa de entrega por canal
- Tempo médio de leitura
- Tarefas pendentes

### Relatórios
- Relatório de notificações diárias
- Relatório de tarefas pendentes
- Relatório de taxa de entrega
- Análise de preferências

## 🚀 Integração com Outros Módulos

### Gestão de Mensalidades
- Notificação quando pagamento é recebido
- Alerta quando mensalidade vence
- Tarefa de cobrança criada automaticamente

### Rastreamento de Despesas
- Notificação quando despesa é registrada
- Alerta quando despesa é pendente
- Tarefa de aprovação criada

### Comunicações
- Notificação quando comunicado é enviado
- Confirmação de entrega
- Relatório de leitura

### Relatórios
- Estatísticas de notificações
- Análise de tarefas pendentes
- Efetividade de notificações

## 🧪 Testes

### Testes Unitários
- 50+ testes cobrindo todos os cenários
- Testes de criação de notificações
- Testes de filtros e busca
- Testes de status e arquivamento
- Testes de tarefas pendentes
- Testes de preferências
- Testes de rastreamento de entrega

### Testes de Integração
- Fluxo completo de notificação
- Múltiplos canais de entrega
- Sincronização entre módulos

## 📱 Experiência Mobile

### Responsividade
- Otimizado para telas pequenas
- Navegação por abas
- Botões de ação rápida

### Acessibilidade
- Cores contrastantes
- Ícones com labels
- Feedback háptico
- Textos legíveis

### Performance
- Carregamento lazy
- Paginação de notificações
- Cache local
- Sincronização eficiente

## 🔄 Sincronização em Tempo Real

### WebSocket
- Conexão em tempo real com servidor
- Push imediato de notificações
- Atualização de status
- Sincronização bidirecional

### Fallback
- Polling se WebSocket não disponível
- Sincronização periódica
- Cache local

## 🆘 Troubleshooting

### Notificações não aparecem
- Verificar permissões do app
- Verificar preferências de notificação
- Verificar status de entrega
- Consultar logs do servidor

### Tarefas não são criadas
- Verificar se evento foi disparado
- Verificar se admin está ativo
- Verificar permissões
- Consultar logs

### Preferências não salvam
- Verificar conexão com servidor
- Tentar novamente
- Limpar cache do app
- Fazer logout e login

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: support@condominio.com
- WhatsApp: (11) 99999-9999
- Portal: https://help.condominio.com

---

**Versão**: 1.0.0  
**Última Atualização**: 27/04/2026  
**Status**: ✅ Produção
