'use client';

// ============================================
// 觸發條件設定
// ============================================

import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';

export function TriggerSettings() {
  const { settings, updateTriggers } = useSettingsStore();
  const { triggers } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">觸發條件</h3>
        <p className="text-xs text-slate-500 mb-4">
          設定 AI 何時主動給予建議
        </p>
      </div>

      {/* 關鍵詞觸發 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">關鍵詞觸發</span>
            <p className="text-xs text-slate-500 mt-0.5">
              偵測到價格、時間、承諾等關鍵詞時觸發
            </p>
          </div>
          <ToggleSwitch
            checked={triggers.keywordEnabled}
            onChange={(checked) => updateTriggers({ keywordEnabled: checked })}
          />
        </div>

        {triggers.keywordEnabled && (
          <div className="pl-4 border-l-2 border-slate-700">
            <label className="text-xs text-slate-400 mb-2 block">
              冷卻時間（秒）
            </label>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={triggers.keywordThrottle / 1000}
              onChange={(e) =>
                updateTriggers({ keywordThrottle: Number(e.target.value) * 1000 })
              }
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>10秒</span>
              <span className="text-violet-400">
                {triggers.keywordThrottle / 1000}秒
              </span>
              <span>60秒</span>
            </div>
          </div>
        )}
      </div>

      {/* 定時觸發 */}
      <div className="space-y-3 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">定時觸發</span>
            <p className="text-xs text-slate-500 mt-0.5">
              每隔一段時間自動分析
            </p>
          </div>
          <ToggleSwitch
            checked={triggers.timerEnabled}
            onChange={(checked) => updateTriggers({ timerEnabled: checked })}
          />
        </div>

        {triggers.timerEnabled && (
          <div className="pl-4 border-l-2 border-slate-700">
            <label className="text-xs text-slate-400 mb-2 block">
              間隔時間（秒）
            </label>
            <input
              type="range"
              min={30}
              max={180}
              step={10}
              value={triggers.timerInterval / 1000}
              onChange={(e) =>
                updateTriggers({ timerInterval: Number(e.target.value) * 1000 })
              }
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>30秒</span>
              <span className="text-violet-400">
                {triggers.timerInterval / 1000}秒
              </span>
              <span>180秒</span>
            </div>
          </div>
        )}
      </div>

      {/* 沉默觸發 */}
      <div className="space-y-3 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">沉默觸發</span>
            <p className="text-xs text-slate-500 mt-0.5">
              對話沉默一段時間後提供建議
            </p>
          </div>
          <ToggleSwitch
            checked={triggers.silenceEnabled}
            onChange={(checked) => updateTriggers({ silenceEnabled: checked })}
          />
        </div>

        {triggers.silenceEnabled && (
          <div className="pl-4 border-l-2 border-slate-700">
            <label className="text-xs text-slate-400 mb-2 block">
              沉默閾值（秒）
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={triggers.silenceThreshold / 1000}
              onChange={(e) =>
                updateTriggers({
                  silenceThreshold: Number(e.target.value) * 1000,
                })
              }
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>5秒</span>
              <span className="text-violet-400">
                {triggers.silenceThreshold / 1000}秒
              </span>
              <span>30秒</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-violet-500' : 'bg-slate-600'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

export default TriggerSettings;
