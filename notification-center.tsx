/**
 * Notification Center Screen
 * Connected to real backend data via tRPC notificacoes router
 */

import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type NotifTab = "notificacoes" | "chamados" | "resumo";

export default function NotificationCenterScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<NotifTab>("notificacoes");

  const unreadQuery = trpc.notificacoes.getUnreadCount.useQuery(undefined, {
    retry: 1,
    staleTime: 10000,
  });

  const unreadCount = unreadQuery.data?.count ?? 0;

  const tabs: Array<{ id: NotifTab; label: string; badge?: number }> = [
    { id: "notificacoes", label: "Notificações", badge: unreadCount },
    { id: "chamados", label: "Chamados" },
    { id: "resumo", label: "Resumo" },
  ];

  return (
    <ScreenContainer className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>Central de Notificações</Text>
          {unreadCount > 0 && (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 }}>
              {unreadCount} não lida(s)
            </Text>
          )}
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
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
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
              {tab.badge && tab.badge > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.error,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{tab.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {activeTab === "notificacoes" && <NotificacoesTab />}
        {activeTab === "chamados" && <ChamadosTab />}
        {activeTab === "resumo" && <ResumoTab />}
      </View>
    </ScreenContainer>
  );
}

/**
 * Notificações Tab - Real notifications from database
 */
function NotificacoesTab() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filterLidas, setFilterLidas] = useState<"todas" | "naoLidas" | "lidas">("todas");

  const notifQuery = trpc.notificacoes.list.useQuery(
    { page: 1, limit: 50, lidas: filterLidas },
    { retry: 1, staleTime: 10000 }
  );

  const markAsRead = trpc.notificacoes.markAsRead.useMutation();
  const markAllAsRead = trpc.notificacoes.markAllAsRead.useMutation();
  const deleteNotif = trpc.notificacoes.delete.useMutation();
  const utils = trpc.useUtils();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await notifQuery.refetch();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync({ id });
      utils.notificacoes.list.invalidate();
      utils.notificacoes.getUnreadCount.invalidate();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao marcar como lida.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      utils.notificacoes.list.invalidate();
      utils.notificacoes.getUnreadCount.invalidate();
      Alert.alert("Sucesso", "Todas as notificações foram marcadas como lidas.");
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao marcar todas como lidas.");
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Excluir", "Deseja excluir esta notificação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNotif.mutateAsync({ id });
            utils.notificacoes.list.invalidate();
            utils.notificacoes.getUnreadCount.invalidate();
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Erro ao excluir.");
          }
        },
      },
    ]);
  };

  const notificacoes = notifQuery.data?.data || [];

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "PAGAMENTO": return "💰";
      case "VENCIMENTO": return "📅";
      case "CHAMADO": return "🔧";
      default: return "🔔";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "PAGAMENTO": return "Pagamento";
      case "VENCIMENTO": return "Vencimento";
      case "CHAMADO": return "Chamado";
      default: return tipo;
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Filters */}
      <View className="flex-row gap-2 mb-3">
        {(["todas", "naoLidas", "lidas"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilterLidas(f)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filterLidas === f ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: filterLidas === f ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: filterLidas === f ? "white" : colors.foreground }}>
              {f === "todas" ? "Todas" : f === "naoLidas" ? "Não Lidas" : "Lidas"}
            </Text>
          </Pressable>
        ))}

        {/* Mark all as read */}
        <Pressable
          onPress={handleMarkAllAsRead}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
            marginLeft: "auto",
          })}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>Ler Todas</Text>
        </Pressable>
      </View>

      {notifQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-2">Carregando notificações...</Text>
        </View>
      ) : notificacoes.length === 0 ? (
        <View className="items-center py-8">
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text className="text-foreground font-semibold mt-2">Nenhuma notificação</Text>
          <Text className="text-muted text-sm mt-1">Você está em dia!</Text>
        </View>
      ) : (
        <View className="gap-3">
          {notificacoes.map((n: any) => (
            <View
              key={n.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 4,
                borderLeftColor: n.lida ? colors.border : colors.primary,
                opacity: n.lida ? 0.7 : 1,
              }}
            >
              <View className="flex-row items-start gap-3">
                <Text style={{ fontSize: 24 }}>{getTipoIcon(n.tipo)}</Text>
                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="font-semibold text-foreground flex-1" numberOfLines={2}>
                      {n.titulo}
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.primary + "20",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600" }}>
                        {getTipoLabel(n.tipo)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted mt-1" numberOfLines={3}>
                    {n.mensagem}
                  </Text>
                  <Text className="text-xs text-muted mt-2">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString("pt-BR") : ""}
                  </Text>

                  {/* Actions */}
                  <View className="flex-row gap-2 mt-3">
                    {!n.lida && (
                      <Pressable
                        onPress={() => handleMarkAsRead(n.id)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: colors.primary + "15",
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>Marcar como lida</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDelete(n.id)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: colors.error + "15",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 12, color: colors.error, fontWeight: "600" }}>Excluir</Text>
                    </Pressable>
                  </View>
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
 * Chamados Tab - Real tickets from database
 */
function ChamadosTab() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const chamadosQuery = trpc.chamados.list.useQuery(
    { page: 1, limit: 50 },
    { retry: 1, staleTime: 15000 }
  );

  const updateStatus = trpc.chamados.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chamadosQuery.refetch();
    setRefreshing(false);
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: "ABERTO" | "EM_ANDAMENTO" | "RESOLVIDO" | "FECHADO") => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      utils.chamados.list.invalidate();
      Alert.alert("Sucesso", `Status atualizado para ${newStatus.replace("_", " ")}`);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Erro ao atualizar status.");
    }
  };

  const chamados = chamadosQuery.data?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ABERTO": return colors.error;
      case "EM_ANDAMENTO": return colors.warning;
      case "RESOLVIDO": return colors.success;
      case "FECHADO": return colors.muted;
      default: return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ABERTO": return "Aberto";
      case "EM_ANDAMENTO": return "Em Andamento";
      case "RESOLVIDO": return "Resolvido";
      case "FECHADO": return "Fechado";
      default: return status;
    }
  };

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case "MANUTENCAO": return "🔧";
      case "SEGURANCA": return "🔒";
      case "LIMPEZA": return "🧹";
      default: return "📋";
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {chamadosQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-2">Carregando chamados...</Text>
        </View>
      ) : chamados.length === 0 ? (
        <View className="items-center py-8">
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text className="text-foreground font-semibold mt-2">Nenhum chamado</Text>
          <Text className="text-muted text-sm mt-1">Nenhum chamado registrado.</Text>
        </View>
      ) : (
        <View className="gap-3">
          {chamados.map((c: any) => (
            <View
              key={c.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                borderLeftWidth: 4,
                borderLeftColor: getStatusColor(c.status),
              }}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    {getCategoriaIcon(c.categoria)} {c.titulo}
                  </Text>
                  <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                    {c.descricao}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Prioridade: {c.prioridade}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: getStatusColor(c.status) + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: getStatusColor(c.status), fontSize: 11, fontWeight: "600" }}>
                    {getStatusLabel(c.status)}
                  </Text>
                </View>
              </View>

              {/* Status Actions */}
              {c.status !== "FECHADO" && (
                <View className="flex-row gap-2 mt-3">
                  {c.status === "ABERTO" && (
                    <Pressable
                      onPress={() => handleUpdateStatus(c.id, "EM_ANDAMENTO")}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: colors.warning + "20",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.warning }}>
                        Iniciar
                      </Text>
                    </Pressable>
                  )}
                  {(c.status === "ABERTO" || c.status === "EM_ANDAMENTO") && (
                    <Pressable
                      onPress={() => handleUpdateStatus(c.id, "RESOLVIDO")}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: colors.success + "20",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.success }}>
                        Resolver
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleUpdateStatus(c.id, "FECHADO")}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.muted + "20",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.muted }}>
                      Fechar
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/**
 * Resumo Tab - Statistics overview from real data
 */
