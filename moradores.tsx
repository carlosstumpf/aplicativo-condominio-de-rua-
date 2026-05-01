import { ScrollView, Text, View, FlatList, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

type StatusFilter = "todos" | "ativo" | "inativo";

export default function MoradoresScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [limit] = useState(10);

  const moradoresQuery = trpc.moradores.list.useQuery({
    page,
    limit,
    search: searchText || undefined,
    status,
  });

  const handleSearch = (text: string) => {
    setSearchText(text);
    setPage(1); // Reset to first page on search
  };

  const handleStatusFilter = (newStatus: StatusFilter) => {
    setStatus(newStatus);
    setPage(1); // Reset to first page on filter change
  };

  const handleNextPage = () => {
    if (moradoresQuery.data?.pagination.hasNextPage) {
      setPage(page + 1);
    }
  };

  const handlePreviousPage = () => {
    if (moradoresQuery.data?.pagination.hasPreviousPage) {
      setPage(page - 1);
    }
  };

  const renderMorador = ({ item }: any) => (
      <Pressable
        onPress={() => {}} // TODO: Navigate to morador detail
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.nomeCompleto}</Text>
            <Text className="text-sm text-muted">Casa: {item.identificacaoCasa}</Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${
              item.statusAtivo === 1
                ? "bg-success/20"
                : "bg-error/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                item.statusAtivo === 1 ? "text-success" : "text-error"
              }`}
            >
              {item.statusAtivo === 1 ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>

        <Text className="text-sm text-muted mb-3">Tel: {item.telefone}</Text>

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
            <Text className="text-white text-center text-sm font-semibold">Ver Detalhes</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: "#F59E0B",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 6,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text className="text-white text-center text-sm font-semibold">Cobrar</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const emptyListMessage = () => (
    <View className="items-center justify-center py-8">
      <Text className="text-lg font-semibold text-foreground mb-2">Nenhum morador encontrado</Text>
      <Text className="text-sm text-muted">
        {searchText ? "Tente ajustar sua busca" : "Clique em + Novo Morador para adicionar"}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <View className="gap-4 flex-1">
        {/* Header */}
        <View className="gap-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-foreground">Moradores</Text>
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: "#0a7ea4",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text className="text-white font-semibold">+ Novo</Text>
            </Pressable>
          </View>

          {/* Total Count */}
          {moradoresQuery.data && (
            <Text className="text-sm text-muted">
              Total: {moradoresQuery.data.pagination.total} morador(es)
            </Text>
          )}
        </View>

        {/* Search Bar */}
        <View className="gap-2">
          <TextInput
            placeholder="Buscar por nome, casa ou telefone..."
            placeholderTextColor="#687076"
            value={searchText}
            onChangeText={handleSearch}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        {/* Status Filter Tabs */}
        <View className="flex-row gap-2">
          {(["todos", "ativo", "inativo"] as StatusFilter[]).map((filterStatus) => (
            <Pressable
              key={filterStatus}
              onPress={() => handleStatusFilter(filterStatus)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor:
                    status === filterStatus ? "#0a7ea4" : "#f5f5f5",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  status === filterStatus ? "text-white" : "text-foreground"
                }`}
              >
                {filterStatus === "todos" && "Todos"}
                {filterStatus === "ativo" && "Ativos"}
                {filterStatus === "inativo" && "Inativos"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Loading State */}
        {moradoresQuery.isLoading && (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="text-muted mt-2">Carregando moradores...</Text>
          </View>
        )}

        {/* Moradores List */}
        {!moradoresQuery.isLoading && moradoresQuery.data && (
          <>
            {moradoresQuery.data.data.length > 0 ? (
              <FlatList
                data={moradoresQuery.data.data}
                renderItem={renderMorador}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                ListEmptyComponent={emptyListMessage}
              />
            ) : (
              emptyListMessage()
            )}
          </>
        )}

        {/* Pagination Controls */}
        {moradoresQuery.data && moradoresQuery.data.pagination.total > 0 && (
          <View className="gap-3 mt-4">
            <View className="flex-row justify-between items-center bg-surface rounded-lg p-3 border border-border">
              <Text className="text-sm text-muted">
                Página {moradoresQuery.data.pagination.page} de{" "}
                {moradoresQuery.data.pagination.totalPages}
              </Text>
              <Text className="text-sm text-muted">
                {moradoresQuery.data.data.length} de{" "}
                {moradoresQuery.data.pagination.total}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={handlePreviousPage}
                disabled={!moradoresQuery.data.pagination.hasPreviousPage}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: moradoresQuery.data.pagination.hasPreviousPage
                      ? "#0a7ea4"
                      : "#cccccc",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold">← Anterior</Text>
              </Pressable>

              <Pressable
                onPress={handleNextPage}
                disabled={!moradoresQuery.data.pagination.hasNextPage}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: moradoresQuery.data.pagination.hasNextPage
                      ? "#0a7ea4"
                      : "#cccccc",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text className="text-white text-center font-semibold">Próxima →</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
