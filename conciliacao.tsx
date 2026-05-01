import { ScrollView, Text, View, Pressable, Alert, Modal, TextInput } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";

interface Extrato {
  id: number;
  nomeArquivo: string;
  banco: string;
  dataUpload: string;
  status: "conciliado" | "pendente" | "discrepancia";
  saldoInicial: number;
  saldoFinal: number;
  totalEntradas: number;
  totalSaidas: number;
  linhas: number;
}

interface Discrepancia {
  id: number;
  tipo: string;
  descricao: string;
  valor_extrato: number;
  valor_sistema: number;
  diferenca: number;
  data: string;
}

const mockExtratos: Extrato[] = [
  {
    id: 1,
    nomeArquivo: "extrato_itau_abril_2026.csv",
    banco: "ITAU",
    dataUpload: "2026-04-27",
    status: "conciliado",
    saldoInicial: 5000.0,
    saldoFinal: 6250.5,
    totalEntradas: 2500.0,
    totalSaidas: 1249.5,
    linhas: 15,
  },
  {
    id: 2,
    nomeArquivo: "extrato_bradesco_abril_2026.csv",
    banco: "BRADESCO",
    dataUpload: "2026-04-26",
    status: "pendente",
    saldoInicial: 3000.0,
    saldoFinal: 3500.0,
    totalEntradas: 1500.0,
    totalSaidas: 1000.0,
    linhas: 12,
  },
];

const mockDiscrepancias: Discrepancia[] = [
  {
    id: 1,
    tipo: "valor_diferente",
    descricao: "Cobrança registrada por R$ 300, mas extrato mostra R$ 280",
    valor_extrato: 280.0,
    valor_sistema: 300.0,
    diferenca: -20.0,
    data: "2026-04-25",
  },
  {
    id: 2,
    tipo: "nao_conciliado",
    descricao: "Transação no extrato sem correspondência no sistema",
    valor_extrato: 150.0,
    valor_sistema: 0,
    diferenca: 150.0,
    data: "2026-04-24",
  },
];

