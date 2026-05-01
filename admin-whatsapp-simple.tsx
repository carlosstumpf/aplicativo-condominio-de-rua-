/**
 * Admin WhatsApp Configuration Screen (Simplified)
 * Configure WhatsApp usando apenas número de celular
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export default function AdminWhatsAppSimpleScreen() {
  const colors = useColors();

  const [phoneNumber, setPhoneNumber] = useState("+55 11 99999-9999");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Formatar número de telefone
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 2) return `+${cleaned}`;
    if (cleaned.length <= 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 8)}-${cleaned.slice(8)}`;
    }
    return phoneNumber;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Erro", "Por favor, insira um número de telefone válido");
      return;
    }

    setLoading(true);
    try {
      // TODO: Chamar API para salvar configuração
      // await api.whatsapp.saveConfig({ phoneNumber });

      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaved(true);
      Alert.alert("Sucesso", "Configuração salva com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar configuração");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Erro", "Por favor, insira um número de telefone válido");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // TODO: Chamar API para testar conexão
      // const result = await api.whatsapp.testConnection({ phoneNumber });

      // Simular teste
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setTestResult({
        success: true,
        message: "✅ Conexão com WhatsApp testada com sucesso!",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "❌ Erro ao testar conexão. Verifique o número.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              💬 WhatsApp
            </Text>
            <Text className="text-muted">
              Configure seu número de WhatsApp para enviar mensagens
            </Text>
          </View>

          {/* Info Box */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 gap-2">
            <Text className="text-sm font-semibold text-blue-900">
              ℹ️ Como funciona
            </Text>
            <Text className="text-sm text-blue-800">
              Você só precisa fornecer seu número de WhatsApp. O sistema usará
              este número para enviar mensagens e flows aos moradores.
            </Text>
          </View>

          {/* Phone Number Input */}
          <View className="gap-3">
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Número de WhatsApp
              </Text>
              <Text className="text-xs text-muted">
                Formato: +55 11 99999-9999
              </Text>
            </View>

            <TextInput
              placeholder="+55 11 99999-9999"
              placeholderTextColor={colors.muted}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              editable={!loading && !testing}
              className={cn(
                "bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base",
                (loading || testing) && "opacity-50"
              )}
            />

            <Text className="text-xs text-muted">
              Este é o número que receberá as notificações de teste e será usado
              como remetente.
            </Text>
          </View>

          {/* Saved Indicator */}
          {saved && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4">
              <Text className="text-sm font-semibold text-green-900">
                ✅ Configuração salva com sucesso!
              </Text>
            </View>
          )}

          {/* Test Result */}
          {testResult && (
            <View
              className={cn(
                "border rounded-lg p-4",
                testResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <Text
                className={cn(
                  "text-sm font-semibold",
                  testResult.success ? "text-green-900" : "text-red-900"
                )}
              >
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View className="gap-3">
            {/* Test Connection Button */}
            <TouchableOpacity
              onPress={handleTestConnection}
              disabled={loading || testing}
              className={cn(
                "bg-blue-500 rounded-lg py-3 items-center",
                (loading || testing) && "opacity-70"
              )}
            >
              {testing ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text className="text-background font-bold text-base">
                  🧪 Testar Conexão
                </Text>
              )}
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || testing}
              className={cn(
                "bg-primary rounded-lg py-3 items-center",
                (loading || testing) && "opacity-70"
              )}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text className="text-background font-bold text-base">
                  💾 Salvar Configuração
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Usage Examples */}
          <View className="gap-3 mt-6 pt-6 border-t border-border">
            <Text className="text-lg font-semibold text-foreground">
              📚 Exemplos de Uso
            </Text>

            {/* Example 1 */}
            <View className="bg-surface rounded-lg p-4 gap-2">
              <Text className="font-semibold text-foreground">
                1️⃣ Enviar Mensagem de Pagamento
              </Text>
              <Text className="text-sm text-muted">
                Quando um morador solicita reenvio do link de pagamento, o
                sistema envia automaticamente via WhatsApp.
              </Text>
            </View>

            {/* Example 2 */}
            <View className="bg-surface rounded-lg p-4 gap-2">
              <Text className="font-semibold text-foreground">
                2️⃣ Enviar Flow Interativo
              </Text>
              <Text className="text-sm text-muted">
                Moradores recebem um menu para escolher entre PIX ou Boleto,
                tudo dentro do WhatsApp.
              </Text>
            </View>

            {/* Example 3 */}
            <View className="bg-surface rounded-lg p-4 gap-2">
              <Text className="font-semibold text-foreground">
                3️⃣ Enviar Comunicados
              </Text>
              <Text className="text-sm text-muted">
                Avisos, notificações e comunicados importantes são entregues
                direto no WhatsApp dos moradores.
              </Text>
            </View>
          </View>

          {/* FAQ */}
          <View className="gap-3 mt-6 pt-6 border-t border-border">
            <Text className="text-lg font-semibold text-foreground">
              ❓ Perguntas Frequentes
            </Text>

            <View className="gap-3">
              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: Preciso de uma conta especial no WhatsApp?
                </Text>
                <Text className="text-xs text-muted">
                  R: Não! Você usa seu WhatsApp normal. Basta fornecer o número.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: Meu número será visível aos moradores?
                </Text>
                <Text className="text-xs text-muted">
                  R: Sim, eles verão mensagens vindas deste número.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: Posso mudar o número depois?
                </Text>
                <Text className="text-xs text-muted">
                  R: Sim, você pode atualizar a qualquer momento nesta tela.
                </Text>
              </View>

              <View className="gap-1">
                <Text className="font-semibold text-foreground text-sm">
                  P: E se eu não receber a mensagem de teste?
                </Text>
                <Text className="text-xs text-muted">
                  R: Verifique se o número está correto e se o WhatsApp está
                  ativo.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-6 pt-6 border-t border-border gap-2">
            <Text className="text-xs text-muted text-center">
              Versão 1.0.0 • Última atualização: 28/04/2026
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
