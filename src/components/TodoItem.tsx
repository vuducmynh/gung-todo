import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Check,
  Star,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
} from 'lucide-react-native';
import { TodoItem as TodoItemType } from '../types/todo';
import { CATEGORIES, COLORS } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';

interface TodoItemProps {
  item: TodoItemType;
  onToggleComplete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onEdit: (item: TodoItemType) => void;
  onDelete: (id: string) => void;
  hapticsEnabled?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  item,
  onToggleComplete,
  onToggleStar,
  onEdit,
  onDelete,
  hapticsEnabled = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  const category = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[1];

  const handleToggleCheck = () => {
    triggerHaptic(item.completed ? 'light' : 'success', hapticsEnabled);
    onToggleComplete(item.id);
  };

  const handleToggleStar = () => {
    triggerHaptic('selection', hapticsEnabled);
    onToggleStar(item.id);
  };

  const handleDelete = () => {
    triggerHaptic('warning', hapticsEnabled);
    onDelete(item.id);
  };

  const handleEdit = () => {
    triggerHaptic('selection', hapticsEnabled);
    onEdit(item);
  };

  return (
    <View
      style={[
        styles.card,
        item.completed && styles.cardCompleted,
        item.starred && !item.completed && styles.cardStarred,
      ]}
    >
      <View style={styles.mainRow}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={handleToggleCheck}
          activeOpacity={0.7}
          style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
        >
          {item.completed && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>

        {/* Content Body */}
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, item.completed && styles.titleCompleted]}
              numberOfLines={expanded ? undefined : 2}
            >
              {item.title}
            </Text>
          </View>

          {/* Badges & Tags Row */}
          <View style={styles.metaRow}>
            {/* Category Tag */}
            <View style={[styles.categoryPill, { backgroundColor: category.bgColor }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>

            {/* Rolled over badge */}
            {item.rolledOverFrom && !item.completed && (
              <View style={styles.rolloverBadge}>
                <Clock size={10} color="#EA580C" />
                <Text style={styles.rolloverText}>Dời từ trước</Text>
              </View>
            )}

            {/* Has notes badge */}
            {item.notes && item.notes.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={styles.noteIndicator}
                activeOpacity={0.7}
              >
                <FileText size={11} color={COLORS.textSecondary} />
                <Text style={styles.noteIndicatorText}>Ghi chú</Text>
                {expanded ? (
                  <ChevronUp size={11} color={COLORS.textSecondary} />
                ) : (
                  <ChevronDown size={11} color={COLORS.textSecondary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons: Star */}
        <TouchableOpacity
          onPress={handleToggleStar}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <Star
            size={19}
            color={item.starred ? COLORS.star : COLORS.textMuted}
            fill={item.starred ? COLORS.star : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Expanded Note Section */}
      {expanded && item.notes && item.notes.trim().length > 0 && (
        <View style={styles.expandedNoteBox}>
          <Text style={styles.noteContent}>{item.notes}</Text>
        </View>
      )}

      {/* Action Tray: Edit / Delete */}
      <View style={styles.footerRow}>
        <Text style={styles.timestampText}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.miniBtn} activeOpacity={0.6}>
            <Edit3 size={14} color={COLORS.textSecondary} />
            <Text style={styles.miniBtnText}>Sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.miniBtn} activeOpacity={0.6}>
            <Trash2 size={14} color={COLORS.danger} />
            <Text style={[styles.miniBtnText, { color: COLORS.danger }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  cardCompleted: {
    backgroundColor: '#FAF8F5',
    borderColor: COLORS.borderLight,
    opacity: 0.75,
  },
  cardStarred: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
    backgroundColor: COLORS.surface,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  contentContainer: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 21,
    flex: 1,
    flexWrap: 'wrap',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rolloverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rolloverText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EA580C',
  },
  noteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  noteIndicatorText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  expandedNoteBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  noteContent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  miniBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
