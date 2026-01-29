// ============================================
// Claude (Anthropic) LLM 服務
// ============================================

import type { LLMService, LLMAnalyzeRequest, LLMAnalyzeResponse, LLMReportRequest } from './types';
import { buildAnalysisPrompt, buildReportPrompt, parseAnalysisResponse } from '../../prompts/advisorPrompts';

export class ClaudeService implements LLMService {
  provider = 'claude' as const;
  private model: string;

  constructor(model: string = 'claude-sonnet-4-20250514') {
    this.model = model;
  }

  async analyze(request: LLMAnalyzeRequest): Promise<LLMAnalyzeResponse> {
    const prompt = buildAnalysisPrompt(request);

    const response = await fetch('/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'claude',
        model: this.model,
        prompt,
        maxTokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as { content?: string };
    return parseAnalysisResponse(data.content || '');
  }

  async generateReport(request: LLMReportRequest): Promise<string> {
    const prompt = buildReportPrompt(request);

    const response = await fetch('/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'claude',
        model: this.model,
        prompt,
        maxTokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as { content?: string };
    return data.content || '';
  }
}
