export type CategoryId = 'all' | 'work' | 'personal' | 'shopping' | 'health' | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface TodoItem {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  starred: boolean;
  category: CategoryId;
  date: string; // YYYY-MM-DD in local time
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
}

export interface GitHubReleaseInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  htmlUrl: string;
  publishedAt: string;
}

export type MascotMood = 'sleeping' | 'happy' | 'focused' | 'celebrating';
