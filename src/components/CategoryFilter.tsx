import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Tag, Plus } from 'lucide-react-native';
import { Category, CategoryId } from '../types/todo';
import { CATEGORIES, COLORS } from '../constants/theme';
import { triggerHaptic } from '../utils/haptics';

interface CategoryFilterProps {
  selectedCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  categoryCounts: Record<CategoryId, number>;
  categories?: Category[];
  onOpenCategoryManager?: () => void;
  hapticsEnabled?: boolean;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categories = CATEGORIES,
  onOpenCategoryManager,
  hapticsEnabled = true,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {categories.map(category => {
          const isSelected = selectedCategory === category.id;
          const count = categoryCounts[category.id] || 0;

          return (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('selection', hapticsEnabled);
                onSelectCategory(category.id);
              }}
              style={[
                styles.pill,
                isSelected
                  ? { backgroundColor: category.id === 'all' ? COLORS.primary : category.color }
                  : styles.pillInactive,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {category.name}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.badge,
                    isSelected ? styles.badgeActive : styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected ? styles.badgeTextActive : styles.badgeTextInactive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Manage Categories Button */}
        {onOpenCategoryManager && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic('selection', hapticsEnabled);
              onOpenCategoryManager();
            }}
            style={styles.managePill}
          >
            <Tag size={13} color={COLORS.primary} />
            <Text style={styles.managePillText}>Nhãn</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  pillInactive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeInactive: {
    backgroundColor: COLORS.surfaceAlt,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  badgeTextInactive: {
    color: COLORS.textMuted,
  },
  managePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 5,
  },
  managePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
