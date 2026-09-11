import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoItem, NotificationSettings } from '../types/todo';
import { DEFAULT_SETTINGS } from '../constants/theme';

const STORAGE_KEYS = {
  TODOS: '@gung_todos_v1',
  SETTINGS: '@gung_settings_v1',
  LAST_ACTIVE_DATE: '@gung_last_active_date_v1',
};

/**
 * Returns today's date in local time as YYYY-MM-DD
 */
export const getTodayString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string for user display in Vietnamese
 */
export const formatDateDisplay = (dateStr: string): { title: string; subtitle: string; isToday: boolean } => {
  const today = getTodayString();
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return { title: dateStr, subtitle: '', isToday: false };
  }

  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const isToday = dateStr === today;

  const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()];
  const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  return {
    title: isToday ? 'Hôm nay' : dayOfWeek,
    subtitle: `${dayOfWeek}, ${formattedDate}`,
    isToday,
  };
};

/**
 * Load all todos from storage
 */
export const loadTodos = async (): Promise<TodoItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TODOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading todos:', error);
    return [];
  }
};

/**
 * Save all todos to storage
 */
export const saveTodos = async (todos: TodoItem[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    return true;
  } catch (error) {
    console.error('Error saving todos:', error);
    return false;
  }
};

/**
 * Load notification & app settings
 */
export const loadSettings = async (): Promise<NotificationSettings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save settings to storage
 */
export const saveSettings = async (settings: NotificationSettings): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Rollover unfinished tasks from previous days to today.
 * Ensures the user never forgets unfinished tasks when a new day begins.
 */
export const checkAndPerformRollover = async (currentTodos: TodoItem[]): Promise<{
  todos: TodoItem[];
  rolledOverCount: number;
}> => {
  const today = getTodayString();
  let rolledOverCount = 0;

  const updatedTodos = currentTodos.map(todo => {
    // If not completed and created before today, rollover to today
    if (!todo.completed && todo.date < today) {
      rolledOverCount++;
      return {
        ...todo,
        date: today,
        rolledOverFrom: todo.rolledOverFrom || todo.date,
      };
    }
    return todo;
  });

  if (rolledOverCount > 0) {
    await saveTodos(updatedTodos);
  }

  await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, today);
  return { todos: updatedTodos, rolledOverCount };
};
