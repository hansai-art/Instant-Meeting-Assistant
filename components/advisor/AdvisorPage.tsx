'use client';

// ============================================
// 即時會議 AI 顧問主頁面
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { Settings, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Components
import { ControlPanel } from './ControlPanel';
import { SessionTimer } from './SessionTimer';
import { ModeSelector } from './ModeSelector';
import { SuggestionList } from './SuggestionList';
import { TranscriptPanel } from './TranscriptPanel';
import { SettingsModal } from '../settings/SettingsModal';
import { ExportModal } from '../export/ExportModal';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';

// Stores
import { useSessionStore } from '@/lib/stores/useSessionStore';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { useSuggestionStore } from '@/lib/stores/useSuggestionStore';

// Services
import { TriggerEngine } from '@/lib/services/triggers/TriggerEngine';
import { speakText, stopSpeaking } from '@/lib/services/tts/speechSynthesis';

// Types
import type { MeetingMode, Suggestion, SuggestionKind, TriggerType, KeywordCategory } from '@/lib/types';

export function AdvisorPage() {
  // Stores
  const {
    status,
    mode,
    segments,
    suggestions,
    elapsedTime,
    setStatus,
    setMode,
    addSegment,
    addSuggestion,
    updateSuggestion,
    removeSuggestion,
    setElapsedTime,
    resetSession,
  } = useSessionStore();

  const {
    settings,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
  } = useSettingsStore();

  const {
    setLastTriggerTime,
    setIsProcessing,
    isProcessing,
  } = useSuggestionStore();

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const triggerEngineRef = useRef<TriggerEngine | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 檢查是否需要顯示引導流程
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [hasCompletedOnboarding]);

  // 處理觸發事件
  const handleTrigger = useCallback(async (
    type: TriggerType,
    context: { keyword?: string; duration?: number }
  ) => {
    if (isProcessing || status !== 'recording') return;

    setIsProcessing(true);
    setLastTriggerTime(type, Date.now());

    try {
      // 取得最近的對話內容
      const recentSegments = segments.slice(-10);
      const transcription = recentSegments.map(s => s.text).join(' ');

      if (!transcription.trim()) {
        setIsProcessing(false);
        return;
      }

      // 呼叫分析 API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          trigger: {
            type,
            keyword: context.keyword,
            duration: context.duration,
          },
          mode,
          provider: settings.llmProvider,
        }),
      });

      if (!response.ok) {
        throw new Error('分析請求失敗');
      }

      const result = await response.json() as {
        shouldAdvise?: boolean;
        suggestion?: {
          type: string;
          content: string;
        };
      };

      if (result.shouldAdvise && result.suggestion) {
        const newSuggestion: Suggestion = {
          id: `sug_${Date.now()}`,
          type: result.suggestion.type as SuggestionKind,
          content: result.suggestion.content,
          trigger: type,
          triggerContext: context.keyword || (context.duration ? `${context.duration}秒` : undefined),
          timestamp: new Date().toISOString(),
          isRead: false,
        };

        addSuggestion(newSuggestion);

        // TTS 朗讀建議
        if (settings.ttsEnabled) {
          speakText(newSuggestion.content, settings.ttsVoice, settings.ttsRate);
        }
      }
    } catch (err) {
      console.error('觸發分析錯誤:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    status,
    segments,
    mode,
    settings,
    addSuggestion,
    setIsProcessing,
    setLastTriggerTime,
  ]);

  // 初始化觸發引擎
  useEffect(() => {
    const config = {
      keywordEnabled: settings.triggers.keywordEnabled,
      keywordCategories: settings.triggers.keywordCategories,
      keywordThrottle: settings.triggers.keywordThrottle,
      timerEnabled: settings.triggers.timerEnabled,
      timerInterval: settings.triggers.timerInterval,
      silenceEnabled: settings.triggers.silenceEnabled,
      silenceThreshold: settings.triggers.silenceThreshold,
    };

    const callbacks = {
      onTrigger: (event: { type: TriggerType; keyword?: string; category?: KeywordCategory }) => {
        handleTrigger(event.type, { keyword: event.keyword });
      },
    };

    triggerEngineRef.current = new TriggerEngine(config, callbacks);

    return () => {
      triggerEngineRef.current?.stop();
    };
  }, [settings.triggers, handleTrigger]);

  // 連接 Deepgram WebSocket
  const connectDeepgram = useCallback(async () => {
    try {
      // 取得 token
      const tokenResponse = await fetch('/api/deepgram');
      if (!tokenResponse.ok) {
        throw new Error('無法取得 Deepgram token');
      }
      const { key } = await tokenResponse.json() as { key: string };

      // 建立 WebSocket 連接
      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?` +
        `model=nova-2&` +
        `language=zh-TW&` +
        `smart_format=true&` +
        `interim_results=true&` +
        `punctuate=true`
      );

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'Authorization', token: key }));
        console.log('Deepgram 連接成功');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.channel?.alternatives?.[0]?.transcript) {
            const transcript = data.channel.alternatives[0].transcript;
            const isFinal = data.is_final;

            if (transcript.trim()) {
              const now = Date.now();
              const segment = {
                id: `seg_${now}`,
                text: transcript,
                words: [],
                startTime: now,
                endTime: now,
                timestamp: new Date().toISOString(),
                isFinal,
              };

              addSegment(segment);

              // 傳送到觸發引擎
              if (isFinal && triggerEngineRef.current) {
                triggerEngineRef.current.processTranscription(transcript);
              }
            }
          }
        } catch (err) {
          console.error('解析 Deepgram 訊息錯誤:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('Deepgram WebSocket 錯誤:', event);
        setError('語音辨識連接錯誤');
      };

      ws.onclose = () => {
        console.log('Deepgram 連接關閉');
      };

      websocketRef.current = ws;
    } catch (err) {
      console.error('連接 Deepgram 失敗:', err);
      setError('無法連接語音辨識服務');
      throw err;
    }
  }, [addSegment]);

  // 開始錄音
  const handleStart = useCallback(async () => {
    setError(null);

    try {
      // 請求麥克風權限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // 連接 Deepgram
      await connectDeepgram();

      // 建立 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          websocketRef.current.send(event.data);
        }
      };

      mediaRecorder.start(250); // 每 250ms 傳送一次
      mediaRecorderRef.current = mediaRecorder;

      // 啟動觸發引擎
      triggerEngineRef.current?.start();

      setStatus('recording');
    } catch (err) {
      console.error('開始錄音失敗:', err);
      setError('無法存取麥克風，請確認權限設定');
    }
  }, [connectDeepgram, setStatus]);

  // 暫停錄音
  const handlePause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    triggerEngineRef.current?.pause();
    setStatus('paused');
  }, [setStatus]);

  // 繼續錄音
  const handleResume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    triggerEngineRef.current?.resume();
    setStatus('recording');
  }, [setStatus]);

  // 停止錄音
  const handleStop = useCallback(() => {
    // 停止 MediaRecorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // 關閉 WebSocket
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // 停止媒體串流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 停止觸發引擎
    triggerEngineRef.current?.stop();

    // 停止 TTS
    stopSpeaking();

    setStatus('stopped');
  }, [setStatus]);

  // 處理計時器
  const handleTimerTick = useCallback((time: number) => {
    setElapsedTime(time);
  }, [setElapsedTime]);

  // 處理模式變更
  const handleModeChange = useCallback((newMode: MeetingMode) => {
    setMode(newMode);
  }, [setMode]);

  // 處理建議關閉
  const handleDismissSuggestion = useCallback((id: string) => {
    removeSuggestion(id);
  }, [removeSuggestion]);

  // 處理建議回饋
  const handleFeedback = useCallback((id: string, feedback: 'helpful' | 'not_helpful') => {
    updateSuggestion(id, { feedback });
  }, [updateSuggestion]);

  // 處理引導完成
  const handleOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  }, [setHasCompletedOnboarding]);

  // 處理新會議
  const handleNewSession = useCallback(() => {
    resetSession();
  }, [resetSession]);

  const isActive = status === 'recording' || status === 'paused';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 首次引導 */}
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {/* 設定彈窗 */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* 匯出彈窗 */}
      {showExport && (
        <ExportModal
          segments={segments}
          suggestions={suggestions}
          mode={mode}
          elapsedTime={elapsedTime}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                AI 會議顧問
              </h1>
              <SessionTimer
                status={status}
                elapsedTime={elapsedTime}
                onTick={handleTimerTick}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* 匯出按鈕 */}
              {(status === 'stopped' || segments.length > 0) && (
                <button
                  onClick={() => setShowExport(true)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="匯出紀錄"
                >
                  <Download className="w-5 h-5 text-slate-400" />
                </button>
              )}

              {/* 設定按鈕 */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                title="設定"
              >
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* 會議模式選擇器（僅在未開始時顯示） */}
        {!isActive && status !== 'stopped' && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-slate-400 mb-3">會議模式</h2>
            <ModeSelector
              value={mode}
              onChange={handleModeChange}
              disabled={isActive}
            />
          </div>
        )}

        {/* 控制面板 */}
        <div className="mb-8">
          <ControlPanel
            status={status}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </div>

        {/* 會議結束後顯示新會議按鈕 */}
        {status === 'stopped' && (
          <div className="mb-8 text-center">
            <button
              onClick={handleNewSession}
              className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium transition-colors"
            >
              開始新會議
            </button>
          </div>
        )}

        {/* 建議區域 */}
        {isActive && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-400">AI 建議</h2>
              {isProcessing && (
                <span className="text-xs text-violet-400 animate-pulse">
                  分析中...
                </span>
              )}
            </div>
            <SuggestionList
              suggestions={suggestions}
              onDismiss={handleDismissSuggestion}
              onFeedback={handleFeedback}
            />
          </div>
        )}

        {/* 對話紀錄 */}
        {(isActive || status === 'stopped') && segments.length > 0 && (
          <div className="mb-8">
            <TranscriptPanel
              segments={segments}
              defaultExpanded={status === 'stopped'}
              maxHeight={300}
            />
          </div>
        )}

        {/* 會議摘要（停止後） */}
        {status === 'stopped' && segments.length > 0 && (
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-medium">會議摘要</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <span className="text-slate-500">會議時長：</span>
                {Math.floor(elapsedTime / 60000)} 分 {Math.floor((elapsedTime % 60000) / 1000)} 秒
              </p>
              <p>
                <span className="text-slate-500">對話段落：</span>
                {segments.filter(s => s.isFinal).length} 條
              </p>
              <p>
                <span className="text-slate-500">AI 建議：</span>
                {suggestions.length} 條
              </p>
              {suggestions.filter(s => s.feedback === 'helpful').length > 0 && (
                <p>
                  <span className="text-slate-500">有幫助的建議：</span>
                  {suggestions.filter(s => s.feedback === 'helpful').length} 條
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-2 text-center text-xs text-slate-600 bg-slate-900/80 backdrop-blur">
        即時會議 AI 顧問 - 您的對話不會被儲存到伺服器
      </footer>
    </div>
  );
}

export default AdvisorPage;
