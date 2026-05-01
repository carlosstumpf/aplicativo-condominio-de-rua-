# Guia de Painel Visual de Cobrança

## Visão Geral

O painel visual de cobrança fornece uma visão completa e em tempo real do status dos pagamentos em lote, mostrando valores pagos, pendentes, atrasados e estatísticas detalhadas.

## Componentes Principais

### 1. BillingDashboard
Painel principal com estatísticas agregadas e visualizações de progresso.

**Funcionalidades:**
- Valor total da cobrança
- Valor pago vs pendente vs atrasado
- Taxa de pagamento em percentual
- Barra de progresso visual
- Breakdown de status
- Botões de ação (Enviar Lembrete, Exportar)

**Uso:**
```tsx
import { BillingDashboard } from "@/components/billing-dashboard";

export default function CobrancasScreen() {
  return <BillingDashboard batchId={1} />;
}
```

### 2. BillingBreakdown
Visualização detalhada de pagamentos individuais com filtros.

**Funcionalidades:**
- Lista de todos os pagamentos
- Filtros por status (Pago, Pendente, Atrasado)
- Informações do morador
- Método de pagamento
- Data de vencimento
- Data de pagamento

**Uso:**
```tsx
import { BillingBreakdown } from "@/components/billing-breakdown";

export default function PaymentDetailsScreen() {
  return (
    <BillingBreakdown 
      batchId={1}
      onPaymentSelect={(payment) => {
        console.log("Pagamento selecionado:", payment);
      }}
    />
  );
}
```

### 3. BillingFilters
Componente de filtros avançados para refinamento de dados.

**Funcionalidades:**
- Seleção de período (7d, 30d, 90d, 1a)
- Filtro por status
- Filtro por método de pagamento
- Botão de reset

**Uso:**
```tsx
import { BillingFilters } from "@/components/billing-filters";

const [filters, setFilters] = useState({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: new Date(),
  status: "all",
  paymentMethod: "all",
});

return (
  <BillingFilters 
    filters={filters}
    onFiltersChange={setFilters}
  />
);
```

## Dados e Estatísticas

### getBillingStats()
Retorna estatísticas gerais de cobrança.

```typescript
interface BillingStats {
  totalBillings: number;      // Total de cobranças
  totalAmount: number;        // Valor total
  paidAmount: number;         // Valor pago
  pendingAmount: number;      // Valor pendente
  overdueAmount: number;      // Valor atrasado
  paymentRate: number;        // Taxa de pagamento %
  averagePaymentTime: number; // Dias médios para pagar
}
```

### getBatchBillingStats(batchId)
Retorna estatísticas de um lote específico.

```typescript
interface BatchBillingStats {
  batchId: number;
  batchName: string;
  totalMoradores: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  paymentRate: number;
  createdAt: Date;
  dueDate: Date;
}
```

### getPaymentStatusBreakdown()
Retorna breakdown de status de pagamentos.

```typescript
interface PaymentStatusBreakdown {
  status: string;    // "Pago", "Pendente", "Atrasado"
  count: number;     // Quantidade
  amount: number;    // Valor total
  percentage: number; // Percentual
}
```

### getMonthlyBillingTrend(months)
Retorna tendência de cobrança mensal.

```typescript
interface MonthlyBillingTrend {
  month: string;      // "Abr/26"
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  paymentRate: number;
}
```

### getMoradorPaymentStatus(moradorId)
Retorna status de pagamento de um morador específico.

```typescript
interface MoradorPaymentStatus {
  moradorId: number;
  moradorName: string;
  email: string;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentRate: number;
  lastPaymentDate?: Date;
  nextDueDate?: Date;
}
```

## Atualizações em Tempo Real

O sistema suporta atualizações em tempo real via webhooks.

### Subscrever a Atualizações
```typescript
import { billingRealtimeUpdates } from "@/server/_core/billing-realtime-updates";

// Subscrever a atualizações de um lote
billingRealtimeUpdates.subscribeToBatch(batchId, clientId);

// Ouvir atualizações de pagamento
billingRealtimeUpdates.on(`batch:${batchId}:payment`, (event) => {
  console.log("Pagamento atualizado:", event);
  // Atualizar UI
});

// Ouvir atualizações de estatísticas
billingRealtimeUpdates.on(`batch:${batchId}:stats`, (update) => {
  console.log("Estatísticas atualizadas:", update);
  // Atualizar gráficos
});
```

