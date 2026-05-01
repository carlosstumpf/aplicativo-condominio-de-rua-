/**
 * Billing Breakdown Component
 * Detailed view of individual payments in a batch
 */

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, FlatList } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface PaymentItem {
  id: number;
  moradorId: number;
  moradorName: string;
  email: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paymentMethod?: string;
  paidDate?: Date;
  dueDate: Date;
}

interface BillingBreakdownProps {
  batchId: number;
  onPaymentSelect?: (payment: PaymentItem) => void;
}

export function BillingBreakdown({ batchId, onPaymentSelect }: BillingBreakdownProps) {
  const colors = useColors();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadPayments();
  }, [batchId, filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // TODO: Load from API
      const mockPayments: PaymentItem[] = [
        {
          id: 1,
          moradorId: 1,
          moradorName: "João Silva",
          email: "joao@example.com",
          amount: 500,
          status: "paid",
          paymentMethod: "PIX",
          paidDate: new Date("2026-04-20"),
          dueDate: new Date("2026-05-31"),
        },
        {
          id: 2,
          moradorId: 2,
          moradorName: "Maria Santos",
          email: "maria@example.com",
          amount: 500,
          status: "pending",
          dueDate: new Date("2026-05-31"),
        },
        {
          id: 3,
          moradorId: 3,
          moradorName: "Pedro Oliveira",
          email: "pedro@example.com",
          amount: 500,
          status: "overdue",
          dueDate: new Date("2026-04-30"),
        },
      ];

      const filtered =
        filter === "all" ? mockPayments : mockPayments.filter((p) => p.status === filter);
      setPayments(filtered);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return colors.success;
      case "pending":
        return colors.warning;
      case "overdue":
        return colors.error;
      case "cancelled":
        return colors.muted;
      default:
        return colors.primary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Atrasado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Filter Tabs */}
      <View className="flex-row border-b border-border bg-surface px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["all", "paid", "pending", "overdue"].map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilter(status)}
              className={cn(
                "px-4 py-2 mr-2 rounded-full",
                filter === status ? "bg-primary" : "bg-background border border-border"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-medium",
                  filter === status ? "text-background" : "text-foreground"
                )}
              >
                {status === "all" ? "Todos" : getStatusLabel(status)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Payment List */}
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PaymentItemCard
            payment={item}
            statusColor={getStatusColor(item.status)}
            statusLabel={getStatusLabel(item.status)}
            onPress={() => onPaymentSelect?.(item)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-muted">Nenhum pagamento encontrado</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}

interface PaymentItemCardProps {
  payment: PaymentItem;
  statusColor: string;
  statusLabel: string;
  onPress?: () => void;
}

function PaymentItemCard({ payment, statusColor, statusLabel, onPress }: PaymentItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border-b border-border p-4 active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{payment.moradorName}</Text>
          <Text className="text-xs text-muted">{payment.email}</Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: statusColor + "20" }}
        >
          <Text className="text-xs font-semibold" style={{ color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-bold text-foreground">
            R$ {payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Text>
          <Text className="text-xs text-muted">
            Vence em {payment.dueDate.toLocaleDateString("pt-BR")}
          </Text>
        </View>

        <View className="items-end">
          {payment.paymentMethod && (
            <Text className="text-xs text-muted mb-1">{payment.paymentMethod}</Text>
          )}
          {payment.paidDate && (
            <Text className="text-xs text-success">
              Pago em {payment.paidDate.toLocaleDateString("pt-BR")}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default BillingBreakdown;
