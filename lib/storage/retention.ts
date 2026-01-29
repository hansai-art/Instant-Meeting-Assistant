// ============================================
// 資料保留管理
// ============================================

import { deleteExpiredSessions, getStats } from './indexedDB';

/**
 * 執行資料清理
 * @param retentionDays 保留天數 (7, 30, 或 90)
 * @returns 刪除的 session 數量
 */
export async function performDataCleanup(retentionDays: 7 | 30 | 90): Promise<number> {
  try {
    const deletedCount = await deleteExpiredSessions(retentionDays);
    console.log(`[Retention] Deleted ${deletedCount} expired sessions (retention: ${retentionDays} days)`);
    return deletedCount;
  } catch (error) {
    console.error('[Retention] Failed to cleanup expired data:', error);
    return 0;
  }
}

/**
 * 檢查並執行自動清理
 * 應該在應用啟動時呼叫
 */
export async function checkAndCleanup(retentionDays: 7 | 30 | 90): Promise<void> {
  const LAST_CLEANUP_KEY = 'meeting-advisor-last-cleanup';
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 小時

  try {
    const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
    const lastCleanupTime = lastCleanup ? parseInt(lastCleanup, 10) : 0;
    const now = Date.now();

    if (now - lastCleanupTime >= CLEANUP_INTERVAL) {
      const deletedCount = await performDataCleanup(retentionDays);
      localStorage.setItem(LAST_CLEANUP_KEY, now.toString());

      if (deletedCount > 0) {
        console.log(`[Retention] Auto cleanup completed: ${deletedCount} sessions deleted`);
      }
    }
  } catch (error) {
    console.error('[Retention] Auto cleanup failed:', error);
  }
}

/**
 * 取得儲存空間使用情況
 */
export async function getStorageUsage(): Promise<{
  used: number;
  quota: number;
  usagePercent: number;
}> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;

      return {
        used,
        quota,
        usagePercent: quota > 0 ? (used / quota) * 100 : 0,
      };
    }
  } catch (error) {
    console.error('[Retention] Failed to get storage estimate:', error);
  }

  return { used: 0, quota: 0, usagePercent: 0 };
}

/**
 * 格式化儲存空間大小
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const base = 1024;
  const index = Math.floor(Math.log(bytes) / Math.log(base));
  const size = bytes / Math.pow(base, index);

  return `${size.toFixed(2)} ${units[index]}`;
}

/**
 * 清理過期資料 (用於手動清理)
 * @param retentionDays 保留天數
 * @returns 清理結果
 */
export async function cleanupOldData(retentionDays: number): Promise<{
  deletedSessions: number;
  deletedSuggestions: number;
}> {
  const validDays = retentionDays === 7 || retentionDays === 30 || retentionDays === 90
    ? retentionDays
    : 30;

  const deletedSessions = await performDataCleanup(validDays);

  return {
    deletedSessions,
    deletedSuggestions: 0, // Suggestions are stored within sessions
  };
}

/**
 * 取得資料保留摘要
 */
export async function getRetentionSummary(retentionDays: 7 | 30 | 90): Promise<{
  retentionDays: number;
  totalSessions: number;
  totalSuggestions: number;
  storageUsed: string;
  storagePercent: number;
}> {
  const stats = await getStats();
  const storage = await getStorageUsage();

  return {
    retentionDays,
    totalSessions: stats.totalSessions,
    totalSuggestions: stats.totalSuggestions,
    storageUsed: formatStorageSize(storage.used),
    storagePercent: storage.usagePercent,
  };
}
