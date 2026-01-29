'use client';

// ============================================
// 會議計時器
// ============================================

import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionStatus } from '@/lib/types';

interface SessionTimerProps {
  status: SessionStatus;
  elapsedTime: number;
  onTick?: (time: number) => void;
  className?: string;
}

export function SessionTimer({
  status,
  elapsedTime,
  onTick,
  className,
}: SessionTimerProps) {
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      // 開始計時
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - elapsedTime;
      }

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const newElapsed = Date.now() - startTimeRef.current;
          onTick?.(newElapsed);
        }
      }, 1000);
    } else if (status === 'paused') {
      // 暫停計時
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else if (status === 'idle' || status === 'stopped') {
      // 重置計時
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, elapsedTime, onTick]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const isActive = status === 'recording' || status === 'paused';

  return (
    <div
      className={cn(
        'status-indicator',
        status === 'recording' && 'status-indicator-recording',
        status === 'paused' && 'status-indicator-paused',
        (status === 'idle' || status === 'stopped') && 'status-indicator-idle',
        className
      )}
    >
      <Clock className="w-4 h-4" />
      <span className="font-mono">{formatTime(elapsedTime)}</span>
      {status === 'recording' && (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
    </div>
  );
}

export default SessionTimer;
