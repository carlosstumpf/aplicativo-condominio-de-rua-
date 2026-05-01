/**
 * Webhook Status Badge Component
 * Shows real-time webhook failure status with visual indicators
 */

import React, { useEffect, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

interface WebhookStatusBadgeProps {
  /**
   * Size variant: "small" (for tab bar), "medium" (for header)
   */
  size?: "small" | "medium";
  /**
   * Show count of failed webhooks
   */
  showCount?: boolean;
  /**
   * Refresh interval in milliseconds (default: 30000ms = 30s)
   */
  refreshInterval?: number;
}

/**
 * Badge component that displays webhook failure status
 * Shows red dot for failures, green dot for healthy status
 */
export function WebhookStatusBadge({
  size = "small",
  showCount = false,
  refreshInterval = 30000,
}: WebhookStatusBadgeProps) {
  const colors = useColors();
  const [failedCount, setFailedCount] = useState(0);
  const [hasFailures, setHasFailures] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Query for retry statistics (includes failed webhook count)
  const retryStatsQuery = trpc.webhookAdmin.getRetryStatistics.useQuery(
    undefined,
    {
      refetchInterval: refreshInterval,
    }
  );

  // Update badge state when data changes
  useEffect(() => {
    if (retryStatsQuery.data) {
      const failed = retryStatsQuery.data.totalFailed || 0;
      setFailedCount(failed);
      setHasFailures(failed > 0);
      setIsLoading(false);

      // Trigger pulse animation when failures detected
      if (failed > 0) {
        startPulseAnimation();
      }
    }
  }, [retryStatsQuery.data]);

  // Pulse animation for alert state
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Determine badge colors and size
  const badgeSize = size === "small" ? 8 : 12;
  const dotSize = size === "small" ? 6 : 10;
  const badgeColor = hasFailures ? colors.error : colors.success;
  const textSize = size === "small" ? 10 : 12;

  // Don't show badge while loading
  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Pulsing dot indicator */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: badgeColor,
            transform: [{ scale: hasFailures ? pulseAnim : 1 }],
          },
        ]}
      />

      {/* Optional: Show count of failed webhooks */}
      {showCount && failedCount > 0 && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: badgeColor,
              minWidth: size === "small" ? 16 : 20,
              height: size === "small" ? 16 : 20,
              borderRadius: size === "small" ? 8 : 10,
            },
          ]}
        >
          <Text
            style={[
              styles.countText,
              {
                fontSize: textSize,
                color: "white",
              },
            ]}
          >
            {failedCount > 99 ? "99+" : failedCount}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Inline badge component for use in tab bar labels
 * Compact version showing only status indicator
 */
export function WebhookTabBadge() {
  const colors = useColors();
  const [hasFailures, setHasFailures] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  const retryStatsQuery = trpc.webhookAdmin.getRetryStatistics.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    }
  );

  useEffect(() => {
    if (retryStatsQuery.data) {
      const failed = retryStatsQuery.data.totalFailed || 0;
      setFailedCount(failed);
      setHasFailures(failed > 0);
    }
  }, [retryStatsQuery.data]);

  if (!hasFailures) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: colors.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "bold",
          color: "white",
        }}
      >
        {failedCount > 99 ? "99+" : failedCount}
      </Text>
    </View>
  );
}

/**
 * Header badge component for webhook dashboard
 * Shows detailed status information
 */
export function WebhookHeaderBadge() {
  const colors = useColors();
  const [status, setStatus] = useState<"healthy" | "warning" | "critical">(
    "healthy"
  );
  const [failedCount, setFailedCount] = useState(0);
  const [readyForRetry, setReadyForRetry] = useState(0);

  const retryStatsQuery = trpc.webhookAdmin.getRetryStatistics.useQuery(
    undefined,
    {
      refetchInterval: 30000,
    }
  );

  useEffect(() => {
    if (retryStatsQuery.data) {
      const failed = retryStatsQuery.data.totalFailed || 0;
      const ready = retryStatsQuery.data.readyForRetry || 0;

      setFailedCount(failed);
      setReadyForRetry(ready);

      // Determine status
      if (failed === 0) {
        setStatus("healthy");
      } else if (failed < 5) {
        setStatus("warning");
      } else {
        setStatus("critical");
      }
    }
  }, [retryStatsQuery.data]);

  const statusColors = {
    healthy: colors.success,
    warning: colors.warning,
    critical: colors.error,
  };

  const statusLabels = {
    healthy: "Saudável",
    warning: "Atenção",
    critical: "Crítico",
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: `${statusColors[status]}20`,
        borderWidth: 1,
        borderColor: statusColors[status],
      }}
    >
      {/* Status indicator dot */}
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: statusColors[status],
        }}
      />

      {/* Status label */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: statusColors[status],
        }}
      >
        {statusLabels[status]}
      </Text>

      {/* Failed count if any */}
      {failedCount > 0 && (
        <>
          <Text style={{ color: colors.muted }}>•</Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.foreground,
            }}
          >
            {failedCount} falhadas
          </Text>
        </>
      )}

      {/* Ready for retry count if any */}
      {readyForRetry > 0 && (
        <>
          <Text style={{ color: colors.muted }}>•</Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.foreground,
            }}
          >
            {readyForRetry} prontas
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  countText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});
