import { Category, NotificationSettings } from '../types/todo';

export const COLORS = {
  // Brand & Background
  background: '#FBF9F5', // Warm Apple cream
  surface: '#FFFFFF',
  surfaceAlt: '#F5F2EB',
  border: '#EBE5D8',
  borderLight: '#F3EFE6',

  // Primary Ginger accents
  primary: '#EA580C',      // Vibrant Ginger Orange
  primaryLight: '#FFEDD5', // Soft Peach/Orange
  primaryDark: '#9A3412',
  primaryHover: '#C2410C',

  // Star & Priority
  star: '#EAB308',
  starLight: '#FEF9C3',

  // Text
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  textInverse: '#FFFFFF',

  // System Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Pastel Categories
  categories: {
    work: {
      color: '#2563EB',
      bgColor: '#DBEAFE',
    },
    personal: {
      color: '#E11D48',
      bgColor: '#FFE4E6',
    },
    shopping: {
      color: '#059669',
      bgColor: '#D1FAE5',
    },
    health: {
      color: '#7C3AED',
      bgColor: '#EDE9FE',
    },
    other: {
      color: '#4B5563',
      bgColor: '#F3F4F6',
    },
  },
};

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'Tất cả',
    color: COLORS.primary,
    bgColor: COLORS.primaryLight,
    icon: 'Sparkles',
  },
  {
    id: 'work',
    name: 'Công việc',
    color: COLORS.categories.work.color,
    bgColor: COLORS.categories.work.bgColor,
    icon: 'Briefcase',
  },
  {
    id: 'personal',
    name: 'Cá nhân',
    color: COLORS.categories.personal.color,
    bgColor: COLORS.categories.personal.bgColor,
    icon: 'Heart',
  },
  {
    id: 'shopping',
    name: 'Mua sắm',
    color: COLORS.categories.shopping.color,
    bgColor: COLORS.categories.shopping.bgColor,
    icon: 'ShoppingBag',
  },
  {
    id: 'health',
    name: 'Sức khỏe',
    color: COLORS.categories.health.color,
    bgColor: COLORS.categories.health.bgColor,
    icon: 'Activity',
  },
  {
    id: 'other',
    name: 'Khác',
    color: COLORS.categories.other.color,
    bgColor: COLORS.categories.other.bgColor,
    icon: 'Bookmark',
  },
];

export const DEFAULT_SETTINGS: NotificationSettings = {
  morningEnabled: true,
  morningTime: {
    hour: 8,
    minute: 0,
  },
  eveningEnabled: true,
  eveningTime: {
    hour: 18,
    minute: 0,
  },
  soundEnabled: true,
  hapticsEnabled: true,
  permissionAsked: false,
};

export const APP_CONFIG = {
  name: 'Gừng Todo',
  version: '1.0.0',
  githubRepo: 'vuducmynh/gung-todo',
  githubApiUrl: 'https://api.github.com/repos/vuducmynh/gung-todo/releases/latest',
};
