/**
 * Push Notifications Service
 * Handles Expo push notifications for real-time alerts
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Initialize notifications
 */
export async function initializePushNotifications() {
  try {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions
    if (Platform.OS !== "web") {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push notification permissions");
        return null;
      }
    }

    // Get push token
    if (Device.isDevice) {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.projectId,
      });

      return token.data;
    }

    return null;
  } catch (error) {
    console.error("Error initializing push notifications:", error);
    return null;
  }
}

/**
 * Send local notification
 */
export async function sendLocalNotification(data: {
  title: string;
  body: string;
  badge?: number;
  sound?: boolean;
  data?: Record<string, any>;
  delay?: number;
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        badge: data.badge,
        sound: data.sound !== false ? "default" : undefined,
        data: data.data || {},
      },
      trigger: data.delay
        ? { seconds: Math.floor(data.delay / 1000) }
        : null,
    });
  } catch (error) {
    console.error("Error sending local notification:", error);
  }
}

/**
 * Send notification with different priority levels
 */
export async function sendPriorityNotification(data: {
  title: string;
  body: string;
  priority: "baixa" | "normal" | "alta" | "crítica";
  data?: Record<string, any>;
}) {
  const config = {
    baixa: {
      badge: 1,
      sound: false,
      delay: 5000,
    },
    normal: {
      badge: 1,
      sound: true,
      delay: 0,
    },
    alta: {
      badge: 2,
      sound: true,
      delay: 0,
    },
    crítica: {
      badge: 3,
      sound: true,
      delay: 0,
    },
  };

  const settings = config[data.priority];

  await sendLocalNotification({
    title: data.title,
    body: data.body,
    badge: settings.badge,
    sound: settings.sound,
    delay: settings.delay,
    data: data.data,
  });
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Listen to notifications when app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listen to notification responses (when user taps notification)
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      onNotificationResponse?.(response);
    });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling notifications:", error);
  }
}

/**
 * Cancel specific notification
 */
export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}

/**
 * Notification templates
 */
export const notificationTemplates = {
  /**
   * Payment received notification
   */
  pagamentoRecebido: (morador: string, valor: number) => ({
    title: "💰 Pagamento Recebido",
    body: `${morador} pagou R$ ${valor}`,
    priority: "normal" as const,
    data: { tipo: "pagamento" },
  }),

  /**
   * Payment overdue notification
   */
  pagamentoAtrasado: (morador: string, dias: number) => ({
    title: "⚠️ Pagamento Atrasado",
    body: `${morador} está ${dias} dias em atraso`,
    priority: "alta" as const,
    data: { tipo: "cobranca" },
  }),

  /**
   * Expense registered notification
   */
  despesaRegistrada: (titulo: string, valor: number) => ({
    title: "📋 Despesa Registrada",
    body: `${titulo} - R$ ${valor}`,
    priority: "normal" as const,
    data: { tipo: "despesa" },
  }),

  /**
   * Communication sent notification
   */
  comunicadoEnviado: (titulo: string, recipients: number) => ({
    title: "📢 Comunicado Enviado",
    body: `${titulo} para ${recipients} moradores`,
    priority: "normal" as const,
    data: { tipo: "comunicado" },
  }),

  /**
   * Critical alert notification
   */
  alertaCritico: (titulo: string, descricao: string) => ({
    title: "🚨 Alerta Crítico",
    body: descricao,
    priority: "crítica" as const,
    data: { tipo: "alerta", titulo },
  }),

  /**
   * Task assigned notification
   */
  tarefaAtribuida: (titulo: string) => ({
    title: "✓ Nova Tarefa",
    body: titulo,
    priority: "alta" as const,
    data: { tipo: "tarefa" },
  }),

  /**
   * Task deadline notification
   */
  tarefaVencendo: (titulo: string, tempo: string) => ({
    title: "⏰ Tarefa Vencendo",
    body: `${titulo} vence ${tempo}`,
    priority: "alta" as const,
    data: { tipo: "tarefa" },
  }),

  /**
   * System maintenance notification
   */
  manutencaoSistema: () => ({
    title: "🔧 Manutenção do Sistema",
    body: "Sistema em manutenção. Voltaremos em breve.",
    priority: "baixa" as const,
    data: { tipo: "alerta" },
  }),
};

/**
 * Send batch notifications
 */
export async function sendBatchNotifications(
  notifications: Array<{
    title: string;
    body: string;
    priority: "baixa" | "normal" | "alta" | "crítica";
    delay?: number;
  }>
) {
  try {
    const results = await Promise.all(
      notifications.map((notif) =>
        sendPriorityNotification({
          title: notif.title,
          body: notif.body,
          priority: notif.priority,
        })
      )
    );

    return {
      total: notifications.length,
      enviadas: results.length,
    };
  } catch (error) {
    console.error("Error sending batch notifications:", error);
    return {
      total: notifications.length,
      enviadas: 0,
    };
  }
}

/**
 * Setup notification badge
 */
export async function setNotificationBadge(count: number) {
  try {
    if (Platform.OS !== "web") {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch (error) {
    console.error("Error setting badge:", error);
  }
}

/**
 * Clear notification badge
 */
export async function clearNotificationBadge() {
  try {
    if (Platform.OS !== "web") {
      await Notifications.setBadgeCountAsync(0);
    }
  } catch (error) {
    console.error("Error clearing badge:", error);
  }
}
