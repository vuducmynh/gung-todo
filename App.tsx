import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Plus,
  Settings,
  Search,
  X,
  Sparkles,
} from 'lucide-react-native';

import { TodoItem as TodoItemType, CategoryId, NotificationSettings, GitHubReleaseInfo, MascotMood } from './src/types/todo';
import { COLORS, DEFAULT_SETTINGS, APP_CONFIG } from './src/constants/theme';
import {
  loadTodos,
  saveTodos,
  loadSettings,
  saveSettings,
  getTodayString,
  checkAndPerformRollover,
} from './src/services/storage';
import {
  scheduleDailyNotifications,
  checkNotificationPermission,
  requestNotificationPermission,
  setupNotificationChannel,
} from './src/services/notifications';
import { checkForGitHubUpdate } from './src/services/updater';
import { triggerHaptic } from './src/utils/haptics';

import { CatMascot } from './src/components/CatMascot';
import { TodoItem } from './src/components/TodoItem';
import { CategoryFilter } from './src/components/CategoryFilter';
import { DaySelector } from './src/components/DaySelector';
import { ProgressBar } from './src/components/ProgressBar';
import { AddTodoModal } from './src/components/AddTodoModal';
import { SettingsModal } from './src/components/SettingsModal';
import { UpdateModal } from './src/components/UpdateModal';
import { PermissionModal } from './src/components/PermissionModal';

