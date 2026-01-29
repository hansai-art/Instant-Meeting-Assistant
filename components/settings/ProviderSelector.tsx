'use client';

// ============================================
// LLM 供應商選擇器
// ============================================

import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import type { LLMProvider } from '@/lib/types';

const providers: {
  id: LLMProvider;
  name: string;
  description: string;
  models: string[];
}[] = [
  {
    id: 'claude',
    name: 'Claude',
    description: '由 Anthropic 開發，擅長分析與推理',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT 系列模型，廣泛應用',
    models: ['gpt-4o', 'gpt-4o-mini'],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: '低延遲推理，適合即時應用',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
];

export function ProviderSelector() {
  const { settings, setLLMProvider, setLLMModel } = useSettingsStore();

  const selectedProvider = providers.find(p => p.id === settings.llmProvider);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">AI 供應商</h3>
        <p className="text-xs text-slate-500 mb-4">
          選擇用於分析會議內容的 AI 服務
        </p>
        <div className="space-y-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                setLLMProvider(provider.id);
                setLLMModel(provider.models[0]);
              }}
              className={cn(
                'w-full p-3 rounded-xl text-left transition-all',
                'border',
                settings.llmProvider === provider.id
                  ? 'bg-violet-500/20 border-violet-500'
                  : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{provider.name}</span>
                {settings.llmProvider === provider.id && (
                  <span className="text-xs text-violet-400">已選擇</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">{provider.description}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedProvider && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">模型</h3>
          <div className="space-y-2">
            {selectedProvider.models.map((model) => (
              <button
                key={model}
                onClick={() => setLLMModel(model)}
                className={cn(
                  'w-full p-2 rounded-lg text-left text-sm transition-all',
                  'border',
                  settings.llmModel === model
                    ? 'bg-violet-500/10 border-violet-500/50 text-violet-300'
                    : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                )}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          API 金鑰由伺服器端管理，請確認環境變數已正確設定。
        </p>
      </div>
    </div>
  );
}

export default ProviderSelector;
