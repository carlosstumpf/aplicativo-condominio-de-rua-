/**
 * Webhook Retry Confirmation Dialog
 * Confirms before retrying all failed webhooks
 */

import React from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface WebhookRetryConfirmationProps {
  /**
   * Whether dialog is visible
   */
  visible: boolean;
  /**
   * Number of webhooks to retry
   */
  failedCount: number;
  /**
   * Whether retry is in progress
   */
  isRetrying?: boolean;
  /**
   * Callback when user confirms retry
   */
  onConfirm: () => void;
  /**
   * Callback when user cancels
   */
  onCancel: () => void;
}

/**
 * Modal dialog to confirm webhook retry action
 * Shows count and asks for confirmation before proceeding
 */
export function WebhookRetryConfirmation({
  visible,
  failedCount,
  isRetrying = false,
  onConfirm,
  onCancel,
}: WebhookRetryConfirmationProps) {
  const colors = useColors();

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
        onPress={onCancel}
        disabled={isRetrying}
      >
        {/* Dialog */}
        <Pressable
          style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 20,
            width: "100%",
            maxWidth: 320,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 16,
          }}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              Reenviar Webhooks?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                lineHeight: 20,
              }}
            >
              Você está prestes a reenviar {failedCount} webhook{failedCount !== 1 ? "s" : ""} falhado{failedCount !== 1 ? "s" : ""}.
            </Text>
          </View>

          {/* Info box */}
          <View
            style={{
              backgroundColor: `${colors.warning}10`,
              borderRadius: 8,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: colors.warning,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.foreground,
                fontWeight: "500",
              }}
            >
              ℹ️ Webhooks serão reenviados imediatamente. Isso pode levar alguns minutos.
            </Text>
          </View>

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            {/* Cancel button */}
            <Pressable
              onPress={handleCancel}
              disabled={isRetrying}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.foreground,
                }}
              >
                Cancelar
              </Text>
            </Pressable>

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirm}
              disabled={isRetrying}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: colors.error,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: 8,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {isRetrying ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Reenviando...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>🔄</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Reenviar
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Error notification for failed retry
 */
export function WebhookRetryErrorNotification({
  visible,
  error,
  onDismiss,
}: {
  visible: boolean;
  error?: Error | null;
  onDismiss: () => void;
}) {
  const colors = useColors();

  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: colors.error,
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 18 }}>❌</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "white",
            marginBottom: 4,
          }}
        >
          Erro ao reenviar webhooks
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.8)",
          }}
          numberOfLines={2}
        >
          {error?.message || "Tente novamente mais tarde"}
        </Text>
      </View>
      <Pressable
        onPress={onDismiss}
        style={{
          padding: 4,
        }}
      >
        <Text style={{ fontSize: 16, color: "white" }}>✕</Text>
      </Pressable>
    </View>
  );
}

/**
 * Success notification for completed retry
 */
export function WebhookRetrySuccessNotification({
  visible,
  successCount,
  onDismiss,
}: {
  visible: boolean;
  successCount: number;
  onDismiss: () => void;
}) {
  const colors = useColors();

  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: colors.success,
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 18 }}>✓</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "white",
          }}
        >
          {successCount} webhook{successCount !== 1 ? "s" : ""} reenviado{successCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}
