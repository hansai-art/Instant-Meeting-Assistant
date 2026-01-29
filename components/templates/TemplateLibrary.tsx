'use client';

// ============================================
// 話術範本庫 (P2)
// ============================================

import { useState, useMemo } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplateStore } from '@/lib/stores/useTemplateStore';
import { TemplateCard } from './TemplateCard';
import type { SpeechTemplate, TemplateCategory } from '@/lib/types';

interface TemplateLibraryProps {
  onClose: () => void;
  onSelect?: (template: SpeechTemplate) => void;
}

const categoryLabels: Record<TemplateCategory, string> = {
  opening: '開場白',
  objection: '異議處理',
  closing: '收尾話術',
  follow_up: '追問技巧',
  price_negotiation: '價格談判',
};

export function TemplateLibrary({ onClose, onSelect }: TemplateLibraryProps) {
  const { templates, favorites, toggleFavorite } = useTemplateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all' | 'favorites'>('all');

  const categories: (TemplateCategory | 'all' | 'favorites')[] = [
    'all',
    'favorites',
    'opening',
    'objection',
    'closing',
    'follow_up',
    'price_negotiation',
  ];

  const filteredTemplates = useMemo(() => {
    let result = templates;

    // 類別過濾
    if (selectedCategory === 'favorites') {
      result = result.filter((t) => favorites.includes(t.id));
    } else if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // 搜尋過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [templates, selectedCategory, searchQuery, favorites]);

  const handleCopy = (template: SpeechTemplate) => {
    navigator.clipboard.writeText(template.content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold">話術範本庫</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 搜尋和篩選 */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          {/* 搜尋框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋範本..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* 類別標籤 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  selectedCategory === cat
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                )}
              >
                {cat === 'all'
                  ? '全部'
                  : cat === 'favorites'
                    ? '收藏'
                    : categoryLabels[cat]}
                {cat === 'favorites' && favorites.length > 0 && (
                  <span className="ml-1">({favorites.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 範本列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                {selectedCategory === 'favorites'
                  ? '尚未收藏任何範本'
                  : '找不到符合條件的範本'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={favorites.includes(template.id)}
                  onToggleFavorite={() => toggleFavorite(template.id)}
                  onCopy={() => handleCopy(template)}
                  onSelect={onSelect ? () => onSelect(template) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateLibrary;
