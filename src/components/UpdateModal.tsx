import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Check, X, ArrowDownCircle, RefreshCw } from 'lucide-react-native';
import { GitHubReleaseInfo } from '../types/todo';
import { COLORS } from '../constants/theme';
import { CatMascot } from './CatMascot';
import { MarkdownView } from './MarkdownView';
import { triggerHaptic } from '../utils/haptics';

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  releaseInfo: GitHubReleaseInfo | null;
  onApplyUpdate?: (newVersion: string) => void;
  hapticsEnabled?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  onClose,
  releaseInfo,
  onApplyUpdate,
  hapticsEnabled = true,
}) => {
  const [updateState, setUpdateState] = useState<'idle' | 'downloading' | 'installing' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (visible) {
      setUpdateState('idle');
      setProgress(0);
    }
  }, [visible]);

  if (!releaseInfo) return null;

  const handleStartUpdate = () => {
    triggerHaptic('medium', hapticsEnabled);
    setUpdateState('downloading');
    setProgress(15);

    // Simulate fast bundle download and patch application in 1.5s
    const timer1 = setTimeout(() => setProgress(55), 400);
    const timer2 = setTimeout(() => {
      setProgress(90);
      setUpdateState('installing');
    }, 800);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setUpdateState('completed');
      triggerHaptic('success', hapticsEnabled);
    }, 1300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleFinishUpdate = () => {
    triggerHaptic('success', hapticsEnabled);
    if (typeof onApplyUpdate === 'function') {
      onApplyUpdate(releaseInfo.latestVersion);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.dialogContainer}>
          {/* Close button (only when idle) */}
          {updateState === 'idle' && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Cute Cat Mascot Header */}
          <View style={styles.mascotContainer}>
            <CatMascot
              mood={updateState === 'completed' ? 'celebrating' : updateState === 'downloading' ? 'focused' : 'happy'}
              size={85}
            />
          </View>

          {/* Badge */}
          <View style={styles.tagBadge}>
            <Sparkles size={12} color={COLORS.primary} />
            <Text style={styles.tagText}>
              {updateState === 'completed'
                ? `Đã cập nhật: v${releaseInfo.latestVersion}`
                : `Bản mới: v${releaseInfo.latestVersion}`}
            </Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {updateState === 'completed'
              ? 'Cập nhật thành công! 🐱🎉'
              : updateState === 'downloading'
              ? 'Đang tải bản cập nhật...'
              : updateState === 'installing'
              ? 'Đang áp dụng thay đổi...'
              : releaseInfo.releaseName || 'Gừng Todo có bản cập nhật mới!'}
          </Text>

          {/* Content Box */}
          {updateState === 'idle' ? (
            <View style={styles.notesContainer}>
              <ScrollView showsVerticalScrollIndicator={true} style={styles.scrollArea}>
                <MarkdownView content={releaseInfo.releaseNotes} />
              </ScrollView>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {updateState === 'completed'
                  ? 'Hoàn tất 100%! Sẵn sàng sử dụng.'
                  : `${progress}% - Đang tối ưu hiệu năng...`}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            {updateState === 'idle' ? (
              <>
                <TouchableOpacity onPress={onClose} style={styles.laterBtn} activeOpacity={0.7}>
                  <Text style={styles.laterBtnText}>Để sau</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartUpdate}
                  style={styles.updateBtn}
                  activeOpacity={0.8}
                >
                  <ArrowDownCircle size={17} color="#FFFFFF" />
                  <Text style={styles.updateBtnText}>Cập nhật ngay 🐾</Text>
                </TouchableOpacity>
              </>
            ) : updateState === 'completed' ? (
              <TouchableOpacity
                onPress={handleFinishUpdate}
                style={styles.finishBtn}
                activeOpacity={0.8}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.finishBtnText}>Áp dụng ngay</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Vui lòng chờ trong giây lát...</Text>
              </View>
            )}
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
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
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
  mascotContainer: {
    marginTop: 4,
    marginBottom: 6,
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
    fontSize: 16,
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
    maxHeight: 130,
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
  progressContainer: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
  finishBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
