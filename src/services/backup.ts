import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BackupData, TodoItem, NotificationSettings } from '../types/todo';
import { loadTodos, loadSettings, saveTodos, saveSettings, getTodayString } from './storage';

/**
 * Generates a JSON backup file and opens the iOS Share Sheet
 * so the user can save to Files (iCloud Drive), AirDrop, etc.
 */
export const exportBackupToFile = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const todos = await loadTodos();
    const settings = await loadSettings();
    const today = getTodayString();

    const backupData: BackupData = {
      appName: 'Gừng Todo',
      version: 1,
      exportedAt: new Date().toISOString(),
      todos,
      settings,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `GungTodo_Backup_${today}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'Tính năng chia sẻ không khả dụng trên thiết bị này.',
      };
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Lưu bản sao lưu Gừng Todo',
      UTI: 'public.json',
    });

    return {
      success: true,
      message: `Đã chuẩn bị bản sao lưu (${todos.length} công việc). Bạn có thể lưu vào Tệp hoặc iCloud Drive!`,
    };
  } catch (error) {
    console.error('Error exporting backup:', error);
    return {
      success: false,
      message: 'Không thể tạo file sao lưu: ' + (error instanceof Error ? error.message : String(error)),
    };
  }
};

/**
 * Parses and restores backup data from a JSON string.
 */
export const restoreFromBackupData = async (
  rawJson: string,
  mode: 'replace' | 'merge' = 'merge'
): Promise<{ success: boolean; message: string; restoredCount: number }> => {
  try {
    const parsed = JSON.parse(rawJson);

    if (!parsed || !Array.isArray(parsed.todos)) {
      return {
        success: false,
        message: 'File sao lưu không hợp lệ hoặc không đúng định dạng của Gừng Todo.',
        restoredCount: 0,
      };
    }

    const backupTodos: TodoItem[] = parsed.todos;
    let finalTodos: TodoItem[] = [];

    if (mode === 'replace') {
      finalTodos = backupTodos;
    } else {
      // Merge: keep current todos, add missing ones or update by id
      const currentTodos = await loadTodos();
      const currentMap = new Map(currentTodos.map(t => [t.id, t]));

      for (const item of backupTodos) {
        if (item.id && item.title) {
          currentMap.set(item.id, item);
        }
      }

      finalTodos = Array.from(currentMap.values());
    }

    await saveTodos(finalTodos);

    if (parsed.settings && typeof parsed.settings === 'object') {
      await saveSettings(parsed.settings as NotificationSettings);
    }

    return {
      success: true,
      message: `Khôi phục thành công ${backupTodos.length} công việc!`,
      restoredCount: backupTodos.length,
    };
  } catch (error) {
    console.error('Error restoring backup:', error);
    return {
      success: false,
      message: 'Lỗi khi đọc file sao lưu: ' + (error instanceof Error ? error.message : String(error)),
      restoredCount: 0,
    };
  }
};
