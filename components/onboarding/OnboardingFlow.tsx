'use client';

// ============================================
// 首次引導流程
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PrivacyNotice } from './PrivacyNotice';
import { MicrophoneTest } from './MicrophoneTest';
import { WelcomeStep } from './WelcomeStep';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'privacy' | 'microphone' | 'complete';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [microphoneTested, setMicrophoneTested] = useState(false);

  const steps = [
    { id: 'welcome', label: '歡迎' },
    { id: 'privacy', label: '隱私' },
    { id: 'microphone', label: '麥克風' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleNext = () => {
    switch (step) {
      case 'welcome':
        setStep('privacy');
        break;
      case 'privacy':
        if (privacyAccepted) {
          setStep('microphone');
        }
        break;
      case 'microphone':
        if (microphoneTested) {
          onComplete();
        }
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'privacy':
        setStep('welcome');
        break;
      case 'microphone':
        setStep('privacy');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 進度指示器 */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    index <= currentStepIndex
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  )}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-1',
                      index < currentStepIndex ? 'bg-violet-500' : 'bg-slate-700'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 內容區 */}
        <div className="px-6 pb-6">
          {step === 'welcome' && <WelcomeStep />}
          {step === 'privacy' && (
            <PrivacyNotice
              accepted={privacyAccepted}
              onAcceptChange={setPrivacyAccepted}
            />
          )}
          {step === 'microphone' && (
            <MicrophoneTest
              tested={microphoneTested}
              onTestComplete={() => setMicrophoneTested(true)}
            />
          )}
        </div>

        {/* 按鈕區 */}
        <div className="px-6 pb-6 flex gap-3">
          {step !== 'welcome' && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
            >
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              (step === 'privacy' && !privacyAccepted) ||
              (step === 'microphone' && !microphoneTested)
            }
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-colors',
              (step === 'privacy' && !privacyAccepted) ||
              (step === 'microphone' && !microphoneTested)
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-violet-500 text-white hover:bg-violet-600'
            )}
          >
            {step === 'microphone' ? '開始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;
