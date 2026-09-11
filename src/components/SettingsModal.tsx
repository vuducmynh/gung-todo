import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import {
  X,
  Bell,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Volume2,
  Vibrate,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react-native';
import { NotificationSettings, GitHubReleaseInfo, TodoItem } from '../types/todo';
import { COLORS, APP_CONFIG } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';
import { exportBackupToFile, restoreFromBackupData } from '../services/backup';
import { triggerTestNotification, scheduleDailyNotifications } from '../services/notifications';
import { checkForGitHubUpdate } from '../services/updater';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  todos: TodoItem[];
  onDataRestored: () => void;
  onShowUpdateInfo: (info: GitHubReleaseInfo) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onUpdateSettings,
  todos,
  onDataRestored,
  onShowUpdateInfo,
}) => {
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showRestoreInput, setShowRestoreInput] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  const toggleSetting = (key: keyof NotificationSettings) => {
    triggerHaptic('selection', settings.hapticsEnabled);
    const updated = { ...settings, [key]: !settings[key] };
    onUpdateSettings(updated);
    scheduleDailyNotifications(todos, updated);
  };

  const updateTime = (slot: 'morning' | 'evening', hour: number, minute: number) => {
    triggerHaptic('selection', settings.hapticsEnabled);
    const updated = {
      ...settings,
      [`${slot}Time`]: { hour, minute },
    };
    onUpdateSettings(updated);
    scheduleDailyNotifications(todos, updated);
  };

  const handleTestNotification = async () => {
    triggerHaptic('medium', settings.hapticsEnabled);
    setTestNotificationStatus('Đang gửi thông báo thử...');
    const success = await triggerTestNotification();
    if (success) {
      setTestNotificationStatus('Đã gửi! Vui lòng khóa màn hình hoặc đợi 3 giây.');
      setTimeout(() => setTestNotificationStatus(null), 4000);
    } else {
      setTestNotificationStatus('Chưa có quyền thông báo hoặc không gửi được.');
      setTimeout(() => setTestNotificationStatus(null), 4000);
    }
  };

  const handleExportBackup = async () => {
    triggerHaptic('medium', settings.hapticsEnabled);
    const result = await exportBackupToFile();
    if (!result.success) {
      Alert.alert('Thông báo', result.message);
    }
  };

  const handleRestoreSubmit = async () => {
    if (!restoreText.trim()) return;

    triggerHaptic('warning', settings.hapticsEnabled);
    Alert.alert(
      'Xác nhận khôi phục',
      'Bạn muốn hợp nhất dữ liệu mới với việc hiện tại hay thay thế hoàn toàn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hợp nhất (An toàn)',
          onPress: async () => {
            const res = await restoreFromBackupData(restoreText, 'merge');
            Alert.alert('Khôi phục', res.message);
            if (res.success) {
              setShowRestoreInput(false);
              setRestoreText('');
              onDataRestored();
            }
          },
        },
        {
          text: 'Thay thế tất cả',
          style: 'destructive',
          onPress: async () => {
            const res = await restoreFromBackupData(restoreText, 'replace');
            Alert.alert('Khôi phục', res.message);
            if (res.success) {
              setShowRestoreInput(false);
              setRestoreText('');
              onDataRestored();
            }
          },
        },
      ]
    );
  };

  const handleCheckUpdate = async () => {
    triggerHaptic('medium', settings.hapticsEnabled);
    setCheckingUpdate(true);
    try {
      const releaseInfo = await checkForGitHubUpdate(APP_CONFIG.version);
      if (releaseInfo && releaseInfo.hasUpdate) {
        onShowUpdateInfo(releaseInfo);
      } else {
        Alert.alert(
          'Đã là bản mới nhất! 🐱✨',
          `Gừng Todo v${APP_CONFIG.version} đang là phiên bản mới nhất trên GitHub.`
        );
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối đến GitHub API để kiểm tra.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cài đặt & Dữ liệu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. THÔNG BÁO HẸN GIỜ OFFLINE */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Thông báo Hẹn giờ Offline</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Tự động đánh thức và nhắc nhở 100% offline mà không cần server hay internet.
              </Text>

              {/* Sáng */}
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>☀️ Nhắc việc Buổi Sáng</Text>
                  <Text style={styles.settingSub}>
                    Lên dây cót mục tiêu lúc{' '}
                    {String(settings.morningTime.hour).padStart(2, '0')}:
                    {String(settings.morningTime.minute).padStart(2, '0')}
                  </Text>
                </View>
                <Switch
                  value={settings.morningEnabled}
                  onValueChange={() => toggleSetting('morningEnabled')}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                />
              </View>

              {/* Chiều tan làm */}
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>🌙 Nhắc kiểm tra Chiều Tan Làm</Text>
                  <Text style={styles.settingSub}>
                    Rà soát công việc lúc{' '}
                    {String(settings.eveningTime.hour).padStart(2, '0')}:
                    {String(settings.eveningTime.minute).padStart(2, '0')}
                  </Text>
                </View>
                <Switch
                  value={settings.eveningEnabled}
                  onValueChange={() => toggleSetting('eveningEnabled')}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                />
              </View>

              {/* Nút Test Notification */}
              <TouchableOpacity
                onPress={handleTestNotification}
                style={styles.actionItem}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  <Clock size={16} color={COLORS.primary} />
                  <Text style={styles.actionItemText}>Thử nghiệm nhận thông báo ngay (3 giây)</Text>
                </View>
                <CheckCircle2 size={16} color={COLORS.success} />
              </TouchableOpacity>
              {testNotificationStatus && (
                <Text style={styles.testStatusText}>{testNotificationStatus}</Text>
              )}
            </View>

            {/* 2. PHẢN HỒI RUNG & ÂM THANH */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Vibrate size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Tương tác & Phản hồi</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>Rung Haptic (Taptic Engine)</Text>
                  <Text style={styles.settingSub}>Rung xúc giác chuẩn iOS khi tick, xóa, thao tác</Text>
                </View>
                <Switch
                  value={settings.hapticsEnabled}
                  onValueChange={() => toggleSetting('hapticsEnabled')}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                />
              </View>
            </View>

            {/* 3. SAO LƯU & PHỤC HỒI DỮ LIỆU */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Bảo toàn dữ liệu (Xóa app cài lại)</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Lưu file sao lưu vào ứng dụng Tệp (Files / iCloud Drive) để không bao giờ mất việc kể cả khi gỡ app.
              </Text>

              {/* Xuất sao lưu */}
              <TouchableOpacity
                onPress={handleExportBackup}
                style={styles.actionItem}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  <Download size={16} color={COLORS.primary} />
                  <Text style={styles.actionItemText}>Xuất bản sao lưu ra Tệp (iCloud Drive)</Text>
                </View>
                <ExternalLink size={14} color={COLORS.textMuted} />
              </TouchableOpacity>

              {/* Nhập phục hồi */}
              <TouchableOpacity
                onPress={() => setShowRestoreInput(!showRestoreInput)}
                style={styles.actionItem}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  <Upload size={16} color={COLORS.primary} />
                  <Text style={styles.actionItemText}>Khôi phục dữ liệu từ nội dung file sao lưu</Text>
                </View>
              </TouchableOpacity>

              {showRestoreInput && (
                <View style={styles.restoreBox}>
                  <Text style={styles.restoreHelp}>
                    Dán nội dung JSON từ file sao lưu của bạn vào đây:
                  </Text>
                  <TextInput
                    style={styles.restoreInput}
                    placeholder='{"appName":"Gừng Todo", ...}'
                    placeholderTextColor={COLORS.textMuted}
                    value={restoreText}
                    onChangeText={setRestoreText}
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity
                    onPress={handleRestoreSubmit}
                    disabled={!restoreText.trim()}
                    style={[
                      styles.restoreSubmitBtn,
                      !restoreText.trim() && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.restoreSubmitText}>Xác nhận khôi phục 🐾</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 4. KIỂM TRA CẬP NHẬT GITHUB */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <RefreshCw size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Phiên bản & Cập nhật</Text>
              </View>

              <View style={styles.versionRow}>
                <Text style={styles.versionLabel}>Gừng Todo hiện tại</Text>
                <View style={styles.versionTag}>
                  <Text style={styles.versionTagText}>v{APP_CONFIG.version}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCheckUpdate}
                disabled={checkingUpdate}
                style={styles.actionItem}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  {checkingUpdate ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <RefreshCw size={16} color={COLORS.primary} />
                  )}
                  <Text style={styles.actionItemText}>
                    {checkingUpdate ? 'Đang kiểm tra GitHub Release...' : 'Kiểm tra bản cập nhật mới'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
  },
  section: {
    marginBottom: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  actionItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  testStatusText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  restoreBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restoreHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  restoreInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    padding: 8,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
  },
  restoreSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  restoreSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  versionLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  versionTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  versionTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
