// ============================================
// 話術範本 (P2)
// ============================================

import type { SpeechTemplate, TemplateCategory, MeetingMode } from '../types';

/** 範本類別名稱 */
export const TEMPLATE_CATEGORY_NAMES: Record<TemplateCategory, string> = {
  opening: '開場白',
  objection: '異議處理',
  closing: '收尾',
  follow_up: '追問技巧',
  price_negotiation: '價格談判',
};

/** 範本類別圖標 */
export const TEMPLATE_CATEGORY_ICONS: Record<TemplateCategory, string> = {
  opening: '👋',
  objection: '🛡️',
  closing: '🎯',
  follow_up: '❓',
  price_negotiation: '💰',
};

/** 預設話術範本 */
export const DEFAULT_TEMPLATES: SpeechTemplate[] = [
  // ===== 開場白 =====
  {
    id: 'opening-value',
    category: 'opening',
    title: '價值導向開場',
    content: '在我們開始之前，我想先了解一下，對您來說，這次合作最重要的是什麼？是成本效益、時間效率，還是品質保證？',
    mode: ['negotiation', 'proposal'],
    tags: ['價值', '需求探索'],
  },
  {
    id: 'opening-rapport',
    category: 'opening',
    title: '建立關係開場',
    content: '感謝您抽出時間。在進入主題之前，我注意到貴公司最近在 [領域] 有很大的發展，能否分享一下目前面臨的主要挑戰？',
    mode: ['proposal', 'general'],
    tags: ['關係建立', '背景了解'],
  },
  {
    id: 'opening-interview',
    category: 'opening',
    title: '面試自我介紹',
    content: '謝謝給我這個機會。我是 [姓名]，在 [領域] 有 [年數] 年的經驗。我特別擅長 [核心技能]，曾經幫助 [具體成果]。今天很期待能更深入了解這個職位。',
    mode: ['interview'],
    tags: ['自我介紹', '亮點展示'],
  },

  // ===== 異議處理 =====
  {
    id: 'objection-price-high',
    category: 'objection',
    title: '價格太高',
    content: '我理解價格是重要的考量。讓我幫您算一下，如果考慮到 [效益1]、[效益2]，長期來看每月的投資報酬率是...這樣看的話，您覺得這個投資合理嗎？',
    mode: ['negotiation', 'proposal'],
    tags: ['價格', 'ROI'],
  },
  {
    id: 'objection-need-time',
    category: 'objection',
    title: '需要時間考慮',
    content: '完全理解，這是一個重要的決定。為了幫助您做決定，能否告訴我還有什麼資訊是您需要的？或者有什麼顧慮是我可以幫您釐清的？',
    mode: ['negotiation', 'proposal'],
    tags: ['猶豫', '探索'],
  },
  {
    id: 'objection-competitor',
    category: 'objection',
    title: '還在比較其他選項',
    content: '比較是明智的做法。方便分享一下您主要在比較哪些方面嗎？這樣我可以更清楚地說明我們的差異化優勢。',
    mode: ['negotiation', 'proposal'],
    tags: ['競爭', '差異化'],
  },

  // ===== 收尾 =====
  {
    id: 'closing-next-step',
    category: 'closing',
    title: '明確下一步',
    content: '感謝今天的討論。根據我們談的內容，下一步我建議 [具體行動]。您看這週 [時間] 方便嗎？',
    mode: ['negotiation', 'proposal', 'general'],
    tags: ['行動', '時間'],
  },
  {
    id: 'closing-summary',
    category: 'closing',
    title: '總結確認',
    content: '讓我確認一下我們達成的共識：[重點1]、[重點2]、[重點3]。這些是否正確？還有什麼需要補充的嗎？',
    mode: ['negotiation', 'general'],
    tags: ['確認', '共識'],
  },
  {
    id: 'closing-interview',
    category: 'closing',
    title: '面試結尾提問',
    content: '謝謝您的分享。在結束之前，我想請教：對於這個職位，您認為成功的關鍵因素是什麼？另外，接下來的流程大概是怎樣的？',
    mode: ['interview'],
    tags: ['提問', '流程'],
  },

  // ===== 追問技巧 =====
  {
    id: 'follow-why',
    category: 'follow_up',
    title: '深挖原因',
    content: '這很有意思，能否多說一些是什麼讓您有這個想法？',
    mode: ['negotiation', 'proposal', 'interview', 'general'],
    tags: ['深挖', '原因'],
  },
  {
    id: 'follow-example',
    category: 'follow_up',
    title: '請求舉例',
    content: '您能舉一個具體的例子嗎？這樣我能更好地理解您的需求。',
    mode: ['negotiation', 'proposal', 'general'],
    tags: ['具體', '例子'],
  },
  {
    id: 'follow-priority',
    category: 'follow_up',
    title: '確認優先級',
    content: '在您提到的這幾點中，哪一個對您來說是最重要的？',
    mode: ['negotiation', 'proposal', 'general'],
    tags: ['優先', '排序'],
  },

  // ===== 價格談判 =====
  {
    id: 'price-value-first',
    category: 'price_negotiation',
    title: '價值優先',
    content: '在討論價格之前，讓我們先確認這個方案能為您帶來的價值。如果能達到 [預期效果]，這對貴公司的影響會是什麼？',
    mode: ['negotiation', 'proposal'],
    tags: ['價值', '效益'],
  },
  {
    id: 'price-anchor',
    category: 'price_negotiation',
    title: '價格錨定',
    content: '根據市場行情和我們提供的服務範圍，完整方案的價格是 [較高金額]。不過，考慮到我們的長期合作潛力，我可以提供 [實際金額] 的優惠方案。',
    mode: ['negotiation'],
    tags: ['錨定', '優惠'],
  },
  {
    id: 'price-trade',
    category: 'price_negotiation',
    title: '條件交換',
    content: '如果價格是主要考量，我們可以討論調整服務範圍。或者，如果能夠 [對方讓步]，我們可以在價格上有更多彈性。',
    mode: ['negotiation'],
    tags: ['交換', '彈性'],
  },
];

/**
 * 根據類別取得範本
 */
export function getTemplatesByCategory(category: TemplateCategory): SpeechTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

/**
 * 根據會議模式取得適用範本
 */
export function getTemplatesByMode(mode: MeetingMode): SpeechTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.mode.includes(mode));
}

/**
 * 搜尋範本
 */
export function searchTemplates(query: string): SpeechTemplate[] {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_TEMPLATES.filter(t =>
    t.title.toLowerCase().includes(lowerQuery) ||
    t.content.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
