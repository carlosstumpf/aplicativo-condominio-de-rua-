/**
 * Webhook Selective Retry Panel
 * UI for filtering and retrying webhooks by type
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import {
  WebhookTypeFilter,
  WebhookTypeFilterButton,
  type WebhookType,
  CATEGORY_LABELS,
  WEBHOOK_TYPE_TO_CATEGORY,
} from "./webhook-type-filter";
import * as Haptics from "expo-haptics";

interface FailureCountByType {
  [key: string]: number;
}

interface SelectiveRetryPanelProps {
  /**
   * Failure counts by webhook type
   */
  failuresByType?: FailureCountByType;
  /**
   * Callback to retry selected types
   */
  onRetry: (types: WebhookType[]) => Promise<void>;
  /**
   * Whether retry is in progress
   */
  isRetrying?: boolean;
  /**
   * Show as compact (button) or expanded (full panel)
   */
  compact?: boolean;
}

/**
 * Panel for selective webhook retry by type
 */
export function WebhookSelectiveRetryPanel({
  failuresByType = {},
  onRetry,
  isRetrying = false,
  compact = false,
}: SelectiveRetryPanelProps) {
  const colors = useColors();
  const [selectedTypes, setSelectedTypes] = useState<WebhookType[]>([]);
  const [showFilter, setShowFilter] = useState(!compact);
  const [retrySuccess, setRetrySuccess] = useState(false);

  // Calculate total failures for selected types
  const getTotalFailures = (): number => {
    if (selectedTypes.length === 0) {
      return Object.values(failuresByType).reduce((a, b) => a + b, 0);
    }
    return selectedTypes.reduce((sum, type) => sum + (failuresByType[type] || 0), 0);
  };

  // Get failures by category
  const getFailuresByCategory = (): Record<string, number> => {
    const byCategory: Record<string, number> = {};

    Object.entries(failuresByType).forEach(([type, count]) => {
      const category = WEBHOOK_TYPE_TO_CATEGORY[type as WebhookType];
      if (category) {
        byCategory[category] = (byCategory[category] || 0) + count;
      }
    });

    return byCategory;
  };

  const handleRetry = async () => {
    if (isRetrying || getTotalFailures() === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onRetry(selectedTypes);
      setRetrySuccess(true);
      setTimeout(() => setRetrySuccess(false), 2000);
    } catch (error) {
      console.error("Retry failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (compact) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: `${colors.primary}10`,
          borderWidth: 1,
          borderColor: colors.primary,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 4,
              }}
            >
              Reenvio Seletivo
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
              }}
            >
              {getTotalFailures()} webhook{getTotalFailures() !== 1 ? "s" : ""} falhado{getTotalFailures() !== 1 ? "s" : ""}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowFilter(!showFilter)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "white",
              }}
            >
              {showFilter ? "Fechar" : "Filtrar"}
            </Text>
          </Pressable>
        </View>

        {showFilter && (
          <View style={{ marginTop: 12 }}>
            <WebhookTypeFilter
              selectedTypes={selectedTypes}
              onSelectionChange={setSelectedTypes}
              layout="horizontal"
              showCategories={true}
            />

            <Pressable
              onPress={handleRetry}
              disabled={isRetrying || getTotalFailures() === 0}
              style={({ pressed }) => ({
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                backgroundColor: getTotalFailures() === 0 ? colors.muted : colors.error,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {isRetrying ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Reenviando...
                  </Text>
                </>
              ) : retrySuccess ? (
                <>
                  <Text style={{ fontSize: 14 }}>✓</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Reenviado!
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 14 }}>🔄</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "white",
                    }}
                  >
                    Reenviar {getTotalFailures()}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // Full panel view
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: `${colors.primary}10`,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: colors.foreground,
            marginBottom: 4,
          }}
        >
          Reenvio Seletivo por Tipo
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
          }}
        >
          Selecione os tipos de webhook que deseja reenviar
        </Text>
      </View>

      {/* Failure counts by category */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          Falhas por Categoria
        </Text>

        <View style={{ gap: 6 }}>
          {Object.entries(getFailuresByCategory()).map(([category, count]) => (
            <View
              key={category}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: `${colors.error}10`,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: colors.foreground,
                }}
              >
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </Text>
              <View
                style={{
                  backgroundColor: colors.error,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Filter */}
      <WebhookTypeFilter
        selectedTypes={selectedTypes}
        onSelectionChange={setSelectedTypes}
        layout="vertical"
        showCategories={true}
      />

      {/* Action button */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleRetry}
          disabled={isRetrying || getTotalFailures() === 0}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: getTotalFailures() === 0 ? colors.muted : colors.error,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {isRetrying ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Reenviando {getTotalFailures()} webhook{getTotalFailures() !== 1 ? "s" : ""}...
              </Text>
            </>
          ) : retrySuccess ? (
            <>
              <Text style={{ fontSize: 16 }}>✓</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Reenviado com sucesso!
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 16 }}>🔄</Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Reenviar {getTotalFailures()} Webhook{getTotalFailures() !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Inline selective retry button
 */
export function WebhookSelectiveRetryButton({
  failuresByType = {},
  onRetry,
  isRetrying = false,
}: Omit<SelectiveRetryPanelProps, "compact">) {
  const colors = useColors();
  const [selectedTypes, setSelectedTypes] = useState<WebhookType[]>([]);

  const getTotalFailures = (): number => {
    if (selectedTypes.length === 0) {
      return Object.values(failuresByType).reduce((a, b) => a + b, 0);
    }
    return selectedTypes.reduce((sum, type) => sum + (failuresByType[type] || 0), 0);
  };

  const handleRetry = async () => {
    if (isRetrying || getTotalFailures() === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onRetry(selectedTypes);
  };

  return (
    <View style={{ gap: 8 }}>
      <WebhookTypeFilter
        selectedTypes={selectedTypes}
        onSelectionChange={setSelectedTypes}
        layout="horizontal"
        showCategories={true}
      />

      <Pressable
        onPress={handleRetry}
        disabled={isRetrying || getTotalFailures() === 0}
        style={({ pressed }) => ({
          marginHorizontal: 16,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: getTotalFailures() === 0 ? colors.muted : colors.error,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        {isRetrying ? (
          <>
            <ActivityIndicator size="small" color="white" />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "white",
              }}
            >
              Reenviando...
            </Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14 }}>🔄</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "white",
              }}
            >
              Reenviar {getTotalFailures()} Selecionado{getTotalFailures() !== 1 ? "s" : ""}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
