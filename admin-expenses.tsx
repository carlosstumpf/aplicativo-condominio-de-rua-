/**
 * Admin Expense Tracking Screen
 * Connected to real backend data via tRPC despesas router
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

type ExpenseTab = "list" | "create" | "analytics";

export default function AdminExpensesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<ExpenseTab>("list");

  const tabs: Array<{ id: ExpenseTab; label: string }> = [
    { id: "list", label: "Listar" },
    { id: "create", label: "Nova" },
    { id: "analytics", label: "Análise" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>Despesas</Text>
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
        {activeTab === "list" && <ListTab />}
        {activeTab === "create" && <CreateTab onCreated={() => setActiveTab("list")} />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </View>
    </ScreenContainer>
  );
}

/**
 * List Expenses Tab - Real data from despesas.list
 */
function ListTab() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");

  const despesasQuery = trpc.despesas.list.useQuery(
    {
      page: 1,
      limit: 50,
      categoria: filterCategoria === "todos" ? undefined : filterCategoria,
    },
    { retry: 1, staleTime: 15000 }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await despesasQuery.refetch();
    setRefreshing(false);
  }, []);

  const despesas = despesasQuery.data?.data || [];

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case "MANUTENCAO": return "🔧";
      case "LIMPEZA": return "🧹";
      case "SEGURANCA": return "🔒";
      case "UTILIDADES": return "💡";
      case "OUTROS": return "📋";
      default: return "📋";
    }
  };

  const getCategoriaLabel = (cat: string) => {
    switch (cat) {
      case "MANUTENCAO": return "Manutenção";
      case "LIMPEZA": return "Limpeza";
      case "SEGURANCA": return "Segurança";
      case "UTILIDADES": return "Utilidades";
      case "OUTROS": return "Outros";
      default: return cat;
    }
  };

  const categorias = ["todos", "MANUTENCAO", "LIMPEZA", "SEGURANCA", "UTILIDADES", "OUTROS"];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {categorias.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setFilterCategoria(cat)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filterCategoria === cat ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: filterCategoria === cat ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: filterCategoria === cat ? "white" : colors.foreground }}>
                {cat === "todos" ? "Todas" : getCategoriaLabel(cat)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {despesasQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-2">Carregando despesas...</Text>
        </View>
      ) : despesas.length === 0 ? (
        <View className="items-center py-8">
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text className="text-foreground font-semibold mt-2">Nenhuma despesa</Text>
          <Text className="text-muted text-sm mt-1">Registre uma nova despesa na aba "Nova".</Text>
        </View>
      ) : (
        <View className="gap-3">
          {despesas.map((d: any) => (
            <View
              key={d.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    {getCategoriaIcon(d.categoria)} {d.descricao}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary + "20",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      alignSelf: "flex-start",
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>
                      {getCategoriaLabel(d.categoria)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.error }}>
                  {formatarMoeda(d.valor)}
                </Text>
              </View>
              <Text className="text-xs text-muted mt-2">
                {d.createdAt ? new Date(d.createdAt).toLocaleDateString("pt-BR") : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Create Expense Tab - Real creation via despesas.create
 */
function CreateTab({ onCreated }: { onCreated: () => void }) {
  const colors = useColors();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<"MANUTENCAO" | "LIMPEZA" | "SEGURANCA" | "UTILIDADES" | "OUTROS">("MANUTENCAO");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createDespesa = trpc.despesas.create.useMutation();
  const utils = trpc.useUtils();

  const handleCreate = async () => {
    if (!descricao.trim()) {
      Alert.alert("Erro", "Informe a descrição da despesa.");
      return;
    }
    if (!valor.trim() || isNaN(Number(valor.replace(",", ".")))) {
      Alert.alert("Erro", "Informe um valor válido.");
      return;
    }

    const valorCentavos = Math.round(Number(valor.replace(",", ".")) * 100);

    setIsSubmitting(true);
    try {
      await createDespesa.mutateAsync({
        descricao,
        valor: valorCentavos,
        categoria,
        data: new Date().toISOString(),
      });
      Alert.alert("Sucesso", "Despesa registrada com sucesso!");
      setDescricao("");
      setValor("");
      setCategoria("MANUTENCAO");
      utils.despesas.list.invalidate();
      utils.despesas.getStatistics.invalidate();
      utils.relatorios.resumoMes.invalidate();
      onCreated();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao registrar despesa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categorias: Array<{ id: "MANUTENCAO" | "LIMPEZA" | "SEGURANCA" | "UTILIDADES" | "OUTROS"; label: string; icon: string }> = [
    { id: "MANUTENCAO", label: "Manutenção", icon: "🔧" },
    { id: "LIMPEZA", label: "Limpeza", icon: "🧹" },
    { id: "SEGURANCA", label: "Segurança", icon: "🔒" },
    { id: "UTILIDADES", label: "Utilidades", icon: "💡" },
    { id: "OUTROS", label: "Outros", icon: "📋" },
  ];

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Nova Despesa</Text>

      {/* Descrição */}
      <View className="mb-4">
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Descrição</Text>
        <TextInput
          placeholder="Ex: Manutenção Hidráulica"
          value={descricao}
          onChangeText={setDescricao}
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
      </View>

      {/* Valor */}
      <View className="mb-4">
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Valor (R$)</Text>
        <TextInput
          placeholder="Ex: 1500.00"
          value={valor}
          onChangeText={setValor}
          keyboardType="decimal-pad"
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
      </View>

      {/* Categoria */}
      <View className="mb-4">
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Categoria</Text>
        <View className="flex-row flex-wrap gap-2">
          {categorias.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoria(cat.id)}
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: categoria === cat.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: categoria === cat.id ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: categoria === cat.id ? "white" : colors.foreground }}>
                {cat.icon} {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Submit */}
      <Pressable
        onPress={handleCreate}
        disabled={isSubmitting}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: 10,
          opacity: pressed || isSubmitting ? 0.7 : 1,
          marginTop: 8,
        })}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>Registrar Despesa</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

/**
 * Analytics Tab - Real statistics from despesas.getStatistics
 */
function AnalyticsTab() {
  const colors = useColors();

  const statsQuery = trpc.despesas.getStatistics.useQuery(
    {},
    { retry: 1, staleTime: 30000 }
  );

  const stats = statsQuery.data?.stats;

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  const getCategoriaLabel = (cat: string) => {
    switch (cat) {
      case "MANUTENCAO": return "Manutenção";
      case "LIMPEZA": return "Limpeza";
      case "SEGURANCA": return "Segurança";
      case "UTILIDADES": return "Utilidades";
      case "OUTROS": return "Outros";
      default: return cat;
    }
  };

  const getCategoriaColor = (cat: string) => {
    switch (cat) {
      case "MANUTENCAO": return "#F59E0B";
      case "LIMPEZA": return "#22C55E";
      case "SEGURANCA": return "#EF4444";
      case "UTILIDADES": return "#0a7ea4";
      case "OUTROS": return "#8B5CF6";
      default: return "#6B7280";
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Análise de Despesas</Text>

      {statsQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View className="gap-4">
          {/* Summary */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">Total de Despesas</Text>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.error }}>
                {formatarMoeda(stats?.total ?? 0)}
              </Text>
            </View>
            <Text className="text-xs text-muted mt-1">{stats?.count ?? 0} despesa(s) registrada(s)</Text>
          </View>

          {/* By Category */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Por Categoria</Text>
            <View className="gap-3">
              {stats?.byCategory && Object.entries(stats.byCategory).map(([cat, valor]) => {
                const total = stats.total || 1;
                const percentage = Math.round(((valor as number) / total) * 100);
                return (
                  <View key={cat} className="gap-1">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm font-semibold text-foreground">{getCategoriaLabel(cat)}</Text>
                      <Text style={{ fontSize: 13, fontWeight: "bold", color: getCategoriaColor(cat) }}>
                        {formatarMoeda(valor as number)}
                      </Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
                      <View
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          backgroundColor: getCategoriaColor(cat),
                          borderRadius: 4,
                        }}
                      />
                    </View>
                    <Text className="text-xs text-muted">{percentage}% do total</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
