// ============================================
// 純文字匯出
// ============================================

import type { MeetingSession, ExportOptions, SuggestionKind } from '../../types';
import { MEETING_MODES } from '../../constants/modes';

/** 建議類型名稱 */
const SUGGESTION_NAMES: Record<SuggestionKind, string> = {
  tactical: '策略建議',
  warning: '風險提醒',
  opportunity: '機會提示',
  clarify: '建議追問',
  positive: '正面回饋',
};

/**
 * 匯出為純文字格式
 */
export function exportToText(
  session: MeetingSession,
  options: ExportOptions
): string {
  const lines: string[] = [];
  const modeConfig = MEETING_MODES[session.mode];

  // 標題
  lines.push('會議記錄');
  lines.push('='.repeat(40));
  lines.push('');

  // 會議資訊
  lines.push('【會議資訊】');
  lines.push(`模式: ${modeConfig.name}`);
  lines.push(`開始時間: ${formatDateTime(session.startTime)}`);
  if (session.endTime) {
    lines.push(`結束時間: ${formatDateTime(session.endTime)}`);
  }
  lines.push(`時長: ${formatDuration(session.duration)}`);
  if (session.context) {
    lines.push(`背景: ${session.context}`);
  }
  lines.push('');

  // 統計
  if (options.includeStats) {
    lines.push('【統計】');
    lines.push(`轉錄段落數: ${session.transcriptionSegments.length}`);
    lines.push(`AI 建議數: ${session.suggestions.length}`);

    if (session.suggestions.length > 0) {
      const byType = session.suggestions.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      lines.push('建議類型分布:');
      for (const [type, count] of Object.entries(byType)) {
        const name = SUGGESTION_NAMES[type as SuggestionKind];
        lines.push(`  - ${name}: ${count}`);
      }
    }
    lines.push('');
  }

  // 轉錄內容
  if (options.includeTranscription && session.transcriptionSegments.length > 0) {
    lines.push('【對話記錄】');
    lines.push('-'.repeat(40));

    for (const segment of session.transcriptionSegments) {
      if (!segment.isFinal) continue;

      if (options.includeTimestamps) {
        const timestamp = formatTime(segment.timestamp);
        lines.push(`[${timestamp}] ${segment.text}`);
      } else {
        lines.push(segment.text);
      }
    }
    lines.push('');
  }

  // AI 建議
  if (options.includeSuggestions && session.suggestions.length > 0) {
    lines.push('【AI 建議】');
    lines.push('-'.repeat(40));

    for (let i = 0; i < session.suggestions.length; i++) {
      const suggestion = session.suggestions[i];
      const name = SUGGESTION_NAMES[suggestion.type];

      lines.push(`${i + 1}. [${name}]`);

      if (options.includeTimestamps) {
        lines.push(`   時間: ${formatTime(suggestion.timestamp)}`);
      }

      lines.push(`   內容: ${suggestion.content}`);

      if (suggestion.triggerContext) {
        lines.push(`   觸發: ${suggestion.triggerContext}`);
      }

      if (suggestion.feedback) {
        const feedbackText = suggestion.feedback === 'helpful' ? '有用' : '沒用';
        lines.push(`   回饋: ${feedbackText}`);
      }

      lines.push('');
    }
  }

  // 頁尾
  lines.push('='.repeat(40));
  lines.push(`由即時會議 AI 顧問生成於 ${formatDateTime(new Date().toISOString())}`);

  return lines.join('\n');
}

/**
 * 格式化日期時間
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化時間
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 格式化時長
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} 小時 ${minutes % 60} 分鐘`;
  }
  if (minutes > 0) {
    return `${minutes} 分鐘 ${seconds % 60} 秒`;
  }
  return `${seconds} 秒`;
}
