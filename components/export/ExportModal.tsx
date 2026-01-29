'use client';

// ============================================
// 匯出選項彈窗
// ============================================

import { useState } from 'react';
import { X, FileText, FileCode, Download, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TranscriptionSegment, Suggestion, MeetingMode } from '@/lib/types';

interface ExportModalProps {
  segments: TranscriptionSegment[];
  suggestions: Suggestion[];
  mode: MeetingMode;
  elapsedTime: number;
  onClose: () => void;
}

type ExportFormat = 'markdown' | 'text' | 'json';

export function ExportModal({
  segments,
  suggestions,
  mode,
  elapsedTime,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [includeSuggestions, setIncludeSuggestions] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const formats: { id: ExportFormat; name: string; icon: typeof FileText; description: string }[] = [
    {
      id: 'markdown',
      name: 'Markdown',
      icon: FileCode,
      description: '適合筆記軟體和文件編輯',
    },
    {
      id: 'text',
      name: '純文字',
      icon: FileText,
      description: '簡單易讀的純文字格式',
    },
    {
      id: 'json',
      name: 'JSON',
      icon: FileCode,
      description: '結構化資料，適合程式處理',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          session: {
            mode,
            elapsedTime,
            segments: includeTranscript ? segments.filter((s) => s.isFinal) : [],
            suggestions: includeSuggestions ? suggestions : [],
            startTime: segments[0]?.timestamp || new Date().toISOString(),
            endTime: segments[segments.length - 1]?.timestamp || new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('匯出失敗');
      }

      // 取得檔案名稱
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `meeting-${Date.now()}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = match[1];
        }
      } else {
        // 根據格式設定副檔名
        const ext = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt';
        filename = `meeting-${Date.now()}.${ext}`;
      }

      // 下載檔案
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('匯出錯誤:', error);
      alert('匯出失敗，請重試');
    } finally {
      setIsExporting(false);
    }
  };

  const finalSegments = segments.filter((s) => s.isFinal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold">匯出會議紀錄</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="p-4 space-y-6">
          {/* 成功訊息 */}
          {exportSuccess ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">匯出成功！</h3>
              <p className="text-sm text-slate-400">檔案已開始下載</p>
            </div>
          ) : (
            <>
              {/* 統計資訊 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">對話段落</p>
                  <p className="text-lg font-semibold">{finalSegments.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">AI 建議</p>
                  <p className="text-lg font-semibold">{suggestions.length}</p>
                </div>
              </div>

              {/* 格式選擇 */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">匯出格式</h3>
                <div className="space-y-2">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        'w-full p-3 rounded-xl text-left transition-all',
                        'border flex items-center gap-3',
                        format === f.id
                          ? 'bg-violet-500/20 border-violet-500'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      )}
                    >
                      <f.icon className="w-5 h-5 text-slate-400" />
                      <div className="flex-1">
                        <span className="font-medium text-sm">{f.name}</span>
                        <p className="text-xs text-slate-400">{f.description}</p>
                      </div>
                      {format === f.id && (
                        <CheckCircle className="w-5 h-5 text-violet-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 包含選項 */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">包含內容</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTranscript}
                      onChange={(e) => setIncludeTranscript(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-500"
                    />
                    <div>
                      <span className="text-sm font-medium">對話紀錄</span>
                      <p className="text-xs text-slate-400">
                        {finalSegments.length} 條對話
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSuggestions}
                      onChange={(e) => setIncludeSuggestions(e.target.checked)}
                      className="w-4 h-4 rounded accent-violet-500"
                    />
                    <div>
                      <span className="text-sm font-medium">AI 建議</span>
                      <p className="text-xs text-slate-400">
                        {suggestions.length} 條建議
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!exportSuccess && (
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleExport}
              disabled={isExporting || (!includeTranscript && !includeSuggestions)}
              className={cn(
                'w-full py-3 rounded-xl font-medium transition-colors',
                'flex items-center justify-center gap-2',
                isExporting || (!includeTranscript && !includeSuggestions)
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              )}
            >
              <Download className="w-5 h-5" />
              {isExporting ? '匯出中...' : '下載檔案'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExportModal;
