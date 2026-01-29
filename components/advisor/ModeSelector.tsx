'use client';

// ============================================
// 會議模式選擇器
// ============================================

import { cn } from '@/lib/utils';
import type { MeetingMode } from '@/lib/types';
import { MEETING_MODES, getMeetingModeList } from '@/lib/constants/modes';

interface ModeSelectorProps {
  value: MeetingMode;
  onChange: (mode: MeetingMode) => void;
  disabled?: boolean;
  className?: string;
}

export function ModeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: ModeSelectorProps) {
  const modes = getMeetingModeList();

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'border transition-all',
            value === mode.id
              ? 'bg-violet-500/20 border-violet-500 text-violet-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span>{mode.icon}</span>
          <span className="text-sm font-medium">{mode.name}</span>
        </button>
      ))}
    </div>
  );
}

export default ModeSelector;
