/**
 * Webhook Search Component
 * Search webhooks by payment ID, customer ID, or event type
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, Pressable, ActivityIndicator, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

export type SearchType = "payment" | "customer" | "all";

interface WebhookSearchProps {
  /**
   * Callback when search query changes
   */
  onSearch: (query: string, type: SearchType) => void;
  /**
   * Whether search is loading
   */
  isLoading?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Debounce delay in ms
   */
  debounceDelay?: number;
  /**
   * Show search type selector
   */
  showTypeSelector?: boolean;
}

/**
 * Search component for finding webhooks
 */
export function WebhookSearch({
  onSearch,
  isLoading = false,
  placeholder = "Buscar por ID de pagamento ou cliente...",
  debounceDelay = 300,
  showTypeSelector = true,
}: WebhookSearchProps) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.trim()) {
      const timer = setTimeout(() => {
        onSearch(query.trim(), searchType);
      }, debounceDelay);

      setDebounceTimer(timer);
    } else {
      onSearch("", searchType);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query, searchType, debounceDelay, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  const handleTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
  }, []);

  return (
    <View style={{ gap: 8, marginHorizontal: 16, marginVertical: 12 }}>
      {/* Search Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 16, color: colors.muted }}>🔍</Text>

        <TextInput
          style={{
            flex: 1,
            fontSize: 14,
            color: colors.foreground,
            paddingVertical: 4,
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          editable={!isLoading}
        />

        {query && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => ({
              padding: 4,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 16 }}>✕</Text>
          </Pressable>
        )}

        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* Search Type Selector */}
      {showTypeSelector && (
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {(["all", "payment", "customer"] as SearchType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => handleTypeChange(type)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: searchType === type ? colors.primary : `${colors.border}40`,
                borderWidth: 1,
                borderColor: searchType === type ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: searchType === type ? "white" : colors.foreground,
                }}
              >
                {type === "all" ? "Todos" : type === "payment" ? "Pagamento" : "Cliente"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Search Tips */}
      {!query && (
        <Text
          style={{
            fontSize: 11,
            color: colors.muted,
            marginHorizontal: 4,
          }}
        >
          💡 Digite um ID de pagamento (ex: pay_xxx) ou ID de cliente (ex: cust_xxx)
        </Text>
      )}
    </View>
  );
}

/**
 * Compact search bar for header
 */
export function WebhookSearchBar({
  onSearch,
  isLoading = false,
}: Omit<WebhookSearchProps, "showTypeSelector" | "placeholder" | "debounceDelay">) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.trim()) {
      const timer = setTimeout(() => {
        onSearch(query.trim(), "all");
      }, 300);

      setDebounceTimer(timer);
    } else {
      onSearch("", "all");
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query, onSearch]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: `${colors.primary}10`,
        borderWidth: 1,
        borderColor: colors.primary,
        marginHorizontal: 16,
        marginVertical: 8,
      }}
    >
      <Text style={{ fontSize: 14, color: colors.muted }}>🔍</Text>

      <TextInput
        style={{
          flex: 1,
          fontSize: 12,
          color: colors.foreground,
          paddingVertical: 4,
        }}
        placeholder="Buscar ID..."
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        editable={!isLoading}
      />

      {query && (
        <Pressable
          onPress={() => setQuery("")}
          style={({ pressed }) => ({
            padding: 2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 12 }}>✕</Text>
        </Pressable>
      )}

      {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
    </View>
  );
}

/**
 * Parse search query to detect type
 */
export function parseSearchQuery(query: string): {
  type: SearchType;
  value: string;
} {
  const trimmed = query.trim().toLowerCase();

  if (trimmed.startsWith("pay_")) {
    return { type: "payment", value: trimmed };
  }

  if (trimmed.startsWith("cust_")) {
    return { type: "customer", value: trimmed };
  }

  // Try to detect by pattern
  if (/^[a-z0-9]{20,}$/.test(trimmed)) {
    // Long alphanumeric could be payment ID
    return { type: "payment", value: trimmed };
  }

  return { type: "all", value: trimmed };
}

/**
 * Validate search query
 */
export function isValidSearchQuery(query: string): boolean {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return false;
  }

  if (trimmed.length > 100) {
    return false;
  }

  // Allow alphanumeric, hyphens, underscores
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Format search results count
 */
export function formatSearchResultsCount(count: number, type: SearchType): string {
  const typeLabel =
    type === "payment"
      ? "pagamento"
      : type === "customer"
        ? "cliente"
        : "webhook";

  if (count === 0) {
    return `Nenhum ${typeLabel} encontrado`;
  }

  if (count === 1) {
    return `1 ${typeLabel} encontrado`;
  }

  return `${count} ${typeLabel}s encontrados`;
}

/**
 * Highlight search query in text
 */
export function highlightSearchQuery(text: string, query: string): string {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "**$1**");
}
