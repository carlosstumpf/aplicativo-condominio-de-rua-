# Gestão de Condomínio de Rua — TODO

## Fase 1: Configuração Base & Autenticação
- [x] Gerar logo e ícone da aplicação
- [x] Atualizar app.config.ts com nome e branding
- [x] Configurar paleta de cores (theme.config.js)
- [x] Implementar autenticação (login/logout)
- [x] Criar tela de login com validação
- [x] Implementar persistência de sessão (AsyncStorage)
- [x] Criar context de autenticação (useAuth)

## Fase 2: Estrutura de Banco de Dados & Backend
- [x] Definir schema do banco (moradores, cobrancas, despesas, chamados)
- [x] Implementar migrations Drizzle ORM
- [x] Criar endpoints API (tRPC) para:
  - [x] Moradores (CRUD, listagem, busca)
  - [x] Cobranças (criar, listar, atualizar status)
  - [x] Despesas (criar, listar, filtrar)
  - [x] Chamados (criar, listar, responder)
  - [x] Relatórios (resumo, prestação de contas)
- [ ] Integrar webhook Asaas para atualizar status de pagamentos

## Fase 3: Módulo de Moradores
- [x] Criar tela de listagem de moradores
- [x] Implementar busca e filtros (nome, casa, status)
- [x] Implementar paginação com 10 itens por página
- [ ] Criar tela de detalhe do morador
- [ ] Implementar edição de morador
- [ ] Criar tela de cadastro de novo morador
- [ ] Validar CPF e telefone
- [ ] Exibir histórico de pagamentos por morador

## Fase 4: Módulo Financeiro - Cobranças
- [x] Criar tela de listagem de cobranças
- [x] Implementar filtros (status, período, tipo)
- [ ] Criar tela de gerar cobrança individual
- [ ] Implementar geração de cobrança em massa
- [x] Integrar Asaas (modo mock) para gerar Pix e Boleto
- [x] Exibir QR code (Pix) e linha digitável (Boleto)
- [ ] Implementar webhook para atualizar status de pagamentos
- [ ] Enviar notificações quando pagamento é confirmado

## Fase 5: Módulo Financeiro - Despesas
- [ ] Criar tela de listagem de despesas
- [ ] Implementar filtros (categoria, período, valor)
- [ ] Criar tela de registrar nova despesa
- [ ] Implementar categorização de despesas
- [ ] Permitir upload de comprovante (imagem)
- [ ] Exibir total de despesas por categoria

## Fase 6: Prestação de Contas & Relatórios
- [ ] Criar tela de prestação de contas (resumo mensal)
- [ ] Implementar gráfico de receitas vs despesas
- [ ] Implementar gráfico de pizza (despesas por categoria)
- [ ] Criar tabela detalhada de receitas e despesas
- [ ] Implementar filtro por período (mês/ano)
- [ ] Adicionar funcionalidade de exportar PDF
- [ ] Criar tela de relatórios avançados

## Fase 7: Conciliação Bancária
- [ ] Criar tela de conciliação bancária
- [ ] Implementar sincronização com Asaas (saldo bancário)
- [ ] Calcular saldo em caixa (receitas - despesas)
- [ ] Exibir discrepâncias/diferenças
- [ ] Listar transações não conciliadas
- [ ] Implementar funcionalidade de conciliar transações

## Fase 8: Atendimento & Suporte
- [ ] Criar tela de listagem de chamados
- [ ] Implementar filtros (status, prioridade)
- [ ] Criar tela de novo chamado (morador)
- [ ] Implementar resposta a chamados (admin)
- [ ] Permitir anexo de imagens em chamados
- [ ] Enviar notificações de atualizações de chamados
- [ ] Criar histórico de comunicação por chamado

## Fase 9: Notificações & Comunicação
- [ ] Implementar push notifications (expo-notifications)
- [ ] Configurar notificações para:
  - [ ] Cobrança gerada
  - [ ] Pagamento confirmado
  - [ ] Mensalidade vencida
  - [ ] Novo chamado respondido
- [ ] Permitir ativar/desativar notificações nas configurações

## Fase 10: Tela de Configurações
- [ ] Criar tela de configurações
- [ ] Exibir perfil do usuário (nome, telefone, cargo)
- [ ] Permitir edição de configurações da associação (nome, valor mensalidade)
- [ ] Implementar toggle de tema (claro/escuro)
- [ ] Implementar toggle de notificações
- [ ] Adicionar botão de logout

## Fase 11: UI/UX & Polimento
- [ ] Implementar feedback visual (press states, haptics)
- [ ] Adicionar loading spinners
- [ ] Implementar toast notifications (sucesso, erro, aviso)
- [ ] Validar e exibir mensagens de erro claras
- [ ] Otimizar performance de listas (FlatList, lazy loading)
- [ ] Testar acessibilidade (contraste, tamanho de fonte)
- [ ] Testar responsividade em diferentes tamanhos de tela

