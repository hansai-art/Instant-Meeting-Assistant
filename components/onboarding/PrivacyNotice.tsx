'use client';

// ============================================
// 引導流程 - 隱私聲明
// ============================================

import { Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrivacyNoticeProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function PrivacyNotice({ accepted, onAcceptChange }: PrivacyNoticeProps) {
  const privacyPoints = [
    {
      title: '語音資料',
      description: '您的語音僅用於即時轉錄，不會被錄製或儲存到伺服器',
    },
    {
      title: '對話內容',
      description: '轉錄後的文字僅儲存在您的裝置本地，您可以隨時刪除',
    },
    {
      title: 'AI 分析',
      description: '對話內容會傳送至 AI 服務進行分析，但不會被用於訓練模型',
    },
    {
      title: '資料保留',
      description: '您可以設定資料保留期限（7/30/90 天），過期資料會自動刪除',
    },
  ];

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
          <Shield className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">隱私聲明</h2>
        <p className="text-slate-400 text-sm">
          我們重視您的隱私，請閱讀以下說明
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {privacyPoints.map((point) => (
          <div
            key={point.title}
            className="p-3 rounded-xl bg-slate-700/50"
          >
            <h3 className="font-medium text-sm mb-1">{point.title}</h3>
            <p className="text-xs text-slate-400">{point.description}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onAcceptChange(!accepted)}
        className={cn(
          'w-full flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
          accepted
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
            : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded flex items-center justify-center',
            accepted ? 'bg-emerald-500' : 'bg-slate-600'
          )}
        >
          {accepted && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm">我已閱讀並同意以上隱私聲明</span>
      </button>
    </div>
  );
}

export default PrivacyNotice;
