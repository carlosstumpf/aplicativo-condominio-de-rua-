/**
 * Webhook Search Results Component
 * Display search results with details and actions
 */

import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatSearchResultsCount } from "./webhook-search";

interface WebhookResult {
  id: number;
  event: string;
  asaasPaymentId: string;
  asaasCustomerId?: string;
  status: string;
  success: number;
  errorMessage?: string;
  receivedAt: Date;
  processedAt: Date;
}

interface WebhookSearchResultsProps {
  /**
   * Search results
   */
  results: WebhookResult[];
  /**
   * Whether results are loading
   */
  isLoading?: boolean;
  /**
   * Search query
   */
  query?: string;
  /**
   * Callback when result is selected
   */
  onResultSelect?: (result: WebhookResult) => void;
  /**
   * Callback to retry webhook
   */
  onRetry?: (id: number) => Promise<void>;
  /**
   * Show empty state
   */
  showEmpty?: boolean;
}

/**
 * Display webhook search results
 */
export function WebhookSearchResults({
  results,
  isLoading = false,
  query = "",
  onResultSelect,
  onRetry,
  showEmpty = true,
}: WebhookSearchResultsProps) {
  const colors = useColors();

  if (isLoading) {
    return (
      <View
        style={{
          paddingVertical: 32,
          alignItems: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            fontSize: 14,
            color: colors.muted,
          }}
        >
          Buscando webhooks...
        </Text>
      </View>
    );
  }

  if (results.length === 0 && showEmpty) {
    return (
      <View
        style={{
          paddingVertical: 32,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 24 }}>🔍</Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          {query ? "Nenhum resultado encontrado" : "Digite para buscar"}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.muted,
            textAlign: "center",
            marginHorizontal: 16,
          }}
        >
          {query
            ? `Nenhum webhook encontrado para "${query}"`
            : "Busque por ID de pagamento ou cliente"}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {/* Results count */}
      {query && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.muted,
            marginHorizontal: 16,
            marginVertical: 8,
          }}
        >
          {formatSearchResultsCount(results.length, "all")}
        </Text>
      )}

      {/* Results list */}
      <FlatList
        scrollEnabled={false}
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <WebhookSearchResultItem
            result={item}
            onSelect={onResultSelect}
            onRetry={onRetry}
            colors={colors}
          />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginHorizontal: 16,
            }}
          />
        )}
      />
    </View>
  );
}

/**
 * Individual search result item
 */
function WebhookSearchResultItem({
  result,
  onSelect,
  onRetry,
  colors,
}: {
  result: WebhookResult;
  onSelect?: (result: WebhookResult) => void;
  onRetry?: (id: number) => Promise<void>;
  colors: ReturnType<typeof useColors>;
}) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry(result.id);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = () => {
    if (result.success === 1) return colors.success;
    if (result.status === "pending") return colors.warning;
    return colors.error;
  };

  const getStatusLabel = () => {
    if (result.success === 1) return "✓ Sucesso";
    if (result.status === "pending") return "⏳ Pendente";
    if (result.status === "failed") return "✗ Falhou";
    return result.status;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Pressable
      onPress={() => onSelect?.(result)}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: pressed ? `${colors.primary}10` : "transparent",
      })}
    >
      <View style={{ gap: 8 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              {result.event}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
              }}
            >
              ID: {result.id}
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              backgroundColor: `${getStatusColor()}20`,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: getStatusColor(),
              }}
            >
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View
          style={{
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 4,
            backgroundColor: `${colors.surface}80`,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>Pagamento:</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.foreground,
              }}
            >
              {result.asaasPaymentId}
            </Text>
          </View>

          {result.asaasCustomerId && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Cliente:</Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: colors.foreground,
                }}
              >
                {result.asaasCustomerId}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 11, color: colors.muted }}>Recebido:</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: colors.foreground,
              }}
            >
              {formatDate(result.receivedAt)}
            </Text>
          </View>

          {result.errorMessage && (
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>Erro:</Text>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.error,
                  fontStyle: "italic",
                }}
                numberOfLines={2}
              >
                {result.errorMessage}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {result.status === "failed" && onRetry && (
          <Pressable
            onPress={handleRetry}
            disabled={isRetrying}
            style={({ pressed }) => ({
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 4,
              backgroundColor: colors.error,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                🔄 Reenviar
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Empty search state
 */
export function WebhookSearchEmpty({ query }: { query?: string }) {
  const colors = useColors();

  return (
    <View
      style={{
        paddingVertical: 32,
        alignItems: "center",
        gap: 12,
        marginHorizontal: 16,
      }}
    >
      <Text style={{ fontSize: 48 }}>🔍</Text>
      <View style={{ gap: 4, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: colors.foreground,
          }}
        >
          {query ? "Nenhum resultado" : "Comece a buscar"}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          {query
            ? `Nenhum webhook encontrado para "${query}"`
            : "Digite um ID de pagamento ou cliente para buscar"}
        </Text>
      </View>

      {!query && (
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: `${colors.primary}10`,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: colors.primary,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            💡 Exemplos: pay_xxx, cust_xxx, ou qualquer ID parcial
          </Text>
        </View>
      )}
    </View>
  );
}
