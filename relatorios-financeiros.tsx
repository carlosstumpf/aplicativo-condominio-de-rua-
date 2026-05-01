import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }>;
}

export default function RelatoriosFinanceirosScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<"mes" | "trimestre" | "ano">("mes");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleExportPDF = () => {
    Alert.alert(
      "Exportar Relatório",
      "Gerando relatório em PDF...",
      [
        {
          text: "Cancelar",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Exportar",
          onPress: () => {
            Alert.alert(
              "Sucesso",
              "Relatório exportado para: Downloads/relatorio_financeiro.pdf"
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              Relatórios Financeiros
            </Text>
            <Text className="text-sm text-muted">
              Análise completa de receitas, despesas e fluxo de caixa
            </Text>
          </View>

          {/* Period Selector */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1">
            {["mes", "trimestre", "ano"].map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period as any)}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: selectedPeriod === period ? "#0a7ea4" : "transparent",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  className={
                    selectedPeriod === period
                      ? "text-white text-xs font-semibold text-center"
                      : "text-foreground text-xs font-semibold text-center"
                  }
                >
                  {period === "mes" ? "Mês" : period === "trimestre" ? "Trimestre" : "Ano"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Summary Cards */}
          <View className="gap-3">
            <View className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <Text className="text-xs text-green-600 font-semibold">Total de Receitas</Text>
              <Text className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(15500.0)}
              </Text>
              <Text className="text-xs text-green-600 mt-1">↑ 9.15% vs período anterior</Text>
            </View>

            <View className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <Text className="text-xs text-red-600 font-semibold">Total de Despesas</Text>
              <Text className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(8750.5)}
              </Text>
              <Text className="text-xs text-red-600 mt-1">↑ 6.71% vs período anterior</Text>
            </View>

            <View className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <Text className="text-xs text-blue-600 font-semibold">Lucro Líquido</Text>
              <Text className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(6749.5)}
              </Text>
              <Text className="text-xs text-blue-600 mt-1">Taxa: 43.5%</Text>
            </View>
          </View>

          {/* Chart Placeholder - Receitas vs Despesas */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-lg font-bold text-foreground">
              Receitas vs Despesas
            </Text>
            <View className="bg-background rounded p-4 h-48 items-center justify-center">
              <Text className="text-4xl mb-2">📊</Text>
              <Text className="text-sm text-muted text-center">
                Gráfico de linha mostrando evolução de receitas e despesas ao longo do período
              </Text>
            </View>
            <View className="flex-row gap-4 justify-center">
              <View className="items-center">
                <View className="w-3 h-3 bg-green-500 rounded-full mb-1" />
                <Text className="text-xs text-muted">Receitas</Text>
              </View>
              <View className="items-center">
                <View className="w-3 h-3 bg-red-500 rounded-full mb-1" />
                <Text className="text-xs text-muted">Despesas</Text>
              </View>
            </View>
          </View>

          {/* Chart Placeholder - Despesas por Categoria */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-lg font-bold text-foreground">
              Despesas por Categoria
            </Text>
            <View className="bg-background rounded p-4 h-48 items-center justify-center">
              <Text className="text-4xl mb-2">🥧</Text>
              <Text className="text-sm text-muted text-center">
                Gráfico de pizza mostrando distribuição de despesas por categoria
              </Text>
            </View>
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 bg-blue-500 rounded" />
                  <Text className="text-xs text-muted">Manutenção</Text>
                </View>
                <Text className="text-xs font-semibold text-foreground">
                  {formatCurrency(3500.0)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 bg-green-500 rounded" />
                  <Text className="text-xs text-muted">Limpeza</Text>
                </View>
                <Text className="text-xs font-semibold text-foreground">
                  {formatCurrency(2000.0)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 bg-orange-500 rounded" />
                  <Text className="text-xs text-muted">Segurança</Text>
                </View>
                <Text className="text-xs font-semibold text-foreground">
                  {formatCurrency(2250.5)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 bg-purple-500 rounded" />
                  <Text className="text-xs text-muted">Utilidades</Text>
                </View>
                <Text className="text-xs font-semibold text-foreground">
                  {formatCurrency(1000.0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Status */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-lg font-bold text-foreground">
              Status de Pagamentos
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-12 h-12 bg-green-500/20 rounded-full items-center justify-center">
                    <Text className="text-lg">✅</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Pagos</Text>
                    <Text className="text-xs text-muted">20 cobrançass</Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-green-600">80%</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-12 h-12 bg-orange-500/20 rounded-full items-center justify-center">
                    <Text className="text-lg">⏳</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Pendentes</Text>
                    <Text className="text-xs text-muted">3 cobranças</Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-orange-600">12%</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-12 h-12 bg-red-500/20 rounded-full items-center justify-center">
                    <Text className="text-lg">⚠️</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Vencidos</Text>
                    <Text className="text-xs text-muted">2 cobranças</Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-red-600">8%</Text>
              </View>
            </View>
          </View>

          {/* Delinquent Residents */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-lg font-bold text-foreground">
              Moradores Inadimplentes
            </Text>
            <Text className="text-sm text-muted">
              5 moradores com débito total de {formatCurrency(2500.0)}
            </Text>

            <View className="gap-2">
              {[
                { nome: "João Silva", casa: "101", valor: 500.0, dias: 45 },
                { nome: "Maria Santos", casa: "205", valor: 750.0, dias: 30 },
                { nome: "Pedro Oliveira", casa: "312", valor: 600.0, dias: 60 },
              ].map((morador, index) => (
                <View
                  key={index}
                  className="bg-background rounded p-3 border border-border"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {morador.nome}
                      </Text>
                      <Text className="text-xs text-muted">Casa {morador.casa}</Text>
                    </View>
                    <Text className="text-sm font-bold text-red-600">
                      {formatCurrency(morador.valor)}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted">
                    Vencido há {morador.dias} dias
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cash Flow */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-lg font-bold text-foreground">
              Fluxo de Caixa
            </Text>
            <View className="gap-3">
              <View className="flex-row justify-between items-center bg-background rounded p-3">
                <Text className="text-sm text-muted">Saldo Inicial</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {formatCurrency(5000.0)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center bg-green-500/10 rounded p-3">
                <Text className="text-sm text-green-600">Entradas</Text>
                <Text className="text-sm font-semibold text-green-600">
                  +{formatCurrency(15500.0)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center bg-red-500/10 rounded p-3">
                <Text className="text-sm text-red-600">Saídas</Text>
                <Text className="text-sm font-semibold text-red-600">
                  -{formatCurrency(8750.5)}
                </Text>
              </View>
              <View className="flex-row justify-between items-center bg-blue-500/10 rounded p-3 border border-blue-500/20">
                <Text className="text-sm font-semibold text-blue-600">Saldo Final</Text>
                <Text className="text-sm font-bold text-blue-600">
                  {formatCurrency(11749.5)}
                </Text>
              </View>
            </View>
          </View>

          {/* Export Button */}
          <Pressable
            onPress={handleExportPDF}
            style={({ pressed }) => [
              {
                backgroundColor: "#0a7ea4",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 8,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-white text-center font-semibold">
              📥 Exportar Relatório em PDF
            </Text>
          </Pressable>

          {/* Spacer */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
