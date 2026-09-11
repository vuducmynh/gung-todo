import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationSettings, TodoItem } from '../types/todo';
import { getTodayString } from './storage';

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Check existing notification permissions
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Request notification permissions from iOS
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule recurring daily offline notifications for morning and evening.
 * Runs 100% offline using iOS UNUserNotificationCenter.
 */
export const scheduleDailyNotifications = async (
  todos: TodoItem[],
  settings: NotificationSettings
): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return false;

    // Cancel previously scheduled local notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

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
    console.error('Error scheduling daily notifications:', error);
    return false;
  }
};

/**
 * Triggers a test notification 3 seconds in the future
 * so the user can immediately verify push notifications on iPhone 13 mini!
 */
export const triggerTestNotification = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🐾 Mèo Gừng thử nghiệm thông báo!',
        body: 'Thông báo đẩy offline hoạt động hoàn hảo và siêu mượt trên iPhone của bạn! 🐱✨',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });

    return true;
  } catch (error) {
    console.error('Error triggering test notification:', error);
    return false;
  }
};
