import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Bell, Sparkles, X, Settings } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { CatMascot } from './CatMascot';

interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<void>;
  alreadyDenied?: boolean;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  visible,
  onClose,
  onRequestPermission,
  alreadyDenied = false,
}) => {
  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.card}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.mascotBox}>
            <CatMascot mood="happy" size={85} />
          </View>

          <View style={styles.badge}>
            <Bell size={12} color={COLORS.primary} />
            <Text style={styles.badgeText}>Thông báo đúng giờ</Text>
          </View>

          <Text style={styles.title}>Đừng bỏ lỡ việc quan trọng!</Text>

          <Text style={styles.description}>
            Mèo Gừng sẽ nhắc bạn vào lúc <Text style={styles.bold}>08:00 sáng</Text> để lên dây cót và{' '}
            <Text style={styles.bold}>18:00 chiều</Text> để rà soát công việc trước khi tan làm. Hoạt động 100% offline, không phiền phức! 🐾
          </Text>

          {alreadyDenied ? (
            <View style={styles.deniedBox}>
              <Text style={styles.deniedText}>
                Bạn đã tắt quyền thông báo trong cài đặt iPhone. Hãy nhấn nút bên dưới để bật lại nhé!
              </Text>
              <TouchableOpacity
                onPress={handleOpenSettings}
                style={styles.primaryBtn}
                activeOpacity={0.8}
              >
                <Settings size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Mở Cài đặt iPhone</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity onPress={onClose} style={styles.secondaryBtn} activeOpacity={0.7}>
                <Text style={styles.secondaryBtnText}>Để sau</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onRequestPermission}
                style={styles.primaryBtn}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Bật thông báo ngay 🐾</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 330,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  mascotBox: {
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  deniedBox: {
    width: '100%',
    alignItems: 'center',
  },
  deniedText: {
    fontSize: 12,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  primaryBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
