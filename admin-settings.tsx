/**
 * Admin Settings Screen
 * Connected to real backend - WhatsApp, moradores, despesas, webhooks
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";

type SettingsTab = "whatsapp" | "asaas" | "condominio" | "moradores" | "webhooks";

export default function AdminSettingsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<SettingsTab>("whatsapp");

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "asaas", label: "Asaas" },
    { id: "condominio", label: "Condomínio" },
    { id: "moradores", label: "Moradores" },
    { id: "webhooks", label: "Webhooks" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>Configurações</Text>
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
        {activeTab === "whatsapp" && <WhatsAppTab />}
        {activeTab === "asaas" && <AsaasConfigTab />}
        {activeTab === "condominio" && <CondominioTab />}
        {activeTab === "moradores" && <MoradoresConfigTab />}
        {activeTab === "webhooks" && <WebhooksTab />}
      </View>
    </ScreenContainer>
  );
}

/**
 * WhatsApp Tab - Real WhatsApp connection status and QR Code
 */
function WhatsAppTab() {
  const colors = useColors();
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/whatsapp/status`);
      const data = await res.json();
      setStatus(data);

      if (data.status === "qr_waiting") {
        const qrRes = await fetch(`${getApiBaseUrl()}/api/whatsapp/qrcode`);
        const qrData = await qrRes.json();
        if (qrData.qrCode) {
          setQrCode(qrData.qrCode);
        }
      } else {
        setQrCode(null);
      }
    } catch (error) {
      setStatus({ status: "error", message: "Erro ao conectar com o servidor" });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await fetch(`${getApiBaseUrl()}/api/whatsapp/connect`, { method: "POST" });
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      Alert.alert("Erro", "Erro ao iniciar conexão WhatsApp.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert("Desconectar", "Deseja desconectar o WhatsApp?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desconectar",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${getApiBaseUrl()}/api/whatsapp/disconnect`, { method: "POST" });
            fetchStatus();
          } catch (error) {
            Alert.alert("Erro", "Erro ao desconectar.");
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  const getStatusInfo = () => {
    if (!status) return { color: colors.muted, label: "Verificando...", icon: "⏳" };
    switch (status.status) {
      case "connected": return { color: colors.success, label: "Conectado", icon: "✅" };
      case "qr_waiting": return { color: colors.warning, label: "Aguardando QR Code", icon: "📱" };
      case "connecting": return { color: colors.warning, label: "Conectando...", icon: "🔄" };
      case "disconnected": return { color: colors.error, label: "Desconectado", icon: "❌" };
      default: return { color: colors.muted, label: status.status, icon: "❓" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Status Card */}
      <View
        className="bg-surface rounded-xl p-4 border border-border mb-4"
        style={{ borderLeftWidth: 4, borderLeftColor: statusInfo.color }}
      >
        <View className="flex-row items-center gap-3">
          <Text style={{ fontSize: 32 }}>{statusInfo.icon}</Text>
          <View className="flex-1">
            <Text className="font-bold text-foreground text-lg">WhatsApp</Text>
            <Text style={{ color: statusInfo.color, fontWeight: "600", fontSize: 14 }}>
              {statusInfo.label}
            </Text>
            {status?.phone && (
              <Text className="text-sm text-muted mt-1">Número: {status.phone}</Text>
            )}
          </View>
        </View>
      </View>

      {/* QR Code */}
      {qrCode && status?.status === "qr_waiting" && (
        <View className="bg-white rounded-xl p-6 border border-border mb-4 items-center">
          <Text className="font-bold text-foreground mb-3">Escaneie o QR Code</Text>
          <Image
            source={{ uri: qrCode }}
            style={{ width: 250, height: 250, borderRadius: 8 }}
            resizeMode="contain"
          />
          <Text className="text-xs text-muted mt-3 text-center">
            Abra o WhatsApp no celular {"\n"}
            Aparelhos conectados → Conectar aparelho
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {status?.status !== "connected" && status?.status !== "qr_waiting" && (
        <Pressable
          onPress={handleConnect}
          disabled={connecting}
          style={({ pressed }) => ({
            backgroundColor: colors.success,
            paddingVertical: 14,
            borderRadius: 10,
            opacity: pressed || connecting ? 0.7 : 1,
            marginBottom: 12,
          })}
        >
          {connecting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
              Iniciar Conexão WhatsApp
            </Text>
          )}
        </Pressable>
      )}

      {status?.status === "connected" && (
        <Pressable
          onPress={handleDisconnect}
          style={({ pressed }) => ({
            backgroundColor: colors.error,
            paddingVertical: 14,
            borderRadius: 10,
            opacity: pressed ? 0.7 : 1,
            marginBottom: 12,
          })}
        >
          <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
            Desconectar WhatsApp
          </Text>
        </Pressable>
      )}

      {/* Test Send */}
      {status?.status === "connected" && <TestSendSection />}
    </ScrollView>
  );
}

/**
 * Test Send Section - Send test message via WhatsApp
 */
function TestSendSection() {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Teste do sistema de gestão do condomínio.");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!phone.trim()) {
      Alert.alert("Erro", "Informe o número de telefone.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Sucesso", "Mensagem enviada com sucesso!");
      } else {
        Alert.alert("Erro", data.error || "Erro ao enviar mensagem.");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="bg-surface rounded-xl p-4 border border-border mt-4">
      <Text className="font-semibold text-foreground mb-3">Enviar Mensagem de Teste</Text>
      <TextInput
        placeholder="Número (ex: 5521998231962)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          marginBottom: 8,
        }}
        placeholderTextColor={colors.muted}
      />
      <TextInput
        placeholder="Mensagem"
        value={message}
        onChangeText={setMessage}
        multiline
        style={{
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          minHeight: 60,
          textAlignVertical: "top",
          marginBottom: 12,
        }}
        placeholderTextColor={colors.muted}
      />
      <Pressable
        onPress={handleSend}
        disabled={sending}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          paddingVertical: 12,
          borderRadius: 10,
          opacity: pressed || sending ? 0.7 : 1,
        })}
      >
        {sending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Enviar Teste</Text>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Condomínio Tab - General condominium settings
 */
function CondominioTab() {
  const colors = useColors();
  const currentMes = new Date().toISOString().split("T")[0].substring(0, 7);

  const resumoQuery = trpc.relatorios.resumoMes.useQuery(
    { mesReferencia: currentMes },
    { retry: 1, staleTime: 30000 }
  );

  const resumo = resumoQuery.data;

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Informações do Condomínio</Text>

      {resumoQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View className="gap-4">
          {/* Stats */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Resumo do Mês - {currentMes}</Text>
            <View className="gap-2">
              <InfoRow label="Moradores Ativos" value={String(resumo?.moradores ?? 0)} color={colors.success} />
              <InfoRow label="Receitas" value={formatarMoeda(resumo?.receitas ?? 0)} color={colors.success} />
              <InfoRow label="Despesas" value={formatarMoeda(resumo?.despesas ?? 0)} color={colors.error} />
              <InfoRow label="Saldo" value={formatarMoeda(resumo?.saldo ?? 0)} color={(resumo?.saldo ?? 0) >= 0 ? colors.success : colors.error} />
            </View>
          </View>

          {/* System Info */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Sistema</Text>
            <View className="gap-2">
              <InfoRow label="Versão" value="1.0.0" />
              <InfoRow label="Backend" value="Ativo" color={colors.success} />
              <InfoRow label="Banco de Dados" value="MySQL" />
              <InfoRow label="Integração Asaas" value="Configurável" />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Moradores Config Tab - Manage residents (CRUD)
 */
function MoradoresConfigTab() {
  const colors = useColors();
  const [showAddForm, setShowAddForm] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [casa, setCasa] = useState("");
  const [cpf, setCpf] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCpfId, setEditingCpfId] = useState<number | null>(null);
  const [editCpfValue, setEditCpfValue] = useState("");

  const moradoresQuery = trpc.moradores.list.useQuery(
    { page: 1, limit: 100, status: "ativo" },
    { retry: 1, staleTime: 15000 }
  );

  const createMorador = trpc.moradores.create.useMutation();
  const updateMorador = trpc.moradores.update.useMutation();
  const cancelMorador = trpc.moradores.cancel.useMutation();
  const reactivateMorador = trpc.moradores.reactivate.useMutation();
  const utils = trpc.useUtils();

  const moradores = moradoresQuery.data?.data || [];

  const handleAddMorador = async () => {
    if (!nome.trim() || !telefone.trim() || !casa.trim()) {
      Alert.alert("Erro", "Preencha nome, telefone e casa.");
      return;
    }
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpf.trim() && cpfDigits.length !== 11) {
      Alert.alert("Erro", "CPF inválido. Digite os 11 dígitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMorador.mutateAsync({
        nomeCompleto: nome,
        telefone,
        cpf: cpf.trim() ? cpf.replace(/\D/g, "") : "00000000000",
        identificacaoCasa: casa,
      });
      Alert.alert("Sucesso", "Morador cadastrado com sucesso!");
      setNome("");
      setTelefone("");
      setCasa("");
      setCpf("");
      setShowAddForm(false);
      utils.moradores.list.invalidate();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao cadastrar morador.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Add Form */}
      {showAddForm && (
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="font-bold text-foreground mb-3">Novo Morador</Text>
          <View className="gap-3">
            <TextInput
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
              }}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Telefone (ex: 5521998231962)"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
              }}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Identificação da casa (ex: Casa 1)"
              value={casa}
              onChangeText={setCasa}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
              }}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="CPF (ex: 123.456.789-09) — necessário para PIX/Boleto"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              maxLength={14}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
              }}
              placeholderTextColor={colors.muted}
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleAddMorador}
                disabled={isSubmitting}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 10,
                  opacity: pressed || isSubmitting ? 0.7 : 1,
                })}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Salvar</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setShowAddForm(false)}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600", textAlign: "center" }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <Pressable
          onPress={() => setShowAddForm(true)}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            opacity: pressed ? 0.7 : 1,
            marginBottom: 16,
          })}
        >
          <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>+ Novo Morador</Text>
        </Pressable>
      )}

      {/* Moradores List */}
      {moradoresQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : moradores.length === 0 ? (
        <View className="items-center py-8">
          <Text style={{ fontSize: 48 }}>🏠</Text>
          <Text className="text-foreground font-semibold mt-2">Nenhum morador cadastrado</Text>
          <Text className="text-muted text-sm mt-1">Clique em "+ Novo Morador" para começar.</Text>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-muted">{moradores.length} morador(es) ativo(s)</Text>
          {moradores.map((m: any) => (
            <View key={m.id} className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{m.nomeCompleto}</Text>
                  <Text className="text-xs text-muted mt-1">Casa: {m.identificacaoCasa}</Text>
                  <Text className="text-xs text-muted">Tel: {m.telefone}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-muted">
                      CPF: {m.cpf && m.cpf !== "00000000000" ? `${m.cpf.substring(0,3)}.${m.cpf.substring(3,6)}.${m.cpf.substring(6,9)}-${m.cpf.substring(9)}` : "⚠️ Não cadastrado"}
                    </Text>
                    <Pressable
                      onPress={() => { setEditingCpfId(m.id); setEditCpfValue(m.cpf && m.cpf !== "00000000000" ? m.cpf : ""); }}
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "600" }}>Editar CPF</Text>
                    </Pressable>
                  </View>
                  {editingCpfId === m.id && (
                    <View className="mt-2 gap-2">
                      <TextInput
                        placeholder="CPF (ex: 529.982.247-25)"
                        value={editCpfValue}
                        onChangeText={setEditCpfValue}
                        keyboardType="numeric"
                        maxLength={14}
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: colors.primary,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          color: colors.foreground,
                          fontSize: 13,
                        }}
                        placeholderTextColor={colors.muted}
                      />
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={async () => {
                            const digits = editCpfValue.replace(/\D/g, "");
                            if (digits.length !== 11) {
                              Alert.alert("Erro", "CPF deve ter 11 dígitos.");
                              return;
                            }
                            try {
                              await updateMorador.mutateAsync({ id: m.id, cpf: digits });
                              Alert.alert("Sucesso", "CPF atualizado!");
                              setEditingCpfId(null);
                              utils.moradores.list.invalidate();
                            } catch (e: any) {
                              Alert.alert("Erro", e?.message || "Erro ao atualizar CPF.");
                            }
                          }}
                          style={({ pressed }) => ({
                            flex: 1, backgroundColor: colors.primary, paddingVertical: 8,
                            borderRadius: 8, opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text style={{ color: "white", fontWeight: "600", textAlign: "center", fontSize: 13 }}>Salvar</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setEditingCpfId(null)}
                          style={({ pressed }) => ({
                            flex: 1, backgroundColor: colors.surface, paddingVertical: 8,
                            borderRadius: 8, borderWidth: 1, borderColor: colors.border,
                            opacity: pressed ? 0.7 : 1,
                          })}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: "600", textAlign: "center", fontSize: 13 }}>Cancelar</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <View
                    style={{
                      backgroundColor: m.statusAtivo ? colors.success + "20" : colors.error + "20",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: m.statusAtivo ? colors.success : colors.error, fontSize: 11, fontWeight: "600" }}>
                      {m.statusAtivo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                  {m.statusAtivo ? (
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Cancelar Morador",
                          `Cancelar o cadastro de ${m.nomeCompleto}?`,
                          [
                            { text: "Não", style: "cancel" },
                            {
                              text: "Cancelar",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await cancelMorador.mutateAsync({ id: m.id });
                                  Alert.alert("Sucesso", "Morador cancelado.");
                                  utils.moradores.list.invalidate();
                                } catch (e: any) {
                                  Alert.alert("Erro", e?.message || "Erro ao cancelar.");
                                }
                              },
                            },
                          ]
                        )
                      }
                      style={({ pressed }) => ({
                        backgroundColor: colors.error + "15",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.error + "40",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ color: colors.error, fontSize: 11, fontWeight: "600" }}>Cancelar</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={async () => {
                        try {
                          await reactivateMorador.mutateAsync({ id: m.id });
                          Alert.alert("Sucesso", "Morador reativado!");
                          utils.moradores.list.invalidate();
                        } catch (e: any) {
                          Alert.alert("Erro", e?.message || "Erro ao reativar.");
                        }
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: colors.success + "15",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.success + "40",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ color: colors.success, fontSize: 11, fontWeight: "600" }}>Reativar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Webhooks Tab - Real webhook statistics
 */
function WebhooksTab() {
  const colors = useColors();

  const webhookStatsQuery = trpc.webhookAdmin.getStatistics.useQuery({ days: 30 }, {
    retry: 1,
    staleTime: 30000,
  });

  const stats = webhookStatsQuery.data;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Webhooks</Text>

      {webhookStatsQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View className="gap-4">
          {/* Asaas Webhook */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center gap-2 mb-3">
              <Text style={{ fontSize: 20 }}>💳</Text>
              <Text className="font-semibold text-foreground">Asaas Payments</Text>
            </View>
            <Text className="text-sm text-muted mb-2">
              Recebe notificações de pagamento do Asaas (PIX e Boleto).
            </Text>
            <View className="gap-1">
              <InfoRow label="Endpoint" value="/api/webhooks/asaas" />
              <InfoRow label="Status" value="Ativo" color={colors.success} />
              <InfoRow
                label="Total Processados"
                value={String((stats as any)?.data?.totalProcessed ?? 0)}
              />
              <InfoRow
                label="Falhas"
                value={String((stats as any)?.data?.totalFailed ?? 0)}
                color={colors.error}
              />
            </View>
          </View>

          {/* WhatsApp Webhook */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center gap-2 mb-3">
              <Text style={{ fontSize: 20 }}>📱</Text>
              <Text className="font-semibold text-foreground">WhatsApp Baileys</Text>
            </View>
            <Text className="text-sm text-muted mb-2">
              Processa mensagens recebidas via WhatsApp (menu automático).
            </Text>
            <View className="gap-1">
              <InfoRow label="Endpoint" value="/api/whatsapp/*" />
              <InfoRow label="Status" value="Ativo" color={colors.success} />
            </View>
          </View>

          {/* Info */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm text-muted">
              Os webhooks são configurados automaticamente pelo sistema.
              O Asaas envia notificações de pagamento que atualizam o status das cobranças em tempo real.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Asaas Config Tab - Secure API Key Management Panel
 */
function AsaasConfigTab() {
  const colors = useColors();
  const [apiKey, setApiKey] = useState("");
  const [ambiente, setAmbiente] = useState<"teste" | "producao">("teste");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const statusQuery = trpc.asaasConfig.getStatus.useQuery(undefined, {
    retry: 1,
    staleTime: 10000,
  });
  const validateMutation = trpc.asaasConfig.validate.useMutation();
  const saveMutation = trpc.asaasConfig.save.useMutation();
  const removeMutation = trpc.asaasConfig.remove.useMutation();
  const utils = trpc.useUtils();

  const status = statusQuery.data;

  const handleValidate = async () => {
    if (!apiKey.trim() || apiKey.length < 10) {
      Alert.alert("Erro", "Informe uma chave API v\u00e1lida (m\u00ednimo 10 caracteres).");
      return;
    }
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await validateMutation.mutateAsync({ apiKey: apiKey.trim(), ambiente });
      setValidationResult(result);
      if (result.valid) {
        Alert.alert("Sucesso", `Chave validada! Conta: ${(result as any).conta?.nome || "N/A"}`);
      } else {
        Alert.alert("Falha", (result as any).error || "Chave inv\u00e1lida");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao validar chave.");
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!validationResult?.valid) {
      Alert.alert("Aten\u00e7\u00e3o", "Valide a chave antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveMutation.mutateAsync({
        apiKey: apiKey.trim(),
        ambiente,
        walletId: validationResult.conta?.walletId || undefined,
        contaNome: validationResult.conta?.nome || undefined,
        contaEmail: validationResult.conta?.email || undefined,
        contaCpfCnpj: validationResult.conta?.cpfCnpj || undefined,
      });
      if (result.success) {
        Alert.alert("Sucesso", "Chave API salva com seguran\u00e7a!");
        setApiKey("");
        setValidationResult(null);
        utils.asaasConfig.getStatus.invalidate();
      } else {
        Alert.alert("Erro", result.error || "Erro ao salvar.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao salvar chave.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      "Remover Chave",
      "Tem certeza que deseja remover a chave API do Asaas? As cobran\u00e7as via Asaas deixar\u00e3o de funcionar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              const result = await removeMutation.mutateAsync();
              if (result.success) {
                Alert.alert("Removida", "Chave API removida com sucesso.");
                utils.asaasConfig.getStatus.invalidate();
              } else {
                Alert.alert("Erro", result.error || "Erro ao remover.");
              }
            } catch (error: any) {
              Alert.alert("Erro", error?.message || "Erro ao remover chave.");
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {/* Current Status */}
      <View
        className="bg-surface rounded-xl p-4 border border-border mb-4"
        style={{ borderLeftWidth: 4, borderLeftColor: status?.configured ? colors.success : colors.warning }}
      >
        <View className="flex-row items-center gap-3 mb-2">
          <Text style={{ fontSize: 28 }}>{status?.configured ? "\u2705" : "\u26A0\uFE0F"}</Text>
          <View className="flex-1">
            <Text className="font-bold text-foreground text-lg">API Asaas</Text>
            <Text style={{ color: status?.configured ? colors.success : colors.warning, fontWeight: "600", fontSize: 13 }}>
              {status?.configured ? "Configurada" : "N\u00e3o configurada"}
            </Text>
          </View>
        </View>

        {status?.configured && (
          <View className="mt-2 gap-1">
            <InfoRow label="Chave" value={status.maskedKey || "****"} />
            <InfoRow label="Ambiente" value={status.ambiente === "teste" ? "Sandbox (Teste)" : "Produ\u00e7\u00e3o"} />
            <InfoRow label="Conta" value={status.contaNome || "N/A"} />
            <InfoRow label="Email" value={status.contaEmail || "N/A"} />
            <InfoRow label="CPF/CNPJ" value={status.contaCpfCnpj || "N/A"} />
            <InfoRow label="Validada" value={status.testeado ? "Sim" : "N\u00e3o"} color={status.testeado ? colors.success : colors.error} />
            {status.ultimoTeste && (
              <InfoRow label="\u00daltimo teste" value={String(status.ultimoTeste).substring(0, 19)} />
            )}
          </View>
        )}
      </View>

      {/* Remove Button (if configured) */}
      {status?.configured && (
        <Pressable
          onPress={handleRemove}
          disabled={removing}
          style={({ pressed }) => ({
            backgroundColor: colors.error,
            paddingVertical: 12,
            borderRadius: 10,
            opacity: pressed || removing ? 0.7 : 1,
            marginBottom: 16,
          })}
        >
          {removing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Remover Chave Atual</Text>
          )}
        </Pressable>
      )}

      {/* Configuration Form */}
      <View className="bg-surface rounded-xl p-4 border border-border mb-4">
        <Text className="font-bold text-foreground mb-1">
          {status?.configured ? "Atualizar Chave API" : "Configurar Chave API"}
        </Text>
        <Text className="text-xs text-muted mb-4">
          Insira sua chave API do Asaas. A chave ser\u00e1 validada antes de salvar.
        </Text>

        {/* Ambiente Selector */}
        <Text className="text-sm font-semibold text-foreground mb-2">Ambiente</Text>
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => setAmbiente("teste")}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: ambiente === "teste" ? colors.primary : colors.border,
              backgroundColor: ambiente === "teste" ? colors.primary + "15" : colors.background,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", fontSize: 13, color: ambiente === "teste" ? colors.primary : colors.muted }}>
              Sandbox (Teste)
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAmbiente("producao")}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: ambiente === "producao" ? colors.primary : colors.border,
              backgroundColor: ambiente === "producao" ? colors.primary + "15" : colors.background,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", fontSize: 13, color: ambiente === "producao" ? colors.primary : colors.muted }}>
              Produ\u00e7\u00e3o
            </Text>
          </Pressable>
        </View>

        {/* API Key Input */}
        <Text className="text-sm font-semibold text-foreground mb-2">Chave API</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <TextInput
            placeholder="$aact_... ou chave de produ\u00e7\u00e3o"
            value={apiKey}
            onChangeText={(text) => {
              setApiKey(text);
              setValidationResult(null);
            }}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: validationResult?.valid ? colors.success : (validationResult && !validationResult.valid) ? colors.error : colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              color: colors.foreground,
              fontSize: 14,
              fontFamily: "monospace",
            }}
            placeholderTextColor={colors.muted}
          />
          <Pressable
            onPress={() => setShowKey(!showKey)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 12,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
              {showKey ? "Ocultar" : "Mostrar"}
            </Text>
          </Pressable>
        </View>

        {/* Validation Result */}
        {validationResult && (
          <View
            style={{
              backgroundColor: validationResult.valid ? colors.success + "15" : colors.error + "15",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: validationResult.valid ? colors.success + "40" : colors.error + "40",
            }}
          >
            {validationResult.valid ? (
              <View className="gap-1">
                <Text style={{ color: colors.success, fontWeight: "700", fontSize: 14 }}>\u2705 Chave V\u00e1lida</Text>
                <Text style={{ color: colors.foreground, fontSize: 12 }}>Conta: {validationResult.conta?.nome}</Text>
                <Text style={{ color: colors.foreground, fontSize: 12 }}>Email: {validationResult.conta?.email}</Text>
                <Text style={{ color: colors.foreground, fontSize: 12 }}>CPF/CNPJ: {validationResult.conta?.cpfCnpj}</Text>
              </View>
            ) : (
              <Text style={{ color: colors.error, fontWeight: "600", fontSize: 13 }}>
                \u274C {validationResult.error}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3">
          <Pressable
            onPress={handleValidate}
            disabled={validating || !apiKey.trim()}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              paddingVertical: 14,
              borderRadius: 10,
              opacity: pressed || validating || !apiKey.trim() ? 0.6 : 1,
            })}
          >
            {validating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "700", textAlign: "center", fontSize: 15 }}>
                Validar Chave
              </Text>
            )}
          </Pressable>

          {validationResult?.valid && (
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: colors.success,
                paddingVertical: 14,
                borderRadius: 10,
                opacity: pressed || saving ? 0.6 : 1,
              })}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontWeight: "700", textAlign: "center", fontSize: 15 }}>
                  Salvar Chave
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Help Info */}
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="font-semibold text-foreground mb-2">Como obter sua chave API</Text>
        <View className="gap-2">
          <Text className="text-sm text-muted">1. Acesse sua conta em asaas.com</Text>
          <Text className="text-sm text-muted">2. V\u00e1 em Configura\u00e7\u00f5es {'>'} Integra\u00e7\u00f5es</Text>
          <Text className="text-sm text-muted">3. Gere uma nova chave API</Text>
          <Text className="text-sm text-muted">4. Copie a chave e cole acima</Text>
        </View>
        <View style={{ marginTop: 12, backgroundColor: colors.warning + "15", borderRadius: 8, padding: 10 }}>
          <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "600" }}>
            Dica: Use o ambiente Sandbox para testes. A chave de teste come\u00e7a com $aact_
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * Helper Components
 */
function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useColors();
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-muted">{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: color || colors.foreground }}>{value}</Text>
    </View>
  );
}
