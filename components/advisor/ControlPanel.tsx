'use client';

// ============================================
// 錄音控制面板
// ============================================

import { Mic, MicOff, Pause, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/lib/types';

interface ControlPanelProps {
  status: SessionStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export function ControlPanel({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
  className,
}: ControlPanelProps) {
  const isIdle = status === 'idle' || status === 'stopped';
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';

  const handleMainButtonClick = () => {
    if (disabled) return;

    if (isIdle) {
      onStart();
    } else if (isRecording) {
      onPause();
    } else if (isPaused) {
      onResume();
    }
  };

  const handleStopClick = () => {
    if (disabled) return;
    onStop();
  };

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* 主要控制按鈕 */}
      <div className="relative">
        {/* 背景光環 */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-ring scale-125" />
        )}

        {/* 主按鈕 */}
        <button
          onClick={handleMainButtonClick}
          disabled={disabled}
          className={cn(
            'record-button flex items-center justify-center',
            isRecording && 'recording',
            isPaused && 'paused',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isIdle && <Mic className="w-12 h-12 text-white" />}
          {isRecording && <Pause className="w-12 h-12 text-white" />}
          {isPaused && <Play className="w-12 h-12 text-white" />}
        </button>
      </div>

      {/* 狀態文字 */}
      <div className="text-center">
        <p className="text-lg font-medium">
          {isIdle && '點擊開始監聽'}
          {isRecording && '監聽中...'}
          {isPaused && '已暫停'}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          {isIdle && '開始後 AI 會主動給予建議'}
          {isRecording && '說話時 AI 會即時分析'}
          {isPaused && '點擊繼續或停止結束會議'}
        </p>
      </div>

      {/* 停止按鈕（僅在錄音或暫停時顯示） */}
      {!isIdle && (
        <button
          onClick={handleStopClick}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-xl',
            'bg-red-500/10 text-red-400 border border-red-500/30',
            'hover:bg-red-500/20 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Square className="w-5 h-5" />
          <span>結束會議</span>
        </button>
      )}
    </div>
  );
}

export default ControlPanel;
