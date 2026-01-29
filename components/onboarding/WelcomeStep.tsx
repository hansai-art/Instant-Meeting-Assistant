'use client';

// ============================================
// 引導流程 - 歡迎步驟
// ============================================

import { Sparkles, Mic, Brain, Shield } from 'lucide-react';

export function WelcomeStep() {
  const features = [
    {
      icon: Mic,
      title: '即時監聽',
      description: '會議中持續監聽對話',
    },
    {
      icon: Brain,
      title: '主動建議',
      description: 'AI 自動分析並給予建議',
    },
    {
      icon: Shield,
      title: '隱私保護',
      description: '對話不會儲存到伺服器',
    },
  ];

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          歡迎使用 AI 會議顧問
        </h2>
        <p className="text-slate-400 text-sm">
          您的即時會議助手，主動提供策略建議
        </p>
      </div>

      <div className="space-y-3 text-left">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/50"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <feature.icon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-slate-400">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WelcomeStep;
