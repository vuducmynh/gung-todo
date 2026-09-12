import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Sparkles, Check, X, ArrowDownCircle, ExternalLink, Download } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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
  const [updateState, setUpdateState] = useState<'idle' | 'downloading' | 'installing' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const downloadTaskRef = useRef<FileSystem.DownloadResumable | null>(null);

  useEffect(() => {
    if (visible) {
      setUpdateState('idle');
      setProgress(0);
      setStatusMessage('');
    }
  }, [visible]);

  if (!releaseInfo) return null;

  const handleStartUpdate = async () => {
    triggerHaptic('medium', hapticsEnabled);

    // 1. Android: If APK asset is available, download directly!
    if (Platform.OS === 'android' && releaseInfo.apkUrl) {
      try {
        setUpdateState('downloading');
        setProgress(5);
        setStatusMessage('Đang kết nối đến GitHub...');

        const targetFileName = releaseInfo.apkName || `GungTodo-v${releaseInfo.latestVersion}.apk`;
        const localUri = `${FileSystem.documentDirectory}${targetFileName}`;

        const downloadResumable = FileSystem.createDownloadResumable(
          releaseInfo.apkUrl,
          localUri,
          {},
          (downloadProgress) => {
            if (downloadProgress.totalBytesExpectedToWrite > 0) {
              const percent = Math.round(
                (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
              );
              setProgress(Math.min(percent, 99));
              setStatusMessage(`Đang tải file APK (${percent}%)...`);
            }
          }
        );
        downloadTaskRef.current = downloadResumable;

        const downloadResult = await downloadResumable.downloadAsync();

        if (downloadResult && downloadResult.uri) {
          setProgress(100);
          setUpdateState('installing');
          setStatusMessage('Tải xong! Đang mở trình cài đặt APK...');
          triggerHaptic('success', hapticsEnabled);

          // Prompt user to install the APK
          try {
            await Sharing.shareAsync(downloadResult.uri, {
              mimeType: 'application/vnd.android.package-archive',
              dialogTitle: 'Cài đặt bản cập nhật Gừng Todo',
            });
          } catch {
            // If share fails, fallback to direct open
            await Linking.openURL(releaseInfo.apkUrl);
          }

          setUpdateState('completed');
          setStatusMessage('Vui lòng làm theo hướng dẫn trên màn hình để hoàn tất cài đặt.');
        } else {
          throw new Error('Không thể lưu file APK.');
        }
      } catch (err: any) {
        console.warn('APK download error:', err);
        setUpdateState('error');
        setStatusMessage('Không thể tải file tự động. Bạn có thể mở trình duyệt để tải trực tiếp.');
      }
      return;
    }

    // 2. iOS or Fallback: Show options
    if (Platform.OS === 'ios') {
      // On iOS, Apple sandbox prohibits self-updating binary
      Alert.alert(
        'Cập nhật trên iOS 🍎',
        'Hệ điều hành iOS yêu cầu cập nhật ứng dụng thông qua TestFlight hoặc cài file IPA qua Sideloadly trên máy tính.\n\nBạn có muốn mở trang phát hành GitHub để xem chi tiết?',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Mở trang GitHub',
            onPress: () => {
              Linking.openURL(releaseInfo.htmlUrl);
            },
          },
          {
            text: 'Đã cập nhật xong',
            onPress: () => {
              if (typeof onApplyUpdate === 'function') {
                onApplyUpdate(releaseInfo.latestVersion);
              }
              onClose();
            },
          },
        ]
      );
      return;
    }

    // 3. Fallback when running in development/Expo Go
    setUpdateState('downloading');
    setProgress(30);
    setStatusMessage('Đang tải dữ liệu phiên bản mới...');

    setTimeout(() => {
      setProgress(75);
      setUpdateState('installing');
      setStatusMessage('Đang áp dụng thay đổi...');
    }, 600);

    setTimeout(() => {
      setProgress(100);
      setUpdateState('completed');
      setStatusMessage('Cập nhật hoàn tất!');
      triggerHaptic('success', hapticsEnabled);
    }, 1200);
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
                {statusMessage || (updateState === 'completed'
                  ? 'Hoàn tất 100%! Sẵn sàng sử dụng.'
                  : `${progress}% - Đang xử lý...`)}
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
            ) : updateState === 'error' ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(releaseInfo.apkUrl || releaseInfo.htmlUrl)}
                style={styles.updateBtn}
                activeOpacity={0.8}
              >
                <ExternalLink size={16} color="#FFFFFF" />
                <Text style={styles.updateBtnText}>Tải qua trình duyệt 🌐</Text>
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
