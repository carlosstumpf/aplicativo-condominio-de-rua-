/**
 * Billing Dashboard Component
 * Visual dashboard for batch billing payment status tracking
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface BillingStats {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  paymentRate: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export function BillingDashboard({ batchId }: { batchId?: number }) {
  const colors = useColors();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [breakdown, setBreakdown] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [batchId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // TODO: Load from API
      setStats({
        totalAmount: 25000,
        paidAmount: 23500,
        pendingAmount: 1000,
        overdueAmount: 500,
        paymentRate: 94,
      });
      setBreakdown([
        { status: "Pago", count: 47, amount: 23500, percentage: 94 },
        { status: "Pendente", count: 2, amount: 1000, percentage: 4 },
        { status: "Atrasado", count: 1, amount: 500, percentage: 2 },
      ]);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-foreground">Erro ao carregar dados</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4 gap-4">
        {/* Header Stats */}
        <View className="gap-3">
          <StatCard
            label="Valor Total"
            value={`R$ ${stats.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            color={colors.primary}
          />
          <View className="flex-row gap-3">
            <StatCard
              label="Pago"
              value={`R$ ${stats.paidAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              color={colors.success}
              flex
            />
            <StatCard
              label="Pendente"
              value={`R$ ${stats.pendingAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              color={colors.warning}
              flex
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label="Atrasado"
              value={`R$ ${stats.overdueAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              color={colors.error}
              flex
            />
            <StatCard
              label="Taxa de Pagamento"
              value={`${stats.paymentRate.toFixed(1)}%`}
              color={colors.primary}
              flex
            />
          </View>
        </View>

        {/* Progress Bar */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Progresso de Pagamento</Text>
          <View className="h-8 bg-surface rounded-lg overflow-hidden flex-row">
            <View
              className="bg-success h-full"
              style={{ width: `${stats.paymentRate}%` }}
            />
            <View
              className="bg-warning h-full"
              style={{ width: `${(stats.pendingAmount / stats.totalAmount) * 100}%` }}
            />
            <View
              className="bg-error h-full flex-1"
              style={{ width: `${(stats.overdueAmount / stats.totalAmount) * 100}%` }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Pago: {stats.paymentRate.toFixed(1)}%</Text>
            <Text className="text-xs text-muted">
              Pendente: {((stats.pendingAmount / stats.totalAmount) * 100).toFixed(1)}%
            </Text>
            <Text className="text-xs text-muted">
              Atrasado: {((stats.overdueAmount / stats.totalAmount) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Status Breakdown */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Status dos Pagamentos</Text>
          {breakdown.map((item, index) => (
            <StatusBreakdownItem key={index} item={item} />
          ))}
        </View>

        {/* Actions */}
        <View className="gap-2 pt-4">
          <Pressable
            className="bg-primary rounded-lg p-4 items-center active:opacity-80"
            onPress={() => {
              // TODO: Handle action
            }}
          >
            <Text className="text-background font-semibold">Enviar Lembrete</Text>
          </Pressable>
          <Pressable
            className="bg-surface border border-border rounded-lg p-4 items-center active:opacity-80"
            onPress={() => {
              // TODO: Handle action
            }}
          >
            <Text className="text-foreground font-semibold">Exportar Relatório</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  flex?: boolean;
}

function StatCard({ label, value, color, flex }: StatCardProps) {
  return (
    <View
      className={cn("bg-surface rounded-lg p-4 border border-border", flex && "flex-1")}
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <Text className="text-lg font-bold text-foreground">{value}</Text>
    </View>
  );
}

interface StatusBreakdownItemProps {
  item: StatusBreakdown;
}

function StatusBreakdownItem({ item }: StatusBreakdownItemProps) {
  const colors = useColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pago":
        return colors.success;
      case "Pendente":
        return colors.warning;
      case "Atrasado":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View className="bg-surface rounded-lg p-3 gap-2">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2 flex-1">
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStatusColor(item.status) }}
          />
          <Text className="text-sm font-medium text-foreground flex-1">{item.status}</Text>
        </View>
        <Text className="text-sm font-semibold text-foreground">{item.count}</Text>
      </View>
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted">
          R$ {item.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="h-1.5 bg-border rounded-full flex-1 w-12">
            <View
              className="h-1.5 rounded-full"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: getStatusColor(item.status),
              }}
            />
          </View>
          <Text className="text-xs font-semibold text-foreground w-8 text-right">
            {item.percentage}%
          </Text>
        </View>
      </View>
    </View>
  );
}

export default BillingDashboard;
