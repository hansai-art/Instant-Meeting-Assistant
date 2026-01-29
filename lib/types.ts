// ============================================
// 即時會議 AI 顧問 - 類型定義
// ============================================

// ============ 原有類型 ============

export enum FLAGS {
  COPILOT = "copilot",
  SUMMERIZER = "summerizer",
}

export interface HistoryData {
  createdAt: string;
  data: string;
  tag: string;
}

export interface TranscriptionWord {
  word: string;
  punctuated_word?: string;
  start?: number;
  end?: number;
  confidence?: number;
  speaker?: number;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  words: TranscriptionWord[];
  startTime: number;
  endTime: number;
  confidence?: number;
  speaker?: number;
  isFinal: boolean;
  timestamp: string;
}

// ============ 新增類型 - AI 建議 ============

/** 建議類型 */
export type SuggestionKind =
  | 'tactical'    // 策略建議
  | 'warning'     // 風險提醒
  | 'opportunity' // 機會提示
  | 'clarify'     // 建議追問
  | 'positive';   // 正面回饋

/** 觸發類型 */
export type TriggerType =
  | 'keyword'  // 關鍵詞觸發
  | 'timer'    // 定時觸發
  | 'silence'; // 沉默觸發

/** 關鍵詞類別 */
export type KeywordCategory =
  | 'price'       // 價格相關
  | 'deadline'    // 時間期限
  | 'commitment'  // 承諾保證
  | 'objection'   // 異議疑慮
  | 'competitor'; // 競爭對手

/** AI 建議 */
export interface Suggestion {
  id: string;
  type: SuggestionKind;
  content: string;
  timestamp: string;
  trigger: TriggerType;
  triggerContext?: string;      // 觸發的上下文（例如：偵測到的關鍵詞）
  keywordCategory?: KeywordCategory;
  isRead: boolean;
  feedback?: 'helpful' | 'not_helpful';
}

/** AI 分析請求 */
export interface AnalyzeRequest {
  transcription: string;
  trigger: TriggerType;
  mode: MeetingMode;
  context?: string;
  recentSuggestions?: string[];
}

/** AI 分析回應 */
export interface AnalyzeResponse {
  shouldAdvise: boolean;
  type?: SuggestionKind;
  content?: string;
  triggerReason?: string;
}

// ============ 新增類型 - 會議模式 ============

/** 會議模式 */
export type MeetingMode =
  | 'negotiation' // 商業談判
  | 'interview'   // 面試
  | 'proposal'    // 客戶提案
  | 'general';    // 一般會議

/** 會議模式設定 */
export interface MeetingModeConfig {
  id: MeetingMode;
  name: string;
  description: string;
  icon: string;
  promptContext: string;
}

// ============ 新增類型 - LLM 服務 ============

/** LLM 供應商 */
export type LLMProvider = 'claude' | 'openai' | 'groq';

/** LLM 設定 */
export interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

/** LLM 供應商資訊 */
export interface LLMProviderInfo {
  id: LLMProvider;
  name: string;
  description: string;
  models: string[];
  defaultModel: string;
}

// ============ 新增類型 - 會議 Session ============

/** 會議 Session 狀態 */
export type SessionStatus =
  | 'idle'      // 閒置
  | 'recording' // 錄音中
  | 'paused'    // 暫停
  | 'stopped';  // 已停止

/** 會議 Session */
export interface MeetingSession {
  id: string;
  status: SessionStatus;
  mode: MeetingMode;
  startTime: string;
  endTime?: string;
  duration: number;           // 毫秒
  context?: string;           // 會議背景說明
  transcriptionSegments: TranscriptionSegment[];
  suggestions: Suggestion[];
  exportedAt?: string;
}

/** Session 統計 */
export interface SessionStats {
  totalDuration: number;
  segmentCount: number;
  suggestionCount: number;
  suggestionsByType: Record<SuggestionKind, number>;
  keywordTriggerCount: number;
  timerTriggerCount: number;
  silenceTriggerCount: number;
  helpfulSuggestions: number;
  notHelpfulSuggestions: number;
}

// ============ 新增類型 - 觸發設定 ============

/** 觸發設定 */
export interface TriggerConfig {
  // 關鍵詞觸發
  keywordEnabled: boolean;
  keywordCategories: KeywordCategory[];
  keywordThrottle: number;    // 毫秒，同類關鍵詞的冷卻時間

  // 定時觸發
  timerEnabled: boolean;
  timerInterval: number;      // 毫秒

  // 沉默觸發
  silenceEnabled: boolean;
  silenceThreshold: number;   // 毫秒
}

// ============ 新增類型 - 用戶設定 ============

/** 主題 */
export type Theme = 'dark' | 'light';

/** 用戶設定 */
export interface UserSettings {
  // 外觀
  theme: Theme;

  // LLM
  llmProvider: LLMProvider;
  llmModel: string;

  // 觸發
  triggers: TriggerConfig;

  // 會議預設
  defaultMode: MeetingMode;

  // 資料保留
  retentionDays: 7 | 30 | 90 | -1;

  // TTS (P2)
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsRate: number;

  // 首次使用
  onboardingCompleted: boolean;
}

// ============ 新增類型 - 匯出 ============

/** 匯出格式 */
export type ExportFormat = 'markdown' | 'text' | 'json';

/** 匯出選項 */
export interface ExportOptions {
  format: ExportFormat;
  includeTranscription: boolean;
  includeSuggestions: boolean;
  includeStats: boolean;
  includeTimestamps: boolean;
}

// ============ 新增類型 - 話術範本 (P2) ============

/** 範本類別 */
export type TemplateCategory =
  | 'opening'          // 開場白
  | 'objection'        // 異議處理
  | 'closing'          // 收尾
  | 'follow_up'        // 追問
  | 'price_negotiation'; // 價格談判

/** 話術範本 */
export interface SpeechTemplate {
  id: string;
  category: TemplateCategory;
  title: string;
  content: string;
  mode: MeetingMode[];  // 適用的會議模式
  tags: string[];
  scenario?: string;    // 適用場景說明
}

// ============ 新增類型 - 會後報告 (P2) ============

/** 會後報告 */
export interface PostMeetingReport {
  sessionId: string;
  generatedAt: string;
  summary: string;
  keyMoments: KeyMoment[];
  actionItems: string[];
  suggestionAnalysis: SuggestionAnalysis;
  recommendations: string[];
}

/** 關鍵時刻 */
export interface KeyMoment {
  timestamp: string;
  description: string;
  type: 'opportunity' | 'risk' | 'decision' | 'commitment';
}

/** 建議分析 */
export interface SuggestionAnalysis {
  total: number;
  byType: Record<SuggestionKind, number>;
  helpfulRate: number;
  mostCommonTrigger: TriggerType;
}

// ============ 預設值 ============

export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  keywordEnabled: true,
  keywordCategories: ['price', 'deadline', 'commitment', 'objection', 'competitor'],
  keywordThrottle: 30000,  // 30 秒

  timerEnabled: true,
  timerInterval: 90000,    // 90 秒

  silenceEnabled: true,
  silenceThreshold: 15000, // 15 秒
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'dark',
  llmProvider: 'claude',
  llmModel: 'claude-sonnet-4-20250514',
  triggers: DEFAULT_TRIGGER_CONFIG,
  defaultMode: 'negotiation',
  retentionDays: 30,
  ttsEnabled: false,
  ttsVoice: '',
  ttsRate: 1.0,
  onboardingCompleted: false,
};
