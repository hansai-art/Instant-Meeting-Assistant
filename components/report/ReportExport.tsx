'use client';

// ============================================
// 報告匯出元件 (P2)
// ============================================

import { useState } from 'react';
import { Download, FileText, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeetingMode } from '@/lib/types';

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

interface ReportExportProps {
  reportData: ReportData;
  mode: MeetingMode;
  elapsedTime: number;
}

type ExportFormat = 'markdown' | 'text';

const modeLabels: Record<MeetingMode, string> = {
  negotiation: '談判',
  interview: '面試',
  proposal: '提案',
  general: '一般',
};

export function ReportExport({ reportData, mode, elapsedTime }: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}小時${minutes}分${seconds}秒`;
    }
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  };

  const generateMarkdown = (): string => {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString('zh-TW');

    lines.push('# 會後分析報告');
    lines.push('');
    lines.push(`**日期:** ${date}`);
    lines.push(`**會議類型:** ${modeLabels[mode]}`);
    lines.push(`**會議時長:** ${formatDuration(elapsedTime)}`);
    lines.push('');

    lines.push('## 會議摘要');
    lines.push('');
    lines.push(reportData.summary);
    lines.push('');

    lines.push('## 統計數據');
    lines.push('');
    lines.push(`- 總字數: ${reportData.statistics.totalWords.toLocaleString()}`);
    lines.push(`- AI 建議數: ${reportData.statistics.suggestionsGiven}`);
    lines.push(`- 有幫助的建議: ${reportData.statistics.helpfulSuggestions}`);
    if (reportData.statistics.suggestionsGiven > 0) {
      const rate = Math.round(
        (reportData.statistics.helpfulSuggestions / reportData.statistics.suggestionsGiven) * 100
      );
      lines.push(`- 建議採納率: ${rate}%`);
    }
    lines.push('');

    if (reportData.statistics.keywordsDetected.length > 0) {
      lines.push('### 偵測到的關鍵詞');
      lines.push('');
      lines.push(reportData.statistics.keywordsDetected.map(k => `\`${k}\``).join(', '));
      lines.push('');
    }

    if (reportData.keyMoments.length > 0) {
      lines.push('## 關鍵時刻');
      lines.push('');
      reportData.keyMoments.forEach((moment) => {
        const typeLabel = moment.type === 'opportunity' ? '機會' : moment.type === 'risk' ? '風險' : '決定';
        const time = new Date(moment.timestamp).toLocaleTimeString('zh-TW');
        lines.push(`### ${typeLabel} (${time})`);
        lines.push('');
        lines.push(moment.description);
        lines.push('');
      });
    }

    lines.push('## 改進建議');
    lines.push('');
    reportData.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });
    lines.push('');

    lines.push('## 後續步驟');
    lines.push('');
    reportData.nextSteps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push('');

    lines.push('---');
    lines.push('*由 AI 會議顧問自動生成*');

    return lines.join('\n');
  };

  const generateText = (): string => {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString('zh-TW');

    lines.push('會後分析報告');
    lines.push('================');
    lines.push('');
    lines.push(`日期: ${date}`);
    lines.push(`會議類型: ${modeLabels[mode]}`);
    lines.push(`會議時長: ${formatDuration(elapsedTime)}`);
    lines.push('');

    lines.push('會議摘要');
    lines.push('--------');
    lines.push(reportData.summary);
    lines.push('');

    lines.push('統計數據');
    lines.push('--------');
    lines.push(`總字數: ${reportData.statistics.totalWords.toLocaleString()}`);
    lines.push(`AI 建議數: ${reportData.statistics.suggestionsGiven}`);
    lines.push(`有幫助的建議: ${reportData.statistics.helpfulSuggestions}`);
    if (reportData.statistics.suggestionsGiven > 0) {
      const rate = Math.round(
        (reportData.statistics.helpfulSuggestions / reportData.statistics.suggestionsGiven) * 100
      );
      lines.push(`建議採納率: ${rate}%`);
    }
    lines.push('');

    if (reportData.statistics.keywordsDetected.length > 0) {
      lines.push('偵測到的關鍵詞: ' + reportData.statistics.keywordsDetected.join(', '));
      lines.push('');
    }

    if (reportData.keyMoments.length > 0) {
      lines.push('關鍵時刻');
      lines.push('--------');
      reportData.keyMoments.forEach((moment) => {
        const typeLabel = moment.type === 'opportunity' ? '機會' : moment.type === 'risk' ? '風險' : '決定';
        const time = new Date(moment.timestamp).toLocaleTimeString('zh-TW');
        lines.push(`[${typeLabel}] ${time}`);
        lines.push(moment.description);
        lines.push('');
      });
    }

    lines.push('改進建議');
    lines.push('--------');
    reportData.recommendations.forEach((rec, index) => {
      lines.push(`${index + 1}. ${rec}`);
    });
    lines.push('');

    lines.push('後續步驟');
    lines.push('--------');
    reportData.nextSteps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push('');

    lines.push('---');
    lines.push('由 AI 會議顧問自動生成');

    return lines.join('\n');
  };

  const handleExport = (format: ExportFormat) => {
    setIsExporting(true);

    try {
      const content = format === 'markdown' ? generateMarkdown() : generateText();
      const ext = format === 'markdown' ? 'md' : 'txt';
      const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
      const filename = `meeting-report-${Date.now()}.${ext}`;

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('匯出報告錯誤:', error);
      alert('匯出失敗，請重試');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('markdown')}
        disabled={isExporting}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-violet-500 text-white hover:bg-violet-600',
          isExporting && 'opacity-50 cursor-not-allowed'
        )}
      >
        <FileCode className="w-4 h-4" />
        Markdown
      </button>
      <button
        onClick={() => handleExport('text')}
        disabled={isExporting}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
          'bg-slate-700 text-slate-300 hover:bg-slate-600',
          isExporting && 'opacity-50 cursor-not-allowed'
        )}
      >
        <FileText className="w-4 h-4" />
        純文字
      </button>
    </div>
  );
}

export default ReportExport;
