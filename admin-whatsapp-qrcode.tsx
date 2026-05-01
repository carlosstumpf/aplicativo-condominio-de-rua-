/**
 * WhatsApp Connection Screen - Real QR Code via Baileys
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl } from "@/constants/oauth";

// API base URL - works on both web and mobile (Expo Go)
const getApiBase = () => getApiBaseUrl();

type ConnectionStatus = "disconnected" | "connecting" | "qr_waiting" | "connected";

interface WAStatus {
  status: ConnectionStatus;
  connected: boolean;
  phone: string | null;
  hasQR: boolean;
}

export default function AdminWhatsAppQRCodeScreen() {
  const colors = useColors();
  const [waStatus, setWaStatus] = useState<WAStatus>({
    status: "disconnected",
    connected: false,
    phone: null,
    hasQR: false,
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = getApiBase();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/whatsapp/status`);
      if (!res.ok) return;
      const data: WAStatus = await res.json();
      setWaStatus(data);

      if (data.hasQR && data.status === "qr_waiting") {
        // Fetch QR Code
        const qrRes = await fetch(`${apiBase}/api/whatsapp/qrcode`);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          if (qrData.qrCode) setQrCode(qrData.qrCode);
        }
      } else if (data.status === "connected") {
        setQrCode(null);
      }
    } catch (_err) {
      // Server might not be ready
    }
  }, [apiBase]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setQrCode(null);

    try {
      const res = await fetch(`${apiBase}/api/whatsapp/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao conectar");
        return;
      }

      if (data.qrCode) {
        setQrCode(data.qrCode);
        setWaStatus((prev) => ({ ...prev, status: "qr_waiting", hasQR: true }));
      } else if (data.status === "connected") {
        setWaStatus((prev) => ({ ...prev, status: "connected", connected: true }));
        Alert.alert("✅ Conectado!", "WhatsApp conectado com sucesso!");
      } else {
        // Still connecting, poll will update
        setWaStatus((prev) => ({ ...prev, status: "connecting" }));
      }
    } catch (_err) {
      setError(
        "Não foi possível conectar ao servidor. Verifique se o servidor está rodando."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Desconectar WhatsApp",
      "Tem certeza? A sessão será encerrada e o QR Code precisará ser escaneado novamente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desconectar",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${apiBase}/api/whatsapp/disconnect`, { method: "POST" });
              setQrCode(null);
              setWaStatus({ status: "disconnected", connected: false, phone: null, hasQR: false });
            } catch (_err) {
              Alert.alert("Erro", "Falha ao desconectar");
            }
          },
        },
      ]
    );
  };

  const handleSendTest = async () => {
    const phone = testPhone.replace(/\D/g, "");
    if (!phone) {
      Alert.alert("Erro", "Digite o número de telefone com DDD");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch(`${apiBase}/api/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: testMessage.trim() || "🏠 Teste de conexão - Gestão de Condomínio",
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("✅ Enviado!", `Mensagem enviada para ${testPhone}`);
        setTestMessage("");
        setTestPhone("");
      } else {
        Alert.alert("Erro", data.error || "Falha ao enviar");
      }
    } catch (_err) {
      Alert.alert("Erro", "Falha ao enviar mensagem");
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusColor = () => {
    switch (waStatus.status) {
      case "connected": return colors.success;
      case "qr_waiting": return colors.warning;
      case "connecting": return colors.warning;
      default: return colors.muted;
    }
  };

  const getStatusLabel = () => {
    switch (waStatus.status) {
      case "connected": return "✅ Conectado";
      case "qr_waiting": return "📱 Aguardando Escaneamento";
      case "connecting": return "🔄 Conectando...";
      default: return "⭕ Desconectado";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            📱 WhatsApp
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            Conecte seu WhatsApp para enviar mensagens automáticas
          </Text>
        </View>

        {/* Status Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              Status da Conexão
            </Text>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: getStatusColor(),
              }}
            />
          </View>
          <Text
            style={{ fontSize: 18, fontWeight: "bold", color: getStatusColor(), marginTop: 8 }}
          >
            {getStatusLabel()}
          </Text>
          {waStatus.phone && (
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              Número: +{waStatus.phone}
            </Text>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.error,
            }}
          >
            <Text style={{ color: colors.error, fontSize: 14 }}>⚠️ {error}</Text>
          </View>
        )}

        {/* QR Code Section - show when not connected */}
        {!waStatus.connected && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}
            >
              Escaneie o QR Code
            </Text>

            {qrCode ? (
              <>
                {/* White background for QR Code visibility */}
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    marginBottom: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                >
                  <Image
                    source={{ uri: qrCode }}
                    style={{ width: 260, height: 260 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 6 }}>
                  1. Abra o WhatsApp no celular
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 6 }}>
                  2. Toque em ⋮ → Aparelhos conectados
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 12 }}>
                  3. Toque em "Conectar aparelho" e escaneie
                </Text>
                <Text style={{ fontSize: 12, color: colors.warning, textAlign: "center", marginBottom: 16 }}>
                  ⏱️ O QR Code expira em ~60 segundos
                </Text>
              </>
            ) : (
              <View
                style={{
                  width: 260,
                  height: 260,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                  marginBottom: 16,
                }}
              >
                {waStatus.status === "connecting" ? (
                  <>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center" }}>
                      Gerando QR Code...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 48, marginBottom: 8 }}>📱</Text>
                    <Text style={{ color: colors.muted, textAlign: "center", paddingHorizontal: 20 }}>
                      Clique em "Iniciar Conexão" para gerar o QR Code
                    </Text>
                  </>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={handleConnect}
              disabled={loading || waStatus.status === "connecting"}
              style={{
                width: "100%",
                backgroundColor:
                  loading || waStatus.status === "connecting" ? colors.muted : colors.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 16 }}>
                  {qrCode ? "🔄 Atualizar QR Code" : "🔌 Iniciar Conexão"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Connected Section */}
        {waStatus.connected && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              ✅ WhatsApp Conectado!
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 16 }}>
              Seu WhatsApp está pronto para enviar mensagens automáticas aos moradores.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              Enviar Mensagem de Teste
            </Text>

            <TextInput
              value={testPhone}
              onChangeText={setTestPhone}
              placeholder="Número com DDI+DDD (ex: 5521999999999)"
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                backgroundColor: colors.background,
                marginBottom: 8,
                fontSize: 14,
              }}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              value={testMessage}
              onChangeText={setTestMessage}
              placeholder="Mensagem (opcional)"
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                color: colors.foreground,
                backgroundColor: colors.background,
                marginBottom: 12,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholderTextColor={colors.muted}
            />

            <TouchableOpacity
              onPress={handleSendTest}
              disabled={sendingTest}
              style={{
                backgroundColor: sendingTest ? colors.muted : colors.success,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              {sendingTest ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>📤 Enviar Teste</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDisconnect}
              style={{
                borderWidth: 1,
                borderColor: colors.error,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.error, fontWeight: "600" }}>🔌 Desconectar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            ℹ️ Como funciona
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 22 }}>
            • O sistema usa WhatsApp Web para enviar mensagens{"\n"}
            • Após escanear, o número +55 21 99823-1962 ficará conectado{"\n"}
            • Moradores enviam mensagens e recebem respostas automáticas{"\n"}
            • Menu: 1 = PIX, 2 = Boleto, 3 = Prestação de Contas, 4 = Admin{"\n"}
            • A sessão persiste mesmo após reiniciar o servidor
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
