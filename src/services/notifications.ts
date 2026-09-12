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
    const pendingTodos = todos.filter(t => !t.completed && (!t.date || t.date <= today));
    const pendingCount = pendingTodos.length;

    // QUY TẮC: Nếu không có việc gì chưa hoàn thành hôm nay -> KHÔNG gửi thông báo làm phiền!
    if (pendingCount === 0) {
      return true;
    }

    // Thông báo duy nhất 1 lần trong ngày vào cuối buổi chiều (mặc định 18:00 hoặc giờ người dùng chọn)
    if (settings.eveningEnabled) {
      const reminderTitle = '🐾 Mèo Gừng nhắc việc';
      const reminderBody = `Hôm nay bạn còn ${pendingCount} công việc chưa hoàn tất nè. Vào kiểm tra lại cùng Mèo Gừng nhé! 🐱✨`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderTitle,
          body: reminderBody,
          sound: settings.soundEnabled,
          badge: pendingCount,
          data: { type: 'daily_evening_reminder', date: today, count: pendingCount },
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
