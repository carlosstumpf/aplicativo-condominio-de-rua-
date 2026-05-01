/**
 * Flows Retry Scheduler Components
 * UI components for scheduling automatic retries
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Switch,
} from "react-native";
// DateTimePicker will be implemented with native date/time selection
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";

export type RetryFrequency = "once" | "daily" | "weekly" | "custom";

interface RetrySchedulerModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (config: RetryScheduleConfig) => void;
  isLoading?: boolean;
  flowType?: string;
}

export interface RetryScheduleConfig {
  scheduledTime: Date;
  frequency: RetryFrequency;
  maxRetries: number;
  notes?: string;
}

/**
 * Retry Scheduler Modal Component
 * Allows users to configure retry schedule
 */
export function FlowsRetrySchedulerModal({
  visible,
  onClose,
  onSchedule,
  isLoading = false,
  flowType = "unknown",
}: RetrySchedulerModalProps) {
  const colors = useColors();
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [frequency, setFrequency] = useState<RetryFrequency>("once");
  const [maxRetries, setMaxRetries] = useState(3);
  const [notes, setNotes] = useState("");
  const handleDateTimeChange = (newDate: Date) => {
    setScheduledTime(newDate);
  };

  const handleSchedule = () => {
    onSchedule({
      scheduledTime,
      frequency,
      maxRetries,
      notes,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-black/50 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View
          className="bg-background rounded-t-3xl p-6 max-h-4/5"
          style={{ backgroundColor: colors.background }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-foreground">
                Agendar Reenvio
              </Text>
              <Pressable
                onPress={onClose}
                className="p-2"
                disabled={isLoading}
              >
                <Text className="text-2xl text-muted">✕</Text>
              </Pressable>
            </View>

            {/* Flow Type Info */}
            <View
              className="bg-surface rounded-lg p-4 mb-6"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-sm text-muted">Tipo de Flow</Text>
              <Text className="text-lg font-semibold text-foreground capitalize">
                {flowType === "payment" && "💰 Pagamento"}
                {flowType === "maintenance" && "🔧 Manutenção"}
                {flowType === "balance" && "📊 Saldo"}
                {flowType === "help" && "❓ Ajuda"}
              </Text>
            </View>

            {/* Date Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Data do Reenvio
              </Text>
              <Pressable
                onPress={() => handleDateTimeChange(new Date(scheduledTime.getTime() + 24 * 60 * 60 * 1000))}
                className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
                style={{ backgroundColor: colors.surface }}
                disabled={isLoading}
              >
                <Text className="text-foreground">
                  {scheduledTime.toLocaleDateString("pt-BR")}
                </Text>
                <Text className="text-lg">📅</Text>
              </Pressable>

              {/* Native date picker will be implemented */}
            </View>

            {/* Time Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Horário do Reenvio
              </Text>
              <Pressable
                onPress={() => handleDateTimeChange(new Date(scheduledTime.getTime() + 60 * 60 * 1000))}
                className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
                style={{ backgroundColor: colors.surface }}
                disabled={isLoading}
              >
                <Text className="text-foreground">
                  {scheduledTime.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text className="text-lg">🕐</Text>
              </Pressable>

              {/* Native time picker will be implemented */}
            </View>

            {/* Frequency Selection */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Frequência de Reenvio
              </Text>
              <View className="gap-2">
                {(
                  [
                    { value: "once", label: "Uma única vez" },
                    { value: "daily", label: "Diariamente" },
                    { value: "weekly", label: "Semanalmente" },
                    { value: "custom", label: "Automático (backoff)" },
                  ] as const
                ).map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setFrequency(option.value)}
                    className={cn(
                      "p-3 rounded-lg border",
                      frequency === option.value
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    )}
                    style={{
                      backgroundColor:
                        frequency === option.value
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        frequency === option.value
                          ? colors.primary
                          : colors.border,
                    }}
                    disabled={isLoading}
                  >
                    <Text
                      className={cn(
                        "font-medium",
                        frequency === option.value
                          ? "text-background"
                          : "text-foreground"
                      )}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Max Retries */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Máximo de Tentativas: {maxRetries}
              </Text>
              <View className="flex-row gap-2">
                {[1, 3, 5, 10].map((num) => (
                  <Pressable
                    key={num}
                    onPress={() => setMaxRetries(num)}
                    className={cn(
                      "flex-1 p-3 rounded-lg border",
                      maxRetries === num
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    )}
                    style={{
                      backgroundColor:
                        maxRetries === num ? colors.primary : colors.surface,
                      borderColor:
                        maxRetries === num ? colors.primary : colors.border,
                    }}
                    disabled={isLoading}
                  >
                    <Text
                      className={cn(
                        "text-center font-semibold",
                        maxRetries === num
                          ? "text-background"
                          : "text-foreground"
                      )}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Notas (opcional)
              </Text>
              <View
                className="bg-surface rounded-lg p-3 border border-border"
                style={{ backgroundColor: colors.surface }}
              >
                <Text
                  className="text-foreground"
                  placeholder="Adicione uma nota..."
                  placeholderTextColor={colors.muted}
                  numberOfLines={3}
                >
                  {notes || "Nenhuma nota adicionada"}
                </Text>
              </View>
            </View>

            {/* Summary */}
            <View
              className="bg-surface rounded-lg p-4 mb-6"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-sm text-muted mb-2">Resumo</Text>
              <Text className="text-foreground font-semibold">
                Reenvio agendado para:
              </Text>
              <Text className="text-foreground mt-1">
                📅 {scheduledTime.toLocaleDateString("pt-BR")} às{" "}
                {scheduledTime.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text className="text-foreground mt-2">
                🔄 Frequência: {frequency}
              </Text>
              <Text className="text-foreground mt-1">
                ⚡ Máx. tentativas: {maxRetries}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              <Pressable
                onPress={handleSchedule}
                className="bg-primary rounded-lg p-4 flex-row justify-center items-center gap-2"
                style={{ backgroundColor: colors.primary }}
                disabled={isLoading}
              >
                <Text className="text-background font-semibold text-lg">
                  {isLoading ? "Agendando..." : "✓ Agendar Reenvio"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onClose}
                className="bg-surface rounded-lg p-4 border border-border"
                style={{ backgroundColor: colors.surface }}
                disabled={isLoading}
              >
                <Text className="text-foreground font-semibold text-center">
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Retry Schedule Card Component
 * Displays a scheduled retry
 */
interface RetryScheduleCardProps {
  id: number;
  flowType: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  scheduledTime: Date;
  attempts: number;
  maxRetries: number;
  onCancel?: (id: number) => void;
  onReschedule?: (id: number) => void;
}

export function RetryScheduleCard({
  id,
  flowType,
  status,
  scheduledTime,
  attempts,
  maxRetries,
  onCancel,
  onReschedule,
}: RetryScheduleCardProps) {
  const colors = useColors();

  const statusIcon = {
    pending: "⏳",
    completed: "✅",
    failed: "❌",
    cancelled: "🚫",
  }[status];

  const statusColor = {
    pending: colors.warning,
    completed: colors.success,
    failed: colors.error,
    cancelled: colors.muted,
  }[status];

  return (
    <View
      className="bg-surface rounded-lg p-4 mb-3 border border-border"
      style={{ backgroundColor: colors.surface }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-lg">
              {flowType === "payment" && "💰"}
              {flowType === "maintenance" && "🔧"}
              {flowType === "balance" && "📊"}
              {flowType === "help" && "❓"}
            </Text>
            <Text className="text-foreground font-semibold capitalize flex-1">
              {flowType}
            </Text>
            <Text className="text-lg">{statusIcon}</Text>
          </View>
          <Text className="text-sm text-muted capitalize">{status}</Text>
        </View>
      </View>

      <View className="bg-background/50 rounded-lg p-3 mb-3">
        <Text className="text-xs text-muted mb-1">Agendado para</Text>
        <Text className="text-foreground font-semibold">
          {scheduledTime.toLocaleDateString("pt-BR")} às{" "}
          {scheduledTime.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm text-muted">
          Tentativas: {attempts}/{maxRetries}
        </Text>
        <View className="h-1.5 flex-1 mx-2 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{
              width: `${(attempts / maxRetries) * 100}%`,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </View>

      {status === "pending" && (
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => onReschedule?.(id)}
            className="flex-1 bg-primary rounded-lg p-2"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-background text-center font-semibold text-sm">
              Reagendar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onCancel?.(id)}
            className="flex-1 bg-error rounded-lg p-2"
            style={{ backgroundColor: colors.error }}
          >
            <Text className="text-background text-center font-semibold text-sm">
              Cancelar
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/**
 * Retry Schedule Stats Component
 */
interface RetryScheduleStatsProps {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  successRate: number;
}

export function RetryScheduleStats({
  total,
  pending,
  completed,
  failed,
  successRate,
}: RetryScheduleStatsProps) {
  const colors = useColors();

  return (
    <View
      className="bg-surface rounded-lg p-4 mb-4"
      style={{ backgroundColor: colors.surface }}
    >
      <Text className="text-lg font-bold text-foreground mb-3">
        Estatísticas de Reenvios
      </Text>

      <View className="gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-muted">Total</Text>
          <Text className="text-foreground font-semibold">{total}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-muted">⏳ Pendentes</Text>
          <Text className="text-foreground font-semibold">{pending}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-muted">✅ Concluídos</Text>
          <Text className="text-foreground font-semibold">{completed}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-muted">❌ Falhados</Text>
          <Text className="text-foreground font-semibold">{failed}</Text>
        </View>
        <View className="h-0.5 bg-border my-2" />
        <View className="flex-row justify-between items-center">
          <Text className="text-muted font-semibold">Taxa de Sucesso</Text>
          <Text
            className="font-bold text-lg"
            style={{ color: successRate >= 80 ? colors.success : colors.warning }}
          >
            {successRate}%
          </Text>
        </View>
      </View>
    </View>
  );
}
