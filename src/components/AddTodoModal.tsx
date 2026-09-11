import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, Star, Check } from 'lucide-react-native';
import { TodoItem, CategoryId } from '../types/todo';
import { CATEGORIES, COLORS } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';

interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    notes?: string;
    category: CategoryId;
    starred: boolean;
  }) => void;
  editingItem?: TodoItem | null;
  targetDate: string;
  hapticsEnabled?: boolean;
}

export const AddTodoModal: React.FC<AddTodoModalProps> = ({
  visible,
  onClose,
  onSave,
  editingItem,
  targetDate,
  hapticsEnabled = true,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<CategoryId>('work');
  const [starred, setStarred] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setNotes(editingItem.notes || '');
      setCategory(editingItem.category);
      setStarred(editingItem.starred);
    } else {
      setTitle('');
      setNotes('');
      setCategory('work');
      setStarred(false);
    }
  }, [editingItem, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    triggerHaptic('medium', hapticsEnabled);
    onSave({
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
      category,
      starred,
    });
    onClose();
  };

  const availableCategories = CATEGORIES.filter(c => c.id !== 'all');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingItem ? 'Chỉnh sửa việc' : 'Thêm việc mới'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề công việc *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Họp dự án, Mua sữa, Đọc sách..."
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus={!editingItem}
                returnKeyType="next"
              />
            </View>

            {/* Category Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Danh mục</Text>
              <View style={styles.categoryWrap}>
                {availableCategories.map(cat => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        setCategory(cat.id);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.categoryBtn,
                        isSelected
                          ? { backgroundColor: cat.color }
                          : { backgroundColor: cat.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          { color: isSelected ? '#FFFFFF' : cat.color },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Star / Priority Toggle */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection', hapticsEnabled);
                setStarred(!starred);
              }}
              style={[styles.starToggle, starred && styles.starToggleActive]}
              activeOpacity={0.8}
            >
              <View style={styles.starLeft}>
                <Star
                  size={20}
                  color={starred ? COLORS.star : COLORS.textMuted}
                  fill={starred ? COLORS.star : 'transparent'}
                />
                <View>
                  <Text style={styles.starTitle}>Đánh dấu quan trọng ⭐</Text>
                  <Text style={styles.starSubtitle}>Ưu tiên hiển thị lên đầu danh sách</Text>
                </View>
              </View>
              <View style={[styles.switchIndicator, starred && styles.switchActive]}>
                {starred && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ghi chú chi tiết (Tùy chọn)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Thêm các ghi chú phụ, link tài liệu hoặc lưu ý..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!title.trim()}
              style={[
                styles.saveButton,
                !title.trim() && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {editingItem ? 'Lưu thay đổi' : 'Tạo việc ngay 🐾'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
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
    paddingVertical: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 70,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  categoryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  starToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  starToggleActive: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  starLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  starSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  switchIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: COLORS.star,
    borderColor: COLORS.star,
  },
  footer: {
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
