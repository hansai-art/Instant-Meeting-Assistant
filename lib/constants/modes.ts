// ============================================
// 會議模式定義
// ============================================

import type { MeetingMode, MeetingModeConfig } from '../types';

/** 會議模式設定 */
export const MEETING_MODES: Record<MeetingMode, MeetingModeConfig> = {
  negotiation: {
    id: 'negotiation',
    name: '商業談判',
    description: '價格談判、合約討論、交易協商',
    icon: '🤝',
    promptContext: `你正在協助一場商業談判。
重點關注：
- 價格策略與議價技巧
- 條款交換與讓步策略
- 對方的底線與需求
- 避免過早承諾或洩露底牌
- 建立雙贏局面的機會`,
  },

  interview: {
    id: 'interview',
    name: '面試',
    description: '求職面試、人才評估',
    icon: '👔',
    promptContext: `你正在協助一場面試。
重點關注：
- 如何展示優勢與經驗
- 處理困難問題的技巧
- 薪資福利談判時機
- 提問面試官的好問題
- 展現文化適配度`,
  },

  proposal: {
    id: 'proposal',
    name: '客戶提案',
    description: '產品演示、服務提案、業務簡報',
    icon: '📊',
    promptContext: `你正在協助一場客戶提案。
重點關注：
- 抓住客戶的核心需求
- 強調差異化價值
- 處理客戶的疑慮與異議
- 推進下一步行動
- 建立信任與專業形象`,
  },

  general: {
    id: 'general',
    name: '一般會議',
    description: '日常會議、討論、溝通',
    icon: '💬',
    promptContext: `你正在協助一場一般會議。
重點關注：
- 確保溝通清晰明確
- 識別重要決策點
- 追蹤待辦事項
- 化解潛在衝突
- 推進會議進度`,
  },
};

/** 取得所有會議模式清單 */
export function getMeetingModeList(): MeetingModeConfig[] {
  return Object.values(MEETING_MODES);
}

/** 取得會議模式設定 */
export function getMeetingModeConfig(mode: MeetingMode): MeetingModeConfig {
  return MEETING_MODES[mode];
}

/** 會議模式的 Prompt 上下文 */
export function getModePromptContext(mode: MeetingMode): string {
  return MEETING_MODES[mode].promptContext;
}
