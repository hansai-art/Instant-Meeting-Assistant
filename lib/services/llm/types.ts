// ============================================
// LLM 服務 - 類型定義
// ============================================

import type { LLMProvider, SuggestionKind, MeetingMode, TriggerType } from '../../types';

/** LLM 服務介面 */
export interface LLMService {
  provider: LLMProvider;
  analyze(request: LLMAnalyzeRequest): Promise<LLMAnalyzeResponse>;
  generateReport(request: LLMReportRequest): Promise<string>;
}

/** 分析請求 */
export interface LLMAnalyzeRequest {
  transcription: string;
  mode: MeetingMode;
  trigger: TriggerType;
  triggerContext?: string;
  context?: string;
  recentSuggestions?: string[];
}

/** 分析回應 */
export interface LLMAnalyzeResponse {
  shouldAdvise: boolean;
  type?: SuggestionKind;
  content?: string;
  triggerReason?: string;
  confidence?: number;
}

/** 報告請求 */
export interface LLMReportRequest {
  transcription: string;
  suggestions: Array<{
    type: SuggestionKind;
    content: string;
    feedback?: 'helpful' | 'not_helpful';
  }>;
  mode: MeetingMode;
  duration: number;
}

/** LLM 供應商設定 */
export interface LLMProviderConfig {
  id: LLMProvider;
  name: string;
  description: string;
  models: LLMModelInfo[];
  defaultModel: string;
  endpoint: string;
  envKey: string;
}

/** LLM 模型資訊 */
export interface LLMModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  recommended?: boolean;
}

/** LLM 供應商設定列表 */
export const LLM_PROVIDERS: Record<LLMProvider, LLMProviderConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: '強大的推理能力，適合複雜分析',
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: '平衡速度與能力',
        contextWindow: 200000,
        recommended: true,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: '最快速度，適合即時場景',
        contextWindow: 200000,
      },
    ],
    defaultModel: 'claude-sonnet-4-20250514',
    endpoint: 'https://api.anthropic.com/v1/messages',
    envKey: 'ANTHROPIC_API_KEY',
  },
  openai: {
    id: 'openai',
    name: 'GPT (OpenAI)',
    description: '廣泛使用，穩定可靠',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: '最新多模態模型',
        contextWindow: 128000,
        recommended: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: '成本效益最佳',
        contextWindow: 128000,
      },
    ],
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    envKey: 'OPENAI_API_KEY',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: '超低延遲，極速回應',
    models: [
      {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        description: '高品質開源模型',
        contextWindow: 131072,
        recommended: true,
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: '最快回應速度',
        contextWindow: 131072,
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'MoE 架構',
        contextWindow: 32768,
      },
    ],
    defaultModel: 'llama-3.1-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
  },
};

/** 取得供應商設定 */
export function getProviderConfig(provider: LLMProvider): LLMProviderConfig {
  return LLM_PROVIDERS[provider];
}

/** 取得供應商模型列表 */
export function getProviderModels(provider: LLMProvider): LLMModelInfo[] {
  return LLM_PROVIDERS[provider].models;
}

/** 取得預設模型 */
export function getDefaultModel(provider: LLMProvider): string {
  return LLM_PROVIDERS[provider].defaultModel;
}
