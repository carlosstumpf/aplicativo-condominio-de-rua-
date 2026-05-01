/**
 * Admin Monthly Fees Management Screen
 * Connected to real backend data via tRPC + Asaas integration
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
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type FeeTab = "cobrancas" | "moradores" | "inadimplentes" | "gerar" | "locais";

export default function AdminFeesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<FeeTab>("cobrancas");

  const tabs: Array<{ id: FeeTab; label: string }> = [
    { id: "cobrancas", label: "Cobranças" },
    { id: "moradores", label: "Moradores" },
    { id: "inadimplentes", label: "Inadimplentes" },
    { id: "locais", label: "Locais" },
    { id: "gerar", label: "Gerar" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>Mensalidades</Text>
        </View>

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

        {activeTab === "cobrancas" && <CobrancasTab />}
        {activeTab === "moradores" && <MoradoresTab />}
        {activeTab === "inadimplentes" && <InadimplentesTab />}
        {activeTab === "locais" && <LocalCobrancasTab />}
        {activeTab === "gerar" && <GerarCobrancaTab />}
      </View>
    </ScreenContainer>
  );
}

/**
 * Cobranças Tab - List real charges with PIX/Boleto details
 */
function CobrancasTab() {
  const colors = useColors();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const currentMes = new Date().toISOString().split("T")[0].substring(0, 7);

  const cobrancasQuery = trpc.cobrancas.list.useQuery(
    {
      mesReferencia: currentMes,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    },
    { retry: 1, staleTime: 15000 }
  );
  const syncMutation = trpc.cobrancas.syncStatus.useMutation();
  const utils = trpc.useUtils();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cobrancasQuery.refetch();
    setRefreshing(false);
  }, []);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  const cobrancas = Array.isArray(cobrancasQuery.data) ? cobrancasQuery.data : [];

  const statusFilters = [
    { id: "all", label: "Todas" },
    { id: "PENDING", label: "Pendentes" },
    { id: "RECEIVED", label: "Pagas" },
    { id: "OVERDUE", label: "Vencidas" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECEIVED": return colors.success;
      case "PENDING": return colors.warning;
      case "OVERDUE": return colors.error;
      case "CANCELLED": return colors.muted;
      default: return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RECEIVED": return "Pago";
      case "PENDING": return "Pendente";
      case "OVERDUE": return "Vencido";
      case "CANCELLED": return "Cancelado";
      default: return status;
    }
  };

  const handleSync = async (asaasPaymentId: string) => {
    try {
      const result = await syncMutation.mutateAsync({ asaasPaymentId });
      if (result.success) {
        Alert.alert("Atualizado", `Status: ${result.status}${result.asaasStatus ? ` (Asaas: ${result.asaasStatus})` : ""}`);
        utils.cobrancas.list.invalidate();
      } else {
        Alert.alert("Erro", result.error || "Erro ao sincronizar.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao sincronizar status.");
    }
  };

  const handleCopyPix = async (copyPaste: string) => {
    try {
      await Clipboard.setStringAsync(copyPaste);
      Alert.alert("Copiado!", "Codigo PIX copiado para a area de transferencia.");
    } catch {
      Alert.alert("Erro", "Nao foi possivel copiar.");
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {statusFilters.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setStatusFilter(f.id)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: statusFilter === f.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: statusFilter === f.id ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: statusFilter === f.id ? "white" : colors.foreground }}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Summary */}
      <View className="bg-surface rounded-xl p-4 border border-border mb-4">
        <Text className="text-sm font-semibold text-foreground mb-2">Resumo - {currentMes}</Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-lg font-bold" style={{ color: colors.primary }}>{cobrancas.length}</Text>
            <Text className="text-xs text-muted">Total</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold" style={{ color: colors.success }}>
              {cobrancas.filter((c: any) => c.status === "RECEIVED").length}
            </Text>
            <Text className="text-xs text-muted">Pagas</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold" style={{ color: colors.warning }}>
              {cobrancas.filter((c: any) => c.status === "PENDING").length}
            </Text>
            <Text className="text-xs text-muted">Pendentes</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold" style={{ color: colors.error }}>
              {cobrancas.filter((c: any) => c.status === "OVERDUE").length}
            </Text>
            <Text className="text-xs text-muted">Vencidas</Text>
          </View>
        </View>
      </View>

      {cobrancasQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-2">Carregando cobranças...</Text>
        </View>
      ) : cobrancas.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-muted text-center">Nenhuma cobrança encontrada para este mês.</Text>
          <Text className="text-xs text-muted mt-1">Use a aba "Gerar" para criar novas cobranças.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {cobrancas.map((c: any) => {
            const isExpanded = expandedId === c.id;
            const isAsaas = c.asaasPaymentId && !c.asaasPaymentId.startsWith("local_");
            return (
              <Pressable
                key={c.id}
                onPress={() => setExpandedId(isExpanded ? null : c.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <View className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {c.descricao || `Cobrança #${c.id}`}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        Tel: {c.telefone} | {c.tipo === "PIX" ? "PIX" : "Boleto"}
                      </Text>
                      <Text className="text-xs text-muted">Vence: {c.vencimento}</Text>
                      {isAsaas && (
                        <Text className="text-xs mt-1" style={{ color: colors.primary }}>
                          Asaas: {c.asaasPaymentId}
                        </Text>
                      )}
                      {!isAsaas && (
                        <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                          Modo local (sem Asaas)
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="font-bold" style={{ color: colors.primary }}>
                        {formatarMoeda(c.valor)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: getStatusColor(c.status) + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          marginTop: 4,
                        }}
                      >
                        <Text style={{ color: getStatusColor(c.status), fontSize: 11, fontWeight: "600" }}>
                          {getStatusLabel(c.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                      {/* PIX Details */}
                      {c.tipo === "PIX" && c.pixCopyPaste && (
                        <View className="mb-3">
                          <Text className="text-sm font-semibold text-foreground mb-1">Codigo PIX (Copia e Cola)</Text>
                          <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "monospace" }} numberOfLines={3}>
                              {c.pixCopyPaste}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleCopyPix(c.pixCopyPaste)}
                            style={({ pressed }) => ({
                              backgroundColor: colors.primary,
                              paddingVertical: 8,
                              borderRadius: 8,
                              marginTop: 6,
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <Text style={{ color: "white", fontWeight: "600", textAlign: "center", fontSize: 13 }}>
                              Copiar Codigo PIX
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Boleto Details */}
                      {c.tipo === "BOLETO" && c.boletoUrl && (
                        <View className="mb-3">
                          <Text className="text-sm font-semibold text-foreground mb-1">Boleto</Text>
                          {c.boletoBarCode && (
                            <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 6 }}>
                              <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "monospace" }} numberOfLines={2}>
                                {c.boletoBarCode}
                              </Text>
                            </View>
                          )}
                          <Pressable
                            onPress={async () => {
                              try {
                                await Clipboard.setStringAsync(c.boletoBarCode || c.boletoUrl);
                                Alert.alert("Copiado!", "Codigo de barras copiado.");
                              } catch {
                                Alert.alert("Erro", "Nao foi possivel copiar.");
                              }
                            }}
                            style={({ pressed }) => ({
                              backgroundColor: colors.primary,
                              paddingVertical: 8,
                              borderRadius: 8,
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <Text style={{ color: "white", fontWeight: "600", textAlign: "center", fontSize: 13 }}>
                              Copiar Codigo de Barras
                            </Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Sync Status Button */}
                      {isAsaas && c.status === "PENDING" && (
                        <Pressable
                          onPress={() => handleSync(c.asaasPaymentId)}
                          disabled={syncMutation.isPending}
                          style={({ pressed }) => ({
                            backgroundColor: colors.surface,
                            paddingVertical: 10,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: colors.border,
                            opacity: pressed || syncMutation.isPending ? 0.6 : 1,
                          })}
                        >
                          {syncMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text style={{ color: colors.primary, fontWeight: "600", textAlign: "center", fontSize: 13 }}>
                              Sincronizar Status com Asaas
                            </Text>
                          )}
                        </Pressable>
                      )}

                      {/* No payment data message */}
                      {!c.pixCopyPaste && !c.boletoUrl && (
                        <Text className="text-xs text-muted text-center">
                          {isAsaas ? "Dados de pagamento sendo processados..." : "Cobrança local - sem dados de pagamento Asaas."}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Moradores Tab - List residents with their payment status
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
          <Text className="text-muted mt-2">Carregando moradores...</Text>
        </View>
      ) : moradores.length === 0 ? (
        <View className="items-center py-8">
          <Text className="text-muted text-center">Nenhum morador encontrado.</Text>
          <Text className="text-xs text-muted mt-1">Cadastre moradores na tela de Configurações.</Text>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="text-sm text-muted mb-1">
            {pagination?.total ?? moradores.length} morador(es) encontrado(s)
          </Text>
          {moradores.map((m: any) => (
            <View key={m.id} className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{m.nomeCompleto}</Text>
                  <Text className="text-xs text-muted mt-1">Casa: {m.identificacaoCasa}</Text>
                  <Text className="text-xs text-muted">Tel: {m.telefone}</Text>
                </View>
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
              </View>
            </View>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <View className="flex-row justify-center items-center gap-4 mt-4">
              <Pressable
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={!pagination.hasPreviousPage}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
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
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
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
 * Inadimplentes Tab - List delinquent residents
 */
function InadimplentesTab() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const inadimplentesQuery = trpc.moradores.getInadimplentes.useQuery(
    { page: 1, limit: 100 },
    { retry: 1, staleTime: 15000 }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await inadimplentesQuery.refetch();
    setRefreshing(false);
  }, []);

  const inadimplentes = inadimplentesQuery.data?.data || [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-surface rounded-xl p-4 border border-border mb-4" style={{ borderColor: colors.error }}>
        <View className="flex-row items-center gap-2">
          <Text style={{ fontSize: 24 }}>⚠️</Text>
          <View>
            <Text className="font-bold text-foreground">Moradores Inadimplentes</Text>
            <Text className="text-sm text-muted">
              {inadimplentes.length} morador(es) sem pagamento no mês atual
            </Text>
          </View>
        </View>
      </View>

      {inadimplentesQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-2">Carregando inadimplentes...</Text>
        </View>
      ) : inadimplentes.length === 0 ? (
        <View className="items-center py-8">
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text className="text-foreground font-semibold mt-2">Nenhum inadimplente!</Text>
          <Text className="text-muted text-sm mt-1">Todos os moradores estão em dia.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {inadimplentes.map((m: any) => (
            <View key={m.id} className="bg-surface rounded-xl p-4 border border-border" style={{ borderLeftWidth: 4, borderLeftColor: colors.error }}>
              <Text className="font-semibold text-foreground">{m.nomeCompleto}</Text>
              <Text className="text-xs text-muted mt-1">Tel: {m.telefone}</Text>
              <View
                style={{
                  backgroundColor: colors.error + "15",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginTop: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: colors.error, fontSize: 11, fontWeight: "600" }}>
                  Sem pagamento no mês atual
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Gerar Cobrança Tab - Create new charges with Asaas integration
 * Selects morador from list, auto-fills data, generates real PIX/Boleto
 */
function GerarCobrancaTab() {
  const colors = useColors();
  const [selectedMorador, setSelectedMorador] = useState<any>(null);
  const [tipo, setTipo] = useState<"PIX" | "BOLETO">("PIX");
  const [valor, setValor] = useState("350.00");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showMoradorList, setShowMoradorList] = useState(false);

  const currentMes = new Date().toISOString().split("T")[0].substring(0, 7);
  const vencimento = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const moradoresQuery = trpc.moradores.list.useQuery(
    { page: 1, limit: 100, status: "ativo" },
    { retry: 1, staleTime: 30000 }
  );
  const asaasStatus = trpc.asaasConfig.getStatus.useQuery(undefined, { retry: 1, staleTime: 30000 });
  const createCobranca = trpc.cobrancas.create.useMutation();
  const utils = trpc.useUtils();

  const moradores = moradoresQuery.data?.data || [];
  const isAsaasConfigured = asaasStatus.data?.configured === true;

  const handleSubmit = async () => {
    if (!selectedMorador) {
      Alert.alert("Erro", "Selecione um morador.");
      return;
    }

    const valorCentavos = Math.round(parseFloat(valor) * 100);
    if (isNaN(valorCentavos) || valorCentavos <= 0) {
      Alert.alert("Erro", "Valor inválido.");
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);
    try {
      const result = await createCobranca.mutateAsync({
        moradorId: selectedMorador.id,
        tipo,
        mesReferencia: currentMes,
        valor: valorCentavos,
        vencimento,
        descricao: descricao || `Mensalidade ${currentMes} - ${selectedMorador.nomeCompleto}`,
      });

      setLastResult(result);

      if (result.success) {
        Alert.alert(
          "Cobrança Criada!",
          result.mode === "asaas"
            ? `${tipo} gerado via Asaas com sucesso!\nID: ${result.paymentId}`
            : "Cobrança salva localmente (Asaas não configurado)."
        );
        utils.cobrancas.list.invalidate();
      } else {
        Alert.alert("Erro", (result as any).error || "Erro ao criar cobrança.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao criar cobrança.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copiado!", "Codigo PIX copiado.");
    } catch {
      Alert.alert("Erro", "Nao foi possivel copiar.");
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-2">Gerar Nova Cobrança</Text>

      {/* Asaas Status Banner */}
      <View
        style={{
          backgroundColor: isAsaasConfigured ? colors.success + "15" : colors.warning + "15",
          borderRadius: 10,
          padding: 10,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isAsaasConfigured ? colors.success + "40" : colors.warning + "40",
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: isAsaasConfigured ? colors.success : colors.warning }}>
          {isAsaasConfigured
            ? `Asaas ${asaasStatus.data?.ambiente === "teste" ? "(Sandbox)" : "(Produção)"} conectado - PIX/Boleto real será gerado`
            : "Asaas não configurado - cobrança será salva apenas localmente"}
        </Text>
      </View>

      {/* Morador Selector */}
      <View className="gap-2 mb-4">
        <Text className="text-sm font-semibold text-foreground">Morador *</Text>
        <Pressable
          onPress={() => setShowMoradorList(!showMoradorList)}
          style={({ pressed }) => ({
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: selectedMorador ? colors.primary : colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 12,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {selectedMorador ? (
            <View>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>{selectedMorador.nomeCompleto}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Casa: {selectedMorador.identificacaoCasa} | Tel: {selectedMorador.telefone}
              </Text>
            </View>
          ) : (
            <Text style={{ color: colors.muted }}>Toque para selecionar um morador...</Text>
          )}
        </Pressable>

        {showMoradorList && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, maxHeight: 200 }}>
            <ScrollView nestedScrollEnabled>
              {moradoresQuery.isLoading ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : moradores.length === 0 ? (
                <Text className="text-muted text-center py-4 text-sm">Nenhum morador cadastrado.</Text>
              ) : (
                moradores.map((m: any) => (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setSelectedMorador(m);
                      setShowMoradorList(false);
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: selectedMorador?.id === m.id ? colors.primary + "15" : "transparent",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontWeight: "600", color: colors.foreground }}>{m.nomeCompleto}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>Casa: {m.identificacaoCasa} | CPF: {m.cpf}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Tipo */}
      <View className="gap-2 mb-4">
        <Text className="text-sm font-semibold text-foreground">Tipo de Cobrança</Text>
        <View className="flex-row gap-3">
          {(["PIX", "BOLETO"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTipo(t)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: tipo === t ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: tipo === t ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ textAlign: "center", fontWeight: "600", color: tipo === t ? "white" : colors.foreground }}>
                {t === "PIX" ? "PIX" : "Boleto"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Valor */}
      <View className="gap-2 mb-4">
        <Text className="text-sm font-semibold text-foreground">Valor (R$) *</Text>
        <TextInput
          placeholder="Ex: 350.00"
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.foreground,
          }}
          placeholderTextColor={colors.muted}
        />
      </View>

      {/* Vencimento Info */}
      <View className="gap-1 mb-4">
        <Text className="text-sm font-semibold text-foreground">Vencimento</Text>
        <Text className="text-sm text-muted">{vencimento} (7 dias a partir de hoje)</Text>
      </View>

      {/* Descrição */}
      <View className="gap-2 mb-4">
        <Text className="text-sm font-semibold text-foreground">Descrição</Text>
        <TextInput
          placeholder={`Mensalidade ${currentMes}`}
          value={descricao}
          onChangeText={setDescricao}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.foreground,
          }}
          placeholderTextColor={colors.muted}
        />
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting || !selectedMorador}
        style={({ pressed }) => ({
          backgroundColor: isAsaasConfigured ? colors.success : colors.primary,
          paddingVertical: 14,
          borderRadius: 10,
          opacity: pressed || isSubmitting || !selectedMorador ? 0.6 : 1,
          marginTop: 8,
        })}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "700", textAlign: "center", fontSize: 15 }}>
            {isAsaasConfigured ? `Gerar ${tipo} via Asaas` : "Gerar Cobrança (Local)"}
          </Text>
        )}
      </Pressable>

      {/* Result Display */}
      {lastResult && lastResult.success && (
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.success + "15",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.success + "40",
          }}
        >
          <Text style={{ color: colors.success, fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
            Cobrança Gerada!
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 13, marginBottom: 4 }}>
            Modo: {lastResult.mode === "asaas" ? "Asaas (Real)" : "Local"}
          </Text>
          {lastResult.paymentId && (
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
              ID: {lastResult.paymentId}
            </Text>
          )}

          {/* PIX Result */}
          {lastResult.pixCopyPaste && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13, marginBottom: 4 }}>
                Codigo PIX (Copia e Cola):
              </Text>
              <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "monospace" }} numberOfLines={4}>
                  {lastResult.pixCopyPaste}
                </Text>
              </View>
              <Pressable
                onPress={() => handleCopyPix(lastResult.pixCopyPaste)}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginTop: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
                  Copiar Codigo PIX
                </Text>
              </Pressable>
            </View>
          )}

          {/* Boleto Result */}
          {lastResult.boletoUrl && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 13, marginBottom: 4 }}>
                Boleto:
              </Text>
              {lastResult.boletoBarCode && (
                <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.muted, fontFamily: "monospace" }} numberOfLines={2}>
                    {lastResult.boletoBarCode}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={async () => {
                  try {
                    await Clipboard.setStringAsync(lastResult.boletoBarCode || lastResult.boletoUrl);
                    Alert.alert("Copiado!", "Codigo de barras copiado.");
                  } catch {
                    Alert.alert("Erro", "Nao foi possivel copiar.");
                  }
                }}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
                  Copiar Codigo de Barras
                </Text>
              </Pressable>
            </View>
          )}

          {lastResult.invoiceUrl && (
            <Text style={{ color: colors.primary, fontSize: 12, marginTop: 8 }}>
              Fatura: {lastResult.invoiceUrl}
            </Text>
          )}
        </View>
      )}

      {/* Error Result */}
      {lastResult && !lastResult.success && (
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.error + "15",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.error + "40",
          }}
        >
          <Text style={{ color: colors.error, fontWeight: "600" }}>
            Erro: {lastResult.error}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}


/**
 * Local Cobranças Tab - Recreate local charges with real Asaas IDs
 * Shows charges with local_* IDs and allows converting them to real Asaas charges
 */
function LocalCobrancasTab() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [recreatingId, setRecreatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const cobrancasQuery = trpc.cobrancas.list.useQuery(
    { status: "PENDING" },
    { retry: 1, staleTime: 15000 }
  );
  const recreateMutation = trpc.cobrancas.recreateWithAsaasId.useMutation();
  const sendWhatsAppMutation = trpc.cobrancas.sendViaWhatsApp.useMutation();
  const utils = trpc.useUtils();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cobrancasQuery.refetch();
    setRefreshing(false);
  }, []);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  const cobrancas = Array.isArray(cobrancasQuery.data) ? cobrancasQuery.data : [];
  const localCobrancas = cobrancas.filter((c: any) => c.asaasPaymentId && c.asaasPaymentId.startsWith("local_"));

  const handleRecreate = async (asaasPaymentId: string) => {
    try {
      setRecreatingId(asaasPaymentId);
      const result = await recreateMutation.mutateAsync({ asaasPaymentId });
      
      if (result.success) {
        const cobranca = cobrancas.find((c: any) => c.asaasPaymentId === asaasPaymentId);
        const tipo = cobranca?.tipo || "PIX";
        
        // Send WhatsApp message automatically
        try {
          await sendWhatsAppMutation.mutateAsync({
            asaasPaymentId: result.newPaymentId,
            moradorId: cobranca?.moradorId || 0,
            telefone: cobranca?.telefone || "",
            tipo: tipo as "PIX" | "BOLETO",
            valor: cobranca?.valor || 0,
            pixCopyPaste: result.pixCopyPaste,
            boletoBarCode: result.boletoBarCode,
            boletoUrl: result.boletoUrl,
          });
        } catch (whatsappError) {
          console.error("Erro ao enviar WhatsApp:", whatsappError);
        }
        
        let successMessage = `✅ Cobrança recriada com sucesso!\n\nID novo: ${result.newPaymentId}\n`;
        
        if (tipo === "PIX" && result.pixCopyPaste) {
          successMessage += `\n📱 PIX (Copia e Cola):\n${result.pixCopyPaste.substring(0, 50)}...`;
        } else if (tipo === "BOLETO" && result.boletoBarCode) {
          successMessage += `\n📄 Código de Barras:\n${result.boletoBarCode}`;
        }
        
        successMessage += `\n\n📱 Mensagem enviada para o morador via WhatsApp!`;
        
        Alert.alert("Sucesso!", successMessage, [
          { text: "OK", onPress: () => utils.cobrancas.list.invalidate() },
        ]);
      } else {
        Alert.alert("Erro", result.error || "Erro ao recriar cobrança.");
      }
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao recriar cobrança.");
    } finally {
      setRecreatingId(null);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-surface rounded-xl p-4 border border-border mb-4">
        <View className="flex-row items-center gap-2">
          <Text style={{ fontSize: 24 }}>🔄</Text>
          <View>
            <Text className="font-bold text-foreground">Cobranças Locais</Text>
            <Text className="text-sm text-muted">
              {localCobrancas.length} cobrança(s) aguardando conversão para Asaas
            </Text>
          </View>
        </View>
      </View>

      {cobrancasQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-2">Carregando cobranças...</Text>
        </View>
      ) : localCobrancas.length === 0 ? (
        <View className="items-center py-8">
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text className="text-foreground font-semibold mt-2">Nenhuma cobrança local!</Text>
          <Text className="text-muted text-sm mt-1">Todas as cobranças estão com IDs reais da Asaas.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {localCobrancas.map((c: any) => {
            const isExpanded = expandedId === c.id;
            const isRecreating = recreatingId === c.asaasPaymentId;
            return (
              <Pressable
                key={c.id}
                onPress={() => setExpandedId(isExpanded ? null : c.id)}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <View className="bg-surface rounded-xl p-4 border border-border" style={{ borderLeftWidth: 4, borderLeftColor: colors.warning }}>
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {c.descricao || `Cobrança #${c.id}`}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        Morador: {c.telefone}
                      </Text>
                      <Text className="text-xs text-muted">
                        Tipo: {c.tipo === "PIX" ? "PIX" : "Boleto"}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: colors.warning }}>
                        ID Local: {c.asaasPaymentId}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-bold" style={{ color: colors.primary }}>
                        {formatarMoeda(c.valor)}
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.warning + "20",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          marginTop: 4,
                        }}
                      >
                        <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "600" }}>
                          Pendente
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text className="text-sm font-semibold text-foreground mb-3">
                        Ações
                      </Text>
                      <Pressable
                        onPress={() => handleRecreate(c.asaasPaymentId)}
                        disabled={isRecreating}
                        style={({ pressed }) => ({
                          backgroundColor: isRecreating ? colors.muted : colors.primary,
                          paddingVertical: 12,
                          borderRadius: 8,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          {isRecreating && <ActivityIndicator size="small" color="white" />}
                          <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>
                            {isRecreating ? "Recriando..." : "🔄 Recriar com ID Real"}
                          </Text>
                        </View>
                      </Pressable>
                      <View
                        style={{
                          backgroundColor: colors.success + "15",
                          borderRadius: 8,
                          padding: 10,
                          marginTop: 12,
                          borderLeftWidth: 3,
                          borderLeftColor: colors.success,
                        }}
                      >
                        <Text className="text-xs" style={{ color: colors.success, fontWeight: "600" }}>
                          📱 Mensagem será enviada automaticamente para o morador via WhatsApp
                        </Text>
                      </View>
                      <Text className="text-xs text-muted mt-3">
                        Ao clicar, a cobrança será convertida para um ID real da Asaas, o PIX/Boleto será gerado e enviado via WhatsApp.
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
