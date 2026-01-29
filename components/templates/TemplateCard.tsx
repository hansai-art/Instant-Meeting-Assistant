'use client';

// ============================================
// 話術範本卡片 (P2)
// ============================================

import { useState } from 'react';
import { Copy, Heart, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpeechTemplate, TemplateCategory } from '@/lib/types';

interface TemplateCardProps {
  template: SpeechTemplate;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onCopy: () => void;
  onSelect?: () => void;
}

const categoryStyles: Record<TemplateCategory, { bg: string; text: string; label: string }> = {
  opening: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '開場白' },
  objection: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '異議處理' },
  closing: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '收尾話術' },
  follow_up: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: '追問技巧' },
  price_negotiation: { bg: 'bg-pink-500/20', text: 'text-pink-400', label: '價格談判' },
};

export function TemplateCard({
  template,
  isFavorite,
  onToggleFavorite,
  onCopy,
  onSelect,
}: TemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const style = categoryStyles[template.category];

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contentPreview = template.content.slice(0, 100);
  const hasMore = template.content.length > 100;

  return (
    <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                style.bg,
                style.text
              )}
            >
              {style.label}
            </span>
            {template.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-slate-500"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h3 className="font-medium text-sm">{template.title}</h3>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFavorite}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              isFavorite
                ? 'text-red-400 hover:bg-red-500/20'
                : 'text-slate-400 hover:bg-slate-600'
            )}
            title={isFavorite ? '取消收藏' : '加入收藏'}
          >
            <Heart
              className={cn('w-4 h-4', isFavorite && 'fill-current')}
            />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-600 transition-colors"
            title="複製到剪貼簿"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* 內容 */}
      <div className="text-sm text-slate-300">
        {isExpanded ? (
          <p className="whitespace-pre-wrap">{template.content}</p>
        ) : (
          <p>
            {contentPreview}
            {hasMore && '...'}
          </p>
        )}
      </div>

      {/* 展開/收合按鈕 */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              收合
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              展開全文
            </>
          )}
        </button>
      )}

      {/* 使用場景 */}
      {template.scenario && (
        <div className="mt-3 pt-3 border-t border-slate-600">
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">適用場景：</span>
            {template.scenario}
          </p>
        </div>
      )}

      {/* 選擇按鈕 */}
      {onSelect && (
        <button
          onClick={onSelect}
          className="w-full mt-3 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-sm font-medium hover:bg-violet-500/30 transition-colors"
        >
          使用此範本
        </button>
      )}
    </div>
  );
}

export default TemplateCard;
