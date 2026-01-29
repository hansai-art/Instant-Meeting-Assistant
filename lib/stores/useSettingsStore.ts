// ============================================
// 用戶設定 Store
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  UserSettings,
  Theme,
  LLMProvider,
  MeetingMode,
  TriggerConfig,
  KeywordCategory,
} from '../types';
import { DEFAULT_USER_SETTINGS, DEFAULT_TRIGGER_CONFIG } from '../types';

interface SettingsState extends UserSettings {
  // 方便存取的屬性
  settings: UserSettings;
  hasCompletedOnboarding: boolean;

  // 動作
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  setLLMProvider: (provider: LLMProvider) => void;
  setLLMModel: (model: string) => void;

  setDefaultMode: (mode: MeetingMode) => void;
  setRetentionDays: (days: 7 | 30 | 90 | -1) => void;

  // 觸發設定
  setTriggerConfig: (config: Partial<TriggerConfig>) => void;
  updateTriggers: (config: Partial<TriggerConfig>) => void;
  toggleKeywordCategory: (category: KeywordCategory) => void;
  setKeywordThrottle: (ms: number) => void;
  setTimerInterval: (ms: number) => void;
  setSilenceThreshold: (ms: number) => void;

  // TTS 設定
  setTTSEnabled: (enabled: boolean) => void;
  setTTSVoice: (voice: string) => void;
  setTTSRate: (rate: number) => void;

  // 引導
  completeOnboarding: () => void;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // 重置
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // 初始值
      ...DEFAULT_USER_SETTINGS,

      // 方便存取的屬性 (getter)
      get settings() {
        const state = get();
        return {
          theme: state.theme,
          llmProvider: state.llmProvider,
          llmModel: state.llmModel,
          defaultMode: state.defaultMode,
          triggers: state.triggers,
          retentionDays: state.retentionDays,
          onboardingCompleted: state.onboardingCompleted,
          ttsEnabled: state.ttsEnabled,
          ttsVoice: state.ttsVoice,
          ttsRate: state.ttsRate,
        };
      },
      get hasCompletedOnboarding() {
        return get().onboardingCompleted;
      },

      // 主題
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark',
      })),

      // LLM
      setLLMProvider: (provider) => set({ llmProvider: provider }),
      setLLMModel: (model) => set({ llmModel: model }),

      // 會議模式
      setDefaultMode: (mode) => set({ defaultMode: mode }),

      // 資料保留
      setRetentionDays: (days) => set({ retentionDays: days }),

      // 觸發設定
      setTriggerConfig: (config) => set((state) => ({
        triggers: { ...state.triggers, ...config },
      })),

      updateTriggers: (config) => set((state) => ({
        triggers: { ...state.triggers, ...config },
      })),

      toggleKeywordCategory: (category) => set((state) => {
        const categories = state.triggers.keywordCategories;
        const newCategories = categories.includes(category)
          ? categories.filter((c) => c !== category)
          : [...categories, category];
        return {
          triggers: {
            ...state.triggers,
            keywordCategories: newCategories,
          },
        };
      }),

      setKeywordThrottle: (ms) => set((state) => ({
        triggers: { ...state.triggers, keywordThrottle: ms },
      })),

      setTimerInterval: (ms) => set((state) => ({
        triggers: { ...state.triggers, timerInterval: ms },
      })),

      setSilenceThreshold: (ms) => set((state) => ({
        triggers: { ...state.triggers, silenceThreshold: ms },
      })),

      // TTS
      setTTSEnabled: (enabled) => set({ ttsEnabled: enabled }),
      setTTSVoice: (voice) => set({ ttsVoice: voice }),
      setTTSRate: (rate) => set({ ttsRate: rate }),

      // 引導
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setHasCompletedOnboarding: (completed) => set({ onboardingCompleted: completed }),

      // 重置
      resetSettings: () => set(DEFAULT_USER_SETTINGS),
    }),
    {
      name: 'meeting-advisor-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

// 選擇器
export const selectTheme = (state: SettingsState) => state.theme;
export const selectLLMConfig = (state: SettingsState) => ({
  provider: state.llmProvider,
  model: state.llmModel,
});
export const selectTriggerConfig = (state: SettingsState) => state.triggers;
export const selectOnboardingCompleted = (state: SettingsState) => state.onboardingCompleted;
