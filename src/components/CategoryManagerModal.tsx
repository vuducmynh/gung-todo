import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, Edit2, Check, Tag } from 'lucide-react-native';
import { Category, CategoryId } from '../types/todo';
import { COLORS } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';
import { playSound } from '../utils/sound';

export const PASTEL_PALETTE = [
  { color: '#2563EB', bgColor: '#DBEAFE', name: 'Lam' },
  { color: '#E11D48', bgColor: '#FFE4E6', name: 'Hồng' },
  { color: '#059669', bgColor: '#D1FAE5', name: 'Lục' },
  { color: '#7C3AED', bgColor: '#EDE9FE', name: 'Tím' },
  { color: '#EA580C', bgColor: '#FFEDD5', name: 'Cam' },
  { color: '#D97706', bgColor: '#FEF3C7', name: 'Vàng' },
  { color: '#0891B2', bgColor: '#CFFAFE', name: 'Ngọc' },
  { color: '#4F46E5', bgColor: '#E0E7FF', name: 'Chàm' },
];

interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: CategoryId) => void;
  hapticsEnabled?: boolean;
  soundFxEnabled?: boolean;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  visible,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
  hapticsEnabled = true,
  soundFxEnabled = true,
}) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const startAddNew = () => {
    triggerHaptic('selection', hapticsEnabled);
    playSound('pop', soundFxEnabled);
    setEditingCategory(null);
    setName('');
    setSelectedColorIdx(Math.floor(Math.random() * PASTEL_PALETTE.length));
    setIsAddingNew(true);
  };

  const startEdit = (cat: Category) => {
    triggerHaptic('selection', hapticsEnabled);
    playSound('pop', soundFxEnabled);
    setEditingCategory(cat);
    setName(cat.name);
    const colorIndex = PASTEL_PALETTE.findIndex(p => p.color === cat.color);
    setSelectedColorIdx(colorIndex >= 0 ? colorIndex : 0);
    setIsAddingNew(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    triggerHaptic('success', hapticsEnabled);
    playSound('pop', soundFxEnabled);

    const palette = PASTEL_PALETTE[selectedColorIdx] || PASTEL_PALETTE[0];

    if (editingCategory) {
      // Edit existing
      onSaveCategory({
        ...editingCategory,
        name: name.trim(),
        color: palette.color,
        bgColor: palette.bgColor,
      });
    } else {
      // Create new
      const newCategory: Category = {
        id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        color: palette.color,
        bgColor: palette.bgColor,
        isCustom: true,
      };
      onSaveCategory(newCategory);
    }

    setIsAddingNew(false);
    setName('');
    setEditingCategory(null);
  };

  const handleDelete = (cat: Category) => {
    triggerHaptic('warning', hapticsEnabled);
    Alert.alert(
      'Xóa nhãn này?',
      `Bạn có chắc chắn muốn xóa nhãn "${cat.name}"? Các công việc thuộc nhãn này sẽ tự động chuyển về nhãn "Khác" để không bị mất việc.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa nhãn',
          style: 'destructive',
          onPress: () => {
            playSound('pop', soundFxEnabled);
            onDeleteCategory(cat.id);
            if (editingCategory?.id === cat.id) {
              setIsAddingNew(false);
              setEditingCategory(null);
            }
          },
        },
      ]
    );
  };

  // Only manage non-"all" categories
  const manageableCategories = categories.filter(c => c.id !== 'all');

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Tag size={18} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Quản lý Nhãn & Danh mục</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Add/Edit Form Box */}
            {isAddingNew ? (
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {editingCategory ? 'Sửa tên & màu nhãn' : 'Thêm nhãn mới'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsAddingNew(false);
                      setEditingCategory(null);
                    }}
                  >
                    <Text style={styles.cancelText}>Hủy</Text>
                  </TouchableOpacity>
                </View>

                {/* Input Name */}
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên nhãn (ví dụ: Học tập, Dự án X...)"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={24}
                />

                {/* Color Palette Selector */}
                <Text style={styles.colorLabel}>Chọn màu sắc Pastel:</Text>
                <View style={styles.paletteRow}>
                  {PASTEL_PALETTE.map((pal, idx) => {
                    const isSelected = selectedColorIdx === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          triggerHaptic('selection', hapticsEnabled);
                          setSelectedColorIdx(idx);
                        }}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: pal.color },
                          isSelected && styles.colorCircleSelected,
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!name.trim()}
                  style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    {editingCategory ? 'Lưu thay đổi' : 'Thêm nhãn ngay 🐾'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={startAddNew}
                style={styles.addNewBtn}
                activeOpacity={0.7}
              >
                <Plus size={18} color={COLORS.primary} strokeWidth={2.4} />
                <Text style={styles.addNewBtnText}>Tạo thêm nhãn mới...</Text>
              </TouchableOpacity>
            )}

            {/* Existing Categories List */}
            <Text style={styles.listSectionTitle}>Danh sách nhãn hiện có:</Text>
            <View style={styles.categoryList}>
              {manageableCategories.map(cat => (
                <View key={cat.id} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                    <View style={[styles.tagPreview, { backgroundColor: cat.bgColor }]}>
                      <Text style={[styles.tagPreviewText, { color: cat.color }]}>
                        {cat.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      onPress={() => startEdit(cat)}
                      style={styles.actionBtn}
                      activeOpacity={0.6}
                    >
                      <Edit2 size={15} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {/* Don't delete 'other' category as fallback */}
                    {cat.id !== 'other' && (
                      <TouchableOpacity
                        onPress={() => handleDelete(cat)}
                        style={styles.actionBtn}
                        activeOpacity={0.6}
                      >
                        <Trash2 size={15} color={COLORS.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  addNewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  formCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  cancelText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  categoryList: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagPreview: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagPreviewText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
});
