import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { StatusBadge, AlertBadge } from "@/components/status-badge";

interface Morador {
  id: number;
  nome: string;
  casa: string;
  bloco?: string;
  telefone: string;
  email: string;
  totalDevido: number;
  cobrancasVencidas: number;
  diasAtraso: number;
}

export default function ExportarInadimplentesScreen() {
  const [filtro, setFiltro] = useState<"todos" | "critico" | "medio">("todos");
  const [ordenacao, setOrdenacao] = useState<"nome" | "valor" | "dias">("dias");
  const [isLoading, setIsLoading] = useState(false);

  const moradores: Morador[] = [
    {
      id: 1,
      nome: "João Silva",
      casa: "101",
      bloco: "A",
      telefone: "(11) 98765-4321",
      email: "joao@email.com",
      totalDevido: 2500.0,
      cobrancasVencidas: 3,
      diasAtraso: 45,
    },
    {
      id: 2,
      nome: "Maria Santos",
      casa: "205",
      bloco: "B",
      telefone: "(11) 91234-5678",
      email: "maria@email.com",
      totalDevido: 1800.0,
      cobrancasVencidas: 2,
      diasAtraso: 32,
    },
    {
      id: 3,
      nome: "Carlos Oliveira",
      casa: "308",
      bloco: "C",
      telefone: "(11) 99876-5432",
      email: "carlos@email.com",
      totalDevido: 950.0,
      cobrancasVencidas: 1,
      diasAtraso: 18,
    },
    {
      id: 4,
      nome: "Ana Costa",
      casa: "402",
      bloco: "A",
      telefone: "(11) 98765-1234",
      email: "ana@email.com",
      totalDevido: 3200.0,
      cobrancasVencidas: 4,
      diasAtraso: 60,
    },
    {
      id: 5,
      nome: "Pedro Ferreira",
      casa: "501",
      bloco: "B",
      telefone: "(11) 91111-2222",
      email: "pedro@email.com",
      totalDevido: 1200.0,
      cobrancasVencidas: 2,
      diasAtraso: 25,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRiskLevel = (diasAtraso: number) => {
    if (diasAtraso > 30) return "alto";
    if (diasAtraso > 15) return "médio";
    return "baixo";
  };

  // Filter moradores
  let filtered = moradores;
  if (filtro === "critico") {
    filtered = moradores.filter((m) => m.diasAtraso > 30);
  } else if (filtro === "medio") {
    filtered = moradores.filter((m) => m.diasAtraso > 15 && m.diasAtraso <= 30);
  }

  // Sort
  if (ordenacao === "valor") {
    filtered.sort((a, b) => b.totalDevido - a.totalDevido);
  } else if (ordenacao === "dias") {
    filtered.sort((a, b) => b.diasAtraso - a.diasAtraso);
  } else {
    filtered.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  const totalDevido = filtered.reduce((sum, m) => sum + m.totalDevido, 0);

  const handleExportarPDF = async () => {
    setIsLoading(true);
    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        "Sucesso",
        `Relatório com ${filtered.length} moradores inadimplentes gerado com sucesso!\n\nValor total: ${formatCurrency(totalDevido)}`
      );
    } catch (error) {
      Alert.alert("Erro", "Falha ao gerar relatório PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviarEmail = async () => {
    setIsLoading(true);
    try {
      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Sucesso", "Relatório enviado por email para o administrador");
    } catch (error) {
      Alert.alert("Erro", "Falha ao enviar email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Inadimplentes</Text>
            <Text className="text-sm text-muted">Exportar relatório de moradores em atraso</Text>
          </View>

          {/* Summary */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-muted">Total de Moradores</Text>
              <Text className="text-2xl font-bold text-foreground">{filtered.length}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-muted">Valor Total em Atraso</Text>
              <Text className="text-2xl font-bold text-error">{formatCurrency(totalDevido)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-semibold text-muted">Média por Morador</Text>
              <Text className="text-lg font-bold text-foreground">
                {formatCurrency(totalDevido / (filtered.length || 1))}
              </Text>
            </View>
          </View>

          {/* Filters */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Filtrar por Risco</Text>
            <View className="flex-row gap-2">
              {(["todos", "critico", "medio"] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFiltro(f)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      backgroundColor: filtro === f ? "#0a7ea4" : "#f5f5f5",
                      borderColor: filtro === f ? "#0a7ea4" : "#e5e7eb",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      filtro === f ? "text-background" : "text-foreground"
                    }`}
                  >
                    {f === "todos"
                      ? "Todos"
                      : f === "critico"
                        ? "Crítico"
                        : "Médio"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Sort */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Ordenar por</Text>
            <View className="flex-row gap-2">
              {(["dias", "valor", "nome"] as const).map((o) => (
                <Pressable
                  key={o}
                  onPress={() => setOrdenacao(o)}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      backgroundColor: ordenacao === o ? "#0a7ea4" : "#f5f5f5",
                      borderColor: ordenacao === o ? "#0a7ea4" : "#e5e7eb",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    className={`text-xs font-semibold text-center ${
                      ordenacao === o ? "text-background" : "text-foreground"
                    }`}
                  >
                    {o === "dias"
                      ? "Dias"
                      : o === "valor"
                        ? "Valor"
                        : "Nome"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* List */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Lista ({filtered.length} moradores)
            </Text>
            <View className="bg-surface rounded-lg border border-border overflow-hidden">
              {filtered.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="text-sm text-muted">Nenhum morador encontrado com este filtro</Text>
                </View>
              ) : (
                filtered.map((morador, index) => (
                  <View
                    key={morador.id}
                    className={`p-3 border-b border-border ${index === filtered.length - 1 ? "border-b-0" : ""}`}
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{morador.nome}</Text>
                        <Text className="text-xs text-muted">
                          {morador.casa}
                          {morador.bloco && ` / ${morador.bloco}`}
                        </Text>
                      </View>
                      <StatusBadge
                        type={
                          getRiskLevel(morador.diasAtraso) === "alto"
                            ? "vencido"
                            : getRiskLevel(morador.diasAtraso) === "médio"
                              ? "pendente"
                              : "pago"
                        }
                        label={`${morador.diasAtraso}d`}
                        size="sm"
                      />
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-error font-bold">
                        {formatCurrency(morador.totalDevido)}
                      </Text>
                      <Text className="text-xs text-muted">
                        {morador.cobrancasVencidas} cobrança{morador.cobrancasVencidas !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2">
            <Pressable
              onPress={handleExportarPDF}
              disabled={isLoading || filtered.length === 0}
              style={({ pressed }) => [
                { backgroundColor: "#0a7ea4", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
                (isLoading || filtered.length === 0) && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text className="text-background font-semibold">
                {isLoading ? "Gerando PDF..." : "📥 Exportar em PDF"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleEnviarEmail}
              disabled={isLoading || filtered.length === 0}
              style={({ pressed }) => [
                { backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#0a7ea4", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
                (isLoading || filtered.length === 0) && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text className="text-primary font-semibold">
                {isLoading ? "Enviando..." : "📧 Enviar por Email"}
              </Text>
            </Pressable>
          </View>

          {/* Info Alert */}
          {filtered.length > 0 && (
            <AlertBadge
              type="info"
              message={`Relatório pronto para exportação com ${filtered.length} moradores e ${formatCurrency(totalDevido)} em atraso`}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
