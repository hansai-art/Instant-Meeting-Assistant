// ============================================
// LLM 服務工廠
// ============================================

import type { LLMProvider } from '../../types';
import type { LLMService } from './types';
import { ClaudeService } from './claude';
import { OpenAIService } from './openai';
import { GroqService } from './groq';

/** 建立 LLM 服務實例 */
export function createLLMService(provider: LLMProvider, model?: string): LLMService {
  switch (provider) {
    case 'claude':
      return new ClaudeService(model);
    case 'openai':
      return new OpenAIService(model);
    case 'groq':
      return new GroqService(model);
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/** 取得預設 LLM 服務 */
export function getDefaultLLMService(): LLMService {
  // 預設使用 Claude
  return new ClaudeService();
}
