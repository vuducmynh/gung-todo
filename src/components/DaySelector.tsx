import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { formatDateDisplay, getTodayString } from '../services/storage';
import { triggerHaptic } from '../utils/haptics';

interface DaySelectorProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  hapticsEnabled?: boolean;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  currentDate,
  onDateChange,
  hapticsEnabled = true,
}) => {
  const today = getTodayString();
  const dateInfo = formatDateDisplay(currentDate);

  const changeDayBy = (offset: number) => {
    triggerHaptic('selection', hapticsEnabled);
    const parts = currentDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + offset);
    onDateChange(getTodayString(d));
  };

  const jumpToToday = () => {
    triggerHaptic('medium', hapticsEnabled);
    onDateChange(today);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => changeDayBy(-1)}
        style={styles.arrowButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={jumpToToday}
        style={styles.dateCenter}
        activeOpacity={0.8}
      >
        <View style={styles.titleRow}>
          <CalendarIcon size={16} color={COLORS.primary} />
          <Text style={styles.dateTitle}>{dateInfo.title}</Text>
          {!dateInfo.isToday && (
            <View style={styles.pastTag}>
              <RotateCcw size={10} color="#FFFFFF" />
              <Text style={styles.pastTagText}>Quay lại</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateSubtitle}>{dateInfo.subtitle}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => changeDayBy(1)}
        style={styles.arrowButton}
        activeOpacity={0.7}
      >
        <ChevronRight size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginHorizontal: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  dateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  dateSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  pastTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    marginLeft: 4,
  },
  pastTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
