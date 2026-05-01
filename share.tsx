import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Share, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

const APP_URL = "https://8081-icoaf8540ivqbwcmazgl6-e16ef6a2.us2.manus.computer";

export default function ShareScreen() {
  const colors = useColors();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code URL using a QR code API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(APP_URL)}`;
    setQrCodeUrl(qrUrl);
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Acesse o sistema de gestão de condomínio: ${APP_URL}`,
        title: "Gestão de Condomínio de Rua",
        url: APP_URL,
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Copy to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(APP_URL);
        alert("✅ Link copiado!");
      }
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const handleOpenLink = () => {
    Linking.openURL(APP_URL);
  };

  const handleWhatsApp = () => {
    const text = `Acesse o sistema de gestão de condomínio: ${APP_URL}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(whatsappUrl);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center p-6 gap-6">
          {/* Logo */}
          <View className="w-20 h-20 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <Text className="text-4xl">🏘️</Text>
          </View>

          {/* Title */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Gestão de Condomínio
            </Text>
            <Text className="text-base text-muted text-center">
              Sistema de Rua - Compartilhe com os moradores
            </Text>
          </View>

          {/* QR Code */}
          {qrCodeUrl && (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center gap-3">
              <Text className="text-sm text-muted">
                Escaneie com seu celular para acessar
              </Text>
              <Image
                source={{ uri: qrCodeUrl }}
                style={{ width: 200, height: 200 }}
              />
              <Text className="text-xs text-muted">
                Abra no navegador ou Expo Go
              </Text>
            </View>
          )}

          {/* URL Box */}
          <View className="w-full bg-blue-50 rounded-xl p-4 border border-blue-200 items-center gap-3">
            <Text className="text-xs text-blue-900 font-semibold">
              Ou acesse diretamente:
            </Text>
            <Text
              className="text-sm text-blue-900 font-mono text-center break-all"
              selectable
            >
              {APP_URL}
            </Text>
            <Pressable
              onPress={handleCopyLink}
              className="bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold text-sm">
                📋 Copiar Link
              </Text>
            </Pressable>
          </View>

          {/* Share Buttons */}
          <View className="w-full gap-3">
            <Pressable
              onPress={handleOpenLink}
              className="w-full bg-primary p-4 rounded-lg items-center"
            >
              <Text className="text-background font-semibold">
                🌐 Abrir no Navegador
              </Text>
            </Pressable>

            <Pressable
              onPress={handleWhatsApp}
              className="w-full bg-green-600 p-4 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">
                💬 Compartilhar no WhatsApp
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              className="w-full bg-surface border border-border p-4 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">
                📤 Compartilhar
              </Text>
            </Pressable>
          </View>

          {/* Features */}
          <View className="w-full gap-3">
            <Text className="text-lg font-bold text-foreground">
              Funcionalidades Disponíveis
            </Text>
            <View className="bg-surface rounded-lg p-4 gap-2 border border-border">
              <Text className="text-sm text-foreground">
                ✓ Gestão de cobranças (PIX e Boleto)
              </Text>
              <Text className="text-sm text-foreground">
                ✓ Histórico de pagamentos
              </Text>
              <Text className="text-sm text-foreground">
                ✓ Relatórios financeiros
              </Text>
              <Text className="text-sm text-foreground">
                ✓ Integração com WhatsApp
              </Text>
              <Text className="text-sm text-foreground">
                ✓ Prestação de contas
              </Text>
              <Text className="text-sm text-foreground">
                ✓ Gerenciamento de chamados
              </Text>
              <Text className="text-sm text-foreground">
                ✓ Controle de despesas
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View className="w-full bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <Text className="text-sm text-yellow-900 font-semibold mb-2">
              ℹ️ Informação
            </Text>
            <Text className="text-xs text-yellow-800">
              Este é um ambiente de desenvolvimento. Para produção, será necessário fazer deploy em um servidor próprio.
            </Text>
          </View>

          {/* Footer */}
          <View className="items-center gap-1 mt-4">
            <Text className="text-xs text-muted">
              Desenvolvido com ❤️ para gestão de condomínios de rua
            </Text>
            <Text className="text-xs text-muted">
              © 2026 - Todos os direitos reservados
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