export default function ConciliacaoScreen() {
  const [extratos, setExtratos] = useState<Extrato[]>(mockExtratos);
  const [discrepancias, setDiscrepancias] = useState<Discrepancia[]>(mockDiscrepancias);
  const [activeTab, setActiveTab] = useState<"extratos" | "discrepancias" | "resumo">("extratos");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");

  const totalConciliado = extratos.filter((e) => e.status === "conciliado").length;
  const totalPendente = extratos.filter((e) => e.status === "pendente").length;
  const totalDiscrepancias = discrepancias.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "conciliado":
        return "bg-green-500/10";
      case "pendente":
        return "bg-yellow-500/10";
      case "discrepancia":
        return "bg-red-500/10";
      default:
        return "bg-gray-500/10";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "conciliado":
        return "text-green-600";
      case "pendente":
        return "text-yellow-600";
      case "discrepancia":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "conciliado":
        return "✅ Conciliado";
      case "pendente":
        return "⏳ Pendente";
      case "discrepancia":
        return "⚠️ Discrepância";
      default:
        return status;
    }
  };

  const handleUploadExtrato = () => {
    if (!uploadFileName.trim()) {
      Alert.alert("Erro", "Por favor, selecione um arquivo");
      return;
    }

    const newExtrato: Extrato = {
      id: Math.max(...extratos.map((e) => e.id), 0) + 1,
      nomeArquivo: uploadFileName,
      banco: "OUTRO",
      dataUpload: new Date().toISOString().split("T")[0],
      status: "pendente",
      saldoInicial: 0,
      saldoFinal: 0,
      totalEntradas: 0,
      totalSaidas: 0,
      linhas: 0,
    };

    setExtratos([...extratos, newExtrato]);
    setUploadFileName("");
    setShowUploadModal(false);
    Alert.alert("Sucesso", "Extrato enviado para conciliação");
  };

  const handleReconcile = (extratoId: number) => {
    setExtratos(
      extratos.map((e) =>
        e.id === extratoId ? { ...e, status: "conciliado" } : e
      )
    );
    Alert.alert("Sucesso", "Extrato conciliado com sucesso");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              Conciliação Bancária
            </Text>
            <Text className="text-sm text-muted">
              Reconcilie seus extratos com as transações do sistema
            </Text>
          </View>

          {/* Summary Cards */}
          <View className="gap-3">
            <View className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <Text className="text-xs text-green-600 font-semibold">Conciliados</Text>
              <Text className="text-2xl font-bold text-green-600 mt-1">
                {totalConciliado}
              </Text>
            </View>
            <View className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <Text className="text-xs text-yellow-600 font-semibold">Pendentes</Text>
              <Text className="text-2xl font-bold text-yellow-600 mt-1">
                {totalPendente}
              </Text>
            </View>
            <View className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <Text className="text-xs text-red-600 font-semibold">Discrepâncias</Text>
              <Text className="text-2xl font-bold text-red-600 mt-1">
                {totalDiscrepancias}
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1">
            {["extratos", "discrepancias", "resumo"].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: activeTab === tab ? "#0a7ea4" : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  className={
                    activeTab === tab
                      ? "text-white text-xs font-semibold text-center"
                      : "text-foreground text-xs font-semibold text-center"
                  }
                >
                  {tab === "extratos"
                    ? "Extratos"
                    : tab === "discrepancias"
                      ? "Discrepâncias"
                      : "Resumo"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Upload Button */}
          {activeTab === "extratos" && (
            <Pressable
              onPress={() => setShowUploadModal(true)}
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
              <Text className="text-white text-center font-semibold">
                📤 Enviar Extrato Bancário
              </Text>
            </Pressable>
          )}

          {/* Extratos Tab */}
          {activeTab === "extratos" && (
            <View className="gap-3">
              {extratos.length > 0 ? (
                extratos.map((extrato) => (
                  <View
                    key={extrato.id}
                    className={`rounded-lg p-4 border border-border ${getStatusColor(
                      extrato.status
                    )} gap-3`}
                  >
                    {/* Header */}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {extrato.nomeArquivo}
                        </Text>
                        <Text className={`text-xs font-semibold mt-1 ${getStatusTextColor(extrato.status)}`}>
                          {getStatusLabel(extrato.status)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-muted">{extrato.banco}</Text>
                        <Text className="text-xs text-muted mt-1">
                          {new Date(extrato.dataUpload).toLocaleDateString("pt-BR")}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View className="gap-2">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Saldo Inicial</Text>
                        <Text className="text-xs font-semibold text-foreground">
                          {formatCurrency(extrato.saldoInicial)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Entradas</Text>
                        <Text className="text-xs font-semibold text-green-600">
                          +{formatCurrency(extrato.totalEntradas)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Saídas</Text>
                        <Text className="text-xs font-semibold text-red-600">
                          -{formatCurrency(extrato.totalSaidas)}
                        </Text>
                      </View>
                      <View className="border-t border-border pt-2 flex-row justify-between">
                        <Text className="text-xs font-semibold text-foreground">Saldo Final</Text>
                        <Text className="text-sm font-bold text-foreground">
                          {formatCurrency(extrato.saldoFinal)}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    {extrato.status === "pendente" && (
                      <Pressable
                        onPress={() => handleReconcile(extrato.id)}
                        style={({ pressed }) => [
                          {
                            backgroundColor: "#0a7ea4",
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-white text-center font-semibold text-sm">
                          ✓ Conciliar Extrato
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-4xl mb-4">📄</Text>
                  <Text className="text-lg font-semibold text-foreground mb-2">
                    Nenhum extrato
                  </Text>
                  <Text className="text-sm text-muted text-center">
                    Envie um extrato bancário para começar a conciliação
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Discrepancias Tab */}
          {activeTab === "discrepancias" && (
            <View className="gap-3">
              {discrepancias.length > 0 ? (
                discrepancias.map((disc) => (
                  <View
                    key={disc.id}
                    className="rounded-lg p-4 border border-red-500/20 bg-red-500/5 gap-3"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          ⚠️ {disc.tipo === "valor_diferente" ? "Valor Diferente" : "Não Conciliado"}
                        </Text>
                        <Text className="text-xs text-muted mt-2">
                          {disc.descricao}
                        </Text>
                      </View>
                    </View>

                    <View className="gap-2 bg-background rounded p-3">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Valor no Extrato</Text>
                        <Text className="text-xs font-semibold text-foreground">
                          {formatCurrency(disc.valor_extrato)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted">Valor no Sistema</Text>
                        <Text className="text-xs font-semibold text-foreground">
                          {formatCurrency(disc.valor_sistema)}
                        </Text>
                      </View>
                      <View className="border-t border-border pt-2 flex-row justify-between">
                        <Text className="text-xs font-semibold text-foreground">Diferença</Text>
                        <Text className={`text-xs font-bold ${disc.diferenca > 0 ? "text-red-600" : "text-green-600"}`}>
                          {disc.diferenca > 0 ? "+" : ""}{formatCurrency(disc.diferenca)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <Pressable
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            backgroundColor: "#0a7ea4",
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-white text-center font-semibold text-xs">
                          Resolver
                        </Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            backgroundColor: "#ef4444",
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-white text-center font-semibold text-xs">
                          Ignorar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-4xl mb-4">✅</Text>
                  <Text className="text-lg font-semibold text-foreground mb-2">
                    Sem discrepâncias
                  </Text>
                  <Text className="text-sm text-muted text-center">
                    Todos os extratos estão conciliados corretamente
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Resumo Tab */}
          {activeTab === "resumo" && (
            <View className="gap-3">
              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <Text className="text-lg font-bold text-foreground">Resumo Geral</Text>

                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Total de Extratos</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {extratos.length}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Extratos Conciliados</Text>
                    <Text className="text-sm font-semibold text-green-600">
                      {totalConciliado}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Extratos Pendentes</Text>
                    <Text className="text-sm font-semibold text-yellow-600">
                      {totalPendente}
                    </Text>
                  </View>
                  <View className="border-t border-border pt-2 flex-row justify-between">
                    <Text className="text-sm text-muted">Taxa de Conciliação</Text>
                    <Text className="text-sm font-bold text-foreground">
                      {extratos.length > 0
                        ? Math.round((totalConciliado / extratos.length) * 100)
                        : 0}
                      %
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <Text className="text-lg font-bold text-foreground">Transações</Text>

                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Total de Entradas</Text>
                    <Text className="text-sm font-semibold text-green-600">
                      {formatCurrency(
                        extratos.reduce((sum, e) => sum + e.totalEntradas, 0)
                      )}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Total de Saídas</Text>
                    <Text className="text-sm font-semibold text-red-600">
                      {formatCurrency(
                        extratos.reduce((sum, e) => sum + e.totalSaidas, 0)
                      )}
                    </Text>
                  </View>
                  <View className="border-t border-border pt-2 flex-row justify-between">
                    <Text className="text-sm text-muted">Saldo Líquido</Text>
                    <Text className="text-sm font-bold text-foreground">
                      {formatCurrency(
                        extratos.reduce((sum, e) => sum + (e.saldoFinal - e.saldoInicial), 0)
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-background rounded-lg p-6 w-full max-w-sm gap-4">
            <Text className="text-lg font-bold text-foreground">Enviar Extrato</Text>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Nome do Arquivo
              </Text>
              <TextInput
                placeholder="extrato_banco_mes_ano.csv"
                placeholderTextColor="#999"
                value={uploadFileName}
                onChangeText={setUploadFileName}
                className="border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowUploadModal(false)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#e5e7eb",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-foreground text-center font-semibold">
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUploadExtrato}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: "#0a7ea4",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold">
                  Enviar
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
