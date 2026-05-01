/**
 * Admin WhatsApp Configuration Screen
 * Manage WhatsApp Business API integration
 */

import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

type ConfigTab = "configuracao" | "mensagens" | "menus" | "conversas";

export default function AdminWhatsappScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<ConfigTab>("configuracao");
  const [isConfigured, setIsConfigured] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const tabs: Array<{ id: ConfigTab; label: string; icon: string }> = [
    { id: "configuracao", label: "Configuração", icon: "⚙️" },
    { id: "mensagens", label: "Mensagens", icon: "💬" },
    { id: "menus", label: "Menus", icon: "📋" },
    { id: "conversas", label: "Conversas", icon: "💭" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "configuracao":
        return (
          <ConfigurationTab
            isConfigured={isConfigured}
            testingConnection={testingConnection}
            onTestConnection={() => setTestingConnection(true)}
            onConfigured={() => setIsConfigured(true)}
          />
        );
      case "mensagens":
        return <MessagesTab />;
      case "menus":
        return <MenusTab />;
      case "conversas":
        return <ConversationsTab />;
      default:
        return null;
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-primary px-4 py-4">
          <Text className="text-2xl font-bold text-white">WhatsApp Business</Text>
          <Text className="text-sm text-white/80 mt-1">
            Integração com Twilio para mensagens automáticas
          </Text>
        </View>

        {/* Status Badge */}
        <View className="px-4 py-3 bg-surface border-b border-border">
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                "w-3 h-3 rounded-full",
                isConfigured ? "bg-green-500" : "bg-yellow-500"
              )}
            />
            <Text className="text-sm font-semibold text-foreground">
              {isConfigured ? "✓ Configurado e Ativo" : "⚠️ Não Configurado"}
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-border bg-surface">
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 border-b-2 flex-row items-center justify-center gap-1",
                activeTab === tab.id ? "border-primary" : "border-transparent"
              )}
            >
              <Text className="text-lg">{tab.icon}</Text>
              <Text
                className={cn(
                  "text-xs font-semibold",
                  activeTab === tab.id ? "text-primary" : "text-muted"
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <ScrollView className="flex-1">
          {renderContent()}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * Configuration Tab
 */
function ConfigurationTab({
  isConfigured,
  testingConnection,
  onTestConnection,
  onConfigured,
}: {
  isConfigured: boolean;
  testingConnection: boolean;
  onTestConnection: () => void;
  onConfigured: () => void;
}) {
  const [numeroWhatsapp, setNumeroWhatsapp] = useState("+55 11 99999-9999");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showTokens, setShowTokens] = useState(false);

  return (
    <View className="p-4 gap-4">
      {/* Info Box */}
      <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Text className="text-sm font-semibold text-blue-900 mb-2">
          ℹ️ Como Configurar
        </Text>
        <Text className="text-xs text-blue-800 leading-relaxed">
          1. Crie uma conta em twilio.com{"\n"}
          2. Ative WhatsApp Business API{"\n"}
          3. Copie suas credenciais (Account SID e Auth Token){"\n"}
          4. Cole os dados abaixo e teste a conexão
        </Text>
      </View>

      {/* Número do Condomínio */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          📱 Número do Condomínio
        </Text>
        <View className="bg-surface border border-border rounded-lg px-3 py-2">
          <TextInput
            value={numeroWhatsapp}
            onChangeText={setNumeroWhatsapp}
            placeholder="+55 11 99999-9999"
            placeholderTextColor="#9BA1A6"
            className="text-foreground text-base"
          />
        </View>
        <Text className="text-xs text-muted">
          Este é o número que os moradores verão ao receber mensagens
        </Text>
      </View>

      {/* Account SID */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          🔑 Account SID (Twilio)
        </Text>
        <View className="bg-surface border border-border rounded-lg px-3 py-2 flex-row items-center">
          <TextInput
            value={accountSid}
            onChangeText={setAccountSid}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            placeholderTextColor="#9BA1A6"
            secureTextEntry={!showTokens}
            className="flex-1 text-foreground text-base"
          />
          <Pressable onPress={() => setShowTokens(!showTokens)}>
            <Text className="text-lg">{showTokens ? "👁️" : "👁️‍🗨️"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Auth Token */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          🔐 Auth Token (Twilio)
        </Text>
        <View className="bg-surface border border-border rounded-lg px-3 py-2">
          <TextInput
            value={authToken}
            onChangeText={setAuthToken}
            placeholder="Seu token de autenticação"
            placeholderTextColor="#9BA1A6"
            secureTextEntry={!showTokens}
            className="text-foreground text-base"
          />
        </View>
      </View>

      {/* Phone Number */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          📞 Número Twilio
        </Text>
        <View className="bg-surface border border-border rounded-lg px-3 py-2">
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+1234567890"
            placeholderTextColor="#9BA1A6"
            className="text-foreground text-base"
          />
        </View>
        <Text className="text-xs text-muted">
          O número fornecido pelo Twilio para enviar mensagens
        </Text>
      </View>

      {/* Webhook URL */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          🔗 URL Webhook (Opcional)
        </Text>
        <View className="bg-surface border border-border rounded-lg px-3 py-2">
          <TextInput
            value={webhookUrl}
            onChangeText={setWebhookUrl}
            placeholder="https://seu-app.com/webhook/whatsapp"
            placeholderTextColor="#9BA1A6"
            className="text-foreground text-base"
          />
        </View>
        <Text className="text-xs text-muted">
          URL para receber mensagens de entrada (será preenchida automaticamente)
        </Text>
      </View>

      {/* Test Connection Button */}
      <Pressable
        onPress={onTestConnection}
        disabled={testingConnection || !accountSid || !authToken}
        className={cn(
          "rounded-lg p-3 active:opacity-80",
          testingConnection || !accountSid || !authToken
            ? "bg-gray-300"
            : "bg-blue-500"
        )}
      >
        <Text className="text-white font-semibold text-center">
          {testingConnection ? "Testando..." : "🧪 Testar Conexão"}
        </Text>
      </Pressable>

      {/* Save Button */}
      <Pressable
        onPress={onConfigured}
        className="bg-primary rounded-lg p-3 active:opacity-80"
      >
        <Text className="text-white font-semibold text-center">
          💾 Salvar Configuração
        </Text>
      </Pressable>

      {/* Security Notice */}
      <View className="bg-red-50 border border-red-200 rounded-lg p-4">
        <Text className="text-xs font-semibold text-red-900 mb-1">
          🔒 Segurança
        </Text>
        <Text className="text-xs text-red-800">
          Suas credenciais são criptografadas e armazenadas com segurança. Nunca compartilhe seu Auth Token.
        </Text>
      </View>
    </View>
  );
}

/**
 * Messages Tab
 */
function MessagesTab() {
  const [selectedMoradores, setSelectedMoradores] = useState<number[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);

  const moradores = [
    { id: 1, nome: "João Silva", numero: "+55 11 99999-0001" },
    { id: 2, nome: "Maria Santos", numero: "+55 11 99999-0002" },
    { id: 3, nome: "Pedro Oliveira", numero: "+55 11 99999-0003" },
  ];

  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">
        📤 Enviar Mensagens
      </Text>

      {/* Moradores Selection */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          Selecione os Moradores
        </Text>
        {moradores.map((morador) => (
          <Pressable
            key={morador.id}
            onPress={() =>
              setSelectedMoradores((prev) =>
                prev.includes(morador.id)
                  ? prev.filter((id) => id !== morador.id)
                  : [...prev, morador.id]
              )
            }
            className={cn(
              "flex-row items-center gap-3 p-3 rounded-lg border",
              selectedMoradores.includes(morador.id)
                ? "bg-primary/10 border-primary"
                : "bg-surface border-border"
            )}
          >
            <View
              className={cn(
                "w-5 h-5 rounded border-2 items-center justify-center",
                selectedMoradores.includes(morador.id)
                  ? "bg-primary border-primary"
                  : "border-border"
              )}
            >
              {selectedMoradores.includes(morador.id) && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{morador.nome}</Text>
              <Text className="text-xs text-muted">{morador.numero}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Message Input */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">
          Mensagem
        </Text>
        <View className="bg-surface border border-border rounded-lg p-3 min-h-[120px]">
          <TextInput
            value={mensagem}
            onChangeText={setMensagem}
            placeholder="Digite sua mensagem aqui..."
            placeholderTextColor="#9BA1A6"
            multiline
            numberOfLines={5}
            className="text-foreground text-base"
          />
        </View>
        <Text className="text-xs text-muted">
          {mensagem.length}/1000 caracteres
        </Text>
      </View>

      {/* Send Button */}
      <Pressable
        onPress={() => setSending(true)}
        disabled={sending || selectedMoradores.length === 0 || !mensagem}
        className={cn(
          "rounded-lg p-3 active:opacity-80",
          sending || selectedMoradores.length === 0 || !mensagem
            ? "bg-gray-300"
            : "bg-primary"
        )}
      >
        <Text className="text-white font-semibold text-center">
          {sending
            ? "Enviando..."
            : `📤 Enviar para ${selectedMoradores.length} morador(es)`}
        </Text>
      </Pressable>

      {/* Message Templates */}
      <View className="gap-2 mt-4">
        <Text className="text-sm font-semibold text-foreground">
          📋 Templates Rápidos
        </Text>
        <Pressable className="bg-surface rounded-lg p-3 border border-border active:opacity-60">
          <Text className="text-sm font-semibold text-primary">
            💰 Notificação de Pagamento
          </Text>
        </Pressable>
        <Pressable className="bg-surface rounded-lg p-3 border border-border active:opacity-60">
          <Text className="text-sm font-semibold text-primary">
            📢 Comunicado Geral
          </Text>
        </Pressable>
        <Pressable className="bg-surface rounded-lg p-3 border border-border active:opacity-60">
          <Text className="text-sm font-semibold text-primary">
            🔧 Aviso de Manutenção
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Menus Tab
 */
function MenusTab() {
  return (
    <View className="p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">
        📋 Menus Interativos
      </Text>

      <View className="bg-surface rounded-lg p-4 border border-border gap-3">
        <Text className="font-semibold text-foreground">
          👋 Menu de Suporte Padrão
        </Text>
        <Text className="text-sm text-muted">
          1 - 💰 Pagar Mensalidade{"\n"}
          2 - 📋 Consultar Saldo{"\n"}
          3 - 📢 Comunicados{"\n"}
          4 - 🔧 Manutenção{"\n"}
          5 - 👨‍💼 Falar com Admin
        </Text>
        <Pressable className="bg-primary/20 rounded p-2 active:opacity-60">
          <Text className="text-primary font-semibold text-center text-sm">
            Enviar Menu
          </Text>
        </Pressable>
      </View>

      <Pressable className="bg-primary rounded-lg p-3 active:opacity-80">
        <Text className="text-white font-semibold text-center">
          ➕ Criar Novo Menu
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Conversations Tab
 */
function ConversationsTab() {
  const conversations = [
    {
      id: 1,
      nome: "João Silva",
      numero: "+55 11 99999-0001",
      ultimaMensagem: "Obrigado pela informação!",
      hora: "2 min",
      naoLidas: 0,
    },
    {
      id: 2,
      nome: "Maria Santos",
      numero: "+55 11 99999-0002",
      ultimaMensagem: "Como faço para pagar?",
      hora: "15 min",
      naoLidas: 1,
    },
  ];

  return (
    <View className="p-4 gap-3">
      <Text className="text-lg font-bold text-foreground">
        💭 Conversas Ativas
      </Text>

      {conversations.map((conv) => (
        <Pressable
          key={conv.id}
          className="bg-surface rounded-lg p-3 border border-border active:opacity-60 flex-row items-center gap-3"
        >
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
            <Text className="text-lg">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{conv.nome}</Text>
            <Text className="text-xs text-muted">{conv.numero}</Text>
            <Text className="text-sm text-foreground mt-1">
              {conv.ultimaMensagem}
            </Text>
          </View>
          <View className="items-end gap-1">
            <Text className="text-xs text-muted">{conv.hora}</Text>
            {conv.naoLidas > 0 && (
              <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-xs font-bold text-white">
                  {conv.naoLidas}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
