'use client';

// ============================================
// 引導流程 - 麥克風測試
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicrophoneTestProps {
  tested: boolean;
  onTestComplete: () => void;
}

type TestStatus = 'idle' | 'requesting' | 'testing' | 'success' | 'error';

export function MicrophoneTest({ tested, onTestComplete }: MicrophoneTestProps) {
  const [status, setStatus] = useState<TestStatus>(tested ? 'success' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // 清理
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startTest = async () => {
    setStatus('requesting');
    setErrorMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      setStatus('testing');

      // 建立音訊分析器
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 開始音量監測
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      let testDuration = 0;
      const startTime = Date.now();

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        setAudioLevel(normalizedLevel);

        if (normalizedLevel > maxLevel) {
          maxLevel = normalizedLevel;
        }

        testDuration = Date.now() - startTime;

        // 如果偵測到聲音且已經測試超過 1 秒，則完成測試
        if (maxLevel > 0.1 && testDuration > 1000) {
          completeTest();
          return;
        }

        // 最多測試 10 秒
        if (testDuration < 10000) {
          animationRef.current = requestAnimationFrame(updateLevel);
        } else {
          // 超時但沒有偵測到聲音
          if (maxLevel < 0.05) {
            setStatus('error');
            setErrorMessage('未偵測到聲音，請確認麥克風是否正常運作');
            cleanup();
          } else {
            completeTest();
          }
        }
      };

      updateLevel();
    } catch (error) {
      setStatus('error');
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            setErrorMessage('麥克風權限被拒絕，請在瀏覽器設定中允許麥克風存取');
            break;
          case 'NotFoundError':
            setErrorMessage('找不到麥克風裝置，請確認麥克風已連接');
            break;
          default:
            setErrorMessage(`麥克風存取失敗：${error.message}`);
        }
      } else {
        setErrorMessage('麥克風存取失敗，請重試');
      }
    }
  };

  const completeTest = () => {
    setStatus('success');
    cleanup();
    onTestComplete();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const retryTest = () => {
    cleanup();
    setStatus('idle');
    setAudioLevel(0);
    setErrorMessage('');
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <div
          className={cn(
            'inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors',
            status === 'success'
              ? 'bg-emerald-500/20'
              : status === 'error'
                ? 'bg-red-500/20'
                : 'bg-violet-500/20'
          )}
        >
          {status === 'success' ? (
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          ) : status === 'error' ? (
            <AlertCircle className="w-8 h-8 text-red-400" />
          ) : (
            <Mic className="w-8 h-8 text-violet-400" />
          )}
        </div>
        <h2 className="text-xl font-bold mb-2">麥克風測試</h2>
        <p className="text-slate-400 text-sm">
          {status === 'idle' && '請允許麥克風權限並測試'}
          {status === 'requesting' && '正在請求麥克風權限...'}
          {status === 'testing' && '請對著麥克風說話...'}
          {status === 'success' && '麥克風測試成功！'}
          {status === 'error' && '麥克風測試失敗'}
        </p>
      </div>

      {/* 音量指示器 */}
      {status === 'testing' && (
        <div className="mb-6">
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-75"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">音量：{Math.round(audioLevel * 100)}%</p>
        </div>
      )}

      {/* 錯誤訊息 */}
      {errorMessage && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* 成功訊息 */}
      {status === 'success' && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-sm text-emerald-400">麥克風運作正常，您可以開始使用了！</p>
        </div>
      )}

      {/* 測試按鈕 */}
      {(status === 'idle' || status === 'error') && (
        <button
          onClick={status === 'error' ? retryTest : startTest}
          className="w-full py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors"
        >
          {status === 'error' ? '重新測試' : '開始測試'}
        </button>
      )}

      {/* 跳過按鈕（測試失敗時） */}
      {status === 'error' && (
        <button
          onClick={onTestComplete}
          className="w-full mt-2 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          跳過測試，稍後再試
        </button>
      )}
    </div>
  );
}

export default MicrophoneTest;
