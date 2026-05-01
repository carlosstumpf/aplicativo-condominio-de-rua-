/**
 * Billing Filters Component
 * Date range and status filtering for billing dashboard
 */

import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface BillingFilters {
  startDate: Date;
  endDate: Date;
  status: "all" | "paid" | "pending" | "overdue";
  paymentMethod: "all" | "pix" | "boleto" | "transfer";
}

interface BillingFiltersProps {
  filters: BillingFilters;
  onFiltersChange: (filters: BillingFilters) => void;
}

export function BillingFilters({ filters, onFiltersChange }: BillingFiltersProps) {
  const colors = useColors();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleStatusChange = (status: BillingFilters["status"]) => {
    onFiltersChange({ ...filters, status });
  };

  const handlePaymentMethodChange = (method: BillingFilters["paymentMethod"]) => {
    onFiltersChange({ ...filters, paymentMethod: method });
  };

  const handleDateRangeChange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    onFiltersChange({ ...filters, startDate, endDate });
  };

  const handleResetFilters = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    onFiltersChange({
      startDate,
      endDate,
      status: "all",
      paymentMethod: "all",
    });
  };

  return (
    <ScrollView className="bg-surface border-b border-border">
      <View className="p-4 gap-4">
        {/* Date Range */}
        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-semibold text-foreground">Período</Text>
            <Pressable onPress={handleResetFilters}>
              <Text className="text-xs text-primary">Limpar</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            {[7, 30, 90, 365].map((days) => (
              <Pressable
                key={days}
                onPress={() => handleDateRangeChange(days)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border",
                  Math.abs(
                    filters.endDate.getTime() - filters.startDate.getTime()
                  ) /
                    (1000 * 60 * 60 * 24) ===
                    days
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium text-center",
                    Math.abs(
                      filters.endDate.getTime() - filters.startDate.getTime()
                    ) /
                      (1000 * 60 * 60 * 24) ===
                      days
                      ? "text-background"
                      : "text-foreground"
                  )}
                >
                  {days === 7 ? "7d" : days === 30 ? "30d" : days === 90 ? "90d" : "1a"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-xs text-muted">
            {filters.startDate.toLocaleDateString("pt-BR")} -{" "}
            {filters.endDate.toLocaleDateString("pt-BR")}
          </Text>
        </View>

        {/* Status Filter */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Status</Text>
          <View className="flex-row gap-2 flex-wrap">
            {[
              { key: "all", label: "Todos" },
              { key: "paid", label: "Pagos" },
              { key: "pending", label: "Pendentes" },
              { key: "overdue", label: "Atrasados" },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => handleStatusChange(key as BillingFilters["status"])}
                className={cn(
                  "px-4 py-2 rounded-full border",
                  filters.status === key
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    filters.status === key ? "text-background" : "text-foreground"
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Payment Method Filter */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Método de Pagamento</Text>
          <View className="flex-row gap-2 flex-wrap">
            {[
              { key: "all", label: "Todos" },
              { key: "pix", label: "PIX" },
              { key: "boleto", label: "Boleto" },
              { key: "transfer", label: "Transferência" },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => handlePaymentMethodChange(key as BillingFilters["paymentMethod"])}
                className={cn(
                  "px-4 py-2 rounded-full border",
                  filters.paymentMethod === key
                    ? "bg-primary border-primary"
                    : "bg-background border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-xs font-medium",
                    filters.paymentMethod === key ? "text-background" : "text-foreground"
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default BillingFilters;
