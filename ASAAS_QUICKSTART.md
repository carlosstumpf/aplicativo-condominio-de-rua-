# Asaas Integration - Quick Start Guide

## 5 Minutos para Integração Real

### Passo 1: Obter Credenciais (2 min)

1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Faça login ou crie conta
3. Vá para **Configurações** → **Integrações**
4. Clique em **Gerar Nova Chave** e copie a chave (formato: `aac_...`)
5. Vá para **Webhooks** → **Gerar Novo Secret** e copie o secret

### Passo 2: Configurar Variáveis de Ambiente (1 min)

Adicione ao seu `.env`:

```bash
ASAAS_API_KEY=aac_sua_chave_aqui
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_SECRET=seu_secret_aqui
ASAAS_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/asaas
APP_URL=https://seu-dominio.com
```

### Passo 3: Registrar Webhook (1 min)

Faça uma requisição POST:

```bash
curl -X POST http://localhost:3000/api/trpc/webhooks.register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-dominio.com/api/webhooks/asaas",
    "events": [
      "payment.pending",
      "payment.confirmed",
      "payment.received",
      "payment.overdue",
      "payment.refunded"
    ]
  }'
```

### Passo 4: Testar (1 min)

```bash
# Verificar status
curl http://localhost:3000/api/trpc/webhooks.getStatus

# Testar webhook
curl -X POST http://localhost:3000/api/trpc/webhooks.test
```

## Pronto! ✅

Seu sistema agora está conectado ao Asaas em produção.

## Modo Sandbox (Testes)

Para testar sem usar credenciais reais:

```bash
ASAAS_ENVIRONMENT=sandbox
```

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| `Invalid signature` | Verificar `ASAAS_WEBHOOK_SECRET` |
| Webhook não recebido | Verificar URL é acessível externamente |
| Erro de API | Verificar `ASAAS_API_KEY` |

## Próximos Passos

1. Implementar atualização de BD no webhook handler
2. Implementar notificações em tempo real
3. Configurar retry policy
4. Monitorar logs de webhook

Veja `docs/ASAAS_INTEGRATION.md` para documentação completa.
