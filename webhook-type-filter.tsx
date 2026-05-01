/**
 * Webhook Type Filter Component
 * Filter failed webhooks by type for selective retry
 */

import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

/**
 * Webhook event types that can be filtered
 */
export const WEBHOOK_TYPES = {
  PAYMENT_CREATED: "payment.created",
  PAYMENT_UPDATED: "payment.updated",
  PAYMENT_CONFIRMED: "payment.confirmed",
  PAYMENT_RECEIVED: "payment.received",
  PAYMENT_OVERDUE: "payment.overdue",
  PAYMENT_DELETED: "payment.deleted",
  PAYMENT_RESTORED: "payment.restored",
  PAYMENT_REFUNDED: "payment.refunded",
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_FAILED: "notification.failed",
  STATUS_UPDATE: "status.update",
  ERROR_OCCURRED: "error.occurred",
} as const;

export type WebhookType = (typeof WEBHOOK_TYPES)[keyof typeof WEBHOOK_TYPES];

/**
 * Webhook type labels for display
 */
export const WEBHOOK_TYPE_LABELS: Record<WebhookType, string> = {
  "payment.created": "Pagamento Criado",
  "payment.updated": "Pagamento Atualizado",
  "payment.confirmed": "Pagamento Confirmado",
  "payment.received": "Pagamento Recebido",
  "payment.overdue": "Pagamento Vencido",
  "payment.deleted": "Pagamento Deletado",
  "payment.restored": "Pagamento Restaurado",
  "payment.refunded": "Pagamento Reembolsado",
  "notification.sent": "Notificação Enviada",
  "notification.failed": "Notificação Falhou",
  "status.update": "Atualização de Status",
  "error.occurred": "Erro Ocorreu",
};

/**
 * Webhook type categories for grouping
 */
export const WEBHOOK_CATEGORIES = {
  PAYMENTS: "payments",
  NOTIFICATIONS: "notifications",
  STATUS: "status",
  ERRORS: "errors",
} as const;

export type WebhookCategory = (typeof WEBHOOK_CATEGORIES)[keyof typeof WEBHOOK_CATEGORIES];

/**
 * Map webhook types to categories
 */
export const WEBHOOK_TYPE_TO_CATEGORY: Record<WebhookType, WebhookCategory> = {
  "payment.created": "payments",
  "payment.updated": "payments",
  "payment.confirmed": "payments",
  "payment.received": "payments",
  "payment.overdue": "payments",
  "payment.deleted": "payments",
  "payment.restored": "payments",
  "payment.refunded": "payments",
  "notification.sent": "notifications",
  "notification.failed": "notifications",
  "status.update": "status",
  "error.occurred": "errors",
};

/**
 * Category labels for display
 */
export const CATEGORY_LABELS: Record<WebhookCategory, string> = {
  payments: "💰 Pagamentos",
  notifications: "🔔 Notificações",
  status: "📊 Status",
  errors: "⚠️ Erros",
};

interface WebhookTypeFilterProps {
  /**
   * Selected webhook types
   */
  selectedTypes: WebhookType[];
  /**
   * Callback when selection changes
   */
  onSelectionChange: (types: WebhookType[]) => void;
  /**
   * Show as horizontal scroll (compact) or vertical (full)
   */
  layout?: "horizontal" | "vertical";
  /**
   * Show category tabs instead of individual types
   */
  showCategories?: boolean;
}

/**
 * Filter component for selecting webhook types
 */
