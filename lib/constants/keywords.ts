// ============================================
// 關鍵詞觸發清單
// ============================================

import type { KeywordCategory } from '../types';

/** 關鍵詞定義 */
export interface KeywordDefinition {
  category: KeywordCategory;
  keywords: string[];
  description: string;
}

/** 價格相關關鍵詞 */
export const PRICE_KEYWORDS: KeywordDefinition = {
  category: 'price',
  description: '價格、費用相關的討論',
  keywords: [
    // 繁體中文
    '價格', '報價', '預算', '費用', '成本', '多少錢', '價錢',
    '折扣', '優惠', '便宜', '貴', '划算', '投資', '金額',
    '付款', '款項', '收費', '定價', '底價', '議價',
    // 簡體中文
    '价格', '报价', '预算', '费用', '多少钱', '价钱',
    // 英文
    'price', 'cost', 'budget', 'fee', 'discount', 'quote',
    'pricing', 'expensive', 'cheap', 'afford', 'investment',
  ],
};

/** 時間期限相關關鍵詞 */
export const DEADLINE_KEYWORDS: KeywordDefinition = {
  category: 'deadline',
  description: '時間、期限、交期相關的討論',
  keywords: [
    // 繁體中文
    '時間', '交期', '什麼時候', '多久', '趕', '期限', '截止',
    '盡快', '急', '來得及', '進度', '時程', '排程', '日期',
    '延期', '提前', '準時', '逾期', '工期',
    // 簡體中文
    '时间', '什么时候', '来得及', '时程',
    // 英文
    'time', 'deadline', 'when', 'timeline', 'schedule',
    'urgent', 'asap', 'rush', 'delay', 'date', 'due',
  ],
};

/** 承諾保證相關關鍵詞 */
export const COMMITMENT_KEYWORDS: KeywordDefinition = {
  category: 'commitment',
  description: '承諾、保證相關的討論（可能的風險點）',
  keywords: [
    // 繁體中文
    '保證', '一定', '沒問題', '可以', '答應', '承諾',
    '絕對', '肯定', '包', '搞定', '放心', '確定',
    '同意', '接受', '成交', '簽約',
    // 簡體中文
    '没问题', '绝对', '签约',
    // 英文
    'guarantee', 'promise', 'sure', 'definitely', 'absolutely',
    'commit', 'agree', 'accept', 'deal', 'confirm',
  ],
};

/** 異議疑慮相關關鍵詞 */
export const OBJECTION_KEYWORDS: KeywordDefinition = {
  category: 'objection',
  description: '異議、疑慮、猶豫相關的討論',
  keywords: [
    // 繁體中文
    '但是', '不過', '考慮', '再說', '不確定', '猶豫', '擔心',
    '問題', '困難', '風險', '疑慮', '顧慮', '懷疑',
    '不行', '不好', '不太', '不能', '沒辦法', '怕',
    '萬一', '如果', '假設', '可能', '或許',
    // 簡體中文
    '不确定', '犹豫', '担心', '顾虑', '怀疑', '没办法',
    // 英文
    'but', 'however', 'concern', 'hesitate', 'worry',
    'problem', 'issue', 'risk', 'doubt', 'uncertain',
    'maybe', 'perhaps', 'if', 'what if',
  ],
};

/** 競爭對手相關關鍵詞 */
export const COMPETITOR_KEYWORDS: KeywordDefinition = {
  category: 'competitor',
  description: '競爭對手、比較相關的討論',
  keywords: [
    // 繁體中文
    '其他家', '別人', '比較', '競爭', '對手',
    '另一家', '其他廠商', '別家', '同業', '市場',
    '選擇', '替代', '方案', '比價', '評估',
    // 簡體中文
    '其他厂商', '别家', '竞争', '对手',
    // 英文
    'competitor', 'alternative', 'compare', 'other',
    'option', 'choice', 'market', 'versus', 'vs',
  ],
};

/** 所有關鍵詞定義 */
export const ALL_KEYWORDS: Record<KeywordCategory, KeywordDefinition> = {
  price: PRICE_KEYWORDS,
  deadline: DEADLINE_KEYWORDS,
  commitment: COMMITMENT_KEYWORDS,
  objection: OBJECTION_KEYWORDS,
  competitor: COMPETITOR_KEYWORDS,
};

/** 關鍵詞類別的中文名稱 */
export const KEYWORD_CATEGORY_NAMES: Record<KeywordCategory, string> = {
  price: '價格',
  deadline: '時間期限',
  commitment: '承諾保證',
  objection: '異議疑慮',
  competitor: '競爭對手',
};

/** 關鍵詞類別的圖標 */
export const KEYWORD_CATEGORY_ICONS: Record<KeywordCategory, string> = {
  price: '💰',
  deadline: '⏰',
  commitment: '🤝',
  objection: '🤔',
  competitor: '🏢',
};

/**
 * 檢測文字中的關鍵詞
 * @param text 要檢測的文字
 * @param categories 要檢測的類別（預設全部）
 * @returns 檢測到的關鍵詞和類別
 */
export function detectKeywords(
  text: string,
  categories: KeywordCategory[] = ['price', 'deadline', 'commitment', 'objection', 'competitor']
): { category: KeywordCategory; keyword: string }[] {
  const results: { category: KeywordCategory; keyword: string }[] = [];
  const lowerText = text.toLowerCase();

  for (const category of categories) {
    const definition = ALL_KEYWORDS[category];
    for (const keyword of definition.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        results.push({ category, keyword });
        break; // 每個類別只取第一個匹配
      }
    }
  }

  return results;
}
