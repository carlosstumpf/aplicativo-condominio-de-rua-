import { ScrollView, Text, View, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

interface PaymentData {
  id: string;
  value: number;
  dueDate: string;
  status: string;
  billingType: string;
  description?: string;
}

export default function CobrancasScreen() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Mock data for demonstration
  const mockPayments: PaymentData[] = [
    {
      id: "pay_1",
      value: 250.0,
      dueDate: "2026-04-30",
      status: "PENDING",
      billingType: "PIX",
      description: "Condomínio - Abril 2026",
    },
    {
      id: "pay_2",
      value: 150.0,
      dueDate: "2026-05-15",
      status: "PENDING",
      billingType: "BOLETO",
      description: "Condomínio - Maio 2026",
    },
    {
      id: "pay_3",
      value: 300.0,
      dueDate: "2026-04-20",
      status: "OVERDUE",
      billingType: "PIX",
      description: "Condomínio - Março 2026",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-warning/20";
      case "RECEIVED":
        return "bg-success/20";
      case "CONFIRMED":
        return "bg-success/20";
      case "OVERDUE":
        return "bg-error/20";
      default:
        return "bg-muted/20";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "text-warning";
      case "RECEIVED":
        return "text-success";
      case "CONFIRMED":
        return "text-success";
      case "OVERDUE":
        return "text-error";
      default:
        return "text-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendente";
      case "RECEIVED":
        return "Recebido";
      case "CONFIRMED":
        return "Confirmado";
      case "OVERDUE":
        return "Vencido";
      default:
        return status;
    }
  };

  const handleGenerateQrCode = (payment: PaymentData) => {
    if (payment.billingType !== "PIX") {
      Alert.alert("Erro", "QR Code disponível apenas para pagamentos PIX");
      return;
    }

    setSelectedPayment(payment);
    setShowQrCode(true);
  };

  const handleGenerateBankSlip = (payment: PaymentData) => {
    if (payment.billingType !== "BOLETO") {
      Alert.alert("Erro", "Boleto disponível apenas para pagamentos BOLETO");
      return;
    }

    Alert.alert(
      "Boleto",
      `Linha digitável:\n123456.78901 234567.890123 456789.012345 1 12345678901234`,
      [
        {
          text: "Copiar",
          onPress: () => Alert.alert("Sucesso", "Linha digitável copiada!"),
        },
        { text: "Fechar" },
      ]
    );
  };

  const filteredPayments = mockPayments.filter(
    (p) =>
      p.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.id.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Cobranças</Text>
            <Text className="text-sm text-muted">Gerencie pagamentos e gere QR Codes PIX</Text>
          </View>

          {/* Search Bar */}
          <TextInput
            placeholder="Buscar cobrança..."
            placeholderTextColor="#687076"
            value={searchText}
            onChangeText={setSearchText}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
          />

          {/* QR Code Display */}
          {showQrCode && selectedPayment && (
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-foreground">QR Code PIX</Text>
                <Pressable onPress={() => setShowQrCode(false)}>
                  <Text className="text-primary font-semibold">Fechar</Text>
                </Pressable>
              </View>

              {/* Mock QR Code Display */}
              <View className="bg-white rounded-lg p-4 items-center justify-center aspect-square border-2 border-border">
                <Text className="text-center text-sm text-muted font-mono">
                  [QR Code PIX]{"\n"}
                  {selectedPayment.value.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              </View>

              {/* Copy to Clipboard */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Código PIX (copiar e colar):</Text>
                <View className="bg-background rounded-lg p-3 border border-border">
                  <Text className="text-xs text-muted font-mono break-words">
                    00020126580014br.gov.bcb.pix0136550e8400-e29d-46a2-a278-744ee4a74d7652040000530398654061234.567895802BR5913CONDOMINIO LTDA6009SAO PAULO62410503***63041D3D
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    {
                      backgroundColor: "#0a7ea4",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => Alert.alert("Sucesso", "Código PIX copiado para a área de transferência!")}
                >
                  <Text className="text-white text-center font-semibold">Copiar Código</Text>
                </Pressable>
              </View>

              {/* Payment Details */}
              <View className="gap-2 border-t border-border pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Valor:</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {selectedPayment.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">Vencimento:</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {new Date(selectedPayment.dueDate).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Charges List */}
          <View className="gap-3">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <View
                  key={payment.id}
                  className="bg-surface rounded-lg p-4 border border-border gap-3"
                >
                  {/* Header */}
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {payment.description}
                      </Text>
                      <Text className="text-sm text-muted mt-1">ID: {payment.id}</Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${getStatusTextColor(
                          payment.status
                        )}`}
                      >
                        {getStatusLabel(payment.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Amount and Date */}
                  <View className="flex-row justify-between items-center bg-background rounded-lg p-3">
                    <View>
                      <Text className="text-xs text-muted">Valor</Text>
                      <Text className="text-lg font-bold text-foreground">
                        {payment.value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-muted">Vencimento</Text>
                      <Text className="text-lg font-bold text-foreground">
                        {new Date(payment.dueDate).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    {payment.billingType === "PIX" ? (
                      <Pressable
                        onPress={() => handleGenerateQrCode(payment)}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            backgroundColor: "#0a7ea4",
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-white text-center font-semibold text-sm">
                          📱 QR Code PIX
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handleGenerateBankSlip(payment)}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            backgroundColor: "#0a7ea4",
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text className="text-white text-center font-semibold text-sm">
                          📄 Boleto
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={({ pressed }) => [
                        {
                          flex: 1,
                          backgroundColor: "#F59E0B",
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 6,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text className="text-white text-center font-semibold text-sm">
                        Detalhes
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  Nenhuma cobrança encontrada
                </Text>
                <Text className="text-sm text-muted">Crie uma nova cobrança para começar</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