export function WebhookTypeFilter({
  selectedTypes,
  onSelectionChange,
  layout = "horizontal",
  showCategories = false,
}: WebhookTypeFilterProps) {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<WebhookCategory | null>(null);

  const handleTypeToggle = (type: WebhookType) => {
    if (selectedTypes.includes(type)) {
      onSelectionChange(selectedTypes.filter((t) => t !== type));
    } else {
      onSelectionChange([...selectedTypes, type]);
    }
  };

  const handleCategoryToggle = (category: WebhookCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      onSelectionChange([]);
    } else {
      setSelectedCategory(category);
      const typesInCategory = (Object.entries(WEBHOOK_TYPE_TO_CATEGORY) as [WebhookType, WebhookCategory][])
        .filter(([_, cat]) => cat === category)
        .map(([type]) => type);
      onSelectionChange(typesInCategory);
    }
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === Object.keys(WEBHOOK_TYPES).length) {
      onSelectionChange([]);
      setSelectedCategory(null);
    } else {
      onSelectionChange(Object.values(WEBHOOK_TYPES) as WebhookType[]);
      setSelectedCategory(null);
    }
  };

  if (showCategories) {
    return (
      <View
        style={{
          marginHorizontal: 16,
          marginVertical: 12,
          gap: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            Filtrar por Categoria
          </Text>
          <Pressable
            onPress={handleSelectAll}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              backgroundColor: `${colors.primary}20`,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.primary,
              }}
            >
              {selectedTypes.length === Object.keys(WEBHOOK_TYPES).length ? "Limpar" : "Todos"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal={layout === "horizontal"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingRight: layout === "horizontal" ? 16 : 0,
          }}
        >
          {(Object.entries(CATEGORY_LABELS) as [WebhookCategory, string][]).map(
            ([category, label]) => {
              const typesInCategory = (
                Object.entries(WEBHOOK_TYPE_TO_CATEGORY) as [WebhookType, WebhookCategory][]
              )
                .filter(([_, cat]) => cat === category)
                .map(([type]) => type);

              const isSelected = typesInCategory.every((type) => selectedTypes.includes(type));
              const isPartiallySelected =
                typesInCategory.some((type) => selectedTypes.includes(type)) && !isSelected;

              return (
                <Pressable
                  key={category}
                  onPress={() => handleCategoryToggle(category)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: isSelected
                      ? colors.primary
                      : isPartiallySelected
                        ? `${colors.primary}40`
                        : `${colors.border}40`,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    minWidth: layout === "horizontal" ? 120 : "auto",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isSelected ? "white" : colors.foreground,
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>
      </View>
    );
  }

  // Individual type selection
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          Filtrar por Tipo
        </Text>
        <Pressable
          onPress={handleSelectAll}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: `${colors.primary}20`,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: colors.primary,
            }}
          >
            {selectedTypes.length === Object.keys(WEBHOOK_TYPES).length ? "Limpar" : "Todos"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal={layout === "horizontal"}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingRight: layout === "horizontal" ? 16 : 0,
        }}
      >
        {(Object.entries(WEBHOOK_TYPE_LABELS) as [WebhookType, string][]).map(
          ([type, label]) => {
            const isSelected = selectedTypes.includes(type);

            return (
              <Pressable
                key={type}
                onPress={() => handleTypeToggle(type)}
                style={({ pressed }) => ({
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected ? colors.primary : `${colors.border}40`,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  minWidth: layout === "horizontal" ? 140 : "auto",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isSelected ? "white" : colors.foreground,
                    textAlign: "center",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Compact filter button for quick category selection
 */
export function WebhookTypeFilterButton({
  selectedTypes,
  onPress,
  count,
}: {
  selectedTypes: WebhookType[];
  onPress: () => void;
  count?: number;
}) {
  const colors = useColors();

  const getCategoryLabel = (): string => {
    if (selectedTypes.length === 0) return "Todos os tipos";
    if (selectedTypes.length === 1) {
      const type = selectedTypes[0];
      return WEBHOOK_TYPE_LABELS[type];
    }
    return `${selectedTypes.length} tipos selecionados`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: `${colors.primary}20`,
        borderWidth: 1,
        borderColor: colors.primary,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: colors.primary,
          flex: 1,
        }}
      >
        🔍 {getCategoryLabel()}
      </Text>
      {count !== undefined && (
        <View
          style={{
            backgroundColor: colors.primary,
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
      )}
    </Pressable>
  );
}

/**
 * Get webhook type from event string
 */
export function getWebhookTypeFromEvent(event: string): WebhookType | null {
  return (Object.values(WEBHOOK_TYPES) as WebhookType[]).find((type) => type === event) || null;
}

/**
 * Check if event matches selected types
 */
export function matchesSelectedTypes(event: string, selectedTypes: WebhookType[]): boolean {
  if (selectedTypes.length === 0) return true;
  const type = getWebhookTypeFromEvent(event);
  return type ? selectedTypes.includes(type) : false;
}
