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
  LogBox,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

LogBox.ignoreLogs([
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'Cannot connect to Expo CLI',
  'Could not setup Android notification channel',
  'expo-notifications:',
  'Call to function',
]);
import { StatusBar } from 'expo-status-bar';
import {
  Plus,
  Settings,
  Search,
  X,
  Sparkles,
} from 'lucide-react-native';

import { TodoItem as TodoItemType, CategoryId, Category, NotificationSettings, GitHubReleaseInfo, MascotMood } from './src/types/todo';
import { COLORS, DEFAULT_SETTINGS, APP_CONFIG, CATEGORIES } from './src/constants/theme';
import {
  loadTodos,
  saveTodos,
  loadSettings,
  saveSettings,
  loadCategories,
  saveCategories,
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
import { playSound } from './src/utils/sound';

import { CatMascot } from './src/components/CatMascot';
import { TodoItem } from './src/components/TodoItem';
import { CategoryFilter } from './src/components/CategoryFilter';
import { DaySelector } from './src/components/DaySelector';
import { ProgressBar } from './src/components/ProgressBar';
import { AddTodoModal } from './src/components/AddTodoModal';
import { SettingsModal } from './src/components/SettingsModal';
import { UpdateModal } from './src/components/UpdateModal';
import { PermissionModal } from './src/components/PermissionModal';
import { CategoryManagerModal } from './src/components/CategoryManagerModal';

function MainScreen() {
  const [todos, setTodos] = useState<TodoItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [appVersion, setAppVersion] = useState<string>(APP_CONFIG.version);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TodoItemType | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
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

        // Load saved app version
        const savedVersion = await AsyncStorage.getItem('@gung_app_version');
        const activeVer = savedVersion || APP_CONFIG.version;
        if (savedVersion && isMounted) {
          setAppVersion(savedVersion);
        }

        // Load saved categories
        const loadedCats = await loadCategories();
        if (isMounted) setCategories(loadedCats);

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
          const update = await checkForGitHubUpdate(activeVer);
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
    };
    categories.forEach(c => {
      counts[c.id] = 0;
    });
    dateTodos.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [dateTodos, categories]);

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

    // Sort: Incomplete first, Starred at top (or explicit manual order), then order / createdAt
    return [...result].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.starred !== b.starred) {
        return a.starred ? -1 : 1;
      }
      const orderA = a.order !== undefined ? a.order : a.createdAt;
      const orderB = b.order !== undefined ? b.order : b.createdAt;
      return orderA - orderB;
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
    let nowCompleted = false;
    const updated = todos.map(t => {
      if (t.id === id) {
        const completed = !t.completed;
        nowCompleted = completed;
        return {
          ...t,
          completed,
          completedAt: completed ? Date.now() : undefined,
        };
      }
      return t;
    });

    if (nowCompleted) {
      playSound('complete', settings.soundFxEnabled);
    } else {
      playSound('pop', settings.soundFxEnabled);
    }

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
          playSound('pop', settings.soundFxEnabled);
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
    playSound('pop', settings.soundFxEnabled);
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
        order: Date.now(),
        createdAt: Date.now(),
      };
      await updateAndSaveTodos([newTodo, ...todos]);
    }
  };

  // Reordering logic
  const handleMoveTodo = async (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const incompleteItems = displayedTodos.filter(t => !t.completed);
    const index = incompleteItems.findIndex(t => t.id === id);
    if (index === -1) return;

    let targetIndex = index;
    if (direction === 'up' && index > 0) targetIndex = index - 1;
    else if (direction === 'down' && index < incompleteItems.length - 1) targetIndex = index + 1;
    else if (direction === 'top') targetIndex = 0;
    else if (direction === 'bottom') targetIndex = incompleteItems.length - 1;

    if (targetIndex === index) return;

    const reordered = [...incompleteItems];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const orderMap = new Map<string, number>();
    reordered.forEach((item, idx) => {
      orderMap.set(item.id, idx);
    });

    const updated = todos.map(t => {
      if (orderMap.has(t.id)) {
        return { ...t, order: orderMap.get(t.id) };
      }
      return t;
    });

    await updateAndSaveTodos(updated);
  };

  // Category management handlers
  const handleSaveCategory = async (cat: Category) => {
    let updated: Category[];
    const exists = categories.some(c => c.id === cat.id);
    if (exists) {
      updated = categories.map(c => (c.id === cat.id ? cat : c));
    } else {
      updated = [...categories, cat];
    }
    setCategories(updated);
    await saveCategories(updated);
  };

  const handleDeleteCategory = async (catId: CategoryId) => {
    const updatedCategories = categories.filter(c => c.id !== catId);
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);

    // Reassign any todos that had this category to 'other'
    const updatedTodos = todos.map(t => {
      if (t.category === catId) {
        return { ...t, category: 'other' as CategoryId };
      }
      return t;
    });
    await updateAndSaveTodos(updatedTodos);

    if (selectedCategory === catId) {
      setSelectedCategory('all');
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
    const reloadedCats = await loadCategories();
    setCategories(reloadedCats);
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
      const hourStr = String(settings.eveningTime?.hour ?? 18).padStart(2, '0');
      const minStr = String(settings.eveningTime?.minute ?? 0).padStart(2, '0');
      Alert.alert(
        'Thành công! 🐱✨',
        `Mèo Gừng sẽ nhắc bạn lúc ${hourStr}:${minStr} nếu còn công việc chưa hoàn thành nhé!`
      );
    } else {
      setPermissionDenied(true);
    }
  };

  const handleApplyUpdate = async (newVersion: string) => {
    setAppVersion(newVersion);
    await AsyncStorage.setItem('@gung_app_version', newVersion);
    setReleaseInfo(null);
    triggerHaptic('success', settings.hapticsEnabled);
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
                <Text style={styles.versionPillText}>v{appVersion}</Text>
              </View>
            </View>
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
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        hapticsEnabled={settings.hapticsEnabled}
      />

      {/* 5. TODO LIST */}
      <FlatList
        data={displayedTodos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const incompleteItems = displayedTodos.filter(t => !t.completed);
          const itemIndex = incompleteItems.findIndex(t => t.id === item.id);
          return (
            <TodoItem
              item={item}
              onToggleComplete={handleToggleComplete}
              onToggleStar={handleToggleStar}
              onEdit={itemToEdit => {
                setEditingItem(itemToEdit);
                setIsAddModalOpen(true);
              }}
              onDelete={handleDeleteTodo}
              onMove={handleMoveTodo}
              isFirst={itemIndex === 0}
              isLast={itemIndex === incompleteItems.length - 1}
              categories={categories}
              hapticsEnabled={settings.hapticsEnabled}
              soundFxEnabled={settings.soundFxEnabled}
            />
          );
        }}
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
        categories={categories}
        hapticsEnabled={settings.hapticsEnabled}
      />

      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        todos={todos}
        onDataRestored={handleDataRestored}
        currentVersion={appVersion}
        onOpenCategoryManager={() => {
          setIsSettingsOpen(false);
          setIsCategoryManagerOpen(true);
        }}
        onShowUpdateInfo={info => {
          setIsSettingsOpen(false);
          setReleaseInfo(info);
          setIsUpdateModalOpen(true);
        }}
      />

      <CategoryManagerModal
        visible={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        hapticsEnabled={settings.hapticsEnabled}
        soundFxEnabled={settings.soundFxEnabled}
      />

      <UpdateModal
        visible={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        releaseInfo={releaseInfo}
        onApplyUpdate={handleApplyUpdate}
        hapticsEnabled={settings.hapticsEnabled}
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
