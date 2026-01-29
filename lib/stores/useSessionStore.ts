// ============================================
// 會議 Session Store
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  MeetingSession,
  SessionStatus,
  MeetingMode,
  TranscriptionSegment,
  Suggestion,
  SessionStats,
  SuggestionKind,
} from '../types';

interface SessionState {
  // 當前 Session
  currentSession: MeetingSession | null;

  // 歷史 Sessions
  sessions: MeetingSession[];

  // 計時器
  elapsedTime: number; // 毫秒

  // 方便存取的屬性 (從 currentSession 導出)
  status: SessionStatus;
  mode: MeetingMode;
  segments: TranscriptionSegment[];
  suggestions: Suggestion[];

  // 動作 - Session 管理
  startSession: (mode: MeetingMode, context?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  setSessionContext: (context: string) => void;
  setSessionMode: (mode: MeetingMode) => void;

  // 動作 - 轉錄
  addTranscriptionSegment: (segment: TranscriptionSegment) => void;
  updateTranscriptionSegment: (id: string, segment: Partial<TranscriptionSegment>) => void;
  clearTranscription: () => void;

  // 動作 - 建議
  addSuggestion: (suggestion: Suggestion) => void;
  markSuggestionAsRead: (id: string) => void;
  setSuggestionFeedback: (id: string, feedback: 'helpful' | 'not_helpful') => void;
  clearSuggestions: () => void;
  removeSuggestion: (id: string) => void;
  updateSuggestion: (id: string, updates: Partial<Suggestion>) => void;

  // 動作 - 計時
  updateElapsedTime: (time: number) => void;
  setElapsedTime: (time: number) => void;

  // 動作 - 狀態設定
  setStatus: (status: SessionStatus) => void;
  setMode: (mode: MeetingMode) => void;
  addSegment: (segment: TranscriptionSegment) => void;
  resetSession: () => void;

  // 動作 - 歷史
  deleteSession: (id: string) => void;
  clearAllSessions: () => void;
  getSession: (id: string) => MeetingSession | undefined;

  // 計算
  getSessionStats: (sessionId?: string) => SessionStats | null;
  getRecentTranscription: (seconds: number) => string;
}

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const generateSuggestionId = () => `suggestion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [],
      elapsedTime: 0,

      // 方便存取的屬性（getter 函數計算）
      get status() {
        return get().currentSession?.status || 'idle';
      },
      get mode() {
        return get().currentSession?.mode || 'general';
      },
      get segments() {
        return get().currentSession?.transcriptionSegments || [];
      },
      get suggestions() {
        return get().currentSession?.suggestions || [];
      },

      // ========== Session 管理 ==========

      startSession: (mode, context) => {
        const newSession: MeetingSession = {
          id: generateSessionId(),
          status: 'recording',
          mode,
          startTime: new Date().toISOString(),
          duration: 0,
          context,
          transcriptionSegments: [],
          suggestions: [],
        };
        set({
          currentSession: newSession,
          elapsedTime: 0,
        });
      },

      pauseSession: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, status: 'paused' as SessionStatus }
            : null,
        }));
      },

      resumeSession: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, status: 'recording' as SessionStatus }
            : null,
        }));
      },

      stopSession: () => {
        const { currentSession, sessions, elapsedTime } = get();
        if (!currentSession) return;

        const completedSession: MeetingSession = {
          ...currentSession,
          status: 'stopped',
          endTime: new Date().toISOString(),
          duration: elapsedTime,
        };

        set({
          currentSession: null,
          sessions: [completedSession, ...sessions].slice(0, 100), // 最多保留 100 個 session
          elapsedTime: 0,
        });
      },

      setSessionContext: (context) => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, context }
            : null,
        }));
      },

      setSessionMode: (mode) => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, mode }
            : null,
        }));
      },

      // ========== 轉錄 ==========

      addTranscriptionSegment: (segment) => {
        set((state) => {
          if (!state.currentSession) return state;

          const segments = state.currentSession.transcriptionSegments;
          const existingIndex = segments.findIndex((s) => s.id === segment.id);

          let newSegments: TranscriptionSegment[];
          if (existingIndex !== -1) {
            // 更新現有段落（interim → final）
            newSegments = [...segments];
            newSegments[existingIndex] = segment;
          } else {
            // 新增段落
            newSegments = [...segments, segment];
          }

          // 限制最大段落數（防止記憶體溢出）
          if (newSegments.length > 1000) {
            newSegments = newSegments.slice(-1000);
          }

          return {
            currentSession: {
              ...state.currentSession,
              transcriptionSegments: newSegments,
            },
          };
        });
      },

      updateTranscriptionSegment: (id, updates) => {
        set((state) => {
          if (!state.currentSession) return state;

          const segments = state.currentSession.transcriptionSegments.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );

          return {
            currentSession: {
              ...state.currentSession,
              transcriptionSegments: segments,
            },
          };
        });
      },

      clearTranscription: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, transcriptionSegments: [] }
            : null,
        }));
      },

      // ========== 建議 ==========

      addSuggestion: (suggestion) => {
        set((state) => {
          if (!state.currentSession) return state;

          const newSuggestion = {
            ...suggestion,
            id: suggestion.id || generateSuggestionId(),
          };

          return {
            currentSession: {
              ...state.currentSession,
              suggestions: [...state.currentSession.suggestions, newSuggestion],
            },
          };
        });
      },

      markSuggestionAsRead: (id) => {
        set((state) => {
          if (!state.currentSession) return state;

          const suggestions = state.currentSession.suggestions.map((s) =>
            s.id === id ? { ...s, isRead: true } : s
          );

          return {
            currentSession: {
              ...state.currentSession,
              suggestions,
            },
          };
        });
      },

      setSuggestionFeedback: (id, feedback) => {
        set((state) => {
          if (!state.currentSession) return state;

          const suggestions = state.currentSession.suggestions.map((s) =>
            s.id === id ? { ...s, feedback } : s
          );

          return {
            currentSession: {
              ...state.currentSession,
              suggestions,
            },
          };
        });
      },

      clearSuggestions: () => {
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, suggestions: [] }
            : null,
        }));
      },

      removeSuggestion: (id) => {
        set((state) => {
          if (!state.currentSession) return state;

          const suggestions = state.currentSession.suggestions.filter((s) => s.id !== id);

          return {
            currentSession: {
              ...state.currentSession,
              suggestions,
            },
          };
        });
      },

      updateSuggestion: (id, updates) => {
        set((state) => {
          if (!state.currentSession) return state;

          const suggestions = state.currentSession.suggestions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );

          return {
            currentSession: {
              ...state.currentSession,
              suggestions,
            },
          };
        });
      },

      // ========== 計時 ==========

      updateElapsedTime: (time) => {
        set({ elapsedTime: time });
      },

      setElapsedTime: (time) => {
        set({ elapsedTime: time });
      },

      // ========== 狀態設定 ==========

      setStatus: (status) => {
        set((state) => {
          if (!state.currentSession) {
            // 如果沒有當前 session，創建一個新的
            if (status === 'recording' || status === 'paused') {
              return {
                currentSession: {
                  id: generateSessionId(),
                  status,
                  mode: 'general',
                  startTime: new Date().toISOString(),
                  duration: 0,
                  transcriptionSegments: [],
                  suggestions: [],
                },
              };
            }
            return state;
          }
          return {
            currentSession: { ...state.currentSession, status },
          };
        });
      },

      setMode: (mode) => {
        set((state) => {
          if (!state.currentSession) {
            return {
              currentSession: {
                id: generateSessionId(),
                status: 'idle',
                mode,
                startTime: new Date().toISOString(),
                duration: 0,
                transcriptionSegments: [],
                suggestions: [],
              },
            };
          }
          return {
            currentSession: { ...state.currentSession, mode },
          };
        });
      },

      addSegment: (segment) => {
        get().addTranscriptionSegment(segment);
      },

      resetSession: () => {
        set({
          currentSession: null,
          elapsedTime: 0,
        });
      },

      // ========== 歷史 ==========

      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      clearAllSessions: () => {
        set({ sessions: [] });
      },

      getSession: (id) => {
        const { sessions, currentSession } = get();
        if (currentSession?.id === id) return currentSession;
        return sessions.find((s) => s.id === id);
      },

      // ========== 計算 ==========

      getSessionStats: (sessionId) => {
        const { currentSession, sessions } = get();
        const session = sessionId
          ? sessions.find((s) => s.id === sessionId) || currentSession
          : currentSession;

        if (!session) return null;

        const suggestionsByType: Record<SuggestionKind, number> = {
          tactical: 0,
          warning: 0,
          opportunity: 0,
          clarify: 0,
          positive: 0,
        };

        let keywordTriggerCount = 0;
        let timerTriggerCount = 0;
        let silenceTriggerCount = 0;
        let helpfulSuggestions = 0;
        let notHelpfulSuggestions = 0;

        for (const suggestion of session.suggestions) {
          suggestionsByType[suggestion.type]++;

          switch (suggestion.trigger) {
            case 'keyword':
              keywordTriggerCount++;
              break;
            case 'timer':
              timerTriggerCount++;
              break;
            case 'silence':
              silenceTriggerCount++;
              break;
          }

          if (suggestion.feedback === 'helpful') helpfulSuggestions++;
          if (suggestion.feedback === 'not_helpful') notHelpfulSuggestions++;
        }

        return {
          totalDuration: session.duration,
          segmentCount: session.transcriptionSegments.length,
          suggestionCount: session.suggestions.length,
          suggestionsByType,
          keywordTriggerCount,
          timerTriggerCount,
          silenceTriggerCount,
          helpfulSuggestions,
          notHelpfulSuggestions,
        };
      },

      getRecentTranscription: (seconds) => {
        const { currentSession } = get();
        if (!currentSession) return '';

        const now = Date.now();
        const cutoff = now - seconds * 1000;

        const recentSegments = currentSession.transcriptionSegments.filter(
          (segment) => new Date(segment.timestamp).getTime() >= cutoff
        );

        return recentSegments.map((s) => s.text).join(' ');
      },
    }),
    {
      name: 'meeting-advisor-sessions',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        // 只持久化歷史 sessions，不持久化當前 session
        sessions: state.sessions,
      }),
    }
  )
);

// 選擇器
export const selectCurrentSession = (state: SessionState) => state.currentSession;
export const selectSessionStatus = (state: SessionState) => state.currentSession?.status || 'idle';
export const selectIsRecording = (state: SessionState) => state.currentSession?.status === 'recording';
export const selectIsPaused = (state: SessionState) => state.currentSession?.status === 'paused';
export const selectTranscriptionSegments = (state: SessionState) =>
  state.currentSession?.transcriptionSegments || [];
export const selectSuggestions = (state: SessionState) =>
  state.currentSession?.suggestions || [];
export const selectUnreadSuggestions = (state: SessionState) =>
  state.currentSession?.suggestions.filter((s) => !s.isRead) || [];
export const selectElapsedTime = (state: SessionState) => state.elapsedTime;
export const selectSessions = (state: SessionState) => state.sessions;
