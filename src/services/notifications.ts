import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationSettings, TodoItem } from '../types/todo';
import { getTodayString } from './storage';

// Configure how notifications should be handled when the app is in foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (err) {
  console.warn('Could not set notification handler:', err);
}

/**
 * Setup Android Notification Channel (Required on Android 8.0+)
 */
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Gừng Todo Nhắc việc',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EA580C',
        enableVibrate: true,
        showBadge: true,
      });
    } catch {
      // Silently ignore channel errors in Expo Go where FCM is not initialized
    }
  }
};

/**
 * Check existing notification permissions safely
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.warn('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Request notification permissions safely for both iOS and Android
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule recurring daily offline notifications for morning and evening.
 * Runs 100% offline and safe against unhandled exceptions on any platform.
 */
export const scheduleDailyNotifications = async (
  todos: TodoItem[],
  settings: NotificationSettings
): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannel();

    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return false;

    // Cancel previously scheduled local notifications to avoid duplicates
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (cancelErr) {
      console.warn('Error canceling scheduled notifications:', cancelErr);
    }

    const today = getTodayString();
    const todayTodos = todos.filter(t => t.date === today);
    const pendingTodos = todayTodos.filter(t => !t.completed);
    const pendingCount = pendingTodos.length;

    // 1. Morning Notification (Lên dây cót buổi sáng)
    if (settings.morningEnabled) {
      const morningBody =
        pendingCount > 0
          ? `Hôm nay bạn có ${pendingCount} việc cần làm. Cùng Mèo Gừng bắt đầu ngày mới thật năng suất nhé! 🐱✨`
          : 'Chào ngày mới! Hãy lên danh sách các việc cần làm hôm nay cùng Mèo Gừng nhé! 🐾';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Chào buổi sáng từ Mèo Gừng!',
          body: morningBody,
          sound: settings.soundEnabled,
          badge: pendingCount,
          data: { type: 'morning_check', date: today },
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: settings.morningTime.hour,
          minute: settings.morningTime.minute,
        },
      });
    }

    // 2. Evening Notification (Kiểm tra tan làm / trước khi ngủ)
    if (settings.eveningEnabled) {
      const eveningBody =
        pendingCount === 0
          ? '🎉 Tuyệt đỉnh! Bạn đã hoàn thành tất cả công việc của ngày hôm nay rồi! Thư giãn nghỉ ngơi thôi nào! 🐾'
          : `⏰ Sắp hết ngày rồi, bạn vẫn còn ${pendingCount} việc chưa tick xong. Vào kiểm tra lại với Mèo Gừng nhé! 🐱`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Chiều tan làm rồi nè!',
          body: eveningBody,
          sound: settings.soundEnabled,
          badge: pendingCount,
          data: { type: 'evening_check', date: today },
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: settings.eveningTime.hour,
          minute: settings.eveningTime.minute,
        },
      });
    }

    return true;
  } catch (error) {
    console.warn('Error scheduling daily notifications:', error);
    return false;
  }
};

/**
 * Triggers a test notification 3 seconds in the future
 * so the user can immediately verify push notifications on both iOS and Android!
 */
export const triggerTestNotification = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    await setupNotificationChannel();

    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🐾 Mèo Gừng thử nghiệm thông báo!',
        body: 'Thông báo đẩy offline hoạt động hoàn hảo và siêu mượt trên điện thoại của bạn! 🐱✨',
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });

    return true;
  } catch (error) {
    console.warn('Error triggering test notification:', error);
    return false;
  }
};
