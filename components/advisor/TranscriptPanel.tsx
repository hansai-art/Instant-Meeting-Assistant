'use client';

// ============================================
// 可折疊對話紀錄面板
// ============================================

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscriptionSegment } from '@/lib/types';

interface TranscriptPanelProps {
  segments: TranscriptionSegment[];
  maxHeight?: number;
  defaultExpanded?: boolean;
  className?: string;
}

export function TranscriptPanel({
  segments,
  maxHeight = 200,
  defaultExpanded = false,
  className,
}: TranscriptPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  // 自動滾動到底部
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [segments, isExpanded]);

  const finalSegments = segments.filter((s) => s.isFinal);
  const latestSegment = segments[segments.length - 1];

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="collapsible-header w-full"
        data-state={isExpanded ? 'open' : 'closed'}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium">對話紀錄</span>
          <span className="text-xs text-slate-500">
            ({finalSegments.length} 條)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          ref={contentRef}
          className="collapsible-content"
          style={{ maxHeight }}
        >
          <div className="p-3 space-y-2">
            {finalSegments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                開始說話後，對話內容會顯示在這裡
              </p>
            ) : (
              finalSegments.map((segment) => (
                <TranscriptLine key={segment.id} segment={segment} />
              ))
            )}

            {/* 顯示臨時結果 */}
            {latestSegment && !latestSegment.isFinal && (
              <TranscriptLine segment={latestSegment} isInterim />
            )}
          </div>
        </div>
      )}

      {/* 未展開時顯示最新一條 */}
      {!isExpanded && latestSegment && (
        <div className="mt-2 px-4 py-2 bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-300 truncate">
            {latestSegment.text}
          </p>
        </div>
      )}
    </div>
  );
}

interface TranscriptLineProps {
  segment: TranscriptionSegment;
  isInterim?: boolean;
}

function TranscriptLine({ segment, isInterim = false }: TranscriptLineProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'transcript-line rounded-lg',
        isInterim ? 'interim bg-slate-700/30' : 'final'
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs text-slate-500 shrink-0">
          {formatTime(segment.timestamp)}
        </span>
        <p className={cn('flex-1', isInterim && 'italic text-slate-400')}>
          {segment.text}
          {isInterim && <span className="animate-pulse">...</span>}
        </p>
      </div>
    </div>
  );
}

export default TranscriptPanel;
