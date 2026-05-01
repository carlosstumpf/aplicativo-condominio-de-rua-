/**
 * Admin Reports and Analytics Screen
 */

import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

type ReportTab = "financial" | "delinquency" | "reconciliation" | "export";

export default function AdminReportsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<ReportTab>("financial");

  const tabs: Array<{
    id: ReportTab;
    label: string;
  }> = [
    { id: "financial", label: "Financeiro" },
    { id: "delinquency", label: "Inadimplência" },
    { id: "reconciliation", label: "Reconciliação" },
    { id: "export", label: "Exportar" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "financial":
        return <FinancialTab />;
      case "delinquency":
        return <DelinquencyTab />;
      case "reconciliation":
        return <ReconciliationTab />;
      case "export":
        return <ExportTab />;
      default:
        return null;
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-primary px-4 py-4">
          <Text className="text-2xl font-bold text-white">Relatórios</Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-border bg-surface">
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 border-b-2",
                activeTab === tab.id ? "border-primary" : "border-transparent"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-semibold text-center",
                  activeTab === tab.id ? "text-primary" : "text-muted"
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView className="flex-1">
          {renderContent()}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * Financial Report Tab
 */
function FinancialTab() {
  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">Relatório Financeiro</Text>

      {/* Period Selector */}
      <View className="flex-row gap-2">
        {["Mês", "Trimestre", "Semestre", "Ano"].map((period) => (
          <Pressable
            key={period}
            className="flex-1 bg-surface border border-border rounded-lg p-2 active:opacity-80"
          >
            <Text className="text-xs font-semibold text-center text-foreground">
              {period}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary Cards */}
      <View className="gap-2">
        <ReportCard
          label="Receita Total"
          value="R$ 60.000"
          change="+5%"
          color="#22C55E"
        />
        <ReportCard
          label="Despesas Totais"
          value="R$ 15.800"
          change="-2%"
          color="#F59E0B"
        />
        <ReportCard
          label="Saldo Líquido"
          value="R$ 44.200"
          change="+8%"
          color="#0a7ea4"
        />
      </View>

      {/* Revenue Breakdown */}
      <View className="bg-surface rounded-lg p-4 gap-3">
        <Text className="font-semibold text-foreground">Receita por Método</Text>

        <RevenueItem method="PIX" value="R$ 30.000" percentage={50} />
        <RevenueItem method="Boleto" value="R$ 20.000" percentage={33} />
        <RevenueItem method="Transferência" value="R$ 10.000" percentage={17} />
      </View>

      {/* Monthly Trend */}
      <View className="bg-surface rounded-lg p-4 gap-3">
        <Text className="font-semibold text-foreground">Tendência Mensal</Text>

        <MonthlyTrendItem month="Abril" revenue="R$ 60.000" expenses="R$ 15.800" />
        <MonthlyTrendItem month="Março" revenue="R$ 57.000" expenses="R$ 14.200" />
        <MonthlyTrendItem month="Fevereiro" revenue="R$ 55.000" expenses="R$ 13.500" />
      </View>

      {/* Export Button */}
      <Pressable className="bg-primary rounded-lg p-3 active:opacity-80">
        <Text className="text-white font-semibold text-center">📊 Exportar Relatório</Text>
      </Pressable>
    </View>
  );
}

/**
 * Delinquency Report Tab
 */
function DelinquencyTab() {
  const delinquents = [
    {
      id: 1,
      name: "João Silva",
      daysOverdue: 45,
      amount: "R$ 1.500",
      lastPayment: "15/02/2026",
    },
    {
      id: 2,
      name: "Maria Santos",
      daysOverdue: 30,
      amount: "R$ 1.000",
      lastPayment: "01/03/2026",
    },
    {
      id: 3,
      name: "Pedro Oliveira",
      daysOverdue: 15,
      amount: "R$ 500",
      lastPayment: "15/03/2026",
    },
  ];

  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">Análise de Inadimplência</Text>

      {/* Summary */}
      <View className="gap-2">
        <ReportCard
          label="Moradores em Atraso"
          value="12"
          change="3 novos"
          color="#EF4444"
        />
        <ReportCard
          label="Valor Total em Atraso"
          value="R$ 8.500"
          change="+R$ 1.500"
          color="#EF4444"
        />
      </View>

      {/* Delinquent List */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Maiores Devedores</Text>

        {delinquents.map((item) => (
          <Pressable
            key={item.id}
            className="bg-surface rounded-lg p-4 border border-border active:opacity-80"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{item.name}</Text>
                <Text className="text-xs text-muted mt-1">
                  {item.daysOverdue} dias em atraso
                </Text>
              </View>
              <Text className="text-lg font-bold text-red-600">{item.amount}</Text>
            </View>

            <Text className="text-xs text-muted mb-3">
              Último pagamento: {item.lastPayment}
            </Text>

            <View className="flex-row gap-2">
              <Pressable className="flex-1 bg-primary/20 rounded py-2 active:opacity-60">
                <Text className="text-primary font-semibold text-center text-sm">
                  Contatar
                </Text>
              </Pressable>
              <Pressable className="flex-1 bg-primary rounded py-2 active:opacity-80">
                <Text className="text-white font-semibold text-center text-sm">
                  Registrar Pagamento
                </Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Export Button */}
      <Pressable className="bg-primary rounded-lg p-3 active:opacity-80">
        <Text className="text-white font-semibold text-center">📊 Exportar Lista</Text>
      </Pressable>
    </View>
  );
}

/**
 * Bank Reconciliation Tab
 */
function ReconciliationTab() {
  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">Reconciliação Bancária</Text>

      {/* Summary */}
      <View className="gap-2">
        <ReportCard
          label="Saldo em Sistema"
          value="R$ 44.200"
          color="#0a7ea4"
        />
        <ReportCard
          label="Saldo Bancário"
          value="R$ 44.200"
          color="#22C55E"
        />
      </View>

      {/* Status */}
      <View className="bg-green-100 rounded-lg p-4">
        <Text className="text-green-800 font-semibold text-center">
          ✓ Reconciliação em Dia
        </Text>
      </View>

      {/* Recent Transactions */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Últimas Transações</Text>

        <TransactionItem
          description="Pagamento PIX - João Silva"
          amount="R$ 500"
          date="20/04/2026"
          type="receita"
        />
        <TransactionItem
          description="Despesa - Manutenção"
          amount="R$ 1.500"
          date="19/04/2026"
          type="despesa"
        />
        <TransactionItem
          description="Pagamento Boleto - Maria Santos"
          amount="R$ 500"
          date="18/04/2026"
          type="receita"
        />
      </View>

      {/* Export Button */}
      <Pressable className="bg-primary rounded-lg p-3 active:opacity-80">
        <Text className="text-white font-semibold text-center">📊 Exportar Reconciliação</Text>
      </Pressable>
    </View>
  );
}

/**
 * Export Tab
 */
function ExportTab() {
  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">Exportar Dados</Text>

      {/* Export Options */}
      <ExportOption
        title="Relatório Financeiro"
        description="Receitas, despesas e saldo"
        icon="📊"
      />
      <ExportOption
        title="Inadimplência"
        description="Lista de devedores e valores"
        icon="⚠️"
      />
      <ExportOption
        title="Pagamentos"
        description="Histórico de todos os pagamentos"
        icon="💰"
      />
      <ExportOption
        title="Despesas"
        description="Histórico de todas as despesas"
        icon="📋"
      />
      <ExportOption
        title="Moradores"
        description="Lista completa de moradores"
        icon="👥"
      />

      {/* Format Selection */}
      <View className="gap-2 mt-4">
        <Text className="text-sm font-semibold text-foreground">Formato</Text>
        <View className="flex-row gap-2">
          {["PDF", "Excel", "CSV"].map((format) => (
            <Pressable
              key={format}
              className="flex-1 bg-surface border border-border rounded-lg p-2 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-center text-foreground">
                {format}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Helper Components
 */

function ReportCard({
  label,
  value,
  change,
  color,
}: {
  label: string;
  value: string;
  change?: string;
  color: string;
}) {
  return (
    <View className="bg-surface rounded-lg p-4 border border-border flex-row justify-between items-center">
      <View>
        <Text className="text-sm text-muted">{label}</Text>
        <Text className="text-xl font-bold mt-1" style={{ color }}>
          {value}
        </Text>
      </View>
      {change && (
        <Text className="text-xs font-semibold text-green-600">{change}</Text>
      )}
    </View>
  );
}

function RevenueItem({
  method,
  value,
  percentage,
}: {
  method: string;
  value: string;
  percentage: number;
}) {
  return (
    <View className="gap-1">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-semibold text-foreground">{method}</Text>
        <Text className="text-sm font-bold text-primary">{value}</Text>
      </View>
      <View className="h-2 bg-background rounded-full overflow-hidden">
        <View
          className="h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className="text-xs text-muted">{percentage}% do total</Text>
    </View>
  );
}

function MonthlyTrendItem({
  month,
  revenue,
  expenses,
}: {
  month: string;
  revenue: string;
  expenses: string;
}) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-border/30">
      <Text className="text-sm font-semibold text-foreground">{month}</Text>
      <View className="items-end">
        <Text className="text-sm text-green-600 font-semibold">{revenue}</Text>
        <Text className="text-xs text-muted">{expenses}</Text>
      </View>
    </View>
  );
}

function TransactionItem({
  description,
  amount,
  date,
  type,
}: {
  description: string;
  amount: string;
  date: string;
  type: "receita" | "despesa";
}) {
  const color = type === "receita" ? "#22C55E" : "#EF4444";

  return (
    <View className="bg-surface rounded-lg p-3 border border-border flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{description}</Text>
        <Text className="text-xs text-muted mt-1">{date}</Text>
      </View>
      <Text className="text-sm font-bold" style={{ color }}>
        {type === "receita" ? "+" : "-"}{amount}
      </Text>
    </View>
  );
}

function ExportOption({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Pressable className="bg-surface rounded-lg p-4 border border-border active:opacity-80 flex-row items-center gap-3">
      <Text className="text-2xl">{icon}</Text>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
      <Text className="text-lg">→</Text>
    </Pressable>
  );
}
