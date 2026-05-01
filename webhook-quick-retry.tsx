/**
 * Webhook Quick Retry Button Component
 * One-click retry for all failed webhooks with loading and success states
 */

import React, { useState, useEffect } from "react";
import { Pressable, Text, View, ActivityIndicator, Animated } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

interface WebhookQuickRetryProps {
  /**
   * Number of failed webhooks to retry
   */
  failedCount: number;
  /**
   * Callback when retry completes successfully
   */
  onRetryComplete?: () => void;
  /**
   * Callback when retry fails
   */
  onRetryError?: (error: Error) => void;
  /**
   * Show button only if failures exist
   */
  showOnlyOnFailure?: boolean;
}

/**
 * Quick retry button that appears next to failure badge
 * Allows admins to retry all failed webhooks with one click
 */
export function WebhookQuickRetry({
  failedCount,
  onRetryComplete,
  onRetryError,
  showOnlyOnFailure = true,
}: WebhookQuickRetryProps) {
  const colors = useColors();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));

  // Mutation to process failed webhooks
  const processFailedMutation = trpc.webhookAdmin.processFailedWebhooks.useMutation({
    onSuccess: (result) => {
      setSuccessCount(result.processed || 0);
      setShowSuccess(true);
      setIsRetrying(false);

      // Trigger success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success state for 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

      // Call callback
      onRetryComplete?.();
    },
    onError: (error) => {
      setIsRetrying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onRetryError?.(error as Error);
    },
  });

  // Handle retry button press
  const handleRetry = async () => {
    if (isRetrying || failedCount === 0) return;

    setIsRetrying(true);
    setShowSuccess(false);

    // Trigger press haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Execute retry
    processFailedMutation.mutate();
  };

  // Don't show if no failures and showOnlyOnFailure is true
  if (showOnlyOnFailure && failedCount === 0) {
    return null;
  }

  // Show success state
  if (showSuccess) {
    return (
      <Pressable
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: `${colors.success}20`,
          borderWidth: 1,
          borderColor: colors.success,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.success,
          }}
        >
          ✓ {successCount} reenviados
        </Text>
      </Pressable>
    );
  }

  // Show loading state
  if (isRetrying) {
    return (
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: `${colors.warning}20`,
          borderWidth: 1,
          borderColor: colors.warning,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ActivityIndicator size="small" color={colors.warning} />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.warning,
          }}
        >
          Reenviando...
        </Text>
      </View>
    );
  }

  // Show retry button
  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={handleRetry}
        disabled={failedCount === 0}
        style={({ pressed }) => ({
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 6,
          backgroundColor: failedCount === 0 ? `${colors.muted}20` : `${colors.error}20`,
          borderWidth: 1,
          borderColor: failedCount === 0 ? colors.border : colors.error,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: failedCount === 0 ? colors.muted : colors.error,
          }}
        >
          🔄 Reenviar {failedCount}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Compact retry button for tab bar
 * Shows as small icon button next to badge
 */
export function WebhookQuickRetryIcon({
  failedCount,
  onRetryComplete,
  onRetryError,
}: Omit<WebhookQuickRetryProps, "showOnlyOnFailure">) {
  const colors = useColors();
  const [isRetrying, setIsRetrying] = useState(false);

  const processFailedMutation = trpc.webhookAdmin.processFailedWebhooks.useMutation({
    onSuccess: () => {
      setIsRetrying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRetryComplete?.();
    },
    onError: (error) => {
      setIsRetrying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onRetryError?.(error as Error);
    },
  });

  const handleRetry = () => {
    if (isRetrying || failedCount === 0) return;
    setIsRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    processFailedMutation.mutate();
  };

  if (failedCount === 0) {
    return null;
  }

  return (
    <Pressable
      onPress={handleRetry}
      disabled={isRetrying}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.error,
        justifyContent: "center",
        alignItems: "center",
        opacity: pressed ? 0.7 : 1,
        marginLeft: 8,
      })}
    >
      {isRetrying ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text style={{ fontSize: 16 }}>🔄</Text>
      )}
    </Pressable>
  );
}

/**
 * Dashboard retry action bar
 * Shows retry button with status information
 */
export function WebhookRetryActionBar({
  failedCount,
  readyForRetry,
  onRetryComplete,
  onRetryError,
}: {
  failedCount: number;
  readyForRetry: number;
  onRetryComplete?: () => void;
  onRetryError?: (error: Error) => void;
}) {
  const colors = useColors();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const processFailedMutation = trpc.webhookAdmin.processFailedWebhooks.useMutation({
    onSuccess: (result) => {
      setSuccessCount(result.processed || 0);
      setShowSuccess(true);
      setIsRetrying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setShowSuccess(false), 3000);
      onRetryComplete?.();
    },
    onError: (error) => {
      setIsRetrying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onRetryError?.(error as Error);
    },
  });

  const handleRetry = () => {
    if (isRetrying || failedCount === 0) return;
    setIsRetrying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    processFailedMutation.mutate();
  };

  if (failedCount === 0) {
    return null;
  }

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: `${colors.error}10`,
        borderWidth: 1,
        borderColor: colors.error,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Status info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 4,
          }}
        >
          {failedCount} webhook{failedCount !== 1 ? "s" : ""} falhado{failedCount !== 1 ? "s" : ""}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.muted,
          }}
        >
          {readyForRetry} pronto{readyForRetry !== 1 ? "s" : ""} para reenvio
        </Text>
      </View>

      {/* Action button */}
      {showSuccess ? (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: `${colors.success}20`,
            borderWidth: 1,
            borderColor: colors.success,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.success,
            }}
          >
            ✓ {successCount} reenviados
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={handleRetry}
          disabled={isRetrying || failedCount === 0}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: colors.error,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ fontSize: 12, color: "white" }}>🔄</Text>
          )}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "white",
            }}
          >
            {isRetrying ? "Reenviando..." : "Reenviar Tudo"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