function ResumoTab() {
  const colors = useColors();
  const currentMes = new Date().toISOString().split("T")[0].substring(0, 7);

  const resumoQuery = trpc.relatorios.resumoMes.useQuery(
    { mesReferencia: currentMes },
    { retry: 1, staleTime: 30000 }
  );

  const chamadosStatsQuery = trpc.chamados.getStatistics.useQuery(undefined, {
    retry: 1,
    staleTime: 30000,
  });

  const notifStatsQuery = trpc.notificacoes.getStatistics.useQuery(undefined, {
    retry: 1,
    staleTime: 30000,
  });

  const resumo = resumoQuery.data;
  const chamadosStats = chamadosStatsQuery.data?.stats;
  const notifStats = notifStatsQuery.data?.stats;

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-lg font-bold text-foreground mb-4">Resumo Geral</Text>

      {resumoQuery.isLoading ? (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View className="gap-4">
          {/* Financeiro */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Financeiro - {currentMes}</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted text-sm">Moradores Ativos:</Text>
                <Text className="font-bold" style={{ color: colors.success }}>{resumo?.moradores ?? 0}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted text-sm">Receitas:</Text>
                <Text className="font-bold" style={{ color: colors.success }}>
                  {formatarMoeda(resumo?.receitas ?? 0)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted text-sm">Despesas:</Text>
                <Text className="font-bold" style={{ color: colors.error }}>
                  {formatarMoeda(resumo?.despesas ?? 0)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted text-sm">Saldo:</Text>
                <Text className="font-bold" style={{ color: (resumo?.saldo ?? 0) >= 0 ? colors.success : colors.error }}>
                  {formatarMoeda(resumo?.saldo ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Chamados */}
          {chamadosStats && (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground mb-3">Chamados</Text>
              <View className="flex-row justify-between gap-2">
                <View className="items-center flex-1">
                  <Text className="text-lg font-bold" style={{ color: colors.error }}>{chamadosStats.abertos}</Text>
                  <Text className="text-xs text-muted">Abertos</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-lg font-bold" style={{ color: colors.warning }}>{chamadosStats.emAndamento}</Text>
                  <Text className="text-xs text-muted">Em Andamento</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-lg font-bold" style={{ color: colors.success }}>{chamadosStats.resolvidos}</Text>
                  <Text className="text-xs text-muted">Resolvidos</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-lg font-bold" style={{ color: colors.muted }}>{chamadosStats.fechados}</Text>
                  <Text className="text-xs text-muted">Fechados</Text>
                </View>
              </View>
            </View>
          )}

          {/* Notificações Stats */}
          {notifStats && (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="font-semibold text-foreground mb-3">Notificações</Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted text-sm">Total:</Text>
                  <Text className="font-bold text-foreground">{(notifStats as any).total ?? 0}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted text-sm">Não Lidas:</Text>
                  <Text className="font-bold" style={{ color: colors.primary }}>{(notifStats as any).naoLidas ?? 0}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
