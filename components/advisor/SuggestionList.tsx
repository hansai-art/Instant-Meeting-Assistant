'use client';

// ============================================
// 建議列表元件
// ============================================

import { useRef, useEffect } from 'react';
import { SuggestionCard } from './SuggestionCard';
import type { Suggestion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SuggestionListProps {
  suggestions: Suggestion[];
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, feedback: 'helpful' | 'not_helpful') => void;
  maxVisible?: number;
  className?: string;
}

export function SuggestionList({
  suggestions,
  onDismiss,
  onFeedback,
  maxVisible = 5,
  className,
}: SuggestionListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(suggestions.length);

  // 當新建議加入時，震動提醒
  useEffect(() => {
    if (suggestions.length > prevLengthRef.current) {
      // 有新建議
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    prevLengthRef.current = suggestions.length;
  }, [suggestions.length]);

  // 只顯示最新的建議
  const visibleSuggestions = suggestions.slice(-maxVisible);

  if (visibleSuggestions.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-slate-400">
          AI 顧問正在監聽中，有建議時會顯示在這裡
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('space-y-3', className)}>
      {visibleSuggestions.map((suggestion, index) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onDismiss={onDismiss ? () => onDismiss(suggestion.id) : undefined}
          onFeedback={
            onFeedback
              ? (feedback) => onFeedback(suggestion.id, feedback)
              : undefined
          }
          className={cn(
            // 最新的建議有特殊效果
            index === visibleSuggestions.length - 1 && 'animate-shake'
          )}
        />
      ))}
    </div>
  );
}

export default SuggestionList;