## Fase 12: Testes & Entrega
- [ ] Testar fluxos principais end-to-end
- [ ] Testar em iOS e Android
- [ ] Testar em web (se aplicável)
- [ ] Corrigir bugs encontrados
- [ ] Documentar instruções de uso
- [ ] Criar checkpoint final
- [ ] Entregar aplicativo ao usuário

---

## Notas Importantes

- **Integração Asaas**: Usar API Asaas para gerar cobranças (Pix e Boleto)
- **Webhook**: Configurar webhook para atualizar status de pagamentos em tempo real
- **Banco de Dados**: Usar Supabase (PostgreSQL) com Drizzle ORM
- **Autenticação**: Implementar com JWT (jose) e persistência em AsyncStorage
- **Notificações**: Usar expo-notifications para push notifications
- **Armazenamento de Arquivos**: Usar S3 para comprovantes de despesas
- **Validação**: Validar CPF, telefone, email no frontend e backend
- **Segurança**: Nunca expor chaves de API no frontend, usar backend para chamadas sensíveis

---

## Status Geral

**Progresso**: 0% (0/100 tarefas)
**Fase Atual**: Fase 1 - Configuração Base & Autenticação
**Última Atualização**: 2026-04-27


## Fase 8: Módulo de Atendimento - Chamados
- [x] Criar tela de listagem de chamados
- [x] Implementar filtros (status, prioridade, categoria)
- [x] Criar tela de novo chamado
- [x] Implementar categorização de chamados (manutenção, limpeza, segurança, outro)
- [ ] Criar tela de detalhe do chamado
- [ ] Implementar sistema de respostas/comentários
- [x] Adicionar status badges (aberto, em andamento, resolvido, fechado)
- [ ] Implementar notificações de atualização de chamado
- [ ] Permitir anexar imagens aos chamados
- [ ] Exibir histórico de interações


## Fase 9: Módulo de Despesas
- [x] Criar tela de listagem de despesas
- [x] Implementar filtros por período (data início/fim)
- [x] Implementar filtros por categoria
- [x] Criar tela de nova despesa
- [x] Implementar categorização de despesas (manutenção, limpeza, segurança, utilidades, outro)
- [x] Implementar upload de comprovante (foto/PDF)
- [x] Exibir comprovante em modal
- [x] Calcular total de despesas por período
- [ ] Exibir gráfico de despesas por categoria
- [ ] Implementar edição de despesa
- [ ] Implementar exclusão de despesa com confirmação


## Fase 10: Sistema de Notificações
- [x] Criar tela de notificações
- [x] Implementar filtros (tipo, lidas/não lidas)
- [x] Criar sistema de notificações em tempo real
- [x] Alertas de pagamentos confirmados
- [x] Alertas de vencimentos próximos (7 dias)
- [x] Alertas de atualizações de chamados
- [x] Implementar marcação como lida
- [x] Implementar exclusão de notificações
- [x] Adicionar badge com contagem de não lidas
- [ ] Implementar notificações push (expo-notifications)


## Fase 11: Conciliação Bancária
- [x] Criar tela de conciliação bancária
- [x] Implementar upload de extrato bancário (CSV/PDF)
- [x] Criar parser para extratos bancários
- [x] Implementar matching automático (valor + data)
- [x] Criar tela de reconciliação manual
- [x] Implementar status de conciliação (conciliado, pendente, discrepância)
- [x] Exibir resumo de discrepâncias
- [x] Implementar histórico de conciliações
- [ ] Gerar relatório de conciliação
- [ ] Implementar alertas de transações não conciliadas


## Fase 12: Integração com Webhook Asaas
- [x] Criar endpoint para receber webhooks do Asaas
- [x] Implementar validação de assinatura do webhook
- [x] Processar eventos de pagamento confirmado
- [x] Processar eventos de pagamento recusado
- [x] Processar eventos de pagamento expirado
- [x] Atualizar status de cobrança automaticamente
- [x] Criar notificações quando pagamento é confirmado
- [x] Implementar retry logic para falhas
- [x] Criar logs de webhooks recebidos
- [x] Implementar testes de webhook


## Fase 13: Dashboard de Relatórios Financeiros
- [x] Criar tela de relatórios financeiros
- [x] Implementar gráfico de receitas vs despesas
- [x] Implementar gráfico de despesas por categoria
- [x] Implementar gráfico de moradores inadimplentes
- [x] Criar filtros por período (mês, trimestre, ano)
- [x] Calcular resumo financeiro (total receita, despesa, lucro)
- [x] Implementar exportação em PDF
- [x] Adicionar dados de comparação período anterior
- [x] Implementar gráfico de evolução mensal
- [x] Criar relatório de prestação de contas


