export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  bgColor: string;
  icon?: string;
  isCustom?: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  starred: boolean;
  category: CategoryId;
  date: string; // YYYY-MM-DD in local time
  order?: number; // Manual sorting order
  createdAt: number;
  completedAt?: number;
  rolledOverFrom?: string; // YYYY-MM-DD of previous day if task was carried over
}

export interface NotificationSettings {
  morningEnabled: boolean;
  morningTime: {
    hour: number;
    minute: number;
  };
  eveningEnabled: boolean;
  eveningTime: {
    hour: number;
    minute: number;
  };
  soundEnabled: boolean;
  soundFxEnabled: boolean;
  hapticsEnabled: boolean;
  permissionAsked: boolean;
  lastScheduledAt?: number;
}

export interface BackupData {
  appName: string;
  version: number;
  exportedAt: string;
  todos: TodoItem[];
  settings: NotificationSettings;
  categories?: Category[];
}

export interface GitHubReleaseInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  htmlUrl: string;
  publishedAt: string;
  apkUrl?: string;
  apkSize?: number;
  apkName?: string;
}

export type MascotMood = 'sleeping' | 'happy' | 'focused' | 'celebrating';
