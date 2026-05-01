/**
 * Webhook Access Guard Component
 * Protects webhook admin screens from unauthorized access
 */

import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface WebhookAccessGuardProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that ensures only admin users can access webhook screens
 * Shows error message if user is not admin
 */
export function WebhookAccessGuard({ children }: WebhookAccessGuardProps) {
  const { user, loading } = useAuth();
  const colors = useColors();

  // Show loading state
  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-muted">Carregando...</Text>
      </ScreenContainer>
    );
  }

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-error">Acesso Negado</Text>
          <Text className="text-center text-muted">
            Apenas administradores podem acessar o painel de webhooks.
          </Text>
          <Text className="text-xs text-muted mt-4">
            Entre em contato com um administrador se você precisar de acesso.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // User is admin, render children
  return <>{children}</>;
}
