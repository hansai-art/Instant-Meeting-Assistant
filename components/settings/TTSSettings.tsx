'use client';

// ============================================
// TTS 語音朗讀設定
// ============================================

import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { getAvailableVoices, speakText, stopSpeaking } from '@/lib/services/tts/speechSynthesis';

export function TTSSettings() {
  const { settings, setTTSEnabled, setTTSVoice, setTTSRate } = useSettingsStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      // 過濾出中文相關語音
      const chineseVoices = availableVoices.filter(
        (v) =>
          v.lang.includes('zh') ||
          v.lang.includes('cmn') ||
          v.name.toLowerCase().includes('chinese')
      );
      setVoices(chineseVoices.length > 0 ? chineseVoices : availableVoices.slice(0, 10));
    };

    loadVoices();

    // 某些瀏覽器需要等待 voiceschanged 事件
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTest = () => {
    if (isTesting) {
      stopSpeaking();
      setIsTesting(false);
    } else {
      setIsTesting(true);
      speakText('這是一段測試語音，用於展示語音朗讀功能。', settings.ttsVoice, settings.ttsRate);
      // 估計結束時間
      setTimeout(() => setIsTesting(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">語音朗讀</h3>
        <p className="text-xs text-slate-500 mb-4">
          啟用後，AI 建議會自動朗讀出來
        </p>
      </div>

      {/* 啟用開關 */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">啟用語音朗讀</span>
          <p className="text-xs text-slate-500 mt-0.5">
            自動朗讀新的 AI 建議
          </p>
        </div>
        <button
          role="switch"
          aria-checked={settings.ttsEnabled}
          onClick={() => setTTSEnabled(!settings.ttsEnabled)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            settings.ttsEnabled ? 'bg-violet-500' : 'bg-slate-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              settings.ttsEnabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {settings.ttsEnabled && (
        <>
          {/* 語音選擇 */}
          <div className="pt-4 border-t border-slate-700">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              語音
            </label>
            <select
              value={settings.ttsVoice}
              onChange={(e) => setTTSVoice(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">預設語音</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
            {voices.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                無法載入語音列表，將使用系統預設語音
              </p>
            )}
          </div>

          {/* 語速設定 */}
          <div className="pt-4 border-t border-slate-700">
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              語速
            </label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.ttsRate}
              onChange={(e) => setTTSRate(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>慢 (0.5x)</span>
              <span className="text-violet-400">{settings.ttsRate.toFixed(1)}x</span>
              <span>快 (2x)</span>
            </div>
          </div>

          {/* 測試按鈕 */}
          <div className="pt-4 border-t border-slate-700">
            <button
              onClick={handleTest}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                isTesting
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              <Volume2 className="w-4 h-4" />
              {isTesting ? '停止測試' : '測試語音'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TTSSettings;
