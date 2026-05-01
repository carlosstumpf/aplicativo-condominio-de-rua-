/**
 * Admin Payment Resend Screen
 * Manage manual payment link resends
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface Payment {
  id: number;
  asaasPaymentId: string;
  moradorId: number;
  moradorNome: string;
  telefone: string;
  valor: number;
  status: string;
  vencimento: string;
  tipo: "PIX" | "BOLETO";
  pixCopyPaste?: string;
  boletoBarCode?: string;
  boletoUrl?: string;
}

interface ResendRecord {
  id: number;
  canal: string;
  status: string;
  motivo: string;
  tentativas: number;
  criadoEm: string;
  erro?: string;
}

export default function AdminPaymentResendScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"pendentes" | "historico" | "stats">("pendentes");
  const [pagamentos, setPagamentos] = useState<Payment[]>([]);
  const [historico, setHistorico] = useState<ResendRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    enviados: 0,
    falhas: 0,
    taxaSucesso: 0,
  });

  const cobrancasQuery = trpc.cobrancas.list.useQuery(
    { status: "PENDING" },
    { retry: 1, staleTime: 15000 }
  );
  const sendWhatsAppMutation = trpc.cobrancas.sendViaWhatsApp.useMutation();
  const utils = trpc.useUtils();

  // Mock data - replace with real API calls
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API calls
      // const response = await api.getRecentResends();
      // setHistorico(response);

      // Mock data
      setHistorico([
        {
          id: 1,
          canal: "WHATSAPP",
          status: "enviado",
          motivo: "Morador solicitou",
          tentativas: 1,
          criadoEm: new Date().toISOString(),
        },
      ]);

      setPagamentos([
        {
          id: "pay_001",
          moradorNome: "João Silva",
          valor: 500,
          status: "PENDING",
          dataVencimento: "2026-05-10",
          numeroWhatsapp: "+55 11 99999-0001",
          email: "joao@email.com",
        },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const reenviarViaWhatsApp = async (pagamentoId: number) => {
    try {
      setLoading(true);
      const pagamento = pagamentos.find(p => p.id === pagamentoId);
      if (!pagamento) {
        Alert.alert("Erro", "Pagamento não encontrado");
        return;
      }
      
      await sendWhatsAppMutation.mutateAsync({
        asaasPaymentId: pagamento.asaasPaymentId,
        moradorId: pagamento.moradorId,
        telefone: pagamento.telefone,
        tipo: pagamento.tipo,
        valor: pagamento.valor,
        pixCopyPaste: pagamento.pixCopyPaste,
        boletoBarCode: pagamento.boletoBarCode,
        boletoUrl: pagamento.boletoUrl,
      });
      
      Alert.alert("Sucesso", "PIX/Boleto reenviado via WhatsApp!");
      utils.cobrancas.list.invalidate();
      carregarDados();
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Falha ao reenviar PIX/Boleto");
    } finally {
      setLoading(false);
    }
  };

  const reenviarViaEmail = async (pagamentoId: string, email: string) => {
    try {
      setLoading(true);
      // TODO: Call API endpoint
      // await api.resendViaEmail({...});
      Alert.alert("Sucesso", "Link reenviado via Email!");
      carregarDados();
    } catch (error) {
      Alert.alert("Erro", "Falha ao reenviar link");
    } finally {
      setLoading(false);
    }
  };

  const reenviarEmLote = async () => {
    if (selectedPayments.length === 0) {
      Alert.alert("Atenção", "Selecione pelo menos um pagamento");
      return;
    }

    try {
      setLoading(true);
      // TODO: Call API endpoint for bulk resend
      // await api.bulkResend({...});
      Alert.alert(
        "Sucesso",
        `${selectedPayments.length} links reenviados!`
      );
      setSelectedPayments([]);
      carregarDados();
    } catch (error) {
      Alert.alert("Erro", "Falha ao reenviar links em lote");
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentSelection = (pagamentoId: string) => {
    setSelectedPayments((prev) =>
      prev.includes(pagamentoId)
        ? prev.filter((id) => id !== pagamentoId)
        : [...prev, pagamentoId]
    );
  };

  const renderPagamentoPendente = ({ item }: { item: Payment }) => (
    <View
      className={cn(
        "bg-surface border border-border rounded-lg p-4 mb-3",
        selectedPayments.includes(item.id) && "border-primary border-2"
      )}
    >
      <TouchableOpacity
        onPress={() => togglePaymentSelection(item.id)}
        className="mb-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-foreground font-semibold text-base">
              {item.moradorNome}
            </Text>
            <Text className="text-muted text-sm mt-1">
              R$ {item.valor.toFixed(2)}
            </Text>
            <Text className="text-muted text-xs mt-1">
              Vence: {item.dataVencimento}
            </Text>
          </View>
          <View
            className={cn(
              "w-6 h-6 rounded border-2",
              selectedPayments.includes(item.id)
                ? "bg-primary border-primary"
                : "border-border"
            )}
          />
        </View>
      </TouchableOpacity>

      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          onPress={() => reenviarViaWhatsApp(item.id)}
          className="flex-1 bg-primary rounded-lg py-2 px-3"
        >
          <Text className="text-background text-center font-semibold text-sm">
            💬 WhatsApp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => reenviarViaEmail(item.id, item.email)}
          className="flex-1 bg-primary rounded-lg py-2 px-3"
        >
          <Text className="text-background text-center font-semibold text-sm">
            📧 Email
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoricoReenvio = ({ item }: { item: ResendRecord }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold">
          {item.canal === "WHATSAPP" && "💬"}
          {item.canal === "EMAIL" && "📧"}
          {item.canal === "SMS" && "📱"}
          {item.canal === "APP" && "📲"}
          {" " + item.canal}
        </Text>
        <View
          className={cn(
            "rounded-full px-3 py-1",
            item.status === "enviado" && "bg-success",
            item.status === "falha" && "bg-error",
            item.status === "pendente" && "bg-warning"
          )}
        >
          <Text className="text-background text-xs font-semibold">
            {item.status === "enviado" && "✓ Enviado"}
            {item.status === "falha" && "✗ Falha"}
            {item.status === "pendente" && "⏳ Pendente"}
          </Text>
        </View>
      </View>

      <Text className="text-muted text-sm mb-1">{item.motivo}</Text>
      <Text className="text-muted text-xs">
        Tentativas: {item.tentativas}
      </Text>
      <Text className="text-muted text-xs">
        {new Date(item.criadoEm).toLocaleString("pt-BR")}
      </Text>

      {item.erro && (
        <Text className="text-error text-xs mt-2">Erro: {item.erro}</Text>
      )}
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Reenvio de Links
          </Text>
          <Text className="text-muted">
            Gerencie reenvios manuais de pagamentos
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-6">
          {["pendentes", "historico", "stats"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() =>
                setActiveTab(tab as "pendentes" | "historico" | "stats")
              }
              className={cn(
                "flex-1 py-2 px-3 rounded-lg border",
                activeTab === tab
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              )}
            >
              <Text
                className={cn(
                  "text-center font-semibold text-sm",
                  activeTab === tab ? "text-background" : "text-foreground"
                )}
              >
                {tab === "pendentes" && "📋 Pendentes"}
                {tab === "historico" && "📜 Histórico"}
                {tab === "stats" && "📊 Estatísticas"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pendentes Tab */}
        {activeTab === "pendentes" && (
          <View className="flex-1">
            {/* Search */}
            <TextInput
              placeholder="Buscar por morador..."
              value={searchText}
              onChangeText={setSearchText}
              className="bg-surface border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
              placeholderTextColor={colors.muted}
            />

            {/* Bulk Actions */}
            {selectedPayments.length > 0 && (
              <View className="bg-primary rounded-lg p-4 mb-4">
                <Text className="text-background font-semibold mb-3">
                  {selectedPayments.length} selecionado(s)
                </Text>
                <TouchableOpacity
                  onPress={reenviarEmLote}
                  disabled={loading}
                  className="bg-background rounded-lg py-2 px-4"
                >
                  <Text className="text-primary text-center font-semibold">
                    {loading ? "Enviando..." : "Reenviar em Lote"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pagamentos List */}
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={pagamentos}
                renderItem={renderPagamentoPendente}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {/* Histórico Tab */}
        {activeTab === "historico" && (
          <View className="flex-1">
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={historico}
                renderItem={renderHistoricoReenvio}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {/* Estatísticas Tab */}
        {activeTab === "stats" && (
          <View className="flex-1">
            <View className="grid grid-cols-2 gap-4">
              {/* Total */}
              <View className="bg-surface border border-border rounded-lg p-4">
                <Text className="text-muted text-sm mb-2">Total</Text>
                <Text className="text-foreground text-2xl font-bold">
                  {stats.total}
                </Text>
              </View>

              {/* Enviados */}
              <View className="bg-surface border border-border rounded-lg p-4">
                <Text className="text-muted text-sm mb-2">✓ Enviados</Text>
                <Text className="text-success text-2xl font-bold">
                  {stats.enviados}
                </Text>
              </View>

              {/* Falhas */}
              <View className="bg-surface border border-border rounded-lg p-4">
                <Text className="text-muted text-sm mb-2">✗ Falhas</Text>
                <Text className="text-error text-2xl font-bold">
                  {stats.falhas}
                </Text>
              </View>

              {/* Taxa de Sucesso */}
              <View className="bg-surface border border-border rounded-lg p-4">
                <Text className="text-muted text-sm mb-2">Taxa Sucesso</Text>
                <Text className="text-primary text-2xl font-bold">
                  {stats.taxaSucesso.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Gráfico de Canais */}
            <View className="bg-surface border border-border rounded-lg p-4 mt-4">
              <Text className="text-foreground font-semibold mb-4">
                Reenvios por Canal
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted">💬 WhatsApp</Text>
                  <Text className="text-foreground font-semibold">45%</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted">📧 Email</Text>
                  <Text className="text-foreground font-semibold">30%</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted">📲 App</Text>
                  <Text className="text-foreground font-semibold">20%</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted">📱 SMS</Text>
                  <Text className="text-foreground font-semibold">5%</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