## Fase 14: Tela de Detalhe do Morador
- [x] Criar tela de detalhe do morador
- [x] Exibir informações pessoais (nome, CPF, telefone, email, casa)
- [x] Exibir histórico completo de pagamentos
- [x] Implementar filtros de histórico (período, status)
- [x] Exibir status atual (ativo, inativo, inadimplente)
- [x] Implementar edição de dados do morador
- [x] Criar botão para gerar cobrança individual
- [x] Implementar botão de enviar mensagem/email
- [x] Exibir resumo de débitos
- [ ] Implementar exclusão de morador com confirmação


## Fase 15: Indicadores Visuais e Badges
- [x] Criar componente de badge para status de pagamento
- [x] Adicionar badge de atraso (dias vencidos)
- [x] Adicionar badge de pendências (quantidade)
- [x] Criar indicador visual de risco (baixo/médio/alto)
- [x] Adicionar ícones de alerta para inadimplência
- [x] Implementar animações de pulse para alertas críticos
- [x] Criar legenda de cores para status
- [ ] Adicionar tooltips informativos
- [ ] Implementar indicadores na listagem de moradores
- [ ] Criar dashboard com resumo visual de inadimplentes


## Fase 16: Exportação de Inadimplentes em PDF
- [x] Criar tela de listagem de inadimplentes
- [x] Implementar filtros (período, valor mínimo, ordenação)
- [x] Criar gerador de PDF com dados de inadimplentes
- [x] Adicionar cabeçalho com informações do condomínio
- [x] Incluir tabela com dados de cada morador inadimplente
- [x] Adicionar resumo de totais (quantidade, valor total)
- [ ] Implementar assinatura digital no PDF
- [x] Adicionar data de geração do relatório
- [x] Criar opção de enviar PDF por email
- [x] Implementar download do PDF no dispositivo

## Fase 17: Integração com Asaas Real
- [x] Criar camada de abstração Asaas (adapter)
- [x] Implementar cliente real da API Asaas
- [x] Criar handler de webhooks com validação HMAC
- [x] Implementar endpoint de recebimento de webhooks
- [x] Criar tRPC router para gerenciamento de webhooks
- [x] Implementar testes para integração real (24 testes)
- [x] Criar documentação de setup
- [x] Criar guia rápido de integração
- [ ] Implementar atualização de BD no webhook handler
- [ ] Implementar notificações em tempo real
- [ ] Configurar retry policy com backoff exponencial
- [ ] Implementar logging e monitoramento de webhooks

## Fase 17: Integração com Asaas Real
- [x] Criar camada de abstração Asaas (adapter)

## Fase 18: Auditoria e Correção de Funcionalidades (Abril 2026)
- [x] Reescrever Dashboard (admin-dashboard) com dados reais do backend via tRPC
- [x] Reescrever Mensalidades (admin-fees) com CRUD real via tRPC
- [x] Reescrever Comunicados (admin-communications) com dados reais via tRPC
- [x] Reescrever Notificações (notification-center) com dados reais via tRPC
- [x] Reescrever Config (admin-settings) com funcionalidades reais
- [x] Corrigir Home (index.tsx) - view de morador com dados reais
- [x] Testar todos os fluxos end-to-end (13/14 endpoints OK)
- [x] Salvar checkpoint final

## Fase 19: Painel Seguro de Chave API Asaas
- [x] Criar endpoint backend para validar chave Asaas (GET /api/asaas/validate)
- [x] Criar endpoint backend para salvar chave Asaas de forma segura
- [x] Criar endpoint backend para verificar status da chave salva
- [x] Criar aba "Asaas" no painel de configurações
- [x] Implementar campo de entrada seguro (mascarado) para a chave
- [x] Implementar validação em tempo real da chave via API Asaas
- [x] Exibir status da chave (válida/inválida/não configurada)
- [x] Exibir informações da conta Asaas após validação (nome, email, saldo)
- [x] Permitir remover/trocar a chave salva
- [x] Testar fluxo completo e salvar checkpoint

## Fase 20: Integrar Asaas ao Fluxo de Cobranças
- [x] Criar serviço asaas-integration.ts que lê a chave salva e gera pagamentos
- [x] Modificar cobrancas.create para chamar Asaas automaticamente ao criar cobrança
- [x] Salvar asaasPaymentId real retornado pela API na tabela cobrancas
- [x] Adicionar campos pixQrCode, pixCopyPaste, boletoUrl, boletoBarCode na tabela cobrancas
- [x] Atualizar tela admin-fees para exibir link PIX/Boleto gerado (com copiar)
- [x] Adicionar seletor de morador na aba Gerar (em vez de digitar ID)
- [x] Adicionar botão "Copiar PIX" e "Copiar Código de Barras"
- [x] Adicionar endpoint syncStatus para sincronizar status com Asaas
- [x] Adicionar fallback local quando Asaas não está configurado
- [x] Testar fluxo completo: criar cobrança → gerar PIX/Boleto via Asaas

