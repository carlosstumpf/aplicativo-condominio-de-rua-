/**
 * Batch Billing Screen
 * Create and manage batch billing operations
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  amount: number;
  icon: string;
}

interface BatchBillingJob {
  id: number;
  name: string;
  description: string;
  dueDate: Date;
  amount: number;
  totalMoradores: number;
  status: "pending" | "processing" | "completed" | "failed";
  totalCreated: number;
  totalFailed: number;
  createdAt: Date;
}

const BATCH_TEMPLATES: BatchTemplate[] = [
  {
    id: "monthly",
    name: "Mensalidade Mensal",
    description: "Cobrança mensal padrão do condomínio",
    amount: 500,
    icon: "📅",
  },
  {
    id: "maintenance",
    name: "Manutenção Extraordinária",
    description: "Cobrança para manutenção especial",
    amount: 250,
    icon: "🔧",
  },
  {
    id: "improvement",
    name: "Melhoria Predial",
    description: "Cobrança para melhorias no condomínio",
    amount: 300,
    icon: "🏗️",
  },
  {
    id: "custom",
    name: "Personalizado",
    description: "Criar cobrança customizada",
    amount: 0,
    icon: "➕",
  },
];

export default function BatchBillingScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [selectedTemplate, setSelectedTemplate] = useState<BatchTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batches, setBatches] = useState<BatchBillingJob[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dueDate: new Date(),
    amount: 0,
  });

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      // TODO: Load batch history from API
      setBatches([]);
    } catch (error) {
      console.error("Error loading batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: BatchTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      dueDate: new Date(),
      amount: template.amount,
    });
    setShowCreateModal(true);
  };

  const handleCreateBatch = async () => {
    try {
      setLoading(true);
      // TODO: Call API to create batch
      console.log("Creating batch:", formData);
      setShowCreateModal(false);
      setSelectedTemplate(null);
      setFormData({
        name: "",
        description: "",
        dueDate: new Date(),
        amount: 0,
      });
      loadBatches();
    } catch (error) {
      console.error("Error creating batch:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      {/* Tab Navigation */}
      <View className="flex-row bg-surface border-b border-border">
        <Pressable
          className={cn("flex-1 py-4 items-center border-b-2", activeTab === "create" ? "border-primary" : "border-transparent")}
          style={{
            borderBottomColor: activeTab === "create" ? colors.primary : "transparent",
          }}
          onPress={() => setActiveTab("create")}
        >
          <Text className={cn("font-semibold", activeTab === "create" ? "text-primary" : "text-muted")}>
            Criar Lote
          </Text>
        </Pressable>
        <Pressable
          className={cn("flex-1 py-4 items-center border-b-2", activeTab === "history" ? "border-primary" : "border-transparent")}
          style={{
            borderBottomColor: activeTab === "history" ? colors.primary : "transparent",
          }}
          onPress={() => setActiveTab("history")}
        >
          <Text className={cn("font-semibold", activeTab === "history" ? "text-primary" : "text-muted")}>
            Histórico
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {activeTab === "create" ? (
          // Create Tab
          <View className="p-4">
            <Text className="text-2xl font-bold text-foreground mb-6">Gerar Cobrança em Lote</Text>

            <Text className="text-lg font-semibold text-foreground mb-4">Modelos Disponíveis</Text>

            {BATCH_TEMPLATES.map((template) => (
              <Pressable
                key={template.id}
                onPress={() => handleTemplateSelect(template)}
                className="mb-3"
              >
                <View
                  className="flex-row items-center p-4 rounded-lg border border-border"
                  style={{ borderColor: colors.border }}
                >
                  <Text className="text-3xl mr-4">{template.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{template.name}</Text>
                    <Text className="text-muted text-sm">{template.description}</Text>
                    {template.amount > 0 && (
                      <Text className="text-primary font-semibold mt-1">
                        R$ {template.amount.toFixed(2)} por morador
                      </Text>
                    )}
                  </View>
                  <Text className="text-2xl">→</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          // History Tab
          <View className="p-4">
            <Text className="text-2xl font-bold text-foreground mb-6">Histórico de Lotes</Text>

            {loading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : batches.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-muted text-center">Nenhum lote de cobrança criado</Text>
              </View>
            ) : (
              batches.map((batch) => (
                <Pressable key={batch.id} className="mb-3">
                  <View
                    className="rounded-lg p-4 border border-border"
                    style={{ borderColor: colors.border }}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold mb-1">{batch.name}</Text>
                        <Text className="text-muted text-sm">{batch.description}</Text>
                      </View>
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            batch.status === "completed"
                              ? `${colors.success}20`
                              : batch.status === "processing"
                                ? `${colors.warning}20`
                                : batch.status === "failed"
                                  ? `${colors.error}20`
                                  : `${colors.muted}20`,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color:
                              batch.status === "completed"
                                ? colors.success
                                : batch.status === "processing"
                                  ? colors.warning
                                  : batch.status === "failed"
                                    ? colors.error
                                    : colors.muted,
                          }}
                        >
                          {batch.status === "completed"
                            ? "✓ Concluído"
                            : batch.status === "processing"
                              ? "⏳ Processando"
                              : batch.status === "failed"
                                ? "✗ Falhou"
                                : "⏸ Pendente"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between text-sm mb-3">
                      <View>
                        <Text className="text-muted text-xs mb-1">Moradores</Text>
                        <Text className="text-foreground font-semibold">{batch.totalMoradores}</Text>
                      </View>
                      <View>
                        <Text className="text-muted text-xs mb-1">Criadas</Text>
                        <Text className="text-success font-semibold">{batch.totalCreated}</Text>
                      </View>
                      <View>
                        <Text className="text-muted text-xs mb-1">Falhadas</Text>
                        <Text className="text-error font-semibold">{batch.totalFailed}</Text>
                      </View>
                      <View>
                        <Text className="text-muted text-xs mb-1">Valor Total</Text>
                        <Text className="text-foreground font-semibold">
                          R$ {(batch.amount * batch.totalCreated).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View className="border-t border-border pt-3">
                      <Text className="text-muted text-xs">
                        Criado em: {batch.createdAt.toLocaleString("pt-BR")}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Batch Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="rounded-t-3xl p-6 pt-8"
            style={{ backgroundColor: colors.background }}
          >
            {/* Close Button */}
            <Pressable onPress={() => setShowCreateModal(false)} className="absolute top-4 right-4 z-10">
              <Text className="text-2xl">✕</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-2xl font-bold text-foreground mb-2">
                {selectedTemplate?.name}
              </Text>
              <Text className="text-muted mb-6">{selectedTemplate?.description}</Text>

              {/* Form Fields */}
              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2">Nome da Cobrança</Text>
                <TextInput
                  className="border border-border rounded-lg p-3 text-foreground"
                  style={{ borderColor: colors.border }}
                  placeholder="Ex: Taxa de Maio"
                  placeholderTextColor={colors.muted}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2">Descrição</Text>
                <TextInput
                  className="border border-border rounded-lg p-3 text-foreground"
                  style={{ borderColor: colors.border }}
                  placeholder="Ex: Taxa de condomínio referente a maio"
                  placeholderTextColor={colors.muted}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2">Valor por Morador</Text>
                <View className="flex-row items-center border border-border rounded-lg p-3">
                  <Text className="text-foreground font-semibold mr-2">R$</Text>
                  <TextInput
                    className="flex-1 text-foreground"
                    placeholder="0,00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    value={formData.amount.toFixed(2)}
                    onChangeText={(text) =>
                      setFormData({ ...formData, amount: parseFloat(text) || 0 })
                    }
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-foreground font-semibold mb-2">Data de Vencimento</Text>
                <Pressable className="border border-border rounded-lg p-3">
                  <Text className="text-foreground">
                    {formData.dueDate.toLocaleDateString("pt-BR")}
                  </Text>
                </Pressable>
              </View>

              {/* Summary */}
              <View className="bg-primary/10 rounded-lg p-4 mb-6">
                <Text className="text-muted text-sm mb-2">Resumo</Text>
                <Text className="text-foreground font-semibold mb-1">
                  Será gerada cobrança para todos os moradores
                </Text>
                <Text className="text-primary font-bold text-lg">
                  Total Estimado: R$ {(formData.amount * 50).toFixed(2)}
                </Text>
                <Text className="text-muted text-xs mt-2">(50 moradores × R$ {formData.amount.toFixed(2)})</Text>
              </View>

              {/* Action Buttons */}
              <Pressable
                className="bg-primary rounded-lg py-4 items-center mb-3"
                style={{ backgroundColor: colors.primary }}
                onPress={handleCreateBatch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">Gerar Lote</Text>
                )}
              </Pressable>

              <Pressable
                className="border border-border rounded-lg py-3 items-center"
                style={{ borderColor: colors.border }}
                onPress={() => setShowCreateModal(false)}
                disabled={loading}
              >
                <Text className="text-foreground font-semibold">Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
