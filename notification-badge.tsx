/**
 * Notification Badge Component
 * Displays unread notification count in header
 */

import React, { useEffect, useState } from "react";
import { Text, View, Pressable, Animated } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface NotificationBadgeProps {
  count: number;
  onPress?: () => void;
  animated?: boolean;
}

export function NotificationBadge({
  count,
  onPress,
  animated = true,
}: NotificationBadgeProps) {
  const colors = useColors();
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated && count > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, animated, scaleAnim]);

  if (count === 0) {
    return null;
  }

  return (
    <Pressable onPress={onPress} className="relative">
      <View className="w-8 h-8 items-center justify-center">
        <Text className="text-2xl">🔔</Text>
      </View>

      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
        className="absolute -top-1 -right-1 bg-red-600 rounded-full w-5 h-5 items-center justify-center"
      >
        <Text className="text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Notification Indicator Component
 * Shows notification status with color coding
 */
interface NotificationIndicatorProps {
  status: "nao_lida" | "lida" | "arquivada";
  size?: "small" | "medium" | "large";
}

export function NotificationIndicator({
  status,
  size = "medium",
}: NotificationIndicatorProps) {
  const colors = useColors();

  const sizeMap = {
    small: "w-2 h-2",
    medium: "w-3 h-3",
    large: "w-4 h-4",
  };

  const colorMap = {
    nao_lida: "#EF4444",
    lida: "#9BA1A6",
    arquivada: "#687076",
  };

  return (
    <View
      className={`${sizeMap[size]} rounded-full`}
      style={{ backgroundColor: colorMap[status] }}
    />
  );
}

/**
 * Priority Badge Component
 * Shows notification priority with color
 */
interface PriorityBadgeProps {
  priority: "baixa" | "normal" | "alta" | "crítica";
  size?: "small" | "medium";
}

export function PriorityBadge({ priority, size = "medium" }: PriorityBadgeProps) {
  const colorMap = {
    baixa: { bg: "#22C55E", text: "Baixa" },
    normal: { bg: "#0a7ea4", text: "Normal" },
    alta: { bg: "#F59E0B", text: "Alta" },
    crítica: { bg: "#EF4444", text: "Crítica" },
  };

  const sizeMap = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-3 py-1 text-sm",
  };

  const color = colorMap[priority];

  return (
    <View
      className={`${sizeMap[size]} rounded-full`}
      style={{ backgroundColor: color.bg }}
    >
      <Text className="font-semibold text-white text-center">{color.text}</Text>
    </View>
  );
}

/**
 * Notification Type Badge Component
 * Shows notification type with icon
 */
interface NotificationTypeBadgeProps {
  type: string;
}

export function NotificationTypeBadge({ type }: NotificationTypeBadgeProps) {
  const typeMap: Record<string, { icon: string; label: string; color: string }> = {
    pagamento: { icon: "💰", label: "Pagamento", color: "#22C55E" },
    despesa: { icon: "📋", label: "Despesa", color: "#F59E0B" },
    comunicado: { icon: "📢", label: "Comunicado", color: "#0a7ea4" },
    alerta: { icon: "⚠️", label: "Alerta", color: "#EF4444" },
    mensagem: { icon: "💬", label: "Mensagem", color: "#8B5CF6" },
    tarefa: { icon: "✓", label: "Tarefa", color: "#06B6D4" },
  };

  const typeInfo = typeMap[type] || typeMap.alerta;

  return (
    <View className="flex-row items-center gap-1 bg-surface rounded-full px-2 py-1">
      <Text className="text-sm">{typeInfo.icon}</Text>
      <Text className="text-xs font-semibold text-foreground">
        {typeInfo.label}
      </Text>
    </View>
  );
}

/**
 * Notification Counter Component
 * Shows count with label
 */
interface NotificationCounterProps {
  count: number;
  label: string;
  color?: string;
}

export function NotificationCounter({
  count,
  label,
  color = "#0a7ea4",
}: NotificationCounterProps) {
  return (
    <View className="flex-row items-center gap-2 bg-surface rounded-lg p-3">
      <View
        className="w-12 h-12 rounded-lg items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Text className="text-2xl font-bold" style={{ color }}>
          {count}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-sm font-semibold text-foreground">
          {count} {count === 1 ? "item" : "itens"}
        </Text>
      </View>
    </View>
  );
}

/**
 * Notification Timeline Component
 * Shows relative time
 */
interface NotificationTimelineProps {
  timestamp: string;
}

export function NotificationTimeline({ timestamp }: NotificationTimelineProps) {
  const getRelativeTime = (ts: string): string => {
    const timeMap: Record<string, string> = {
      "Agora": "Agora",
      "5 min": "5 minutos",
      "10 min": "10 minutos",
      "1 hora": "1 hora",
      "2 horas": "2 horas",
      "Ontem": "Ontem",
      "2 dias": "2 dias",
    };

    return timeMap[ts] || ts;
  };

  return (
    <Text className="text-xs text-muted">{getRelativeTime(timestamp)}</Text>
  );
}

/**
 * Empty State Component
 * Shows when no notifications
 */
interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

export function NotificationEmptyState({
  title = "Sem notificações",
  message = "Você está em dia com tudo!",
  icon = "🎉",
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12">
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      <Text className="text-sm text-muted mt-2 text-center">{message}</Text>
    </View>
  );
}

/**
 * Loading Skeleton Component
 * Shows while loading notifications
 */
export function NotificationSkeleton() {
  return (
    <View className="gap-3">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="bg-surface rounded-lg p-4 border border-border gap-2"
        >
          <View className="h-4 bg-border rounded w-3/4" />
          <View className="h-3 bg-border rounded w-full" />
          <View className="h-3 bg-border rounded w-1/2" />
        </View>
      ))}
    </View>
  );
}
