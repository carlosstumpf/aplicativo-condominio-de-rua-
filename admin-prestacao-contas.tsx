import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

type PeriodType = "mes" | "periodo";

export default function AdminPrestacaoContasScreen() {
  const colors = useColors();
  const [periodType, setPeriodType] = useState<PeriodType>("mes");
  const [selectedMonth, setSelectedMonth] = useState("2026-04");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-04-30");
  const [isGenerating, setIsGenerating] = useState(false);

  const gerarMesMutation = trpc.prestacaoContas.gerarMes.useQuery(
    { mesReferencia: selectedMonth },
    { enabled: false }
  );

  const gerarPeriodoMutation = trpc.prestacaoContas.gerarPeriodo.useQuery(
    { startDate, endDate },
    { enabled: false }
  );

  const handleGenerarMes = async () => {
    setIsGenerating(true);
    try {
      const result = await gerarMesMutation.refetch();
      if (result.data?.success) {
        // Download HTML as PDF
        downloadHTML(result.data.html, `prestacao-contas-${selectedMonth}.html`);
      } else {
        Alert.alert("Erro", result.data?.error || "Erro ao gerar prestação de contas");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao gerar prestação de contas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGerarPeriodo = async () => {
    setIsGenerating(true);
    try {
      const result = await gerarPeriodoMutation.refetch();
      if (result.data?.success) {
        downloadHTML(result.data.html, `prestacao-contas-${startDate}-${endDate}.html`);
      } else {
        Alert.alert("Erro", result.data?.error || "Erro ao gerar prestação de contas");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao gerar prestação de contas");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadHTML = (html: string, filename: string) => {
    // For web: create blob and download
    if (typeof window !== "undefined") {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 p-4 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Prestação de Contas
            </Text>
            <Text className="text-base text-muted">
              Gere relatórios financeiros detalhados
            </Text>
          </View>

          {/* Period Type Selector */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Tipo de Período
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setPeriodType("mes")}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2",
                  periodType === "mes"
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-center font-semibold",
                    periodType === "mes" ? "text-background" : "text-foreground"
                  )}
                >
                  Por Mês
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPeriodType("periodo")}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2",
                  periodType === "periodo"
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                )}
              >
                <Text
                  className={cn(
                    "text-center font-semibold",
                    periodType === "periodo" ? "text-background" : "text-foreground"
                  )}
                >
                  Por Período
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Month Selector */}
          {periodType === "mes" && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground">
                Selecione o Mês
              </Text>
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-foreground mb-2">Mês/Ano:</Text>
                <Text className="text-lg font-bold text-primary">
                  {selectedMonth}
                </Text>
                <View className="flex-row gap-2 mt-4">
                  <Pressable
                    onPress={() => {
                      const [year, month] = selectedMonth.split("-");
                      const prevMonth = parseInt(month) - 1;
                      if (prevMonth === 0) {
                        setSelectedMonth(`${parseInt(year) - 1}-12`);
                      } else {
                        setSelectedMonth(
                          `${year}-${String(prevMonth).padStart(2, "0")}`
                        );
                      }
                    }}
                    className="flex-1 p-2 bg-primary rounded-lg"
                  >
                    <Text className="text-center text-background font-semibold">
                      ← Anterior
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const [year, month] = selectedMonth.split("-");
                      const nextMonth = parseInt(month) + 1;
                      if (nextMonth === 13) {
                        setSelectedMonth(`${parseInt(year) + 1}-01`);
                      } else {
                        setSelectedMonth(
                          `${year}-${String(nextMonth).padStart(2, "0")}`
                        );
                      }
                    }}
                    className="flex-1 p-2 bg-primary rounded-lg"
                  >
                    <Text className="text-center text-background font-semibold">
                      Próximo →
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Generate Button */}
              <Pressable
                onPress={handleGenerarMes}
                disabled={isGenerating}
                className={cn(
                  "p-4 rounded-lg flex-row items-center justify-center gap-2",
                  isGenerating ? "bg-muted opacity-50" : "bg-primary"
                )}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator color={colors.background} />
                    <Text className="text-background font-semibold">
                      Gerando...
                    </Text>
                  </>
                ) : (
                  <Text className="text-background font-semibold text-center">
                    📄 Gerar Prestação de Contas
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Date Range Selector */}
          {periodType === "periodo" && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground">
                Selecione o Período
              </Text>
              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <View>
                  <Text className="text-foreground mb-2">Data Inicial:</Text>
                  <Text className="text-lg font-bold text-primary">
                    {startDate}
                  </Text>
                </View>
                <View>
                  <Text className="text-foreground mb-2">Data Final:</Text>
                  <Text className="text-lg font-bold text-primary">
                    {endDate}
                  </Text>
                </View>
              </View>

              {/* Generate Button */}
              <Pressable
                onPress={handleGerarPeriodo}
                disabled={isGenerating}
                className={cn(
                  "p-4 rounded-lg flex-row items-center justify-center gap-2",
                  isGenerating ? "bg-muted opacity-50" : "bg-primary"
                )}
              >
                {isGenerating ? (
                  <>
                    <ActivityIndicator color={colors.background} />
                    <Text className="text-background font-semibold">
                      Gerando...
                    </Text>
                  </>
                ) : (
                  <Text className="text-background font-semibold text-center">
                    📄 Gerar Prestação de Contas
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-sm text-blue-900 font-semibold mb-2">
              ℹ️ Informações
            </Text>
            <Text className="text-sm text-blue-800 leading-relaxed">
              A prestação de contas inclui:
            </Text>
            <Text className="text-sm text-blue-800 mt-2">
              • Resumo financeiro (saldos, receitas, despesas)
            </Text>
            <Text className="text-sm text-blue-800">
              • Despesas por categoria
            </Text>
            <Text className="text-sm text-blue-800">
              • Detalhamento de cobranças
            </Text>
            <Text className="text-sm text-blue-800">
              • Resumo de moradores
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
