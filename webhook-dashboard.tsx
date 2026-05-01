/**
 * Webhook Administration Dashboard
 * View webhook history, retry failed webhooks, and monitor metrics
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { WebhookAccessGuard } from "@/components/webhook-access-guard";
import { WebhookHeaderBadge } from "@/components/webhook-status-badge";
import { WebhookRetryActionBar } from "@/components/webhook-quick-retry";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface WebhookMetrics {
  totalReceived: number;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  successRate: number;
  averageProcessingTime: number;
  statusUpdatedCount: number;
  notificationCreatedCount: number;
}

interface RetryStats {
  totalFailed: number;
  readyForRetry: number;
  maxRetriesExceeded: number;
  averageRetries: number;
}

function WebhookDashboardContent() {
  const colors = useColors();
  const [metrics, setMetrics] = useState<WebhookMetrics | null>(null);
  const [retryStats, setRetryStats] = useState<RetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const metricsQuery = trpc.webhookAdmin.getStatistics.useQuery({ days: 30 });
  const retryStatsQuery = trpc.webhookAdmin.getRetryStatistics.useQuery();
  const processFailedMutation = trpc.webhookAdmin.processFailedWebhooks.useMutation();

  useEffect(() => {
    if (metricsQuery.data?.data) {
      setMetrics(metricsQuery.data.data);
    }
    if (retryStatsQuery.data?.data) {
      setRetryStats(retryStatsQuery.data.data);
    }
    setLoading(false);
  }, [metricsQuery.data, retryStatsQuery.data]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      metricsQuery.refetch(),
      retryStatsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const handleProcessFailed = async () => {
    try {
      const result = await processFailedMutation.mutateAsync();
      alert(
        `Processados ${result.processed} webhooks: ${result.successful} sucesso, ${result.failed} falha`
      );
      await handleRefresh();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
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
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Painel de Webhooks
            </Text>
            <Text className="text-sm text-muted">
              Monitore e gerencie eventos de webhooks do Asaas
            </Text>
          </View>

          {/* Metrics Cards */}
          {metrics && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground mt-2">
                Métricas (últimos 30 dias)
              </Text>

              {/* Main Stats */}
              <View className="flex-row gap-2">
                <MetricCard
                  label="Recebidos"
                  value={metrics.totalReceived}
                  color={colors.primary}
                  flex={1}
                />
                <MetricCard
                  label="Processados"
                  value={metrics.totalProcessed}
                  color={colors.primary}
                  flex={1}
                />
              </View>

              <View className="flex-row gap-2">
                <MetricCard
                  label="Sucesso"
                  value={metrics.totalSuccessful}
                  color={colors.success}
                  flex={1}
                />
                <MetricCard
                  label="Falhas"
                  value={metrics.totalFailed}
                  color={colors.error}
                  flex={1}
                />
              </View>

              {/* Success Rate */}
              <View
                className="bg-surface rounded-lg p-4 border border-border"
                style={{ borderColor: colors.border }}
              >
                <Text className="text-sm text-muted mb-1">Taxa de Sucesso</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {metrics.successRate}%
                </Text>
              </View>

              {/* Processing Time */}
              <View
                className="bg-surface rounded-lg p-4 border border-border"
                style={{ borderColor: colors.border }}
              >
                <Text className="text-sm text-muted mb-1">
                  Tempo Médio de Processamento
                </Text>
                <Text className="text-2xl font-bold text-foreground">
                  {metrics.averageProcessingTime}ms
                </Text>
              </View>

              {/* Status Updates and Notifications */}
              <View className="flex-row gap-2">
                <MetricCard
                  label="Status Atualizados"
                  value={metrics.statusUpdatedCount}
                  color={colors.primary}
                  flex={1}
                />
                <MetricCard
                  label="Notificações"
                  value={metrics.notificationCreatedCount}
                  color={colors.primary}
                  flex={1}
                />
              </View>
            </View>
          )}

          {/* Retry Statistics */}
          {retryStats && (
            <View className="gap-3 mt-4">
              <Text className="text-lg font-semibold text-foreground">
                Status de Retentativas
              </Text>

              <View className="flex-row gap-2">
                <MetricCard
                  label="Falhadas"
                  value={retryStats.totalFailed}
                  color={colors.error}
                  flex={1}
                />
                <MetricCard
                  label="Prontas para Retry"
                  value={retryStats.readyForRetry}
                  color={colors.warning}
                  flex={1}
                />
              </View>

              <View className="flex-row gap-2">
                <MetricCard
                  label="Máx. Tentativas"
                  value={retryStats.maxRetriesExceeded}
                  color={colors.error}
                  flex={1}
                />
                <MetricCard
                  label="Média de Tentativas"
                  value={retryStats.averageRetries}
                  color={colors.primary}
                  flex={1}
                />
              </View>

              {/* Process Failed Button */}
              {retryStats.readyForRetry > 0 && (
                <TouchableOpacity
                  onPress={handleProcessFailed}
                  disabled={processFailedMutation.isPending}
                  className="bg-primary rounded-lg p-4 items-center mt-2"
                  style={{
                    opacity: processFailedMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {processFailedMutation.isPending ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text className="text-white font-semibold">
                      Processar {retryStats.readyForRetry} Webhooks Falhados
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Information */}
          <View
            className="bg-surface rounded-lg p-4 border border-border mt-4"
            style={{ borderColor: colors.border }}
          >
            <Text className="text-sm font-semibold text-foreground mb-2">
              ℹ️ Informações
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              • Webhooks falhados são automaticamente agendados para retentativa{"\n"}
              • Tentativas seguem backoff exponencial (5m, 15m, 1h, 4h, 24h){"\n"}
              • Máximo de 5 tentativas por webhook{"\n"}
              • Histórico é mantido por 90 dias
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  label,
  value,
  color,
  flex = 1,
}: {
  label: string;
  value: number | string;
  color: string;
  flex?: number;
}) {
  const colors = useColors();

  return (
    <View
      className="bg-surface rounded-lg p-4 border border-border flex-1"
      style={{ borderColor: colors.border, flex }}
    >
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <Text className="text-2xl font-bold" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

export default function WebhookDashboard() {
  return (
    <WebhookAccessGuard>
      <WebhookDashboardContent />
    </WebhookAccessGuard>
  );
}