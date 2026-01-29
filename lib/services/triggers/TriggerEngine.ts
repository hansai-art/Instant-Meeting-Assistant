// ============================================
// 觸發引擎核心
// ============================================

import type { TriggerType, KeywordCategory, TriggerConfig } from '../../types';
import { detectKeywords } from '../../constants/keywords';

export interface TriggerEvent {
  type: TriggerType;
  category?: KeywordCategory;
  keyword?: string;
  timestamp: number;
}

export interface TriggerEngineCallbacks {
  onTrigger: (event: TriggerEvent) => void;
  onSilenceStart?: () => void;
  onSilenceEnd?: () => void;
}

export class TriggerEngine {
  private config: TriggerConfig;
  private callbacks: TriggerEngineCallbacks;

  // 計時器
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private silenceTimeout: ReturnType<typeof setTimeout> | null = null;

  // 狀態追蹤
  private lastKeywordTriggers: Map<KeywordCategory, number> = new Map();
  private lastTimerTrigger: number = 0;
  private lastSilenceTrigger: number = 0;
  private lastSpeechTime: number = Date.now();
  private isInSilence: boolean = false;
  private isRunning: boolean = false;

  constructor(config: TriggerConfig, callbacks: TriggerEngineCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /** 啟動觸發引擎 */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastSpeechTime = Date.now();
    this.lastTimerTrigger = Date.now();

    // 啟動定時觸發
    if (this.config.timerEnabled) {
      this.startTimerTrigger();
    }

    // 啟動沉默偵測
    if (this.config.silenceEnabled) {
      this.startSilenceDetection();
    }
  }

  /** 停止觸發引擎 */
  stop(): void {
    this.isRunning = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  /** 暫停觸發引擎 */
  pause(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  /** 繼續觸發引擎 */
  resume(): void {
    if (!this.isRunning) return;

    this.lastSpeechTime = Date.now();

    if (this.config.timerEnabled && !this.timerInterval) {
      this.startTimerTrigger();
    }

    if (this.config.silenceEnabled) {
      this.startSilenceDetection();
    }
  }

  /** 更新設定 */
  updateConfig(config: Partial<TriggerConfig>): void {
    this.config = { ...this.config, ...config };

    // 重新啟動計時器
    if (this.isRunning) {
      this.pause();
      this.resume();
    }
  }

  /** 處理新的轉錄文字 */
  processTranscription(text: string): void {
    if (!this.isRunning) return;

    // 更新最後語音時間
    this.lastSpeechTime = Date.now();

    // 結束沉默狀態
    if (this.isInSilence) {
      this.isInSilence = false;
      this.callbacks.onSilenceEnd?.();
    }

    // 重置沉默偵測
    this.resetSilenceDetection();

    // 關鍵詞觸發
    if (this.config.keywordEnabled) {
      this.checkKeywordTrigger(text);
    }
  }

  /** 檢查關鍵詞觸發 */
  private checkKeywordTrigger(text: string): void {
    const detected = detectKeywords(text, this.config.keywordCategories);

    for (const { category, keyword } of detected) {
      // 檢查冷卻時間
      const lastTrigger = this.lastKeywordTriggers.get(category) || 0;
      const elapsed = Date.now() - lastTrigger;

      if (elapsed >= this.config.keywordThrottle) {
        // 觸發
        this.lastKeywordTriggers.set(category, Date.now());
        this.callbacks.onTrigger({
          type: 'keyword',
          category,
          keyword,
          timestamp: Date.now(),
        });
        break; // 每次只觸發一個關鍵詞
      }
    }
  }

  /** 啟動定時觸發 */
  private startTimerTrigger(): void {
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;

      const elapsed = Date.now() - this.lastTimerTrigger;
      if (elapsed >= this.config.timerInterval) {
        this.lastTimerTrigger = Date.now();
        this.callbacks.onTrigger({
          type: 'timer',
          timestamp: Date.now(),
        });
      }
    }, 1000); // 每秒檢查一次
  }

  /** 啟動沉默偵測 */
  private startSilenceDetection(): void {
    this.resetSilenceDetection();
  }

  /** 重置沉默偵測 */
  private resetSilenceDetection(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }

    if (!this.config.silenceEnabled || !this.isRunning) return;

    this.silenceTimeout = setTimeout(() => {
      if (!this.isRunning) return;

      // 進入沉默狀態
      if (!this.isInSilence) {
        this.isInSilence = true;
        this.callbacks.onSilenceStart?.();
      }

      // 檢查是否可以觸發沉默事件
      const elapsed = Date.now() - this.lastSilenceTrigger;
      if (elapsed >= this.config.silenceThreshold * 2) {
        // 至少要間隔閾值的 2 倍
        this.lastSilenceTrigger = Date.now();
        this.callbacks.onTrigger({
          type: 'silence',
          timestamp: Date.now(),
        });
      }
    }, this.config.silenceThreshold);
  }

  /** 取得引擎狀態 */
  getStatus(): {
    isRunning: boolean;
    isInSilence: boolean;
    lastSpeechTime: number;
    lastTimerTrigger: number;
  } {
    return {
      isRunning: this.isRunning,
      isInSilence: this.isInSilence,
      lastSpeechTime: this.lastSpeechTime,
      lastTimerTrigger: this.lastTimerTrigger,
    };
  }
}
