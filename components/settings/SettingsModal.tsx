'use client';

// ============================================
// 設定彈窗
// ============================================

import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { ProviderSelector } from './ProviderSelector';
import { TriggerSettings } from './TriggerSettings';
import { RetentionSettings } from './RetentionSettings';
import { TTSSettings } from './TTSSettings';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'provider' | 'triggers' | 'tts' | 'retention' | 'about';

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('provider');

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'provider', label: 'AI 供應商' },
    { id: 'triggers', label: '觸發條件' },
    { id: 'tts', label: '語音朗讀' },
    { id: 'retention', label: '資料保留' },
    { id: 'about', label: '關於' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative w-full max-w-lg max-h-[80vh] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold">設定</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="flex h-[60vh]">
          {/* 側邊選單 */}
          <div className="w-40 border-r border-slate-700 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  'flex items-center justify-between',
                  activeTab === tab.id
                    ? 'bg-violet-500/20 text-violet-300 border-r-2 border-violet-500'
                    : 'text-slate-400 hover:bg-slate-700/50'
                )}
              >
                <span>{tab.label}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* 設定內容 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'provider' && <ProviderSelector />}
            {activeTab === 'triggers' && <TriggerSettings />}
            {activeTab === 'tts' && <TTSSettings />}
            {activeTab === 'retention' && <RetentionSettings />}
            {activeTab === 'about' && <AboutSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300">關於此應用</h3>
      <div className="space-y-3 text-sm text-slate-400">
        <p>
          <span className="text-slate-300">版本：</span>1.0.0
        </p>
        <p>
          即時會議 AI 顧問是一款主動式會議輔助工具，
          會自動分析對話內容並適時給予建議。
        </p>
        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-slate-300 mb-2">隱私聲明</h4>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li>您的語音資料僅用於即時轉錄</li>
            <li>對話內容不會儲存到伺服器</li>
            <li>所有設定儲存在您的裝置本地</li>
            <li>您可以隨時清除所有本地資料</li>
          </ul>
        </div>
        <div className="pt-4">
          <button
            onClick={() => {
              if (confirm('確定要清除所有本地資料嗎？這個動作無法復原。')) {
                localStorage.clear();
                indexedDB.deleteDatabase('meeting-advisor');
                window.location.reload();
              }
            }}
            className="px-4 py-2 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
          >
            清除所有本地資料
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
