/**
 * Admin Dashboard Screen - Connected to real backend data
 */

import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const currentMes = new Date().toISOString().split("T")[0].substring(0, 7);

  const resumoQuery = trpc.relatorios.resumoMes.useQuery(
    { mesReferencia: currentMes },
    { retry: 1, staleTime: 30000 }
  );
  const moradoresQuery = trpc.moradores.list.useQuery(
    { page: 1, limit: 5 },
    { retry: 1, staleTime: 30000 }
  );
  const cobrancasQuery = trpc.cobrancas.list.useQuery(
    { mesReferencia: currentMes },
    { retry: 1, staleTime: 30000 }
  );
  const despesasQuery = trpc.despesas.list.useQuery(
    { page: 1, limit: 5 },
    { retry: 1, staleTime: 30000 }
  );
  const chamadosQuery = trpc.chamados.getStatistics.useQuery(undefined, {
    retry: 1, staleTime: 30000,
  });
  const inadimplentesQuery = trpc.moradores.getInadimplentes.useQuery(
    { page: 1, limit: 100 },
    { retry: 1, staleTime: 30000 }
  );
  const notificacoesQuery = trpc.notificacoes.getUnreadCount.useQuery(undefined, {
    retry: 1, staleTime: 30000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      resumoQuery.refetch(), moradoresQuery.refetch(), cobrancasQuery.refetch(),
      despesasQuery.refetch(), chamadosQuery.refetch(), inadimplentesQuery.refetch(),
      notificacoesQuery.refetch(),
    ]);
    setRefreshing(false);
  }, []);

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((valor || 0) / 100);

  const resumo = resumoQuery.data;
  const cobrancasList = Array.isArray(cobrancasQuery.data) ? cobrancasQuery.data : [];
  const despesasList = despesasQuery.data?.data || [];
  const totalMoradores = moradoresQuery.data?.pagination?.total ?? 0;
  const totalInadimplentes = inadimplentesQuery.data?.pagination?.total ?? 0;
  const chamadosStats = chamadosQuery.data?.stats;
  const unreadNotifs = notificacoesQuery.data?.count ?? 0;
  const cobrancasPendentes = cobrancasList.filter((c: any) => c.status === "PENDING").length;
  const cobrancasRecebidas = cobrancasList.filter((c: any) => c.status === "RECEIVED").length;
  const isLoading = resumoQuery.isLoading || moradoresQuery.isLoading;

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ backgroundColor: colors.primary, marginHorizontal: -16, marginTop: -16, padding: 20, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 16 }}>
          <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>Dashboard</Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-3">Carregando dados...</Text>
          </View>
        ) : (
          <View className="gap-4">
            {/* Resumo Financeiro */}
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Resumo Financeiro</Text>
              <View className="flex-row flex-wrap gap-3">
                <StatCard label="Receitas" value={formatarMoeda(resumo?.receitas ?? 0)} color={colors.success} subtitle="Mês atual" />
                <StatCard label="Despesas" value={formatarMoeda(resumo?.despesas ?? 0)} color={colors.warning} subtitle="Mês atual" />
                <StatCard label="Saldo" value={formatarMoeda(resumo?.saldo ?? 0)} color={(resumo?.saldo ?? 0) >= 0 ? colors.success : colors.error} subtitle="Receitas - Despesas" />
                <StatCard label="Moradores" value={String(totalMoradores)} color={colors.primary} subtitle="Ativos" />
              </View>
            </View>

            {/* Cobranças do Mês */}
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Cobranças do Mês</Text>
              <View className="flex-row flex-wrap gap-3">
                <StatCard label="Total" value={String(cobrancasList.length)} color={colors.primary} subtitle="Cobranças geradas" />
                <StatCard label="Pendentes" value={String(cobrancasPendentes)} color={colors.warning} subtitle="Aguardando pgto" />
                <StatCard label="Recebidas" value={String(cobrancasRecebidas)} color={colors.success} subtitle="Pagas" />
                <StatCard label="Inadimplentes" value={String(totalInadimplentes)} color={colors.error} subtitle="Sem pagamento" />
              </View>
            </View>

            {/* Chamados */}
            {chamadosStats && (
              <View className="gap-3">
                <Text className="text-lg font-bold text-foreground">Chamados</Text>
                <View className="flex-row flex-wrap gap-3">
                  <StatCard label="Abertos" value={String(chamadosStats.abertos ?? 0)} color={colors.error} subtitle="Precisam atenção" />
                  <StatCard label="Em Andamento" value={String(chamadosStats.emAndamento ?? 0)} color={colors.warning} subtitle="Sendo resolvidos" />
                  <StatCard label="Resolvidos" value={String(chamadosStats.resolvidos ?? 0)} color={colors.success} subtitle="Este período" />
                </View>
              </View>
            )}

            {/* Notificações */}
            {unreadNotifs > 0 && (
              <Pressable
                onPress={() => router.push("/(tabs)/notification-center" as any)}
                style={({ pressed }) => ({ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.warning, borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", opacity: pressed ? 0.8 : 1 })}
              >
                <View>
                  <Text className="font-semibold text-foreground">Notificações Pendentes</Text>
                  <Text className="text-sm text-muted mt-1">Você tem {unreadNotifs} notificação(ões) não lida(s)</Text>
                </View>
                <View style={{ backgroundColor: colors.warning, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: "white", fontWeight: "bold" }}>{unreadNotifs}</Text>
                </View>
              </Pressable>
            )}

            {/* Ações Rápidas */}
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Ações Rápidas</Text>
              <QuickAction label="Gerenciar Moradores" icon="👥" color="#0a7ea4" onPress={() => router.push("/(tabs)/moradores" as any)} />
              <QuickAction label="Gerenciar Cobranças" icon="💰" color="#22C55E" onPress={() => router.push("/(tabs)/admin-fees" as any)} />
              <QuickAction label="Registrar Despesa" icon="📊" color="#F59E0B" onPress={() => router.push("/(tabs)/admin-expenses" as any)} />
              <QuickAction label="Enviar Comunicado" icon="📢" color="#8B5CF6" onPress={() => router.push("/(tabs)/admin-communications" as any)} />
              <QuickAction label="Conectar WhatsApp" icon="📱" color="#25D366" onPress={() => router.push("/(tabs)/admin-whatsapp-qrcode" as any)} />
              <QuickAction label="Ver Chamados" icon="🎫" color="#EF4444" onPress={() => router.push("/(tabs)/chamados" as any)} />
            </View>

            {/* Últimas Despesas */}
            {despesasList.length > 0 && (
              <View className="gap-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-bold text-foreground">Últimas Despesas</Text>
                  <Pressable onPress={() => router.push("/(tabs)/admin-expenses" as any)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text style={{ color: colors.primary, fontWeight: "600" }}>Ver todas</Text>
                  </Pressable>
                </View>
                {despesasList.slice(0, 3).map((d: any) => (
                  <View key={d.id} className="bg-surface rounded-xl p-4 border border-border">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{d.descricao}</Text>
                        <Text className="text-xs text-muted mt-1">{d.categoria}</Text>
                      </View>
                      <Text className="font-bold" style={{ color: colors.error }}>{formatarMoeda(d.valor)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}



function StatCard({ label, value, color, subtitle }: { label: string; value: string; color: string; subtitle: string }) {
  return (
    <View className="bg-surface rounded-xl p-4 border border-border" style={{ minWidth: 140, flex: 1 }}>
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <Text className="text-xl font-bold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-muted mt-1">{subtitle}</Text>
    </View>
  );
}

function QuickAction({ label, icon, color, onPress }: { label: string; icon: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: color, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, opacity: pressed ? 0.8 : 1 })}>
      <Text style={{ color: "white", fontWeight: "600", textAlign: "center" }}>{icon} {label}</Text>
    </Pressable>
  );
}
