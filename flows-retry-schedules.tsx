/**
 * Flows Retry Schedules Screen
 * Manage and view scheduled retries
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import {
  RetryScheduleCard,
  RetryScheduleStats,
} from "@/components/flows-retry-scheduler";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface RetrySchedule {
  id: number;
  flowHistoryId: number;
  flowType: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  scheduledTime: Date;
  attemptsCount: number;
  maxRetries: number;
  notes?: string;
}

interface RetryStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
}

type FilterStatus = "all" | "pending" | "completed" | "failed" | "cancelled";

export default function FlowsRetrySchedulesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [schedules, setSchedules] = useState<RetrySchedule[]>([]);
  const [stats, setStats] = useState<RetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load schedules
  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await trpc.flows.getRetrySchedules.query();
      // setSchedules(response.schedules);
      // setStats(response.stats);

      // Mock data for now
      setSchedules([
        {
          id: 1,
          flowHistoryId: 1,
          flowType: "payment",
          status: "pending",
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          attemptsCount: 1,
          maxRetries: 3,
          notes: "Reenvio automático de pagamento",
        },
        {
          id: 2,
          flowHistoryId: 2,
          flowType: "maintenance",
          status: "pending",
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          attemptsCount: 0,
          maxRetries: 5,
        },
        {
          id: 3,
          flowHistoryId: 3,
          flowType: "payment",
          status: "completed",
          scheduledTime: new Date(Date.now() - 60 * 60 * 1000),
          attemptsCount: 2,
          maxRetries: 3,
        },
      ]);

      setStats({
        total: 3,
        pending: 2,
        completed: 1,
        failed: 0,
        cancelled: 0,
        successRate: 100,
      });
    } catch (error) {
      console.error("Error loading schedules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  }, [loadSchedules]);

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule) => {
    if (filterStatus !== "all" && schedule.status !== filterStatus) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        schedule.flowType.toLowerCase().includes(query) ||
        schedule.id.toString().includes(query) ||
        schedule.notes?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleCancel = async (id: number) => {
    try {
      // TODO: Replace with actual API call
      // await trpc.flows.cancelRetrySchedule.mutate({ scheduleId: id });
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error cancelling schedule:", error);
    }
  };

  const handleReschedule = (id: number) => {
    // TODO: Open reschedule modal
    console.log("Reschedule schedule:", id);
  };

  return (
    <ScreenContainer className="flex-1">
      <FlatList
        data={filteredSchedules}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RetryScheduleCard
            id={item.id}
            flowType={item.flowType}
            status={item.status}
            scheduledTime={new Date(item.scheduledTime)}
            attempts={item.attemptsCount}
            maxRetries={item.maxRetries}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
          />
        )}
        ListHeaderComponent={
          <View className="pb-4">
            {/* Title */}
            <Text className="text-3xl font-bold text-foreground mb-4">
              📅 Reenvios Agendados
            </Text>

            {/* Stats */}
            {stats && (
              <RetryScheduleStats
                total={stats.total}
                pending={stats.pending}
                completed={stats.completed}
                failed={stats.failed}
                successRate={stats.successRate}
              />
            )}

            {/* Search Bar */}
            <View
              className="bg-surface rounded-lg p-3 mb-4 flex-row items-center gap-2"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-lg">🔍</Text>
              <Text
                className="flex-1 text-foreground"
                placeholder="Buscar reenvios..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
              >
                {searchQuery || "Buscar reenvios..."}
              </Text>
            </View>

            {/* Filter Buttons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row gap-2">
                {(
                  [
                    { value: "all", label: "Todos", icon: "📋" },
                    { value: "pending", label: "Pendentes", icon: "⏳" },
                    { value: "completed", label: "Concluídos", icon: "✅" },
                    { value: "failed", label: "Falhados", icon: "❌" },
                  ] as const
                ).map((filter) => (
                  <Pressable
                    key={filter.value}
                    onPress={() => setFilterStatus(filter.value)}
                    className={cn(
                      "px-4 py-2 rounded-full flex-row items-center gap-1",
                      filterStatus === filter.value
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    )}
                    style={{
                      backgroundColor:
                        filterStatus === filter.value
                          ? colors.primary
                          : colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <Text className="text-lg">{filter.icon}</Text>
                    <Text
                      className={cn(
                        "font-semibold text-sm",
                        filterStatus === filter.value
                          ? "text-background"
                          : "text-foreground"
                      )}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Loading State */}
            {loading && (
              <View className="flex-row justify-center py-8">
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View className="flex-row justify-center py-8">
              <View className="items-center gap-2">
                <Text className="text-4xl">📭</Text>
                <Text className="text-foreground font-semibold">
                  Nenhum reenvio agendado
                </Text>
                <Text className="text-muted text-sm">
                  Quando um flow falhar, você poderá agendar um reenvio automático
                </Text>
              </View>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        className="flex-1"
      />
    </ScreenContainer>
  );
}
