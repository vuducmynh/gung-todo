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
  Tag,
  ChevronUp,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { NotificationSettings, GitHubReleaseInfo, TodoItem } from '../types/todo';
import { COLORS, APP_CONFIG } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sound';
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
  onOpenCategoryManager?: () => void;
  currentVersion?: string;
}

const QUICK_PRESETS = [
  { label: '17:00', hour: 17, minute: 0 },
  { label: '17:30', hour: 17, minute: 30 },
  { label: '18:00 (Mặc định)', hour: 18, minute: 0 },
  { label: '18:30', hour: 18, minute: 30 },
  { label: '19:00', hour: 19, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '21:00', hour: 21, minute: 0 },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onUpdateSettings,
  todos,
  onDataRestored,
  onShowUpdateInfo,
  onOpenCategoryManager,
  currentVersion,
}) => {
  const activeVersion = currentVersion || APP_CONFIG.version;
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showRestoreInput, setShowRestoreInput] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [pickerHour, setPickerHour] = useState(settings.eveningTime?.hour ?? 18);
  const [pickerMinute, setPickerMinute] = useState(settings.eveningTime?.minute ?? 0);

  const openTimePicker = () => {
    triggerHaptic('selection', settings.hapticsEnabled);
    setPickerHour(settings.eveningTime?.hour ?? 18);
    setPickerMinute(settings.eveningTime?.minute ?? 0);
    setIsTimePickerOpen(true);
  };

  const handleSaveTime = (hour: number, minute: number) => {
    triggerHaptic('success', settings.hapticsEnabled);
    updateTime('evening', hour, minute);
    setIsTimePickerOpen(false);
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    triggerHaptic('selection', settings.hapticsEnabled);
    const updated = { ...settings, [key]: !settings[key] };
    if (key === 'soundFxEnabled' && updated.soundFxEnabled) {
      playSound('complete', true);
    }
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
      const releaseInfo = await checkForGitHubUpdate(activeVersion);
      if (releaseInfo && releaseInfo.hasUpdate) {
        onShowUpdateInfo(releaseInfo);
      } else {
        Alert.alert(
          'Đã là bản mới nhất! 🐱✨',
          `Gừng Todo v${activeVersion} đang là phiên bản mới nhất trên GitHub.`
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
            {/* 1. THÔNG BÁO HẸN GIỜ OFFLINE (1 LẦN TRONG NGÀY) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Nhắc việc hằng ngày (1 lần/ngày)</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Thông báo tổng hợp toàn app: Chỉ nhắc 1 lần lúc {String(settings.eveningTime.hour).padStart(2, '0')}:{String(settings.eveningTime.minute).padStart(2, '0')} nếu còn việc chưa tick hoàn thành. Nếu không có việc gì tồn đọng sẽ không làm phiền.
              </Text>

              {/* Bật/Tắt nhắc nhở */}
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>Bật nhắc việc cuối ngày</Text>
                  <Text style={styles.settingSub}>
                    {settings.eveningEnabled
                      ? `Đang bật (Nhắc lúc ${String(settings.eveningTime.hour).padStart(2, '0')}:${String(settings.eveningTime.minute).padStart(2, '0')})`
                      : 'Đang tắt'}
                  </Text>
                </View>
                <Switch
                  value={settings.eveningEnabled}
                  onValueChange={() => toggleSetting('eveningEnabled')}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                />
              </View>

              {/* Nút Chỉnh Giờ Nhắc Việc */}
              <TouchableOpacity
                onPress={openTimePicker}
                style={styles.timeSettingBtn}
                activeOpacity={0.7}
              >
                <View style={styles.timeSettingLeft}>
                  <Clock size={16} color={COLORS.primary} />
                  <View>
                    <Text style={styles.timeSettingTitle}>Giờ gửi thông báo:</Text>
                    <Text style={styles.timeSettingHint}>Chạm để đổi giờ nhắc ⏰</Text>
                  </View>
                </View>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>
                    {String(settings.eveningTime.hour).padStart(2, '0')}:
                    {String(settings.eveningTime.minute).padStart(2, '0')} ✎
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Nút Test Notification */}
              <TouchableOpacity
                onPress={handleTestNotification}
                style={styles.actionItem}
                activeOpacity={0.7}
              >
                <View style={styles.actionItemLeft}>
                  <Clock size={16} color={COLORS.primary} />
                  <Text style={styles.actionItemText}>Thử thông báo ngay (3s)</Text>
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

              {/* Haptics */}
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

              {/* Sound FX */}
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={styles.settingLabel}>Âm thanh thao tác (Sound FX)</Text>
                  <Text style={styles.settingSub}>Tiếng chuông gỗ Kalimba và bọt nước nhẹ nhàng</Text>
                </View>
                <Switch
                  value={settings.soundFxEnabled}
                  onValueChange={() => toggleSetting('soundFxEnabled')}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                />
              </View>
            </View>

            {/* 3. QUẢN LÝ NHÃN & DANH MỤC */}
            {onOpenCategoryManager && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Tag size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Nhãn & Danh mục công việc</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Tùy chỉnh thêm nhãn mới, chọn màu pastel, sửa tên hoặc xóa nhãn cá nhân.
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection', settings.hapticsEnabled);
                    onOpenCategoryManager();
                  }}
                  style={styles.actionItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionItemLeft}>
                    <Tag size={16} color={COLORS.primary} />
                    <Text style={styles.actionItemText}>Mở bảng Quản lý Nhãn & Màu sắc 🏷️</Text>
                  </View>
                  <ExternalLink size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* 4. SAO LƯU & PHỤC HỒI DỮ LIỆU */}
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

      {/* TIME PICKER MODAL */}
      <Modal
        visible={isTimePickerOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsTimePickerOpen(false)}
      >
        <View style={styles.timePickerOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setIsTimePickerOpen(false)}
          />
          <View style={styles.timePickerCard}>
            <View style={styles.timePickerHeader}>
              <View style={styles.titleRow}>
                <Clock size={18} color={COLORS.primary} />
                <Text style={styles.timePickerTitle}>Chỉnh Giờ Nhắc Việc</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTimePickerOpen(false)}
                style={styles.closeMiniBtn}
              >
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Visual Digital Clock */}
            <View style={styles.clockBox}>
              {/* Hour Spinner */}
              <View style={styles.timeUnitCol}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection', settings.hapticsEnabled);
                    setPickerHour(prev => (prev + 1) % 24);
                  }}
                  style={styles.spinnerArrow}
                >
                  <ChevronUp size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.digitalDigits}>
                  {String(pickerHour).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection', settings.hapticsEnabled);
                    setPickerHour(prev => (prev - 1 + 24) % 24);
                  }}
                  style={styles.spinnerArrow}
                >
                  <ChevronDown size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.unitLabel}>Giờ</Text>
              </View>

              <Text style={styles.digitalColon}>:</Text>

              {/* Minute Spinner */}
              <View style={styles.timeUnitCol}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection', settings.hapticsEnabled);
                    setPickerMinute(prev => (prev + 5) % 60);
                  }}
                  style={styles.spinnerArrow}
                >
                  <ChevronUp size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.digitalDigits}>
                  {String(pickerMinute).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('selection', settings.hapticsEnabled);
                    setPickerMinute(prev => (prev - 5 + 60) % 60);
                  }}
                  style={styles.spinnerArrow}
                >
                  <ChevronDown size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.unitLabel}>Phút</Text>
              </View>
            </View>

            {/* Quick Presets */}
            <Text style={styles.presetsLabel}>Mốc giờ gợi ý:</Text>
            <View style={styles.presetsGrid}>
              {QUICK_PRESETS.map(preset => {
                const isSelected = pickerHour === preset.hour && pickerMinute === preset.minute;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => {
                      triggerHaptic('selection', settings.hapticsEnabled);
                      setPickerHour(preset.hour);
                      setPickerMinute(preset.minute);
                    }}
                    style={[
                      styles.presetPill,
                      isSelected && styles.presetPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        isSelected && styles.presetPillTextSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.timeHelpText}>
              🐾 Chỉ nhắc 1 lần lúc này nếu bạn còn việc chưa tick hoàn thành.
            </Text>

            {/* Save Button */}
            <TouchableOpacity
              onPress={() => handleSaveTime(pickerHour, pickerMinute)}
              style={styles.saveTimeBtn}
              activeOpacity={0.8}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.saveTimeBtnText}>
                Lưu giờ nhắc: {String(pickerHour).padStart(2, '0')}:{String(pickerMinute).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexShrink: 1,
    paddingRight: 12,
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
    flexShrink: 1,
    marginRight: 10,
  },
  actionItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flexShrink: 1,
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
  timeSettingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeSettingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeSettingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeSettingHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  timeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timePickerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  timeUnitCol: {
    alignItems: 'center',
  },
  spinnerArrow: {
    padding: 4,
  },
  digitalDigits: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 54,
    textAlign: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  digitalColon: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeHelpText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 14,
    textAlign: 'center',
  },
  saveTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
