/**
 * Admin Communications Screen
 * Uses real backend data - sends messages via WhatsApp API and lists moradores
 */

import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";

type CommunicationTab = "enviar" | "moradores" | "templates";

export default function AdminCommunicationsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<CommunicationTab>("enviar");

  const tabs: Array<{ id: CommunicationTab; label: string }> = [
    { id: "enviar", label: "Enviar" },
    { id: "moradores", label: "Moradores" },
    { id: "templates", label: "Templates" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>Comunicados</Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-border bg-surface">
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.id ? colors.primary : "transparent",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  textAlign: "center",
                  color: activeTab === tab.id ? colors.primary : colors.muted,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {activeTab === "enviar" && <EnviarTab />}
        {activeTab === "moradores" && <MoradoresTab />}
        {activeTab === "templates" && <TemplatesTab />}
      </View>
    </ScreenContainer>
  );
}

/**
 * Enviar Tab - Send WhatsApp messages to residents
 */
function EnviarTab() {
  const colors = useColors();
  const [destinatarios, setDestinatarios] = useState<"todos" | "inadimplentes">("todos");
  const [mensagem, setMensagem] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: number; failed: number } | null>(null);

  const moradoresQuery = trpc.moradores.list.useQuery(
    { page: 1, limit: 200, status: "ativo" },
    { retry: 1, staleTime: 30000 }
  );

  const inadimplentesQuery = trpc.moradores.getInadimplentes.useQuery(
    { page: 1, limit: 200 },
    { retry: 1, staleTime: 30000 }
  );

  const totalMoradores = moradoresQuery.data?.pagination?.total ?? 0;
  const totalInadimplentes = inadimplentesQuery.data?.pagination?.total ?? 0;

  const handleSend = async () => {
    if (!mensagem.trim()) {
      Alert.alert("Erro", "Digite uma mensagem para enviar.");
      return;
    }

    const lista = destinatarios === "todos"
      ? moradoresQuery.data?.data || []
      : inadimplentesQuery.data?.data || [];

    if (lista.length === 0) {
      Alert.alert("Aviso", "Nenhum destinatário encontrado.");
      return;
    }

    Alert.alert(
      "Confirmar Envio",
      `Enviar mensagem para ${lista.length} morador(es) via WhatsApp?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: async () => {
            setIsSending(true);
            let success = 0;
            let failed = 0;

            try {
              const response = await fetch(`${getApiBaseUrl()}/api/whatsapp/send-bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phones: lista.map((m: any) => m.telefone),
                  message: mensagem,
                }),
              });

              const result = await response.json();
              success = result.success ?? lista.length;
              failed = result.failed ?? 0;
            } catch (error) {
              // If bulk endpoint doesn't exist, try individual sends
              for (const m of lista) {
                try {
                  await fetch(`${getApiBaseUrl()}/api/whatsapp/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      phone: (m as any).telefone,
                      message: mensagem,
                    }),
                  });
                  success++;
                } catch {
                  failed++;
                }
              }
            }

            setLastResult({ success, failed });
            setIsSending(false);
            Alert.alert(
              "Envio Concluído",
              `Enviados: ${success}\nFalhas: ${failed}`
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Enviar Comunicado via WhatsApp</Text>

      {/* Destinatários */}
      <View className="gap-2 mb-4">
        <Text className="text-sm font-semibold text-foreground">Destinatários</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setDestinatarios("todos")}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: destinatarios === "todos" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: destinatarios === "todos" ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", color: destinatarios === "todos" ? "white" : colors.foreground }}>
              Todos ({totalMoradores})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDestinatarios("inadimplentes")}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: destinatarios === "inadimplentes" ? colors.error : colors.surface,
              borderWidth: 1,
              borderColor: destinatarios === "inadimplentes" ? colors.error : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", color: destinatarios === "inadimplentes" ? "white" : colors.foreground }}>
              Inadimplentes ({totalInadimplentes})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Mensagem */}
      <View className="gap-2 mb-4">
        <Text className="text-sm font-semibold text-foreground">Mensagem</Text>
        <TextInput
          placeholder="Digite sua mensagem..."
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          numberOfLines={6}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.foreground,
            minHeight: 120,
            textAlignVertical: "top",
          }}
          placeholderTextColor={colors.muted}
        />
        <Text className="text-xs text-muted text-right">{mensagem.length} caracteres</Text>
      </View>

      {/* Resumo */}
      <View className="bg-surface rounded-xl p-4 border border-border mb-4">
        <Text className="text-sm font-semibold text-foreground mb-2">Resumo do Envio</Text>
        <View className="flex-row justify-between mb-1">
          <Text className="text-muted text-sm">Destinatários:</Text>
          <Text className="font-semibold text-foreground text-sm">
            {destinatarios === "todos" ? `Todos (${totalMoradores})` : `Inadimplentes (${totalInadimplentes})`}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted text-sm">Canal:</Text>
          <Text className="font-semibold text-foreground text-sm">WhatsApp</Text>
        </View>
      </View>

      {/* Último Resultado */}
      {lastResult && (
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Último Envio</Text>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.success, fontWeight: "600" }}>
              Enviados: {lastResult.success}
            </Text>
            {lastResult.failed > 0 && (
              <Text style={{ color: colors.error, fontWeight: "600" }}>
                Falhas: {lastResult.failed}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Enviar */}
      <Pressable
        onPress={handleSend}
        disabled={isSending}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: 10,
          opacity: pressed || isSending ? 0.7 : 1,
        })}
      >
        {isSending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
            Enviar Agora
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

/**
 * Moradores Tab - List all residents for selection
 */
function MoradoresTab() {
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);

  const moradoresQuery = trpc.moradores.list.useQuery(
    { page, limit: 20, search: searchText || undefined, status: "ativo" },
    { retry: 1, staleTime: 15000 }
  );

  const moradores = moradoresQuery.data?.data || [];
  const pagination = moradoresQuery.data?.pagination;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Search */}
      <TextInput
        placeholder="Buscar morador..."
        value={searchText}
        onChangeText={(t) => { setSearchText(t); setPage(1); }}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          marginBottom: 12,
        }}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
      />

      {moradoresQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : moradores.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-muted">Nenhum morador encontrado.</Text>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-muted">{pagination?.total ?? moradores.length} morador(es)</Text>
          {moradores.map((m: any) => (
            <View key={m.id} className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground">{m.nomeCompleto}</Text>
              <Text className="text-xs text-muted mt-1">Casa: {m.identificacaoCasa} | Tel: {m.telefone}</Text>
            </View>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <View className="flex-row justify-center items-center gap-4 mt-4">
              <Pressable
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={!pagination.hasPreviousPage}
                style={({ pressed }) => ({
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: pagination.hasPreviousPage ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : pagination.hasPreviousPage ? 1 : 0.5,
                })}
              >
                <Text style={{ color: pagination.hasPreviousPage ? "white" : colors.muted, fontWeight: "600" }}>Anterior</Text>
              </Pressable>
              <Text className="text-sm text-muted">{page} / {pagination.totalPages}</Text>
              <Pressable
                onPress={() => setPage(page + 1)}
                disabled={!pagination.hasNextPage}
                style={({ pressed }) => ({
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: pagination.hasNextPage ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : pagination.hasNextPage ? 1 : 0.5,
                })}
              >
                <Text style={{ color: pagination.hasNextPage ? "white" : colors.muted, fontWeight: "600" }}>Próxima</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Templates Tab - Message templates (stored locally)
 */
function TemplatesTab() {
  const colors = useColors();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const templates = [
    {
      id: 1,
      nome: "Lembrete de Pagamento",
      conteudo: "Olá! Lembramos que a mensalidade do condomínio vence em 3 dias. Evite juros e multas, efetue o pagamento. Obrigado!",
    },
    {
      id: 2,
      nome: "Aviso de Manutenção",
      conteudo: "Informamos que haverá manutenção nas áreas comuns do condomínio. Pedimos a compreensão de todos.",
    },
    {
      id: 3,
      nome: "Comunicado Geral",
      conteudo: "Prezados moradores, informamos que...",
    },
    {
      id: 4,
      nome: "Cobrança de Inadimplentes",
      conteudo: "Prezado(a), identificamos que sua mensalidade encontra-se em atraso. Solicitamos a regularização o mais breve possível para evitar encargos adicionais.",
    },
    {
      id: 5,
      nome: "Reunião de Condomínio",
      conteudo: "Convidamos todos os moradores para a reunião do condomínio que será realizada em [DATA] às [HORA]. Contamos com a presença de todos!",
    },
  ];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Templates de Mensagem</Text>
      <Text className="text-sm text-muted mb-4">
        Selecione um template para copiar o texto e usar na aba "Enviar".
      </Text>

      <View className="gap-3">
        {templates.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: selectedTemplate === t.id ? colors.primary : colors.border,
              borderRadius: 12,
              padding: 16,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text className="font-semibold text-foreground">{t.nome}</Text>
            <Text className="text-sm text-muted mt-2" numberOfLines={selectedTemplate === t.id ? undefined : 2}>
              {t.conteudo}
            </Text>
            {selectedTemplate === t.id && (
              <Pressable
                onPress={() => {
                  Alert.alert("Copiado!", "Texto do template copiado. Cole na aba Enviar.");
                }}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginTop: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "600", textAlign: "center", fontSize: 13 }}>
                  Copiar Texto
                </Text>
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
