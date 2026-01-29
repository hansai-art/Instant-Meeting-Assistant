'use client';

// ============================================
// 建議卡片元件
// ============================================

import { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Suggestion, SuggestionKind } from '@/lib/types';
import { speakSuggestion, stopSpeaking } from '@/lib/services/tts/speechSynthesis';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onDismiss?: () => void;
  onFeedback?: (feedback: 'helpful' | 'not_helpful') => void;
  className?: string;
}

/** 建議類型圖標 */
const SUGGESTION_ICONS: Record<SuggestionKind, string> = {
  tactical: '🎯',
  warning: '⚠️',
  opportunity: '💡',
  clarify: '❓',
  positive: '👍',
};

/** 建議類型名稱 */
const SUGGESTION_NAMES: Record<SuggestionKind, string> = {
  tactical: '策略建議',
  warning: '風險提醒',
  opportunity: '機會提示',
  clarify: '建議追問',
  positive: '正面回饋',
};

/** 建議類型樣式 */
const SUGGESTION_STYLES: Record<SuggestionKind, string> = {
  tactical: 'suggestion-card-tactical',
  warning: 'suggestion-card-warning',
  opportunity: 'suggestion-card-opportunity',
  clarify: 'suggestion-card-clarify',
  positive: 'suggestion-card-positive',
};

export function SuggestionCard({
  suggestion,
  onDismiss,
  onFeedback,
  className,
}: SuggestionCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(!!suggestion.feedback);

  const icon = SUGGESTION_ICONS[suggestion.type];
  const name = SUGGESTION_NAMES[suggestion.type];
  const style = SUGGESTION_STYLES[suggestion.type];

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const success = speakSuggestion(suggestion.content);
      if (success) {
        setIsSpeaking(true);
        // 監聽結束
        setTimeout(() => setIsSpeaking(false), 5000);
      }
    }
  };

  const handleFeedback = (feedback: 'helpful' | 'not_helpful') => {
    if (hasFeedback) return;
    setHasFeedback(true);
    onFeedback?.(feedback);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '剛剛';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'suggestion-card rounded-xl p-4 animate-slide-in-right',
        style,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-medium opacity-80">{name}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* TTS Button */}
          <button
            onClick={handleSpeak}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={isSpeaking ? '停止朗讀' : '朗讀建議'}
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 opacity-60" />
            ) : (
              <Volume2 className="w-4 h-4 opacity-60" />
            )}
          </button>
          {/* Dismiss Button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="關閉"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3">{suggestion.content}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Trigger Context */}
        <div className="text-xs opacity-50">
          {suggestion.triggerContext && (
            <span className="mr-2">🔍 {suggestion.triggerContext}</span>
          )}
          <span>{formatTime(suggestion.timestamp)}</span>
        </div>

        {/* Feedback Buttons */}
        {onFeedback && !hasFeedback && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleFeedback('helpful')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="有用"
            >
              <ThumbsUp className="w-4 h-4 opacity-60" />
            </button>
            <button
              onClick={() => handleFeedback('not_helpful')}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="沒用"
            >
              <ThumbsDown className="w-4 h-4 opacity-60" />
            </button>
          </div>
        )}

        {/* Feedback Result */}
        {hasFeedback && (
          <div className="text-xs opacity-50">
            {suggestion.feedback === 'helpful' ? '✅ 感謝回饋' : '已記錄'}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuggestionCard;