function MainScreen() {
  const [todos, setTodos] = useState<TodoItemType[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TodoItemType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState<GitHubReleaseInfo | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // 1. Initialize data safely on startup
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        // Setup Android channel first
        if (Platform.OS === 'android') {
          await setupNotificationChannel();
        }

        // Load saved settings
        const savedSettings = await loadSettings();
        if (isMounted) setSettings(savedSettings);

        // Load saved todos
        const loaded = await loadTodos();

        // Perform daily rollover if new day
        const rolloverResult = await checkAndPerformRollover(loaded);
        const currentTodos = rolloverResult.todos;
        if (isMounted) setTodos(currentTodos);

        // Schedule offline notifications safely
        try {
          await scheduleDailyNotifications(currentTodos, savedSettings);
        } catch (notifErr) {
          console.warn('Notifications init warning:', notifErr);
        }

        // Check notification permissions
        try {
          const hasPermission = await checkNotificationPermission();
          if (!hasPermission && !savedSettings.permissionAsked && isMounted) {
            setTimeout(() => {
              if (isMounted) setIsPermissionModalOpen(true);
            }, 1200);
          }
        } catch (permErr) {
          console.warn('Permission check warning:', permErr);
        }

        // Check GitHub update in background
        try {
          const update = await checkForGitHubUpdate(APP_CONFIG.version);
          if (update && update.hasUpdate && isMounted) {
            setReleaseInfo(update);
            setIsUpdateModalOpen(true);
          }
        } catch {
          // Ignore network errors in offline mode
        }
      } catch (globalErr) {
        console.warn('App initialization warning:', globalErr);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update notifications when todos change
  const updateAndSaveTodos = useCallback(
    async (newTodos: TodoItemType[]) => {
      setTodos(newTodos);
      await saveTodos(newTodos);
      try {
        await scheduleDailyNotifications(newTodos, settings);
      } catch (err) {
        console.warn('Error rescheduling notifications:', err);
      }
    },
    [settings]
  );

  // Filtered tasks for the selected date
  const dateTodos = useMemo(() => {
    return todos.filter(t => t.date === selectedDate);
  }, [todos, selectedDate]);

  // Counts by category for the current date
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      all: dateTodos.length,
      work: 0,
      personal: 0,
      shopping: 0,
      health: 0,
      other: 0,
    };
    dateTodos.forEach(t => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      }
    });
    return counts;
  }, [dateTodos]);

  // Displayed tasks after category & search filters
  const displayedTodos = useMemo(() => {
    let result = dateTodos;

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sort: Incomplete first, Starred at the top, newest first
    return [...result].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.starred !== b.starred) {
        return a.starred ? -1 : 1;
      }
      return b.createdAt - a.createdAt;
    });
  }, [dateTodos, selectedCategory, searchQuery]);

  // Calculate stats for current date
  const totalCount = dateTodos.length;
  const completedCount = dateTodos.filter(t => t.completed).length;

  // Mascot Mood
  const mascotMood: MascotMood = useMemo(() => {
    if (totalCount === 0) return 'sleeping';
    if (completedCount === totalCount) return 'celebrating';
    return 'focused';
  }, [totalCount, completedCount]);

  // Handlers
  const handleToggleComplete = async (id: string) => {
    const updated = todos.map(t => {
      if (t.id === id) {
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? Date.now() : undefined,
        };
      }
      return t;
    });
    await updateAndSaveTodos(updated);
  };

  const handleToggleStar = async (id: string) => {
    const updated = todos.map(t => {
      if (t.id === id) {
        return { ...t, starred: !t.starred };
      }
      return t;
    });
    await updateAndSaveTodos(updated);
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert('Xóa công việc', 'Bạn có chắc chắn muốn xóa việc này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const updated = todos.filter(t => t.id !== id);
          await updateAndSaveTodos(updated);
        },
      },
    ]);
  };

  const handleSaveTodo = async (data: {
    title: string;
    notes?: string;
    category: CategoryId;
    starred: boolean;
  }) => {
    if (editingItem) {
      // Edit existing
      const updated = todos.map(t => {
        if (t.id === editingItem.id) {
          return {
            ...t,
            title: data.title,
            notes: data.notes,
            category: data.category,
            starred: data.starred,
          };
        }
        return t;
      });
      await updateAndSaveTodos(updated);
      setEditingItem(null);
    } else {
      // Add new
      const newTodo: TodoItemType = {
        id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: data.title,
        notes: data.notes,
        category: data.category,
        starred: data.starred,
        completed: false,
        date: selectedDate,
        createdAt: Date.now(),
      };
      await updateAndSaveTodos([newTodo, ...todos]);
    }
  };

  const handleUpdateSettings = async (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleDataRestored = async () => {
    const reloaded = await loadTodos();
    setTodos(reloaded);
    const reloadedSettings = await loadSettings();
    setSettings(reloadedSettings);
  };

  const handleRequestPermission = async () => {
    setIsPermissionModalOpen(false);
    const granted = await requestNotificationPermission();
    const updatedSettings = {
      ...settings,
      permissionAsked: true,
    };
    await handleUpdateSettings(updatedSettings);

    if (granted) {
      triggerHaptic('success', settings.hapticsEnabled);
      Alert.alert('Thành công! 🐱✨', 'Mèo Gừng sẽ nhắc bạn đúng giờ vào 08:00 sáng và 18:00 chiều nhé!');
    } else {
      setPermissionDenied(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* 1. APP HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.catAvatar}>
            <CatMascot mood={mascotMood} size={38} />
          </View>
          <View>
            <View style={styles.titleContainer}>
              <Text style={styles.brandTitle}>Gừng Todo</Text>
              <View style={styles.versionPill}>
                <Text style={styles.versionPillText}>v{APP_CONFIG.version}</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Mèo cam nhắc việc đúng giờ 🐾</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection', settings.hapticsEnabled);
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
          >
            {isSearching ? (
              <X size={19} color={COLORS.textSecondary} />
            ) : (
              <Search size={19} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              triggerHaptic('selection', settings.hapticsEnabled);
              setIsSettingsOpen(true);
            }}
            style={styles.headerIconBtn}
            activeOpacity={0.7}
          >
            <Settings size={19} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar (Collapsible) */}
      {isSearching && (
        <View style={styles.searchBarContainer}>
          <Search size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm công việc, ghi chú..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 2. DAY SELECTOR & CALENDAR STRIP */}
      <DaySelector
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        hapticsEnabled={settings.hapticsEnabled}
      />

      {/* 3. PROGRESS & CAT SUMMARY CARD */}
      <ProgressBar completedCount={completedCount} totalCount={totalCount} />

      {/* 4. CATEGORY FILTER PILLS */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        hapticsEnabled={settings.hapticsEnabled}
      />

      {/* 5. TODO LIST */}
      <FlatList
        data={displayedTodos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TodoItem
            item={item}
            onToggleComplete={handleToggleComplete}
            onToggleStar={handleToggleStar}
            onEdit={itemToEdit => {
              setEditingItem(itemToEdit);
              setIsAddModalOpen(true);
            }}
            onDelete={handleDeleteTodo}
            hapticsEnabled={settings.hapticsEnabled}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CatMascot mood="sleeping" size={100} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy việc phù hợp' : 'Chưa có việc nào cho ngày này'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Hãy thử tìm bằng từ khóa khác nhé!'
                : 'Mèo Gừng đang ngủ nướng. Nhấn nút + bên dưới để lên kế hoạch ngay! 🐾'}
            </Text>
          </View>
        }
      />

      {/* 6. FLOATING ACTION BUTTON (+) */}
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('medium', settings.hapticsEnabled);
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        style={styles.fab}
        activeOpacity={0.85}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.6} />
      </TouchableOpacity>

      {/* MODALS */}
      <AddTodoModal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveTodo}
        editingItem={editingItem}
        targetDate={selectedDate}
        hapticsEnabled={settings.hapticsEnabled}
      />

      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        todos={todos}
        onDataRestored={handleDataRestored}
        onShowUpdateInfo={info => {
          setIsSettingsOpen(false);
          setReleaseInfo(info);
          setIsUpdateModalOpen(true);
        }}
      />

      <UpdateModal
        visible={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        releaseInfo={releaseInfo}
      />

      <PermissionModal
        visible={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          handleUpdateSettings({ ...settings, permissionAsked: true });
        }}
        onRequestPermission={handleRequestPermission}
        alreadyDenied={permissionDenied}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  versionPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  listContent: {
    paddingBottom: 90,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 32 : 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
