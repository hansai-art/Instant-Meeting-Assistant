// ============================================
// TTS 語音朗讀服務 (P2)
// ============================================

/**
 * TTS 服務類別
 * 使用 Web Speech API 進行語音合成
 */
export class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  /**
   * 載入可用的語音
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    // 語音可能異步載入
    const loadVoicesHandler = () => {
      this.voices = this.synthesis!.getVoices();
      this.selectDefaultVoice();
      this.isInitialized = true;
    };

    // 立即嘗試載入
    loadVoicesHandler();

    // 監聽語音變更事件
    this.synthesis.onvoiceschanged = loadVoicesHandler;
  }

  /**
   * 選擇預設語音（優先中文）
   */
  private selectDefaultVoice(): void {
    // 優先選擇繁體中文
    this.selectedVoice =
      this.voices.find((v) => v.lang === 'zh-TW') ||
      this.voices.find((v) => v.lang.startsWith('zh')) ||
      this.voices.find((v) => v.lang.startsWith('en')) ||
      this.voices[0] ||
      null;
  }

  /**
   * 取得可用語音列表
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * 取得中文語音列表
   */
  getChineseVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter((v) => v.lang.startsWith('zh'));
  }

  /**
   * 設定語音
   */
  setVoice(voiceName: string): boolean {
    const voice = this.voices.find((v) => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      return true;
    }
    return false;
  }

  /**
   * 取得當前選擇的語音
   */
  getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  /**
   * 檢查 TTS 是否可用
   */
  isAvailable(): boolean {
    return this.synthesis !== null && this.isInitialized;
  }

  /**
   * 朗讀文字
   */
  speak(
    text: string,
    options?: {
      rate?: number; // 0.1 - 10, 預設 1
      pitch?: number; // 0 - 2, 預設 1
      volume?: number; // 0 - 1, 預設 1
      onEnd?: () => void;
      onError?: (error: SpeechSynthesisErrorEvent) => void;
    }
  ): boolean {
    if (!this.synthesis || !this.selectedVoice) {
      console.warn('TTS not available');
      return false;
    }

    // 停止任何正在進行的朗讀
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.selectedVoice;
    utterance.rate = options?.rate ?? 1;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    if (options?.onError) {
      utterance.onerror = options.onError;
    }

    this.synthesis.speak(utterance);
    return true;
  }

  /**
   * 停止朗讀
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * 暫停朗讀
   */
  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  /**
   * 繼續朗讀
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * 檢查是否正在朗讀
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * 檢查是否暫停中
   */
  isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }
}

// 單例實例
let ttsInstance: TTSService | null = null;

/**
 * 取得 TTS 服務實例
 */
export function getTTSService(): TTSService {
  if (!ttsInstance) {
    ttsInstance = new TTSService();
  }
  return ttsInstance;
}

/**
 * 朗讀建議內容
 */
export function speakSuggestion(content: string): boolean {
  const tts = getTTSService();
  return tts.speak(content, {
    rate: 1.1, // 稍快一點
  });
}

/**
 * 停止朗讀
 */
export function stopSpeaking(): void {
  const tts = getTTSService();
  tts.stop();
}

/**
 * 取得可用語音列表
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  const tts = getTTSService();
  return tts.getVoices();
}

/**
 * 朗讀文字
 * @param text 要朗讀的文字
 * @param voiceName 語音名稱（可選）
 * @param rate 語速（可選，0.1-10）
 */
export function speakText(text: string, voiceName?: string, rate?: number): boolean {
  const tts = getTTSService();

  if (voiceName) {
    tts.setVoice(voiceName);
  }

  return tts.speak(text, {
    rate: rate ?? 1,
  });
}
