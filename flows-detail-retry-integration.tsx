/**
 * Flows Detail Retry Integration
 * Integrates retry scheduling into flows history detail modal
 */

import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import {
  FlowsRetrySchedulerModal,
  type RetryScheduleConfig,
} from "./flows-retry-scheduler";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface FlowsDetailRetryIntegrationProps {
  flowId: number;
  flowType: string;
  flowStatus: "pending" | "completed" | "failed" | "cancelled";
  onScheduleRetry?: (config: RetryScheduleConfig) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Retry Button for Flow Detail Modal
 */
export function FlowDetailRetryButton({
  flowId,
  flowType,
  flowStatus,
  onScheduleRetry,
  isLoading = false,
}: FlowsDetailRetryIntegrationProps) {
  const colors = useColors();
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  // Only show retry button if flow failed
  if (flowStatus !== "failed") {
    return null;
  }

  const handleScheduleRetry = async (config: RetryScheduleConfig) => {
    try {
      setScheduling(true);
      await onScheduleRetry?.(config);
      setShowScheduler(false);
    } catch (error) {
      console.error("Error scheduling retry:", error);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setShowScheduler(true)}
        className="bg-primary rounded-lg p-3 flex-row justify-center items-center gap-2"
        style={{ backgroundColor: colors.primary }}
        disabled={isLoading || scheduling}
      >
        <Text className="text-lg">⏰</Text>
        <Text className="text-background font-semibold">
          {scheduling ? "Agendando..." : "Agendar Reenvio"}
        </Text>
      </Pressable>

      <FlowsRetrySchedulerModal
        visible={showScheduler}
        onClose={() => setShowScheduler(false)}
        onSchedule={handleScheduleRetry}
        isLoading={scheduling}
        flowType={flowType}
      />
    </>
  );
}

/**
 * Retry Status Badge for Flow Detail
 */
interface FlowRetryStatusBadgeProps {
  hasScheduledRetry: boolean;
  nextRetryTime?: Date;
  retryAttempts?: number;
  maxRetries?: number;
}

export function FlowRetryStatusBadge({
  hasScheduledRetry,
  nextRetryTime,
  retryAttempts = 0,
  maxRetries = 3,
}: FlowRetryStatusBadgeProps) {
  const colors = useColors();

  if (!hasScheduledRetry) {
    return null;
  }

  return (
    <View
      className="bg-warning/10 rounded-lg p-3 mb-3 border border-warning"
      style={{
        backgroundColor: `${colors.warning}20`,
        borderColor: colors.warning,
      }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-lg">⏰</Text>
        <Text className="text-foreground font-semibold">Reenvio Agendado</Text>
      </View>

      {nextRetryTime && (
        <Text className="text-sm text-muted mb-1">
          Próxima tentativa: {nextRetryTime.toLocaleDateString("pt-BR")} às{" "}
          {nextRetryTime.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      )}

      {retryAttempts !== undefined && maxRetries !== undefined && (
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-muted">
            Tentativas: {retryAttempts}/{maxRetries}
          </Text>
          <View className="h-1 flex-1 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-warning"
              style={{
                width: `${(retryAttempts / maxRetries) * 100}%`,
                backgroundColor: colors.warning,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Retry History Timeline for Flow Detail
 */
interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  status: "pending" | "success" | "failed";
  error?: string;
}

interface FlowRetryHistoryProps {
  attempts: RetryAttempt[];
}

export function FlowRetryHistory({ attempts }: FlowRetryHistoryProps) {
  const colors = useColors();

  if (attempts.length === 0) {
    return null;
  }

  return (
    <View
      className="bg-surface rounded-lg p-4 mb-3"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-foreground font-semibold mb-3">
        📜 Histórico de Reenvios
      </Text>

      {attempts.map((attempt, index) => (
        <View key={index} className="mb-3 pb-3 border-b border-border">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-foreground font-semibold">
              Tentativa {attempt.attemptNumber}
            </Text>
            <Text className="text-lg">
              {attempt.status === "success" && "✅"}
              {attempt.status === "failed" && "❌"}
              {attempt.status === "pending" && "⏳"}
            </Text>
          </View>

          <Text className="text-sm text-muted mb-1">
            {attempt.timestamp.toLocaleDateString("pt-BR")} às{" "}
            {attempt.timestamp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          {attempt.error && (
            <Text className="text-sm text-error">{attempt.error}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

/**
 * Quick Retry Schedule Action
 */
interface QuickRetryActionProps {
  flowId: number;
  flowType: string;
  onQuickSchedule?: (hours: number) => Promise<void>;
  isLoading?: boolean;
}

export function QuickRetryAction({
  flowId,
  flowType,
  onQuickSchedule,
  isLoading = false,
}: QuickRetryActionProps) {
  const colors = useColors();
  const [scheduling, setScheduling] = useState(false);

  const handleQuickSchedule = async (hours: number) => {
    try {
      setScheduling(true);
      await onQuickSchedule?.(hours);
    } catch (error) {
      console.error("Error quick scheduling retry:", error);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground mb-1">
        Reenviar em:
      </Text>
      <View className="flex-row gap-2">
        {[1, 3, 24].map((hours) => (
          <Pressable
            key={hours}
            onPress={() => handleQuickSchedule(hours)}
            className="flex-1 bg-primary rounded-lg p-2"
            style={{ backgroundColor: colors.primary }}
            disabled={isLoading || scheduling}
          >
            <Text className="text-background text-center font-semibold text-xs">
              {hours}h
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/**
 * Retry Schedule Info Card
 */
interface RetryScheduleInfoProps {
  scheduledTime: Date;
  frequency: string;
  maxRetries: number;
  attempts: number;
  onCancel?: () => Promise<void>;
  onReschedule?: () => void;
}

export function RetryScheduleInfo({
  scheduledTime,
  frequency,
  maxRetries,
  attempts,
  onCancel,
  onReschedule,
}: RetryScheduleInfoProps) {
  const colors = useColors();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await onCancel?.();
    } catch (error) {
      console.error("Error cancelling retry:", error);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View
      className="bg-surface rounded-lg p-4 mb-3"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-foreground font-semibold mb-3">
        ⏰ Detalhes do Reenvio
      </Text>

      <View className="gap-2 mb-4">
        <View className="flex-row justify-between">
          <Text className="text-muted">Agendado para</Text>
          <Text className="text-foreground font-semibold">
            {scheduledTime.toLocaleDateString("pt-BR")} às{" "}
            {scheduledTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-muted">Frequência</Text>
          <Text className="text-foreground font-semibold capitalize">
            {frequency}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-muted">Tentativas</Text>
          <Text className="text-foreground font-semibold">
            {attempts}/{maxRetries}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={onReschedule}
          className="flex-1 bg-primary rounded-lg p-2"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-background text-center font-semibold text-sm">
            Reagendar
          </Text>
        </Pressable>

        <Pressable
          onPress={handleCancel}
          className="flex-1 bg-error rounded-lg p-2"
          style={{ backgroundColor: colors.error }}
          disabled={cancelling}
        >
          <Text className="text-background text-center font-semibold text-sm">
            {cancelling ? "Cancelando..." : "Cancelar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
