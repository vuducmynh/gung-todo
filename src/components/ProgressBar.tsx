import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { Sparkles, CheckCircle2 } from 'lucide-react-native';

interface ProgressBarProps {
  completedCount: number;
  totalCount: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completedCount,
  totalCount,
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getEncouragement = () => {
    if (totalCount === 0) return 'Hôm nay chưa có đầu việc nào. Nhấn + để thêm nhé! 🐾';
    if (percentage === 100) return 'Xuất sắc 100%! Bạn đã hoàn thành hết mục tiêu hôm nay! 👏';
    if (percentage >= 70) return 'Gần cán đích rồi! Chỉ còn vài việc nữa thôi! 🚀';
    if (percentage >= 50) return 'Đã xong hơn một nửa chặng đường, cố lên nào! 🐾';
    if (percentage > 0) return 'Khởi đầu tuyệt vời! Giữ vững nhịp độ nhé! ✨';
    return 'Cùng Mèo Gừng bắt đầu ngày mới thật năng suất nào! ☀️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.statGroup}>
          <CheckCircle2 size={16} color={COLORS.success} />
          <Text style={styles.statText}>
            <Text style={styles.statBold}>{completedCount}</Text> / {totalCount} hoàn thành
          </Text>
        </View>

        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.messageRow}>
        <Sparkles size={13} color={COLORS.primary} />
        <Text style={styles.messageText} numberOfLines={1}>
          {getEncouragement()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statBold: {
    fontWeight: '700',
    color: COLORS.text,
  },
  percentageBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  track: {
    height: 9,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  messageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
});
