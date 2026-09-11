import { GitHubReleaseInfo } from '../types/todo';
import { APP_CONFIG } from '../constants/theme';

/**
 * Compare two semver strings (e.g. "1.0.0" vs "1.0.1")
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareVersions = (v1: string, v2: string): number => {
  const cleanV1 = v1.replace(/^v/i, '').trim();
  const cleanV2 = v2.replace(/^v/i, '').trim();

  const parts1 = cleanV1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = cleanV2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
};

/**
 * Checks GitHub Releases API for the latest release tag
 */
export const checkForGitHubUpdate = async (
  currentVersion: string = APP_CONFIG.version,
  repo: string = APP_CONFIG.githubRepo
): Promise<GitHubReleaseInfo | null> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GungTodoApp',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Repo has no releases yet
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const tagVersion = data.tag_name || data.name || '';
    const cleanTag = tagVersion.replace(/^v/i, '');

    const hasUpdate = compareVersions(cleanTag, currentVersion) > 0;

    return {
      hasUpdate,
      currentVersion,
      latestVersion: cleanTag,
      releaseName: data.name || tagVersion,
      releaseNotes: data.body || 'Bản cập nhật mới với nhiều cải tiến hiệu năng và sửa lỗi!',
      htmlUrl: data.html_url || `https://github.com/${repo}/releases`,
      publishedAt: data.published_at || new Date().toISOString(),
    };
  } catch (error) {
    console.log('Update check info:', error);
    return null;
  }
};
