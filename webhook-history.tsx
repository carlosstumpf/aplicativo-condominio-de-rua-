/**
 * Webhook History Screen
 * View detailed webhook event history with filtering and retry options
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { WebhookAccessGuard } from "@/components/webhook-access-guard";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface WebhookRecord {
  id: number;
  asaasPaymentId: string;
  event: string;
  asaasStatus: string;
  internalStatus: string;
  success: number;
  errorMessage?: string;
  statusUpdated: number;
  notificationCreated: number;
  retryCount: number;
  receivedAt: Date;
  processedAt: Date;
}

function WebhookHistoryContent() {
  const colors = useColors();
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSuccess, setFilterSuccess] = useState<boolean | undefined>(undefined);

  const historyQuery = trpc.webhookAdmin.getHistory.useQuery({
    page,
    limit: 20,
    success: filterSuccess as boolean | undefined,
  });

  const retryMutation = trpc.webhookAdmin.retryWebhook.useMutation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await historyQuery.refetch();
    setRefreshing(false);
  };

  const handleRetry = async (webhookId: number) => {
    try {
      const result = await retryMutation.mutateAsync({ webhookId });
      alert(result.message);
      await handleRefresh();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const renderWebhookItem = ({ item }: { item: WebhookRecord }) => (
    <View
      className="bg-surface rounded-lg p-4 border mb-3"
      style={{ borderColor: colors.border }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            {item.event}
          </Text>
          <Text className="text-xs text-muted mt-1">{item.asaasPaymentId}</Text>
        </View>
        <StatusBadge
          success={item.success === 1}
          colors={colors}
        />
      </View>

      {/* Details */}
      <View className="gap-2 mb-3">
        <DetailRow
          label="Status Asaas"
          value={item.asaasStatus}
          colors={colors}
        />
        <DetailRow
          label="Status Interno"
          value={item.internalStatus}
          colors={colors}
        />
        <DetailRow
          label="Tentativas"
          value={item.retryCount.toString()}
          colors={colors}
        />
      </View>

      {/* Flags */}
      <View className="flex-row gap-2 mb-3">
        {item.statusUpdated === 1 && (
          <FlagBadge label="Status Atualizado" color={colors.success} />
        )}
        {item.notificationCreated === 1 && (
          <FlagBadge label="Notificação Criada" color={colors.success} />
        )}
        {item.success === 0 && (
          <FlagBadge label="Falhou" color={colors.error} />
        )}
      </View>

      {/* Error Message */}
      {item.errorMessage && (
        <View className="bg-red-50 rounded p-2 mb-3">
          <Text className="text-xs text-error">{item.errorMessage}</Text>
        </View>
      )}

      {/* Timestamp */}
      <Text className="text-xs text-muted mb-3">
        {new Date(item.receivedAt).toLocaleString("pt-BR")}
      </Text>

      {/* Retry Button */}
      {item.success === 0 && item.retryCount < 5 && (
        <TouchableOpacity
          onPress={() => handleRetry(item.id)}
          disabled={retryMutation.isPending}
          className="bg-primary rounded p-2 items-center"
          style={{
            opacity: retryMutation.isPending ? 0.6 : 1,
          }}
        >
          {retryMutation.isPending ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text className="text-white text-xs font-semibold">
              Tentar Novamente
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <Text className="text-2xl font-bold text-foreground mb-3">
            Histórico de Webhooks
          </Text>

          {/* Filter Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setFilterSuccess(undefined)}
              className={`flex-1 rounded p-2 items-center ${
                filterSuccess === undefined ? "bg-primary" : "bg-surface border"
              }`}
              style={
                filterSuccess !== undefined ? {} : { borderColor: colors.border }
              }
            >
              <Text
                className={`text-xs font-semibold ${
                  filterSuccess === null ? "text-white" : "text-foreground"
                }`}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterSuccess(true)}
              className={`flex-1 rounded p-2 items-center ${
                filterSuccess === true ? "bg-green-500" : "bg-surface border"
              }`}
              style={
                filterSuccess !== true ? { borderColor: colors.border } : {}
              }
            >
              <Text
                className={`text-xs font-semibold ${
                  filterSuccess === true ? "text-white" : "text-foreground"
                }`}
              >
                Sucesso
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterSuccess(false)}
              className={`flex-1 rounded p-2 items-center ${
                filterSuccess === false ? "bg-red-500" : "bg-surface border"
              }`}
              style={
                filterSuccess !== false ? { borderColor: colors.border } : {}
              }
            >
              <Text
                className={`text-xs font-semibold ${
                  filterSuccess === false ? "text-white" : "text-foreground"
                }`}
              >
                Falhas
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {historyQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={historyQuery.data?.data || []}
            renderItem={renderWebhookItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-muted">Nenhum webhook encontrado</Text>
              </View>
            }
          />
        )}

                {/* Pagination */}
        {historyQuery.data?.pagination && historyQuery.data.pagination.pages && (
          <View className="flex-row justify-between items-center p-4 border-t" style={{ borderTopColor: colors.border }}>
            <TouchableOpacity
              onPress={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-surface"
              style={{
                opacity: page === 1 ? 0.5 : 1,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text className="text-foreground font-semibold">← Anterior</Text>
            </TouchableOpacity>

            <Text className="text-muted text-sm">
              Página {page} de {historyQuery.data.pagination.pages || 1}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setPage(
                  Math.min(historyQuery.data.pagination.pages || 1, page + 1)
                )
              }
              disabled={page >= (historyQuery.data.pagination.pages || 1)}
              className="px-4 py-2 rounded bg-surface"
              style={{
                opacity: page >= (historyQuery.data.pagination.pages || 1) ? 0.5 : 1,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text className="text-foreground font-semibold">Próxima →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({
  success,
  colors,
}: {
  success: boolean;
  colors: any;
}) {
  return (
    <View
      className={`rounded-full px-2 py-1 ${
        success ? "bg-green-100" : "bg-red-100"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          success ? "text-green-700" : "text-red-700"
        }`}
      >
        {success ? "OK" : "Erro"}
      </Text>
    </View>
  );
}

/**
 * Detail Row Component
 */
function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-xs font-semibold text-foreground">{value}</Text>
    </View>
  );
}

/**
 * Flag Badge Component
 */
function FlagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="rounded px-2 py-1"
      style={{ backgroundColor: `${color}20` }}
    >
      <Text className="text-xs font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

export default function WebhookHistory() {
  return (
    <WebhookAccessGuard>
      <WebhookHistoryContent />
    </WebhookAccessGuard>
  );
}