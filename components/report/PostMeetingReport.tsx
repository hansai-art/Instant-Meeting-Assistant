'use client';

// ============================================
// 會後分析報告 (P2)
// ============================================

import { useState, useEffect } from 'react';
import { X, FileText, BarChart2, Lightbulb, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportExport } from './ReportExport';
import type { TranscriptionSegment, Suggestion, MeetingMode } from '@/lib/types';

interface PostMeetingReportProps {
  segments: TranscriptionSegment[];
  suggestions: Suggestion[];
  mode: MeetingMode;
  elapsedTime: number;
  onClose: () => void;
}

interface ReportData {
  summary: string;
  keyMoments: { timestamp: string; description: string; type: 'opportunity' | 'risk' | 'decision' }[];
  statistics: {
    totalWords: number;
    suggestionsGiven: number;
    helpfulSuggestions: number;
    keywordsDetected: string[];
  };
  recommendations: string[];
  nextSteps: string[];
}

export function PostMeetingReport({
  segments,
  suggestions,
  mode,
  elapsedTime,
  onClose,
}: PostMeetingReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'moments' | 'stats'>('summary');

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 準備對話文本
      const transcript = segments
        .filter((s) => s.isFinal)
        .map((s) => s.text)
        .join(' ');

      // 呼叫 API 生成報告
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: transcript,
          trigger: { type: 'report' },
          mode,
          isReport: true,
          suggestions: suggestions.map((s) => ({
            type: s.type,
            content: s.content,
            feedback: s.feedback,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('報告生成失敗');
      }

      const result = await response.json() as { report?: ReportData };

      // 如果 API 返回報告數據，使用它；否則使用模擬數據
      if (result.report) {
        setReportData(result.report);
      } else {
        // 生成基本統計數據
        const totalWords = transcript.split(/\s+/).filter(Boolean).length;
        const helpfulCount = suggestions.filter((s) => s.feedback === 'helpful').length;
        const keywordsDetected = Array.from(
          new Set(suggestions.filter((s) => s.triggerContext).map((s) => s.triggerContext!))
        );

        setReportData({
          summary: `這是一場${getModeLabel(mode)}會議，總時長 ${formatDuration(elapsedTime)}。會議期間 AI 顧問共提供了 ${suggestions.length} 條建議，其中 ${helpfulCount} 條被標記為有幫助。`,
          keyMoments: suggestions.slice(0, 5).map((s) => ({
            timestamp: s.timestamp,
            description: s.content.slice(0, 80) + (s.content.length > 80 ? '...' : ''),
            type: s.type === 'warning' ? 'risk' : s.type === 'opportunity' ? 'opportunity' : 'decision',
          })),
          statistics: {
            totalWords,
            suggestionsGiven: suggestions.length,
            helpfulSuggestions: helpfulCount,
            keywordsDetected,
          },
          recommendations: [
            '建議在下次會議前準備更多數據支持論點',
            '可以嘗試更多開放式問題來了解對方需求',
            '注意控制會議節奏，避免過長的沉默時間',
          ],
          nextSteps: [
            '整理會議重點並發送會議紀要',
            '根據討論結果更新專案進度',
            '安排後續跟進會議',
          ],
        });
      }
    } catch (err) {
      console.error('生成報告錯誤:', err);
      setError('生成報告時發生錯誤，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'summary', label: '摘要', icon: FileText },
    { id: 'moments', label: '關鍵時刻', icon: Lightbulb },
    { id: 'stats', label: '統計', icon: BarChart2 },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold">會後分析報告</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-4" />
              <p className="text-slate-400">正在生成報告...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={generateReport}
                className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm hover:bg-violet-600 transition-colors"
              >
                重試
              </button>
            </div>
          ) : reportData ? (
            <>
              {activeTab === 'summary' && (
                <SummaryTab data={reportData} elapsedTime={elapsedTime} mode={mode} />
              )}
              {activeTab === 'moments' && (
                <KeyMomentsTab moments={reportData.keyMoments} />
              )}
              {activeTab === 'stats' && (
                <StatisticsTab statistics={reportData.statistics} />
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        {reportData && (
          <div className="p-4 border-t border-slate-700">
            <ReportExport
              reportData={reportData}
              mode={mode}
              elapsedTime={elapsedTime}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryTabProps {
  data: ReportData;
  elapsedTime: number;
  mode: MeetingMode;
}

function SummaryTab({ data, elapsedTime, mode }: SummaryTabProps) {
  return (
    <div className="space-y-6">
      {/* 基本資訊 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">會議類型</p>
          <p className="font-medium">{getModeLabel(mode)}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-700/50">
          <p className="text-xs text-slate-400 mb-1">會議時長</p>
          <p className="font-medium">{formatDuration(elapsedTime)}</p>
        </div>
      </div>

      {/* 摘要 */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-2">會議摘要</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{data.summary}</p>
      </div>

      {/* 建議 */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-2">改進建議</h3>
        <ul className="space-y-2">
          {data.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
              <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* 後續步驟 */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-2">後續步驟</h3>
        <ul className="space-y-2">
          {data.nextSteps.map((step, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs flex-shrink-0">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface KeyMomentsTabProps {
  moments: ReportData['keyMoments'];
}

function KeyMomentsTab({ moments }: KeyMomentsTabProps) {
  const typeStyles = {
    opportunity: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '機會' },
    risk: { bg: 'bg-red-500/20', text: 'text-red-400', label: '風險' },
    decision: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '決定' },
  };

  if (moments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">沒有記錄到關鍵時刻</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {moments.map((moment, index) => {
        const style = typeStyles[moment.type];
        return (
          <div
            key={index}
            className="p-4 rounded-xl bg-slate-700/50 border border-slate-600"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  style.bg,
                  style.text
                )}
              >
                {style.label}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(moment.timestamp).toLocaleTimeString('zh-TW')}
              </span>
            </div>
            <p className="text-sm text-slate-300">{moment.description}</p>
          </div>
        );
      })}
    </div>
  );
}

interface StatisticsTabProps {
  statistics: ReportData['statistics'];
}

function StatisticsTab({ statistics }: StatisticsTabProps) {
  const stats = [
    { label: '總字數', value: statistics.totalWords.toLocaleString() },
    { label: 'AI 建議數', value: statistics.suggestionsGiven },
    { label: '有幫助的建議', value: statistics.helpfulSuggestions },
    {
      label: '建議採納率',
      value:
        statistics.suggestionsGiven > 0
          ? `${Math.round((statistics.helpfulSuggestions / statistics.suggestionsGiven) * 100)}%`
          : 'N/A',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 數字統計 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 偵測到的關鍵詞 */}
      {statistics.keywordsDetected.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3">偵測到的關鍵詞</h3>
          <div className="flex flex-wrap gap-2">
            {statistics.keywordsDetected.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 工具函數
function getModeLabel(mode: MeetingMode): string {
  const labels: Record<MeetingMode, string> = {
    negotiation: '談判',
    interview: '面試',
    proposal: '提案',
    general: '一般',
  };
  return labels[mode] || '一般';
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} 小時 ${minutes} 分 ${seconds} 秒`;
  }
  if (minutes > 0) {
    return `${minutes} 分 ${seconds} 秒`;
  }
  return `${seconds} 秒`;
}

export default PostMeetingReport;
