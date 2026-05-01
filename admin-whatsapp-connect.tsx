/**
 * Admin WhatsApp Connection Screen
 * Tela para conectar WhatsApp via QR Code
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface QRCodeData {
  qrCode: string;
  timestamp: number;
  connected: boolean;
}

export default function AdminWhatsAppConnectScreen() {
  const colors = useColors();

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [status, setStatus] = useState<string>("Desconectado");
  const [refreshing, setRefreshing] = useState(false);

  // Simular conexão
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // TODO: Chamar API para verificar status
      // const result = await api.baileys.getStatus();
      // setConnected(result.status.connected);
      // setStatus(result.status.connected ? "Conectado" : "Desconectado");

      // Simular por enquanto
      setStatus("Desconectado");
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      // TODO: Chamar API para iniciar conexão
      // const result = await api.baileys.connect({
      //   phoneNumber: "+55 21 99823-1962"
      // });

      // Simular geração de QR Code
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simular QR Code (em produção, viria da API)
      setQrCode({
        qrCode:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAABJJSURFR4nO3d",
        timestamp: Date.now(),
        connected: false,
      });

      setStatus("Aguardando escanamento...");
    } catch (error) {
      Alert.alert("Erro", "Falha ao iniciar conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Desconectar",
      "Tem certeza que deseja desconectar do WhatsApp?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desconectar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // TODO: Chamar API para desconectar
              // await api.baileys.disconnect();

              setConnected(false);
              setQrCode(null);
              setStatus("Desconectado");
              Alert.alert("Sucesso", "Desconectado do WhatsApp");
            } catch (error) {
              Alert.alert("Erro", "Falha ao desconectar");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // TODO: Chamar API para atualizar status
      await checkStatus();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              💬 WhatsApp
            </Text>
            <Text className="text-muted">
              Conecte seu WhatsApp para enviar mensagens
            </Text>
          </View>

          {/* Status Card */}
          <View
            className={cn(
              "rounded-lg p-4 border",
              connected
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            )}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">
                {connected ? "✅" : "⏳"}
              </Text>
              <View className="flex-1">
                <Text
                  className={cn(
                    "font-semibold",
                    connected ? "text-green-900" : "text-yellow-900"
                  )}
                >
                  {connected ? "Conectado" : "Desconectado"}
                </Text>
                <Text
                  className={cn(
                    "text-xs",
                    connected ? "text-green-800" : "text-yellow-800"
                  )}
                >
                  {status}
                </Text>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          {qrCode && !connected && (
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-lg font-semibold text-foreground">
                  📱 Escaneie o QR Code
                </Text>
                <Text className="text-sm text-muted">
                  Use seu celular para escanear o código abaixo
                </Text>
              </View>

              <View className="bg-surface rounded-lg p-6 items-center border border-border">
                {qrCode.qrCode ? (
                  <Image
                    source={{ uri: qrCode.qrCode }}
                    style={{ width: 250, height: 250 }}
                  />
                ) : (
                  <View className="w-64 h-64 bg-border rounded-lg items-center justify-center">
                    <ActivityIndicator color={colors.primary} size="large" />
                  </View>
                )}
              </View>

              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 gap-2">
                <Text className="text-sm font-semibold text-blue-900">
                  📸 Como escanear:
                </Text>
                <Text className="text-xs text-blue-800">
                  1. Abra WhatsApp no seu celular{"\n"}
                  2. Vá para Configurações → Aparelhos Conectados{"\n"}
                  3. Clique em "Conectar um aparelho"{"\n"}
                  4. Aponte a câmera para o QR Code
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleRefresh}
                disabled={loading || refreshing}
                className={cn(
                  "bg-surface border border-border rounded-lg py-3 items-center",
                  (loading || refreshing) && "opacity-70"
                )}
              >
                {refreshing ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text className="text-foreground font-semibold">
                    🔄 Atualizar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Connected Section */}
          {connected && (
            <View className="gap-4">
              <View className="bg-green-50 border border-green-200 rounded-lg p-4 gap-3">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">✅</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-green-900">
                      Conectado com Sucesso!
                    </Text>
                    <Text className="text-xs text-green-800">
                      Seu WhatsApp está pronto para usar
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-surface rounded-lg p-4 gap-3 border border-border">
                <Text className="font-semibold text-foreground">
                  📊 Informações da Conexão
                </Text>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Número:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      +55 21 99823-1962
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Status:</Text>
                    <Text className="text-sm font-semibold text-green-600">
                      Ativo
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Auto-respostas:</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      3 configuradas
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3">
            {!connected ? (
              <TouchableOpacity
                onPress={handleConnect}
                disabled={loading}
                className={cn(
                  "bg-primary rounded-lg py-3 items-center",
                  loading && "opacity-70"
                )}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text className="text-background font-bold text-base">
                    🔗 Conectar WhatsApp
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleDisconnect}
                disabled={loading}
                className={cn(
                  "bg-red-500 rounded-lg py-3 items-center",
                  loading && "opacity-70"
                )}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text className="text-background font-bold text-base">
                    🔌 Desconectar
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* FAQ */}
          <View className="gap-3 mt-6 pt-6 border-t border-border">
            <Text className="text-lg font-semibold text-foreground">
              ❓ Perguntas Frequentes
            </Text>

            <View className="gap-3">
              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: Preciso deixar o WhatsApp Web aberto?
                </Text>
                <Text className="text-xs text-muted">
                  R: Não! Uma vez conectado, funciona em background.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: Meu celular precisa estar conectado?
                </Text>
                <Text className="text-xs text-muted">
                  R: Não! Funciona como WhatsApp Web.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: Posso usar meu WhatsApp normal?
                </Text>
                <Text className="text-xs text-muted">
                  R: Sim! É o mesmo número que você usa normalmente.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: E se eu perder a conexão?
                </Text>
                <Text className="text-xs text-muted">
                  R: O sistema tenta reconectar automaticamente.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-6 pt-6 border-t border-border gap-2">
            <Text className="text-xs text-muted text-center">
              Versão 2.0.0 • Baileys WhatsApp Web
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
