// ============================================
// AI 顧問 Prompt 模板
// ============================================

import type { MeetingMode, SuggestionKind, TriggerType } from '../types';
import type { LLMAnalyzeRequest, LLMAnalyzeResponse, LLMReportRequest } from '../services/llm/types';
import { getModePromptContext } from '../constants/modes';
import { KEYWORD_CATEGORY_NAMES } from '../constants/keywords';

/** 建議類型的中文名稱 */
const SUGGESTION_TYPE_NAMES: Record<SuggestionKind, string> = {
  tactical: '策略建議',
  warning: '風險提醒',
  opportunity: '機會提示',
  clarify: '建議追問',
  positive: '正面回饋',
};

/** 觸發類型的中文描述 */
const TRIGGER_DESCRIPTIONS: Record<TriggerType, string> = {
  keyword: '關鍵詞觸發',
  timer: '定時分析',
  silence: '對話停頓',
};

/**
 * 建構分析 Prompt
 */
export function buildAnalysisPrompt(request: LLMAnalyzeRequest): string {
  const modeContext = getModePromptContext(request.mode);
  const triggerDesc = TRIGGER_DESCRIPTIONS[request.trigger];

  let triggerContext = '';
  if (request.trigger === 'keyword' && request.triggerContext) {
    triggerContext = `\n\n觸發原因：偵測到關鍵詞「${request.triggerContext}」`;
  } else if (request.trigger === 'silence') {
    triggerContext = '\n\n觸發原因：對話出現停頓，可能需要引導或總結';
  } else if (request.trigger === 'timer') {
    triggerContext = '\n\n觸發原因：定時檢查對話進度';
  }

  const recentSuggestionsContext = request.recentSuggestions?.length
    ? `\n\n最近已給的建議（避免重複）：\n${request.recentSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : '';

  const backgroundContext = request.context
    ? `\n\n會議背景：${request.context}`
    : '';

  return `你是一個專業的即時會議 AI 顧問，正在監聽一場會議並提供主動建議。
你的角色是像一個有經驗的朋友，在使用者耳邊給予即時、實用的建議。

${modeContext}
${backgroundContext}

以下是最近的對話內容（最近 5 分鐘）：
---
${request.transcription}
---
${triggerContext}
${recentSuggestionsContext}

請分析這段對話，判斷是否需要給使用者建議。

建議類型（選擇最適合的一種）：
- tactical：策略建議（如何回應、談判技巧、話術建議）
- warning：風險提醒（承諾太多、可能踩雷、需要注意的地方）
- opportunity：機會提示（對方透露的資訊可以利用、可以深入的點）
- clarify：建議追問（需要釐清的模糊地帶、應該追問的問題）
- positive：正面回饋（做得好的地方、鼓勵使用者、給予信心）

重要原則：
1. 不要每次都給建議，只在真正有價值時才說話
2. 建議要具體、可執行、可立即使用，不要空泛
3. 語氣要像朋友在耳邊提醒，口語化、簡潔、親切
4. 如果對話很正常，沒有特別需要提醒的，就回傳 shouldAdvise: false
5. 建議內容控制在 80 字以內
6. 使用繁體中文
7. 避免與最近已給的建議重複

回傳 JSON 格式（不要加 markdown 標記，不要加程式碼區塊）：
{
  "shouldAdvise": true或false,
  "type": "tactical|warning|opportunity|clarify|positive",
  "content": "建議內容",
  "triggerReason": "觸發原因（簡短說明為什麼給這個建議）"
}`;
}

/**
 * 解析分析回應
 */
export function parseAnalysisResponse(content: string): LLMAnalyzeResponse {
  try {
    // 移除可能的 markdown 標記
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    return {
      shouldAdvise: Boolean(parsed.shouldAdvise),
      type: parsed.type as SuggestionKind,
      content: parsed.content,
      triggerReason: parsed.triggerReason,
    };
  } catch (error) {
    console.error('Failed to parse analysis response:', error, content);
    return {
      shouldAdvise: false,
    };
  }
}

/**
 * 建構會後報告 Prompt
 */
export function buildReportPrompt(request: LLMReportRequest): string {
  const durationMinutes = Math.round(request.duration / 60000);

  const suggestionsSummary = request.suggestions
    .map((s, i) => `${i + 1}. [${SUGGESTION_TYPE_NAMES[s.type]}] ${s.content}${s.feedback ? ` (${s.feedback === 'helpful' ? '有用' : '沒用'})` : ''}`)
    .join('\n');

  return `你是一個會議分析專家。請根據以下會議記錄生成一份詳細的會後分析報告。

會議模式：${getModePromptContext(request.mode)}
會議時長：${durationMinutes} 分鐘
AI 建議數量：${request.suggestions.length} 條

會議對話記錄：
---
${request.transcription}
---

會議期間給出的 AI 建議：
${suggestionsSummary || '（無建議）'}

請生成以下格式的報告（使用繁體中文）：

# 會議分析報告

## 會議摘要
[3-5 句話總結這場會議的重點]

## 關鍵時刻
[列出 3-5 個會議中的關鍵時刻，包括：]
- 時刻描述
- 類型（機會/風險/決策/承諾）
- 建議的後續行動

## 待辦事項
[從對話中提取出的行動項目，格式為清單]

## 建議分析
- 總計建議數：${request.suggestions.length}
- 各類型分布：[列出]
- 有效建議比例：[計算]

## 後續建議
[基於這場會議，給出 3-5 點後續行動建議]`;
}

/**
 * 建構模式特定的 Prompt 上下文
 */
export function buildModeSpecificContext(mode: MeetingMode): string {
  return getModePromptContext(mode);
}
