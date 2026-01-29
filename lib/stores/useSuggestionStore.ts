// ============================================
// AI 建議 Store（觸發與分析狀態）
// ============================================

import { create } from 'zustand';
import type {
  TriggerType,
  KeywordCategory,
  SuggestionKind,
} from '../types';

interface TriggerState {
  type: TriggerType;
  category?: KeywordCategory;
  keyword?: string;
  timestamp: number;
}

interface SuggestionState {
  // 觸發狀態
  lastTriggers: Record<KeywordCategory, number>; // 各類別最後觸發時間
  lastTimerTrigger: number;
  lastSilenceTrigger: number;
  lastSpeechTime: number; // 最後有語音的時間

  // 分析狀態
  isAnalyzing: boolean;
  isProcessing: boolean; // 方便存取的別名
  analysisError: string | null;
  pendingTrigger: TriggerState | null;

  // 靜音偵測
  silenceStartTime: number | null;

  // 動作 - 觸發記錄
  recordKeywordTrigger: (category: KeywordCategory) => void;
  recordTimerTrigger: () => void;
  recordSilenceTrigger: () => void;
  recordSpeech: () => void;

  // 動作 - 方便存取
  setLastTriggerTime: (type: TriggerType, time: number) => void;
  setIsProcessing: (processing: boolean) => void;

  // 動作 - 檢查是否可以觸發
  canTriggerKeyword: (category: KeywordCategory, throttleMs: number) => boolean;
  canTriggerTimer: (intervalMs: number) => boolean;
  canTriggerSilence: (thresholdMs: number) => boolean;

  // 動作 - 分析狀態
  startAnalysis: (trigger: TriggerState) => void;
  finishAnalysis: () => void;
  setAnalysisError: (error: string) => void;
  clearAnalysisError: () => void;

  // 動作 - 靜音偵測
  startSilence: () => void;
  endSilence: () => void;
  getSilenceDuration: () => number;

  // 重置
  reset: () => void;
}

const createInitialState = () => ({
  lastTriggers: {
    price: 0,
    deadline: 0,
    commitment: 0,
    objection: 0,
    competitor: 0,
  } as Record<KeywordCategory, number>,
  lastTimerTrigger: 0,
  lastSilenceTrigger: 0,
  lastSpeechTime: Date.now(),
  isAnalyzing: false,
  analysisError: null,
  pendingTrigger: null,
  silenceStartTime: null,
});

export const useSuggestionStore = create<SuggestionState>()((set, get) => ({
  ...createInitialState(),

  // 方便存取的別名 (getter)
  get isProcessing() {
    return get().isAnalyzing;
  },

  // ========== 方便存取的動作 ==========

  setLastTriggerTime: (type, time) => {
    switch (type) {
      case 'keyword':
        // 對於 keyword 類型，我們更新所有類別的時間
        set((state) => ({
          lastTriggers: Object.keys(state.lastTriggers).reduce((acc, key) => {
            acc[key as KeywordCategory] = time;
            return acc;
          }, {} as Record<KeywordCategory, number>),
        }));
        break;
      case 'timer':
        set({ lastTimerTrigger: time });
        break;
      case 'silence':
        set({ lastSilenceTrigger: time });
        break;
    }
  },

  setIsProcessing: (processing) => {
    set({ isAnalyzing: processing });
  },

  // ========== 觸發記錄 ==========

  recordKeywordTrigger: (category) => {
    set((state) => ({
      lastTriggers: {
        ...state.lastTriggers,
        [category]: Date.now(),
      },
    }));
  },

  recordTimerTrigger: () => {
    set({ lastTimerTrigger: Date.now() });
  },

  recordSilenceTrigger: () => {
    set({ lastSilenceTrigger: Date.now() });
  },

  recordSpeech: () => {
    set({
      lastSpeechTime: Date.now(),
      silenceStartTime: null,
    });
  },

  // ========== 檢查是否可以觸發 ==========

  canTriggerKeyword: (category, throttleMs) => {
    const { lastTriggers, isAnalyzing } = get();
    if (isAnalyzing) return false;

    const lastTrigger = lastTriggers[category];
    return Date.now() - lastTrigger >= throttleMs;
  },

  canTriggerTimer: (intervalMs) => {
    const { lastTimerTrigger, isAnalyzing } = get();
    if (isAnalyzing) return false;

    return Date.now() - lastTimerTrigger >= intervalMs;
  },

  canTriggerSilence: (thresholdMs) => {
    const { lastSilenceTrigger, silenceStartTime, isAnalyzing } = get();
    if (isAnalyzing) return false;
    if (!silenceStartTime) return false;

    const silenceDuration = Date.now() - silenceStartTime;
    const timeSinceLastTrigger = Date.now() - lastSilenceTrigger;

    // 沉默持續超過閾值，且距離上次沉默觸發超過閾值的 2 倍
    return silenceDuration >= thresholdMs && timeSinceLastTrigger >= thresholdMs * 2;
  },

  // ========== 分析狀態 ==========

  startAnalysis: (trigger) => {
    set({
      isAnalyzing: true,
      pendingTrigger: trigger,
      analysisError: null,
    });
  },

  finishAnalysis: () => {
    set({
      isAnalyzing: false,
      pendingTrigger: null,
    });
  },

  setAnalysisError: (error) => {
    set({
      isAnalyzing: false,
      analysisError: error,
      pendingTrigger: null,
    });
  },

  clearAnalysisError: () => {
    set({ analysisError: null });
  },

  // ========== 靜音偵測 ==========

  startSilence: () => {
    const { silenceStartTime } = get();
    if (silenceStartTime === null) {
      set({ silenceStartTime: Date.now() });
    }
  },

  endSilence: () => {
    set({ silenceStartTime: null });
  },

  getSilenceDuration: () => {
    const { silenceStartTime } = get();
    if (silenceStartTime === null) return 0;
    return Date.now() - silenceStartTime;
  },

  // ========== 重置 ==========

  reset: () => {
    set(createInitialState());
  },
}));

// 選擇器
export const selectIsAnalyzing = (state: SuggestionState) => state.isAnalyzing;
export const selectAnalysisError = (state: SuggestionState) => state.analysisError;
export const selectPendingTrigger = (state: SuggestionState) => state.pendingTrigger;
export const selectSilenceDuration = (state: SuggestionState) => {
  if (state.silenceStartTime === null) return 0;
  return Date.now() - state.silenceStartTime;
};
