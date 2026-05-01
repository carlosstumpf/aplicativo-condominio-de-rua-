/**
 * Cobrancas (Billing) Screen
 * Displays billing information and payment options
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface BillingInfo {
  id: number;
  dueDate: Date;
  amount: number;
  description: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  daysUntilDue: number;
}

interface BillingStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export default function CobrancasScreen() {
  const colors = useColors();
  const [billings, setBillings] = useState<BillingInfo[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<BillingInfo | null>(null);

  useEffect(() => {
    loadBillings();
  }, []);

  const loadBillings = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockBillings: BillingInfo[] = [
        {
          id: 1,
          dueDate: new Date(2026, 4, 15),
          amount: 500,
          description: "Taxa de Condomínio - Maio/2026",
          status: "pending",
          daysUntilDue: 3,
        },
        {
          id: 2,
          dueDate: new Date(2026, 3, 15),
          amount: 500,
          description: "Taxa de Condomínio - Abril/2026",
          status: "paid",
          daysUntilDue: -12,
        },
      ];

      setBillings(mockBillings);
      setStats({
        total: 2,
        pending: 1,
        paid: 1,
        overdue: 0,
        totalAmount: 1000,
        pendingAmount: 500,
        overdueAmount: 0,
      });
    } catch (error) {
      console.error("Error loading billings:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBillings();
    setRefreshing(false);
  };

  const handlePayBilling = (billing: BillingInfo) => {
    setSelectedBilling(billing);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return colors.success;
      case "overdue":
        return colors.error;
      case "pending":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "paid":
        return "✓ Pago";
      case "overdue":
        return "⚠ Atrasado";
      case "pending":
        return "⏳ Pendente";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Summary */}
        <View className="bg-primary p-6" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white text-lg font-semibold mb-4">Resumo de Cobranças</Text>

          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-white/80 text-sm mb-1">Pendente</Text>
              <Text className="text-white text-2xl font-bold">
                R$ {stats?.pendingAmount.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-white/80 text-sm mb-1">Atrasado</Text>
              <Text className="text-white text-2xl font-bold">
                R$ {stats?.overdueAmount.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className="text-white/80 text-sm mb-1">Total</Text>
              <Text className="text-white text-2xl font-bold">
                R$ {stats?.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row justify-between pt-4 border-t border-white/20">
            <View className="items-center">
              <Text className="text-white/80 text-xs">Pendentes</Text>
              <Text className="text-white text-lg font-semibold">{stats?.pending}</Text>
            </View>
            <View className="items-center">
              <Text className="text-white/80 text-xs">Pagos</Text>
              <Text className="text-white text-lg font-semibold">{stats?.paid}</Text>
            </View>
            <View className="items-center">
              <Text className="text-white/80 text-xs">Atrasados</Text>
              <Text className="text-white text-lg font-semibold">{stats?.overdue}</Text>
            </View>
          </View>
        </View>

        {/* Billings List */}
        <View className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">Cobranças</Text>

          {billings.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-muted text-center">Nenhuma cobrança registrada</Text>
            </View>
          ) : (
            billings.map((billing) => (
              <Pressable
                key={billing.id}
                onPress={() => handlePayBilling(billing)}
                className="mb-3"
              >
                <View
                  className="rounded-lg p-4 border border-border"
                  style={{ borderColor: colors.border }}
                >
                  {/* Billing Header */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold mb-1">
                        {billing.description}
                      </Text>
                      <Text className="text-muted text-sm">
                        Vencimento: {billing.dueDate.toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-foreground font-bold text-lg">
                        R$ {billing.amount.toFixed(2)}
                      </Text>
                      <Text
                        className="text-xs font-semibold mt-1"
                        style={{ color: getStatusColor(billing.status) }}
                      >
                        {getStatusLabel(billing.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Days Until Due */}
                  {billing.status === "pending" && (
                    <View className="bg-warning/10 rounded p-2 mb-3">
                      <Text className="text-warning text-xs font-semibold">
                        {billing.daysUntilDue > 0
                          ? `⏰ Vence em ${billing.daysUntilDue} dia(s)`
                          : `⚠️ Atrasado há ${Math.abs(billing.daysUntilDue)} dia(s)`}
                      </Text>
                    </View>
                  )}

                  {/* Payment Button */}
                  {billing.status === "pending" && (
                    <Pressable
                      className="bg-primary rounded-lg py-3 items-center"
                      style={{ backgroundColor: colors.primary }}
                      onPress={() => handlePayBilling(billing)}
                    >
                      <Text className="text-white font-semibold">Pagar Agora</Text>
                    </Pressable>
                  )}

                  {billing.status === "paid" && (
                    <View className="bg-success/10 rounded-lg py-3 items-center">
                      <Text className="text-success font-semibold">✓ Pagamento Confirmado</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      {selectedBilling && (
        <PaymentModal
          billing={selectedBilling}
          onClose={() => setSelectedBilling(null)}
          onPaymentComplete={() => {
            setSelectedBilling(null);
            loadBillings();
          }}
        />
      )}
    </ScreenContainer>
  );
}

/**
 * Payment Modal Component
 */
interface PaymentModalProps {
  billing: BillingInfo;
  onClose: () => void;
  onPaymentComplete: () => void;
}

function PaymentModal({ billing, onClose, onPaymentComplete }: PaymentModalProps) {
  const colors = useColors();
  const [selectedMethod, setSelectedMethod] = useState<"pix" | "boleto" | "transfer" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handlePayment = async (method: "pix" | "boleto" | "transfer") => {
    try {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onPaymentComplete();
      }, 2000);
    } catch (error) {
      console.error("Error processing payment:", error);
      setLoading(false);
    }
  };

  return (
    <View className="absolute inset-0 bg-black/50 items-end">
      <View
        className="w-full rounded-t-3xl p-6 pt-8"
        style={{ backgroundColor: colors.background }}
      >
        {/* Close Button */}
        <Pressable onPress={onClose} className="absolute top-4 right-4 z-10">
          <Text className="text-2xl">✕</Text>
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Text className="text-2xl font-bold text-foreground mb-2">Escolha a Forma de Pagamento</Text>
          <Text className="text-muted mb-6">{billing.description}</Text>

          {/* Amount */}
          <View className="bg-primary/10 rounded-lg p-4 mb-6">
            <Text className="text-muted text-sm mb-1">Valor a Pagar</Text>
            <Text className="text-3xl font-bold text-primary">R$ {billing.amount.toFixed(2)}</Text>
          </View>

          {/* Payment Methods */}
          <Text className="text-lg font-semibold text-foreground mb-4">Formas de Pagamento</Text>

          {/* PIX */}
          <PaymentMethodButton
            icon="🔗"
            title="PIX"
            description="Transferência instantânea"
            selected={selectedMethod === "pix"}
            onPress={() => setSelectedMethod("pix")}
            colors={colors}
          />

          {/* Boleto */}
          <PaymentMethodButton
            icon="📄"
            title="Boleto"
            description="Código de barras para pagar no banco"
            selected={selectedMethod === "boleto"}
            onPress={() => setSelectedMethod("boleto")}
            colors={colors}
          />

          {/* Bank Transfer */}
          <PaymentMethodButton
            icon="🏦"
            title="Transferência Bancária"
            description="Transferência para conta do condomínio"
            selected={selectedMethod === "transfer"}
            onPress={() => setSelectedMethod("transfer")}
            colors={colors}
          />

          {/* Payment Button */}
          <Pressable
            className="bg-primary rounded-lg py-4 items-center mt-6 mb-4"
            style={{
              backgroundColor: colors.primary,
              opacity: selectedMethod ? 1 : 0.5,
            }}
            disabled={!selectedMethod || loading}
            onPress={() => {
              if (selectedMethod) {
                handlePayment(selectedMethod);
              }
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">
                Gerar {selectedMethod === "pix" ? "QR Code" : selectedMethod === "boleto" ? "Boleto" : "Dados"}
              </Text>
            )}
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            className="border border-border rounded-lg py-3 items-center"
            style={{ borderColor: colors.border }}
            onPress={onClose}
            disabled={loading}
          >
            <Text className="text-foreground font-semibold">Cancelar</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * Payment Method Button Component
 */
interface PaymentMethodButtonProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

function PaymentMethodButton({
  icon,
  title,
  description,
  selected,
  onPress,
  colors,
}: PaymentMethodButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center p-4 rounded-lg mb-3 border-2",
        selected ? "border-primary bg-primary/5" : "border-border"
      )}
      style={{
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? `${colors.primary}10` : "transparent",
      }}
    >
      <Text className="text-3xl mr-4">{icon}</Text>
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{title}</Text>
        <Text className="text-muted text-sm">{description}</Text>
      </View>
      {selected && (
        <View
          className="w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-sm font-bold">✓</Text>
        </View>
      )}
    </Pressable>
  );
}
