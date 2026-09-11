import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Sparkles, ExternalLink, X } from 'lucide-react-native';
import { GitHubReleaseInfo } from '../types/todo';
import { COLORS } from '../constants/theme';
import { CatMascot } from './CatMascot';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  releaseInfo: GitHubReleaseInfo | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
  releaseInfo,
}) => {
  if (!releaseInfo) return null;

  const handleOpenRelease = () => {
    if (releaseInfo.htmlUrl) {
      Linking.openURL(releaseInfo.htmlUrl);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialogContainer}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Cute Cat Mascot Header */}
          <View style={styles.mascotContainer}>
            <CatMascot mood="celebrating" size={90} />
          </View>

          <View style={styles.tagBadge}>
            <Sparkles size={12} color={COLORS.primary} />
            <Text style={styles.tagText}>Bản cập nhật mới: v{releaseInfo.latestVersion}</Text>
          </View>

          <Text style={styles.title}>{releaseInfo.releaseName || 'Gừng Todo đã có phiên bản mới!'}</Text>

          {/* Changelog Box */}
          <View style={styles.notesContainer}>
            <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollArea}>
              <Text style={styles.notesTitle}>Nội dung cập nhật:</Text>
              <Text style={styles.notesText}>{releaseInfo.releaseNotes}</Text>
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.laterBtn} activeOpacity={0.7}>
              <Text style={styles.laterBtnText}>Để sau</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenRelease}
              style={styles.updateBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.updateBtnText}>Xem trên GitHub</Text>
              <ExternalLink size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
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
  mascotContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  notesContainer: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    width: '100%',
    maxHeight: 140,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollArea: {
    width: '100%',
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  updateBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
