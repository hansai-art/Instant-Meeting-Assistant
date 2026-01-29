// ============================================
// 主動分析 API
// ============================================

import type { LLMProvider, MeetingMode, TriggerType, AnalyzeResponse } from '@/lib/types';
import { buildAnalysisPrompt, parseAnalysisResponse } from '@/lib/prompts/advisorPrompts';

export async function POST(req: Request) {
  try {
    const {
      transcription,
      trigger,
      triggerContext,
      mode,
      context,
      recentSuggestions,
      provider = 'claude',
      model,
    } = (await req.json()) as {
      transcription: string;
      trigger: TriggerType;
      triggerContext?: string;
      mode: MeetingMode;
      context?: string;
      recentSuggestions?: string[];
      provider?: LLMProvider;
      model?: string;
    };

    // 檢查轉錄內容是否足夠
    if (!transcription || transcription.trim().length < 20) {
      return Response.json({
        shouldAdvise: false,
        reason: 'Insufficient transcription content',
      } as AnalyzeResponse);
    }

    // 建構 Prompt
    const prompt = buildAnalysisPrompt({
      transcription,
      trigger,
      triggerContext,
      mode,
      context,
      recentSuggestions,
    });

    // 呼叫 LLM
    const completionResponse = await fetch(new URL('/api/completion', req.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        model,
        prompt,
        maxTokens: 500,
      }),
    });

    if (!completionResponse.ok) {
      throw new Error(`Completion API error: ${completionResponse.status}`);
    }

    const responseData = await completionResponse.json() as { content?: string; error?: string };
    const { content, error } = responseData;

    if (error) {
      throw new Error(error);
    }

    if (!content) {
      throw new Error('No content in response');
    }

    // 解析回應
    const result = parseAnalysisResponse(content);

    return Response.json(result);
  } catch (error: any) {
    console.error('Analyze API Error:', error);
    return Response.json(
      {
        shouldAdvise: false,
        error: error.message || 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