### Processar Webhook de Pagamento
```typescript
import { processPaymentWebhook } from "@/server/_core/billing-realtime-updates";

// Quando receber webhook do Asaas
await processPaymentWebhook({
  batchId: 1,
  billingId: 123,
  moradorId: 5,
  status: "paid",
  amount: 500,
  paymentMethod: "PIX",
});
```

## Integração com Asaas

O painel se integra automaticamente com webhooks do Asaas para atualizar status em tempo real.

**Fluxo:**
1. Morador faz pagamento via PIX/Boleto
2. Asaas envia webhook de confirmação
3. Sistema atualiza status no banco
4. Dashboard atualiza em tempo real
5. Morador recebe notificação

## Exemplos de Uso

### Exemplo 1: Dashboard Completo
```tsx
import { BillingDashboard } from "@/components/billing-dashboard";
import { BillingBreakdown } from "@/components/billing-breakdown";
import { BillingFilters } from "@/components/billing-filters";
import { useState } from "react";

export default function CobrancasScreen() {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    status: "all",
    paymentMethod: "all",
  });

  return (
    <View className="flex-1">
      <BillingFilters filters={filters} onFiltersChange={setFilters} />
      <BillingDashboard batchId={1} />
      <BillingBreakdown batchId={1} />
    </View>
  );
}
```

### Exemplo 2: Monitorar Pagamentos
```tsx
import { useEffect, useState } from "react";
import { billingRealtimeUpdates } from "@/server/_core/billing-realtime-updates";

export function PaymentMonitor({ batchId }: { batchId: number }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const clientId = `client-${Date.now()}`;
    billingRealtimeUpdates.subscribeToBatch(batchId, clientId);

    const handlePaymentUpdate = (event) => {
      setPayments((prev) => [...prev, event]);
    };

    billingRealtimeUpdates.on(`batch:${batchId}:payment`, handlePaymentUpdate);

    return () => {
      billingRealtimeUpdates.unsubscribeFromBatch(batchId, clientId);
      billingRealtimeUpdates.off(`batch:${batchId}:payment`, handlePaymentUpdate);
    };
  }, [batchId]);

  return (
    <View>
      {payments.map((payment) => (
        <Text key={payment.billingId}>
          {payment.moradorId}: {payment.status} - R$ {payment.amount}
        </Text>
      ))}
    </View>
  );
}
```

### Exemplo 3: Exportar Relatório
```tsx
import { getBillingStats, getMonthlyBillingTrend } from "@/server/_core/billing-analytics-db";

async function exportBillingReport() {
  const stats = await getBillingStats();
  const trend = await getMonthlyBillingTrend(12);

  const csv = [
    ["Estatística", "Valor"],
    ["Total de Cobranças", stats.totalBillings],
    ["Valor Total", stats.totalAmount],
    ["Valor Pago", stats.paidAmount],
    ["Taxa de Pagamento", `${stats.paymentRate}%`],
    [],
    ["Mês", "Faturado", "Pago", "Pendente", "Taxa"],
    ...trend.map((m) => [m.month, m.totalBilled, m.totalPaid, m.totalPending, `${m.paymentRate}%`]),
  ];

  // Converter para CSV e baixar
}
```

## Testes

Testes unitários estão em `tests/billing-dashboard.test.ts`.

```bash
# Executar testes
pnpm test billing-dashboard

# Executar com coverage
pnpm test -- --coverage billing-dashboard
```

## Troubleshooting

### Dashboard não atualiza
1. Verificar se webhooks do Asaas estão configurados
2. Verificar logs do servidor
3. Limpar cache do navegador

### Dados inconsistentes
1. Executar sincronização manual
2. Verificar integridade do banco
3. Contatar suporte

### Performance lenta
1. Reduzir período de dados
2. Usar filtros mais específicos
3. Verificar índices do banco

## Próximos Passos

1. **Gráficos Avançados**: Adicionar gráficos de pizza, linha e barra
2. **Alertas**: Notificar quando taxa de pagamento cai abaixo de 80%
3. **Previsões**: Usar ML para prever pagamentos futuros
4. **Comparações**: Comparar performance entre lotes
5. **Exportação**: Suporte para Excel, PDF, etc.

## Suporte

Para dúvidas ou problemas, contate o time de desenvolvimento.
