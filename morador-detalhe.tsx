import { ScrollView, Text, View, Pressable, Alert, Modal } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  StatusBadge,
  AlertBadge,
  CountBadge,
  ProgressIndicator,
  RiskIndicator,
  DebtSummaryBadge,
  PaymentStatusSummary,
} from "@/components/status-badge";

interface Pagamento {
  id: number;
  data: string;
  vencimento: string;
  valor: number;
  status: "pago" | "pendente" | "vencido";
  metodo?: string;
  referencia: string;
  dataPagamento?: string;
}

export default function MoradorDetalheScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState<"info" | "pagamentos" | "atividade">("info");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);

  const morador = {
    id: 1,
    nome: "João Silva",
    cpf: "123.456.789-00",
    email: "joao@email.com",
    telefone: "(11) 98765-4321",
    casa: "101",
    bloco: "A",
    dataIngresso: "2020-01-15",
    status: "ativo",
    statusPagamento: "inadimplente",
    totalDevido: 1500.0,
    ultimoPagamento: "2026-03-20",
    diasAtraso: 38,
    cobrancasTotal: 45,
    cobrancasPagas: 42,
    cobrancasPendentes: 2,
    cobrancasVencidas: 1,
  };

  const pagamentos: Pagamento[] = [
    {
      id: 1,
      data: "2026-04-27",
      vencimento: "2026-04-27",
      valor: 500.0,
      status: "pago",
      metodo: "PIX",
      referencia: "Cobrança Abril 2026",
      dataPagamento: "2026-04-27",
    },
    {
      id: 2,
      data: "2026-03-20",
      vencimento: "2026-03-20",
      valor: 500.0,
      status: "pago",
      metodo: "Boleto",
      referencia: "Cobrança Março 2026",
      dataPagamento: "2026-03-22",
    },
    {
      id: 3,
      data: "2026-02-15",
      vencimento: "2026-02-15",
      valor: 500.0,
      status: "pago",
      metodo: "PIX",
      referencia: "Cobrança Fevereiro 2026",
      dataPagamento: "2026-02-16",
    },
    {
      id: 4,
      data: "2026-05-20",
      vencimento: "2026-05-20",
      valor: 500.0,
      status: "pendente",
      referencia: "Cobrança Maio 2026",
    },
    {
      id: 5,
      data: "2026-04-20",
      vencimento: "2026-04-20",
      valor: 500.0,
      status: "vencido",
      referencia: "Cobrança Abril 2026 (Adicional)",
    },
  ];

  const atividades = [
    {
      id: 1,
      tipo: "pagamento",
      descricao: "Pagamento de cobrança recebido",
      valor: 500.0,
      data: "2026-04-27",
      usuario: "Sistema",
    },
    {
      id: 2,
      tipo: "cobranca",
      descricao: "Cobrança gerada",
      valor: 500.0,
      data: "2026-04-20",
      usuario: "Admin",
    },
    {
      id: 3,
      tipo: "chamado",
      descricao: "Chamado criado: Vazamento na cozinha",
      data: "2026-04-15",
      usuario: "João Silva",
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "text-green-600";
      case "pendente":
        return "text-orange-600";
      case "vencido":
        return "text-red-600";
      case "ativo":
        return "text-green-600";
      case "inativo":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-500/10";
      case "pendente":
        return "bg-orange-500/10";
      case "vencido":
        return "bg-red-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row justify-between items-start gap-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{morador.nome}</Text>
              <Text className="text-sm text-muted">Casa {morador.casa} - Bloco {morador.bloco}</Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text className="text-2xl">✕</Text>
            </Pressable>
          </View>

          {/* Status Badges */}
          <View className="flex-row gap-2 flex-wrap">
            <StatusBadge
              type={morador.status === "ativo" ? "ativo" : "inativo"}
              label={morador.status === "ativo" ? "Ativo" : "Inativo"}
              size="md"
            />
            <StatusBadge
              type={morador.cobrancasVencidas > 0 ? "vencido" : "pago"}
              label={morador.cobrancasVencidas > 0 ? `${morador.cobrancasVencidas} Vencida(s)` : "Em Dia"}
              size="md"
            />
            <RiskIndicator
              level={morador.diasAtraso > 30 ? "alto" : morador.diasAtraso > 15 ? "médio" : "baixo"}
              diasAtraso={morador.diasAtraso}
              cobrancasVencidas={morador.cobrancasVencidas}
            />
          </View>

          {/* Debt Summary Badge */}
          {morador.totalDevido > 0 && (
            <DebtSummaryBadge
              totalDevido={morador.totalDevido}
              cobrancasVencidas={morador.cobrancasVencidas}
              diasAtraso={morador.diasAtraso}
            />
          )}

          {/* Alert for Critical Debt */}
          {morador.totalDevido > 1000 && morador.diasAtraso > 30 && (
            <AlertBadge
              type="error"
              message={`Atenção: Débito crítico de ${formatCurrency(morador.totalDevido)} com ${morador.diasAtraso} dias de atraso`}
              animated={true}
            />
          )}

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1">
            {["info", "pagamentos", "atividade"].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab as any)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: selectedTab === tab ? "#0a7ea4" : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  className={
                    selectedTab === tab
                      ? "text-white text-xs font-semibold text-center"
                      : "text-foreground text-xs font-semibold text-center"
                  }
                >
                  {tab === "info" ? "Informações" : tab === "pagamentos" ? "Pagamentos" : "Atividade"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {selectedTab === "info" && (
            <View className="gap-3">
              {/* Personal Information */}
              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <Text className="text-lg font-bold text-foreground">Informações Pessoais</Text>

                <View className="gap-2">
                  <View>
                    <Text className="text-xs text-muted font-semibold">CPF</Text>
                    <Text className="text-sm text-foreground">{morador.cpf}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted font-semibold">Email</Text>
                    <Text className="text-sm text-foreground">{morador.email}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted font-semibold">Telefone</Text>
                    <Text className="text-sm text-foreground">{morador.telefone}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted font-semibold">Data de Ingresso</Text>
                    <Text className="text-sm text-foreground">
                      {new Date(morador.dataIngresso).toLocaleDateString("pt-BR")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Summary */}
              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <Text className="text-lg font-bold text-foreground">Resumo de Cobranças</Text>

                <PaymentStatusSummary
                  pago={morador.cobrancasPagas}
                  pendente={morador.cobrancasPendentes}
                  vencido={morador.cobrancasVencidas}
                />

                <ProgressIndicator
                  value={morador.cobrancasPagas}
                  max={morador.cobrancasTotal}
                  label="Taxa de Pagamento"
                  showPercentage={true}
                  type={morador.cobrancasPagas / morador.cobrancasTotal > 0.9 ? "success" : morador.cobrancasPagas / morador.cobrancasTotal > 0.7 ? "warning" : "error"}
                />
              </View>

              {/* Action Buttons */}
              <View className="gap-2">
                <Pressable
                  onPress={() => setShowEditModal(true)}
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
                  <Text className="text-white text-center font-semibold">✏️ Editar Dados</Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowChargeModal(true)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: "#22c55e",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-white text-center font-semibold">💳 Gerar Cobrança</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Enviar Mensagem",
                      "Escolha o método de comunicação",
                      [
                        {
                          text: "Email",
                          onPress: () => Alert.alert("Email enviado com sucesso"),
                        },
                        {
                          text: "SMS",
                          onPress: () => Alert.alert("SMS enviado com sucesso"),
                        },
                        {
                          text: "WhatsApp",
                          onPress: () => Alert.alert("Mensagem WhatsApp enviada com sucesso"),
                        },
                        { text: "Cancelar", style: "cancel" },
                      ]
                    );
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: "#3b82f6",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text className="text-white text-center font-semibold">💬 Enviar Mensagem</Text>
                </Pressable>
              </View>
            </View>
          )}

          {selectedTab === "pagamentos" && (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Histórico de Pagamentos</Text>

              {pagamentos.map((pagamento) => (
                <View
                  key={pagamento.id}
                  className={`rounded-lg p-4 border border-border ${getStatusBgColor(pagamento.status)}`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {pagamento.referencia}
                      </Text>
                      <Text className="text-xs text-muted">
                        Vencimento: {new Date(pagamento.vencimento).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <Text className={`text-sm font-bold ${getStatusColor(pagamento.status)}`}>
                      {pagamento.status === "pago"
                        ? "✓ Pago"
                        : pagamento.status === "pendente"
                          ? "⏳ Pendente"
                          : "⚠️ Vencido"}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-foreground">
                      {formatCurrency(pagamento.valor)}
                    </Text>
                          {pagamento.metodo && (
                      <StatusBadge type="pago" label={pagamento.metodo} size="sm" showIcon={false} />
                    )}
                  </View>

                  {pagamento.dataPagamento && (
                    <Text className="text-xs text-muted mt-2">
                      Pago em: {new Date(pagamento.dataPagamento).toLocaleDateString("pt-BR")}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {selectedTab === "atividade" && (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Histórico de Atividades</Text>

              {atividades.map((atividade) => (
                <View key={atividade.id} className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {atividade.descricao}
                      </Text>
                      <Text className="text-xs text-muted">
                        {new Date(atividade.data).toLocaleDateString("pt-BR")} por {atividade.usuario}
                      </Text>
                    </View>
                    {atividade.valor && (
                      <View>
                        <StatusBadge type="pago" label={`+${formatCurrency(atividade.valor)}`} size="sm" />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Spacer */}
          <View className="h-4" />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <Text className="text-xl font-bold text-foreground">Editar Dados do Morador</Text>

            <View className="gap-2">
              <Text className="text-xs text-muted font-semibold">Nome</Text>
              <View className="bg-surface rounded-lg px-4 py-3 border border-border">
                <Text className="text-foreground">{morador.nome}</Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs text-muted font-semibold">Email</Text>
              <View className="bg-surface rounded-lg px-4 py-3 border border-border">
                <Text className="text-foreground">{morador.email}</Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs text-muted font-semibold">Telefone</Text>
              <View className="bg-surface rounded-lg px-4 py-3 border border-border">
                <Text className="text-foreground">{morador.telefone}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#e5e7eb",
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowEditModal(false);
                  Alert.alert("Sucesso", "Dados do morador atualizados com sucesso");
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#0a7ea4",
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold">Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Charge Modal */}
      <Modal visible={showChargeModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <Text className="text-xl font-bold text-foreground">Gerar Nova Cobrança</Text>

            <View className="gap-2">
              <Text className="text-xs text-muted font-semibold">Valor</Text>
              <View className="bg-surface rounded-lg px-4 py-3 border border-border">
                <Text className="text-foreground">R$ 500,00</Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs text-muted font-semibold">Descrição</Text>
              <View className="bg-surface rounded-lg px-4 py-3 border border-border">
                <Text className="text-foreground">Cobrança Maio 2026</Text>
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-xs text-muted font-semibold">Data de Vencimento</Text>
              <View className="bg-surface rounded-lg px-4 py-3 border border-border">
                <Text className="text-foreground">2026-05-20</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowChargeModal(false)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#e5e7eb",
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowChargeModal(false);
                  Alert.alert("Sucesso", "Cobrança gerada com sucesso");
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#22c55e",
                    paddingVertical: 12,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold">Gerar Cobrança</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
