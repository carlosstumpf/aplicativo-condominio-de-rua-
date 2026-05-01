/**
 * Admin Conversations Panel
 * Interface para admins gerenciarem conversas com moradores
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  moradorPhone: string;
  moradorName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: "active" | "resolved" | "pending";
}

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  direction: "incoming" | "outgoing";
  type: "text" | "payment" | "confirmation";
}

export default function AdminConversationsScreen() {
  const colors = useColors();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Simular carregamento de conversas
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      // TODO: Integrar com API real
      const mockConversations: Conversation[] = [
        {
          id: "1",
          moradorPhone: "+5521987654321",
          moradorName: "João Silva",
          lastMessage: "Obrigado! Pagamento realizado.",
          lastMessageTime: "Há 2 horas",
          unreadCount: 0,
          status: "resolved",
        },
        {
          id: "2",
          moradorPhone: "+5521987654322",
          moradorName: "Maria Santos",
          lastMessage: "Qual é a data de vencimento?",
          lastMessageTime: "Há 30 min",
          unreadCount: 1,
          status: "pending",
        },
        {
          id: "3",
          moradorPhone: "+5521987654323",
          moradorName: "Pedro Costa",
          lastMessage: "Não consegui escanear o QR Code",
          lastMessageTime: "Há 1 hora",
          unreadCount: 1,
          status: "active",
        },
      ];

      setConversations(mockConversations);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    setLoading(true);
    try {
      // TODO: Integrar com API real
      const mockMessages: Message[] = [
        {
          id: "1",
          from: "system",
          to: conversation.moradorPhone,
          text: "Olá! Você tem uma mensalidade pendente de R$ 500.00",
          timestamp: "10:30",
          direction: "outgoing",
          type: "text",
        },
        {
          id: "2",
          from: conversation.moradorPhone,
          to: "system",
          text: "Qual é a data de vencimento?",
          timestamp: "10:35",
          direction: "incoming",
          type: "text",
        },
        {
          id: "3",
          from: "system",
          to: conversation.moradorPhone,
          text: "O vencimento é em 30/04/2026",
          timestamp: "10:36",
          direction: "outgoing",
          type: "text",
        },
      ];

      setMessages(mockMessages);
      setSelectedConversation(conversation);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      // TODO: Integrar com API real
      const newMessage: Message = {
        id: String(messages.length + 1),
        from: "admin",
        to: selectedConversation.moradorPhone,
        text: replyText,
        timestamp: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        direction: "outgoing",
        type: "text",
      };

      setMessages([...messages, newMessage]);
      setReplyText("");

      Alert.alert("Sucesso", "Mensagem enviada!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar mensagem");
    }
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.moradorName.toLowerCase().includes(searchText.toLowerCase()) ||
      conv.moradorPhone.includes(searchText)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return colors.success;
      case "active":
        return colors.primary;
      case "pending":
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "Resolvido";
      case "active":
        return "Ativo";
      case "pending":
        return "Pendente";
      default:
        return "Desconhecido";
    }
  };

  if (selectedConversation && messages.length > 0) {
    return (
      <ScreenContainer className="bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => setSelectedConversation(null)}>
            <Text className="text-primary font-semibold">← Voltar</Text>
          </TouchableOpacity>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-foreground">
              {selectedConversation.moradorName}
            </Text>
            <Text className="text-sm text-muted">{selectedConversation.moradorPhone}</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView className="flex-1 px-4 py-4">
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={cn(
                "mb-3 flex-row",
                msg.direction === "outgoing" ? "justify-end" : "justify-start"
              )}
            >
              <View
                className={cn(
                  "rounded-lg px-3 py-2 max-w-xs",
                  msg.direction === "outgoing"
                    ? "bg-primary"
                    : "bg-surface border border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-sm",
                    msg.direction === "outgoing" ? "text-background" : "text-foreground"
                  )}
                >
                  {msg.text}
                </Text>
                <Text
                  className={cn(
                    "text-xs mt-1",
                    msg.direction === "outgoing" ? "text-background opacity-70" : "text-muted"
                  )}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View className="border-t border-border p-4 flex-row gap-2">
          <TextInput
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
            placeholder="Digite sua resposta..."
            placeholderTextColor={colors.muted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            onPress={sendReply}
            className="bg-primary rounded-lg px-4 py-2 justify-center"
          >
            <Text className="text-background font-semibold">Enviar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View className="px-4 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground mb-3">💬 Conversas</Text>

        {/* Search */}
        <TextInput
          className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
          placeholder="Buscar por nome ou telefone..."
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Conversations List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-lg text-muted text-center">
            Nenhuma conversa encontrada
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => loadMessages(item)}
              className="border-b border-border px-4 py-3 flex-row justify-between items-center"
            >
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-base font-semibold text-foreground">
                    {item.moradorName}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View className="bg-primary rounded-full px-2 py-1">
                      <Text className="text-xs font-bold text-background">
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted mb-1">{item.lastMessage}</Text>
                <View className="flex-row gap-2 items-center">
                  <Text className="text-xs text-muted">{item.lastMessageTime}</Text>
                  <View
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(item.status) }}
                  />
                  <Text className="text-xs" style={{ color: getStatusColor(item.status) }}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
              <Text className="text-primary ml-2">→</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={true}
        />
      )}

      {/* Refresh Button */}
      <View className="px-4 py-4 border-t border-border">
        <TouchableOpacity
          onPress={loadConversations}
          className="bg-primary rounded-lg py-3 items-center"
        >
          <Text className="text-background font-semibold">🔄 Atualizar</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
