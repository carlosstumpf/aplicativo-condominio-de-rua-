/**
 * Admin Conversations with AI Suggestions
 * Painel de conversas com sugestões inteligentes de respostas
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

interface SuggestedReply {
  templateId: string;
  title: string;
  content: string;
  emoji: string;
  relevanceScore: number;
  matchedKeywords: string[];
  reason: string;
}

interface MessageAnalysis {
  intent: string;
  confidence: number;
  keywords: string[];
  sentiment: "positive" | "negative" | "neutral";
}

export default function AdminConversationsAISuggestionsScreen() {
  const colors = useColors();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedReply[]>([]);
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
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
          text: conversation.lastMessage,
          timestamp: "10:35",
          direction: "incoming",
          type: "text",
        },
      ];

      setMessages(mockMessages);
      setSelectedConversation(conversation);
      setReplyText("");
      setSuggestions([]);

      // Gerar sugestões para a última mensagem
      await generateSuggestions(conversation.lastMessage);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async (message: string) => {
    setSuggestionsLoading(true);
    try {
      // Simular análise de IA
      const mockAnalysis: MessageAnalysis = {
        intent: message.toLowerCase().includes("vencimento")
          ? "info"
          : message.toLowerCase().includes("problema")
            ? "support"
            : "unknown",
        confidence: message.toLowerCase().includes("vencimento") ? 0.92 : 0.65,
        keywords: message.toLowerCase().split(" ").filter((w) => w.length > 3),
        sentiment: message.toLowerCase().includes("não consegui") ? "negative" : "neutral",
      };

      setAnalysis(mockAnalysis);

      // Simular sugestões
      const mockSuggestions: SuggestedReply[] = [
        {
          templateId: "2",
          title: "📅 Informar Vencimento",
          content: "📅 Sua mensalidade vence em 30/04/2026. Valor: R$ 500.00",
          emoji: "📅",
          relevanceScore: 0.92,
          matchedKeywords: ["vencimento", "data"],
          reason: "Correspondência alta com intenção 'info' (92%)",
        },
        {
          templateId: "3",
          title: "💳 Enviar Link de Pagamento",
          content: "💳 Clique aqui para pagar: https://asaas.com/...",
          emoji: "💳",
          relevanceScore: 0.78,
          matchedKeywords: ["pagamento"],
          reason: "Palavras-chave encontradas: vencimento, data",
        },
        {
          templateId: "5",
          title: "👋 Acompanhamento",
          content: "👋 Olá! Como posso ajudá-lo hoje?",
          emoji: "👋",
          relevanceScore: 0.65,
          matchedKeywords: [],
          reason: "Sugestão baseada em contexto similar",
        },
      ];

      setSuggestions(mockSuggestions);
      setConfidence(Math.round(mockAnalysis.confidence * 100));
    } catch (error) {
      console.error("Erro ao gerar sugestões:", error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const useSuggestion = (suggestion: SuggestedReply) => {
    setReplyText(suggestion.content);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
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

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "😊";
      case "negative":
        return "😞";
      default:
        return "😐";
    }
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = {
      payment: "Pagamento",
      info: "Informação",
      support: "Suporte",
      complaint: "Reclamação",
      greeting: "Saudação",
      unknown: "Desconhecido",
    };
    return labels[intent] || intent;
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

        {/* AI Suggestions Section */}
        {suggestions.length > 0 && (
          <View className="border-t border-border bg-surface p-3">
            {/* Analysis Info */}
            {analysis && (
              <View className="mb-3 p-2 bg-background rounded-lg border border-border">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-foreground">
                    🤖 Análise de IA
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-muted">Confiança:</Text>
                    <View className="bg-primary rounded-full px-2 py-1">
                      <Text className="text-xs font-bold text-background">{confidence}%</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-2 flex-wrap">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs text-muted">Intenção:</Text>
                    <Text className="text-xs font-semibold text-foreground">
                      {getIntentLabel(analysis.intent)}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs text-muted">Sentimento:</Text>
                    <Text className="text-xs">
                      {getSentimentEmoji(analysis.sentiment)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Suggestions */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              💡 Sugestões Recomendadas
            </Text>

            {suggestionsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.templateId}
                    onPress={() => useSuggestion(suggestion)}
                    className="mr-2 bg-background border border-primary rounded-lg px-3 py-2 min-w-max"
                  >
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg">{suggestion.emoji}</Text>
                      <View
                        className="rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor:
                            suggestion.relevanceScore > 0.8
                              ? colors.success
                              : suggestion.relevanceScore > 0.6
                                ? colors.warning
                                : colors.muted,
                        }}
                      >
                        <Text className="text-xs font-bold text-background">
                          {Math.round(suggestion.relevanceScore * 100)}%
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs font-semibold text-foreground max-w-xs">
                      {suggestion.title}
                    </Text>

                    <Text className="text-xs text-muted mt-1">{suggestion.reason}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

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
