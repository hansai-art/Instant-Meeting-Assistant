// ============================================
// 話術範本 Store (P2)
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SpeechTemplate, TemplateCategory, MeetingMode } from '../types';
import { DEFAULT_TEMPLATES } from '../constants/templates';

interface TemplateState {
  // 範本列表
  templates: SpeechTemplate[];

  // 最近使用
  recentlyUsed: string[]; // template ids

  // 收藏
  favorites: string[]; // template ids

  // 動作
  addTemplate: (template: Omit<SpeechTemplate, 'id'>) => void;
  updateTemplate: (id: string, updates: Partial<SpeechTemplate>) => void;
  deleteTemplate: (id: string) => void;

  markAsUsed: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // 查詢
  getTemplatesByCategory: (category: TemplateCategory) => SpeechTemplate[];
  getTemplatesByMode: (mode: MeetingMode) => SpeechTemplate[];
  searchTemplates: (query: string) => SpeechTemplate[];
  getFavoriteTemplates: () => SpeechTemplate[];
  getRecentTemplates: () => SpeechTemplate[];

  // 重置
  resetToDefaults: () => void;
}

const generateTemplateId = () => `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: DEFAULT_TEMPLATES,
      recentlyUsed: [],
      favorites: [],

      // ========== 範本管理 ==========

      addTemplate: (template) => {
        const newTemplate: SpeechTemplate = {
          ...template,
          id: generateTemplateId(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        // 不允許刪除預設範本
        const isDefault = DEFAULT_TEMPLATES.some((t) => t.id === id);
        if (isDefault) return;

        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          recentlyUsed: state.recentlyUsed.filter((tid) => tid !== id),
          favorites: state.favorites.filter((tid) => tid !== id),
        }));
      },

      // ========== 使用記錄 ==========

      markAsUsed: (id) => {
        set((state) => {
          const filtered = state.recentlyUsed.filter((tid) => tid !== id);
          return {
            recentlyUsed: [id, ...filtered].slice(0, 10), // 最多 10 個
          };
        });
      },

      toggleFavorite: (id) => {
        set((state) => {
          const isFavorite = state.favorites.includes(id);
          return {
            favorites: isFavorite
              ? state.favorites.filter((tid) => tid !== id)
              : [...state.favorites, id],
          };
        });
      },

      // ========== 查詢 ==========

      getTemplatesByCategory: (category) => {
        return get().templates.filter((t) => t.category === category);
      },

      getTemplatesByMode: (mode) => {
        return get().templates.filter((t) => t.mode.includes(mode));
      },

      searchTemplates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().templates.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.content.toLowerCase().includes(lowerQuery) ||
            t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },

      getFavoriteTemplates: () => {
        const { templates, favorites } = get();
        return templates.filter((t) => favorites.includes(t.id));
      },

      getRecentTemplates: () => {
        const { templates, recentlyUsed } = get();
        return recentlyUsed
          .map((id) => templates.find((t) => t.id === id))
          .filter((t): t is SpeechTemplate => t !== undefined);
      },

      // ========== 重置 ==========

      resetToDefaults: () => {
        set({
          templates: DEFAULT_TEMPLATES,
          recentlyUsed: [],
          favorites: [],
        });
      },
    }),
    {
      name: 'meeting-advisor-templates',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// 選擇器
export const selectTemplates = (state: TemplateState) => state.templates;
export const selectFavorites = (state: TemplateState) => state.favorites;
export const selectRecentlyUsed = (state: TemplateState) => state.recentlyUsed;
