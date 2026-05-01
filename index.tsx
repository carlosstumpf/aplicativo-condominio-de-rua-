import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

type DateFilterType = "mes" | "trimestre" | "ano" | "customizado";

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const currentMes = new Date().toISOString().split('T')[0].substring(0, 7);
  const [activeTab, setActiveTab] = useState<"resumo" | "cobranças" | "comunicados" | "chamados">("resumo");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("mes");
  const [startDate, setStartDate] = useState<string>(currentMes + "-01");
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const resumoQuery = trpc.relatorios.resumoMes.useQuery(
    { mesReferencia: currentMes },
    { retry: 1, staleTime: 30000 }
  );

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format((valor || 0) / 100);
  };

  const isAdmin = (user as any)?.role === "admin";
  const resumo = resumoQuery.data;

  const tabs = [
    { id: "resumo", label: "📊 Resumo", icon: "📊" },
    { id: "cobranças", label: "💰 Cobranças", icon: "💰" },
    { id: "comunicados", label: "📢 Comunicados", icon: "📢" },
    { id: "chamados", label: "🔔 Chamados", icon: "🔔" },
  ];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2 mb-2">
            <Text className="text-3xl font-bold text-foreground">
              {isAdmin ? "Gestão" : "Meu Condomínio"}
            </Text>
            <Text className="text-sm text-muted">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* Admin View */}
          {isAdmin && (
            <>
              {/* Tab Navigation */}
              <View className="flex-row gap-2 mb-2">
                {tabs.map((tab) => (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id as any)}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 8,
                      backgroundColor: activeTab === tab.id ? "#0a7ea4" : "#f5f5f5",
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text
                      className={`text-xs font-semibold text-center ${
                        activeTab === tab.id ? "text-white" : "text-foreground"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Tab Content */}
              <View className="gap-3">
                {/* RESUMO TAB */}
                {activeTab === "resumo" && (
                  <>
                    {/* Resumo Financeiro */}
                    <View className="gap-2">
                      <Text className="text-sm font-bold text-foreground">Resumo Financeiro</Text>
                      {resumoQuery.isLoading ? (
                        <View className="bg-surface rounded-lg p-3 items-center border border-border">
                          <ActivityIndicator size="small" color="#0a7ea4" />
                          <Text className="text-muted text-xs mt-2">Carregando...</Text>
                        </View>
                      ) : (
                        <View className="flex-row flex-wrap gap-2">
                          <View className="flex-1 bg-surface rounded-lg p-3 border border-border" style={{ minWidth: 100 }}>
                            <Text className="text-xs text-muted mb-1">Receitas</Text>
                            <Text className="text-lg font-bold text-success">{formatarMoeda(resumo?.receitas ?? 0)}</Text>
                          </View>
                          <View className="flex-1 bg-surface rounded-lg p-3 border border-border" style={{ minWidth: 100 }}>
                            <Text className="text-xs text-muted mb-1">Despesas</Text>
                            <Text className="text-lg font-bold text-warning">{formatarMoeda(resumo?.despesas ?? 0)}</Text>
                          </View>
                          <View className="flex-1 bg-surface rounded-lg p-3 border border-border" style={{ minWidth: 100 }}>
                            <Text className="text-xs text-muted mb-1">Saldo</Text>
                            <Text className={`text-lg font-bold ${(resumo?.saldo ?? 0) >= 0 ? 'text-success' : 'text-error'}`}>
                              {formatarMoeda(resumo?.saldo ?? 0)}
                            </Text>
                          </View>
                          <View className="flex-1 bg-surface rounded-lg p-3 border border-border" style={{ minWidth: 100 }}>
                            <Text className="text-xs text-muted mb-1">Moradores</Text>
                            <Text className="text-lg font-bold text-primary">{resumo?.moradores ?? 0}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Ações Rápidas - Compactas */}
                    <View className="gap-2">
                      <Text className="text-sm font-bold text-foreground">Ações Rápidas</Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => router.push('/(tabs)/admin-fees' as any)}
                          style={({ pressed }) => ({
                            flex: 1,
                            backgroundColor: '#0a7ea4',
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 12 }}>
                            Cobranças
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => router.push('/(tabs)/admin-expenses' as any)}
                          style={({ pressed }) => ({
                            flex: 1,
                            backgroundColor: '#F59E0B',
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 12 }}>
                            Despesa
                          </Text>
                        </Pressable>
                      </View>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => router.push('/(tabs)/admin-communications' as any)}
                          style={({ pressed }) => ({
                            flex: 1,
                            backgroundColor: '#22C55E',
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 12 }}>
                            Comunicado
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => router.push('/(tabs)/admin-whatsapp-qrcode' as any)}
                          style={({ pressed }) => ({
                            flex: 1,
                            backgroundColor: '#25D366',
                            paddingVertical: 10,
                            paddingHorizontal: 8,
                            borderRadius: 8,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 12 }}>
                            WhatsApp
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </>
                )}

                {/* COBRANÇAS TAB */}
                {activeTab === "cobranças" && (
                  <View className="gap-3">
                    {/* Filtro de Data */}
                    <View className="bg-surface rounded-lg p-3 border border-border">
                      <Text className="text-foreground font-semibold text-xs mb-2">Filtrar por Período</Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {[
                          { label: "Mês", value: "mes" },
                          { label: "Trimestre", value: "trimestre" },
                          { label: "Ano", value: "ano" },
                        ].map((filter) => (
                          <Pressable
                            key={filter.value}
                            onPress={() => setDateFilter(filter.value as DateFilterType)}
                            style={({ pressed }) => ({
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 6,
                              backgroundColor: dateFilter === filter.value ? "#0a7ea4" : "#f5f5f5",
                              opacity: pressed ? 0.8 : 1,
                            })}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                dateFilter === filter.value ? "text-white" : "text-foreground"
                              }`}
                            >
                              {filter.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Card de Cobranças */}
                    <View className="bg-surface rounded-lg p-4 border border-border">
                      <Text className="text-foreground font-semibold mb-2">Gerenciar Cobranças</Text>
                      <Text className="text-muted text-sm mb-3">Visualize e gerencie todas as cobranças do condomínio.</Text>
                      <Pressable
                        onPress={() => router.push('/(tabs)/admin-fees' as any)}
                        style={({ pressed }) => ({
                          backgroundColor: '#0a7ea4',
                          paddingVertical: 12,
                          borderRadius: 8,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                          Abrir Cobranças
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* COMUNICADOS TAB */}
                {activeTab === "comunicados" && (
                  <View className="bg-surface rounded-lg p-4 border border-border">
                    <Text className="text-foreground font-semibold mb-2">Enviar Comunicado</Text>
                    <Text className="text-muted text-sm mb-3">Envie mensagens e avisos para todos os moradores.</Text>
                    <Pressable
                      onPress={() => router.push('/(tabs)/admin-communications' as any)}
                      style={({ pressed }) => ({
                        backgroundColor: '#22C55E',
                        paddingVertical: 12,
                        borderRadius: 8,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                        Novo Comunicado
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* CHAMADOS TAB */}
                {activeTab === "chamados" && (
                  <View className="gap-3">
                    {/* Filtro de Data */}
                    <View className="bg-surface rounded-lg p-3 border border-border">
                      <Text className="text-foreground font-semibold text-xs mb-2">Filtrar por Período</Text>
                      <View className="flex-row gap-2 flex-wrap">
                        {[
                          { label: "Mês", value: "mes" },
                          { label: "Trimestre", value: "trimestre" },
                          { label: "Ano", value: "ano" },
                        ].map((filter) => (
                          <Pressable
                            key={filter.value}
                            onPress={() => setDateFilter(filter.value as DateFilterType)}
                            style={({ pressed }) => ({
                              paddingVertical: 6,
                              paddingHorizontal: 12,
                              borderRadius: 6,
                              backgroundColor: dateFilter === filter.value ? "#0a7ea4" : "#f5f5f5",
                              opacity: pressed ? 0.8 : 1,
                            })}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                dateFilter === filter.value ? "text-white" : "text-foreground"
                              }`}
                            >
                              {filter.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    {/* Card de Chamados */}
                    <View className="bg-surface rounded-lg p-4 border border-border">
                      <Text className="text-foreground font-semibold mb-2">Chamados e Solicitações</Text>
                      <Text className="text-muted text-sm mb-3">Acompanhe chamados abertos pelos moradores.</Text>
                      <View className="flex-row gap-2 mb-3">
                        <View className="flex-1 bg-background rounded-lg p-3">
                          <Text className="text-xs text-muted">Abertos</Text>
                          <Text className="text-xl font-bold text-error">1</Text>
                        </View>
                        <View className="flex-1 bg-background rounded-lg p-3">
                          <Text className="text-xs text-muted">Em Andamento</Text>
                          <Text className="text-xl font-bold text-warning">0</Text>
                        </View>
                        <View className="flex-1 bg-background rounded-lg p-3">
                          <Text className="text-xs text-muted">Resolvidos</Text>
                          <Text className="text-xl font-bold text-success">0</Text>
                        </View>
                      </View>
                      <Pressable
                        style={({ pressed }) => ({
                          backgroundColor: '#F59E0B',
                          paddingVertical: 12,
                          borderRadius: 8,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                          Ver Todos os Chamados
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Morador View */}
          {!isAdmin && (
            <View className="gap-4">
              <View className="bg-primary rounded-xl p-6 gap-3">
                <Text className="text-white text-lg font-semibold">Status de Pagamento</Text>
                <Text className="text-white text-3xl font-bold">R$ 150,00</Text>
                <Text className="text-white text-sm">Próximo vencimento: 05/05/2026</Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: "#22C55E",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white font-semibold text-center">💳 Pagar via Pix</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: "#0a7ea4",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white font-semibold text-center">🧾 Pagar via Boleto</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: "#F59E0B",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white font-semibold text-center">📞 Suporte</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
