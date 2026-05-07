import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

export interface OnboardingStep {
  targetId: string;
  title: string;
  description: string;
  offset?: { x?: number; y?: number };
}

interface Props {
  steps: OnboardingStep[];
  onComplete: () => void;
}

const VIEWPORT_MARGIN = 20;
const TOOLTIP_W = 288;
const TOOLTIP_H = 180;
const GAP = 16;

export const Onboarding: React.FC<Props> = ({ steps, onComplete }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom', arrowLeft: 144 });
  const [highlightPos, setHighlightPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<number | null>(null);

  const calculatePosition = () => {
    if (!steps || steps.length === 0) return;
    
    const target = document.getElementById(steps[step].targetId);
    if (!target || !tooltipRef.current) return;

    const rect = target.getBoundingClientRect();
    
    // Если элемент далеко за пределами видимости экрана
    const isOut = rect.top < 80 || rect.bottom > window.innerHeight - 80;
    
    if (isOut && scrollTargetRef.current !== step) {
      scrollTargetRef.current = step; // Помечаем, что скролл уже запущен для этого шага
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Даем браузеру время докрутить и пересчитываем позицию
      setTimeout(() => {
        const freshTarget = document.getElementById(steps[step].targetId);
        if (freshTarget) updatePosition(freshTarget.getBoundingClientRect());
      }, 500);
    } else {
      updatePosition(rect);
    }
  };

  const updatePosition = (rect: DOMRect) => {
    const offset = steps[step].offset || {};

    setHighlightPos({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    let top = rect.bottom + GAP + (offset.y || 0);
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2 + (offset.x || 0);
    let placement: 'top' | 'bottom' = 'bottom';

    // Проверяем границы экрана для тултипа
    if (top + TOOLTIP_H > window.innerHeight - VIEWPORT_MARGIN) {
      top = rect.top - TOOLTIP_H - GAP + (offset.y || 0);
      placement = 'top';
    }
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

    if (left + TOOLTIP_W > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - TOOLTIP_W - VIEWPORT_MARGIN;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    // Высчитываем, где должна быть стрелочка (чтобы на мобилке она указывала на элемент, а не в воздух)
    let arrowLeft = (rect.left + rect.width / 2) - left;
    // Ограничиваем стрелочку краями тултипа
    if (arrowLeft < 20) arrowLeft = 20;
    if (arrowLeft > TOOLTIP_W - 20) arrowLeft = TOOLTIP_W - 20;

    setPos({ top, left, placement, arrowLeft });
    setVisible(true);
  };

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => {
      calculatePosition();
    }, 150);

    const handleScroll = () => calculatePosition();
    const handleResize = () => calculatePosition();
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [step, steps]);

  if (!steps || steps.length === 0) return null;

  const next = () => step < steps.length - 1 ? setStep(s => s + 1) : finish();
  
  const finish = () => {
    setVisible(false);
    onComplete();
  };

  const currentStep = steps[step];
  const isDark = document.documentElement.classList.contains('dark');
  const arrowColor = isDark ? '#18181b' : '#ffffff';

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-black/60 transition-opacity duration-300 pointer-events-none"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={finish}
      />

      <div
        className="fixed z-[91] rounded-xl pointer-events-none transition-all duration-300"
        style={{
          top: highlightPos.top - 4,
          left: highlightPos.left - 4,
          width: highlightPos.width + 8,
          height: highlightPos.height + 8,
          borderRadius: '12px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(99, 102, 241, 0.8)',
          opacity: visible ? 1 : 0,
        }}
      />

      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[92] w-72 p-5 rounded-2xl border shadow-2xl transition-all duration-300",
          "dark:bg-zinc-900 dark:border-zinc-800 bg-white border-zinc-200"
        )}
        style={{
          top: pos.top,
          left: pos.left,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(8px)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="absolute w-0 h-0 border-8 border-transparent"
          style={{
            [pos.placement === 'bottom' ? 'bottom' : 'top']: '100%',
            left: `${pos.arrowLeft}px`,
            transform: 'translateX(-50%)',
            ...(pos.placement === 'bottom' ? { borderTopColor: arrowColor } : { borderBottomColor: arrowColor }),
          }}
        />

        <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-500 mb-1 relative z-10">
          {currentStep.title}
        </h4>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed relative z-10">
          {currentStep.description}
        </p>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-5 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-indigo-500 scale-110' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {steps.length > 1 && (
              <Button variant="ghost" size="sm" onClick={finish} className="text-xs">Пропустить</Button>
            )}
            <Button size="sm" onClick={next} className="text-xs">
              {step === steps.length - 1 ? 'OK' : 'Далее'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};