## Fase 21: Correção Crítica de Bugs (Abril 2026)
- [ ] Diagnosticar erros na tela de Configurações/WhatsApp
- [ ] Corrigir tela de WhatsApp - QR Code e reconexão funcionando
- [ ] Corrigir problema de dados zerados no celular
- [ ] Garantir que login funciona no celular (Expo Go)
- [ ] Garantir que todas as telas carregam dados reais no celular
- [ ] Testar cada tela individualmente e corrigir erros
- [ ] Checkpoint final estável

## Fase 22: Correções Reportadas pelo Usuário (28/04/2026)

- [ ] Corrigir formulário de cadastro de morador em Config > Moradores
- [ ] Corrigir texto "Gerenciar Menstrução" para "Gerenciar Cobrança"
- [ ] Verificar e corrigir todos os textos errados no app
- [ ] Corrigir integração WhatsApp para responder comandos do morador (menu automático)
- [ ] Adicionar morador de teste com telefone real do usuário
- [ ] Remover morador "Carlos Silva" (telefone do sistema, não deve ser morador)
- [ ] Testar fluxo completo: cadastro → cobrança → WhatsApp

## Fase 22: Correções Críticas Reportadas (Abril 2026)
- [x] Corrigir bug CPF varchar(11) - remover formatação antes de salvar
- [x] Tornar CPF opcional no formulário de cadastro de morador
- [x] Corrigir texto "Gerenciar Mensalidades" → "Gerenciar Cobranças" em todas as telas
- [x] Criar whatsapp-message-handler.ts com menu completo (PIX, Boleto, Prestação, Chamados)
- [x] Registrar handler em server/_core/index.ts via setMessageHandler
- [x] Atualizar telefone do Carlos Silva para 5521998231962 (com código do país)
- [x] Corrigir URLs hardcoded 127.0.0.1 → getApiBaseUrl() em admin-settings, admin-communications, admin-whatsapp-qrcode
- [x] Testar envio de mensagem de boas-vindas via WhatsApp - OK

## Fase 23: Correção CPF no Cadastro e Emissão de PIX
- [ ] Adicionar campo CPF no formulário de cadastro de morador (admin-settings.tsx)
- [ ] Adicionar campo CPF na tela de edição de morador
- [ ] Corrigir integração Asaas para usar CPF do morador ao criar cliente
- [ ] Garantir que CPF seja salvo corretamente no banco (apenas dígitos, varchar 11)
- [ ] Testar emissão de PIX com morador com CPF cadastrado

## Fase 24: Correção Número do Sistema vs Morador (28/04/2026)
- [ ] Atualizar Carlos Silva: telefone para 5521993149701 (número pessoal do usuário)
- [ ] Garantir que o sistema não responde a si mesmo (5521998231962)
- [ ] Adicionar endpoint moradores.cancel para inativar morador
- [ ] Adicionar botão "Cancelar/Inativar Morador" na lista de moradores
- [ ] Testar: enviar "oi" do 5521993149701 e verificar resposta automática

## Fase 25: Correção Formato LID do WhatsApp (28/04/2026)
- [x] Identificar problema: mensagens chegando com formato @lid em vez de @s.whatsapp.net
- [x] Adicionar mapeamento LID->telefone via evento contacts.upsert no Baileys
- [x] Passar pushName para o handler como fallback quando LID não está mapeado
- [x] Adicionar busca por nome (getMoradorByNome) no handler como fallback
- [x] Corrigir conflito de processos servidor (múltiplas instâncias causando "conflict")
- [x] Testar: mensagem enviada com sucesso para 5521993149701

## Fase 26: Filtros de Data para Análise (28/04/2026)
- [x] Adicionar componentes de filtro de data (mês, trimestre, ano)
- [x] Implementar filtro na aba Cobranças
- [x] Implementar filtro na aba Chamados
- [x] Testar filtros com dados reais

## Fase 27: Melhorias Estratégicas no WhatsApp (28/04/2026)
- [ ] Implementar notificações proativas (lembretes 5 dias antes do vencimento)
- [ ] Implementar envio automático de comprovante de pagamento
- [ ] Implementar respostas inteligentes com NLP básico
- [ ] Testar notificações com dados reais


## Fase 27: Melhorias Estratégicas no WhatsApp (28/04/2026)
- [x] Implementar notificações proativas (lembretes 5 dias antes do vencimento)
- [x] Implementar envio automático de comprovante de pagamento
- [x] Implementar respostas inteligentes com NLP básico
- [x] Testar notificações com dados reais
