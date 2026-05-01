/**
 * Flows History Screen
 * Visualizar histórico completo de flows enviados e seus status
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface FlowHistoryItem {
  id: number;
  flowType: "payment" | "maintenance" | "balance" | "help";
  status: "pending" | "completed" | "failed" | "cancelled";
  sentAt: string;
  completedAt?: string;
  source: "whatsapp" | "app";
  data: Record<string, any>;
  result?: Record<string, any>;
  errorMessage?: string;
}

interface FilterState {
  flowType: string;
  status: string;
  source: string;
  searchQuery: string;
}

const FLOW_TYPE_LABELS: Record<string, string> = {
  payment: "💰 Pagamento",
  maintenance: "🔧 Manutenção",
  balance: "📊 Saldo",
  help: "❓ Ajuda",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "⏳ Pendente",
  completed: "✅ Concluído",
  failed: "❌ Falha",
  cancelled: "🚫 Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  completed: "#10B981",
  failed: "#EF4444",
  cancelled: "#6B7280",
};

export default function FlowsHistoryScreen() {
  const colors = useColors();
  const [flows, setFlows] = useState<FlowHistoryItem[]>([]);
  const [filteredFlows, setFilteredFlows] = useState<FlowHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<FlowHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    flowType: "",
    status: "",
    source: "",
    searchQuery: "",
  });

  // Carregar histórico de flows
  useEffect(() => {
    loadFlowsHistory();
  }, []);

  const loadFlowsHistory = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Chamar API para obter histórico
      // const response = await fetch("/api/flows/history");
      // const data = await response.json();
      // setFlows(data);

      // Mock data para demonstração
      setFlows([
        {
          id: 1,
          flowType: "payment",
          status: "completed",
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          source: "whatsapp",
          data: { month: "2024-04", paymentMethod: "PIX", value: 500 },
          result: { pixKey: "12345678901234567890123456789012" },
        },
        {
          id: 2,
          flowType: "maintenance",
          status: "completed",
          sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          source: "app",
          data: { category: "water", urgency: "high", description: "Vazamento" },
        },
        {
          id: 3,
          flowType: "payment",
          status: "failed",
          sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          source: "whatsapp",
          data: { month: "2024-03", paymentMethod: "BOLETO" },
          errorMessage: "Cliente não encontrado no Asaas",
        },
        {
          id: 4,
          flowType: "balance",
          status: "completed",
          sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 1000
          ).toISOString(),
          source: "app",
          data: {},
          result: { totalDebt: 1500, lastPayment: "2024-04-01" },
        },
        {
          id: 5,
          flowType: "help",
          status: "pending",
          sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          source: "whatsapp",
          data: { question: "Como pago minha taxa?" },
        },
      ]);
    } catch (error) {
      console.error("Erro ao carregar histórico de flows:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar flows quando filtros mudam
  useEffect(() => {
    let filtered = flows;

    if (filters.flowType) {
      filtered = filtered.filter((f) => f.flowType === filters.flowType);
    }

    if (filters.status) {
      filtered = filtered.filter((f) => f.status === filters.status);
    }

    if (filters.source) {
      filtered = filtered.filter((f) => f.source === filters.source);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.flowType.toLowerCase().includes(query) ||
          f.status.toLowerCase().includes(query) ||
          JSON.stringify(f.data).toLowerCase().includes(query)
      );
    }

    setFilteredFlows(filtered);
  }, [flows, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFlowPress = (flow: FlowHistoryItem) => {
    setSelectedFlow(flow);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;

    return date.toLocaleDateString("pt-BR");
  };

  const calculateDuration = (
    sentAt: string,
    completedAt?: string
  ): string => {
    if (!completedAt) return "-";
    const start = new Date(sentAt).getTime();
    const end = new Date(completedAt).getTime();
    const diffMs = end - start;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 60) return `${diffSecs}s`;
    return `${diffMins}m`;
  };

  const renderFlowItem = ({ item }: { item: FlowHistoryItem }) => (
    <Pressable
      onPress={() => handleFlowPress(item)}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        className={cn(
          "mb-3 rounded-lg border p-4",
          "border-border bg-surface"
        )}
      >
        {/* Header */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="flex-1 text-base font-semibold text-foreground">
            {FLOW_TYPE_LABELS[item.flowType]}
          </Text>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: STATUS_COLORS[item.status] + "20" }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: STATUS_COLORS[item.status] }}
            >
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View className="mb-2 flex-row items-center gap-2">
          <Text className="text-xs text-muted">
            {item.source === "whatsapp" ? "💬 WhatsApp" : "📱 App"}
          </Text>
          <Text className="text-xs text-muted">•</Text>
          <Text className="text-xs text-muted">{formatDate(item.sentAt)}</Text>
          {item.completedAt && (
            <>
              <Text className="text-xs text-muted">•</Text>
              <Text className="text-xs text-muted">
                {calculateDuration(item.sentAt, item.completedAt)}
              </Text>
            </>
          )}
        </View>

        {/* Error Message */}
        {item.status === "failed" && item.errorMessage && (
          <View className="rounded bg-error/10 px-2 py-1">
            <Text className="text-xs text-error">{item.errorMessage}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  const renderFilterButton = (
    label: string,
    value: string,
    options: { label: string; value: string }[]
  ) => (
    <Pressable
      onPress={() => {
        // TODO: Implementar seletor de filtro
        handleFilterChange(label as keyof FilterState, "");
      }}
      className={cn(
        "rounded-full border px-3 py-2",
        value
          ? "border-primary bg-primary/10"
          : "border-border bg-surface"
      )}
    >
      <Text
        className={cn(
          "text-xs font-medium",
          value ? "text-primary" : "text-foreground"
        )}
      >
        {value || label}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-foreground">Carregando histórico...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="border-b border-border bg-surface px-4 py-4">
          <Text className="text-2xl font-bold text-foreground">
            Histórico de Flows
          </Text>
          <Text className="mt-1 text-sm text-muted">
            {filteredFlows.length} flow{filteredFlows.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Search */}
        <View className="border-b border-border px-4 py-3">
          <View className="flex-row items-center rounded-lg border border-border bg-surface px-3 py-2">
            <Text className="text-lg text-muted">🔍</Text>
            <TextInput
              placeholder="Buscar flows..."
              placeholderTextColor={colors.muted}
              value={filters.searchQuery}
              onChangeText={(text) =>
                handleFilterChange("searchQuery", text)
              }
              className="ml-2 flex-1 text-foreground"
            />
          </View>
        </View>

        {/* Filters */}
        <View className="border-b border-border px-4 py-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
          >
            {renderFilterButton("Tipo", filters.flowType, [
              { label: "💰 Pagamento", value: "payment" },
              { label: "🔧 Manutenção", value: "maintenance" },
              { label: "📊 Saldo", value: "balance" },
              { label: "❓ Ajuda", value: "help" },
            ])}

            {renderFilterButton("Status", filters.status, [
              { label: "⏳ Pendente", value: "pending" },
              { label: "✅ Concluído", value: "completed" },
              { label: "❌ Falha", value: "failed" },
              { label: "🚫 Cancelado", value: "cancelled" },
            ])}

            {renderFilterButton("Origem", filters.source, [
              { label: "💬 WhatsApp", value: "whatsapp" },
              { label: "📱 App", value: "app" },
            ])}
          </ScrollView>
        </View>

        {/* Flows List */}
        <View className="flex-1 px-4 py-4">
          {filteredFlows.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg text-muted">
                Nenhum flow encontrado
              </Text>
              <Text className="mt-2 text-sm text-muted">
                Tente ajustar seus filtros
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFlows}
              renderItem={renderFlowItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {showDetailModal && selectedFlow && (
        <FlowDetailModal
          flow={selectedFlow}
          onClose={() => setShowDetailModal(false)}
          colors={colors}
        />
      )}
    </ScreenContainer>
  );
}

/**
 * Flow Detail Modal Component
 */
interface FlowDetailModalProps {
  flow: FlowHistoryItem;
  onClose: () => void;
  colors: any;
}

function FlowDetailModal({
  flow,
  onClose,
  colors,
}: FlowDetailModalProps) {
  return (
    <View className="absolute inset-0 flex-1 items-end justify-end bg-black/50">
      <Pressable
        onPress={onClose}
        className="absolute inset-0"
      />

      <View
        className={cn(
          "w-full rounded-t-2xl border-t border-border bg-surface p-6",
          "max-h-3/4"
        )}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">
              Detalhes do Flow
            </Text>
            <Pressable
              onPress={onClose}
              className="rounded-full bg-surface p-2"
            >
              <Text className="text-xl">✕</Text>
            </Pressable>
          </View>

          {/* Type and Status */}
          <View className="mb-4 rounded-lg bg-background p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-muted">Tipo</Text>
              <Text className="font-semibold text-foreground">
                {FLOW_TYPE_LABELS[flow.flowType]}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Status</Text>
              <View
                className="rounded-full px-3 py-1"
                style={{
                  backgroundColor: STATUS_COLORS[flow.status] + "20",
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: STATUS_COLORS[flow.status] }}
                >
                  {STATUS_LABELS[flow.status]}
                </Text>
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View className="mb-4">
            <Text className="mb-2 font-semibold text-foreground">
              Timeline
            </Text>

            <View className="rounded-lg bg-background p-4">
              <View className="mb-3 flex-row items-start gap-3">
                <Text className="text-lg">📤</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">
                    Enviado
                  </Text>
                  <Text className="text-xs text-muted">
                    {new Date(flow.sentAt).toLocaleString("pt-BR")}
                  </Text>
                </View>
              </View>

              {flow.completedAt && (
                <View className="flex-row items-start gap-3">
                  <Text className="text-lg">✅</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      Concluído
                    </Text>
                    <Text className="text-xs text-muted">
                      {new Date(flow.completedAt).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                </View>
              )}

              {flow.status === "failed" && (
                <View className="mt-3 flex-row items-start gap-3">
                  <Text className="text-lg">❌</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-error">
                      Erro
                    </Text>
                    <Text className="text-xs text-error">
                      {flow.errorMessage}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Data */}
          <View className="mb-4">
            <Text className="mb-2 font-semibold text-foreground">
              Dados Enviados
            </Text>
            <View className="rounded-lg bg-background p-4">
              <Text className="font-mono text-xs text-muted">
                {JSON.stringify(flow.data, null, 2)}
              </Text>
            </View>
          </View>

          {/* Result */}
          {flow.result && (
            <View className="mb-4">
              <Text className="mb-2 font-semibold text-foreground">
                Resultado
              </Text>
              <View className="rounded-lg bg-background p-4">
                <Text className="font-mono text-xs text-muted">
                  {JSON.stringify(flow.result, null, 2)}
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View className="mt-6 gap-3">
            <Pressable
              onPress={onClose}
              className="rounded-lg bg-primary py-3"
            >
              <Text className="text-center font-semibold text-background">
                Fechar
              </Text>
            </Pressable>

            {flow.status === "failed" && (
              <Pressable
                onPress={() => {
                  // TODO: Implementar reenvio
                  onClose();
                }}
                className="rounded-lg border border-primary bg-transparent py-3"
              >
                <Text className="text-center font-semibold text-primary">
                  Reenviar
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
