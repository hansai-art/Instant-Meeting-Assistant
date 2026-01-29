'use client';

// ============================================
// 資料保留設定
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { cleanupOldData } from '@/lib/storage/retention';

type RetentionPeriod = 7 | 30 | 90 | -1;

const periods: { value: RetentionPeriod; label: string; description: string }[] = [
  { value: 7, label: '7 天', description: '保留最近一週的資料' },
  { value: 30, label: '30 天', description: '保留最近一個月的資料' },
  { value: 90, label: '90 天', description: '保留最近三個月的資料' },
  { value: -1, label: '永久', description: '不自動刪除資料' },
];

export function RetentionSettings() {
  const { settings, setRetentionDays } = useSettingsStore();
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupResult(null);

    try {
      const result = await cleanupOldData(settings.retentionDays);
      setCleanupResult(
        `已清理 ${result.deletedSessions} 個會議記錄和 ${result.deletedSuggestions} 條建議`
      );
    } catch {
      setCleanupResult('清理過程中發生錯誤');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">資料保留期限</h3>
        <p className="text-xs text-slate-500 mb-4">
          設定本地資料的保留時間，超過期限的資料會自動刪除
        </p>
      </div>

      <div className="space-y-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => setRetentionDays(period.value)}
            className={cn(
              'w-full p-3 rounded-xl text-left transition-all',
              'border',
              settings.retentionDays === period.value
                ? 'bg-violet-500/20 border-violet-500'
                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{period.label}</span>
              {settings.retentionDays === period.value && (
                <span className="text-xs text-violet-400">已選擇</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">{period.description}</p>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 mb-3">手動清理</h4>
        <button
          onClick={handleCleanup}
          disabled={isCleaningUp || settings.retentionDays === -1}
          className={cn(
            'w-full px-4 py-2 rounded-lg text-sm transition-colors',
            'bg-slate-700 hover:bg-slate-600 text-slate-300',
            (isCleaningUp || settings.retentionDays === -1) &&
              'opacity-50 cursor-not-allowed'
          )}
        >
          {isCleaningUp ? '清理中...' : '立即清理過期資料'}
        </button>
        {cleanupResult && (
          <p className="text-xs text-green-400 mt-2">{cleanupResult}</p>
        )}
        {settings.retentionDays === -1 && (
          <p className="text-xs text-slate-500 mt-2">
            永久保留模式下無法自動清理
          </p>
        )}
      </div>
    </div>
  );
}

export default RetentionSettings;
