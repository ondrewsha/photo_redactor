import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';

interface Step {
  targetId: string;
  title: string;
  description: string;
  offset?: { x?: number; y?: number };
}

const STEPS: Step[] = [
  { targetId: 'onb-prompt', title: 'Шаг 1. Промпт', description: 'Опишите, что хотите создать. Или нажмите 🎤 для голосового ввода.', offset: { y: 8 } },
  { targetId: 'onb-styles', title: 'Шаг 2. Стили и размер', description: 'Выберите художественный стиль и формат изображения.', offset: { x: -20 } },
  { targetId: 'onb-generate', title: 'Шаг 3. Генерация', description: 'Нажмите кнопку, и нейросеть создаст изображение. Стоимость: 1 NV.', offset: { x: -40, y: -20 } },
];

const VIEWPORT_MARGIN = 20;
const TOOLTIP_W = 288;
const TOOLTIP_H = 180;
const GAP = 16;

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' });
  const [highlightPos, setHighlightPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    const target = document.getElementById(STEPS[step].targetId);
    if (!target || !tooltipRef.current) return;

    const rect = target.getBoundingClientRect();
    const offset = STEPS[step].offset || {};

    // Для highlight используем viewport coordinates (без scroll)
    setHighlightPos({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    // Расчёт позиции тултипа (тоже viewport coordinates)
    let top = rect.bottom + GAP + (offset.y || 0);
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2 + (offset.x || 0);
    let placement: 'top' | 'bottom' = 'bottom';

    if (top + TOOLTIP_H > window.innerHeight - VIEWPORT_MARGIN) {
      top = rect.top - TOOLTIP_H - GAP + (offset.y || 0);
      placement = 'top';
    }
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

    if (left + TOOLTIP_W > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - TOOLTIP_W - VIEWPORT_MARGIN;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    setPos({ top, left, placement });
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
  }, [step]);

  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
  const finish = () => {
    localStorage.setItem('nv_onboarding_done', 'true');
    onComplete();
  };

  const currentStep = STEPS[step];
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
            left: '50%',
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
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-5 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-indigo-500 scale-110' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={finish} className="text-xs">Пропустить</Button>
            <Button size="sm" onClick={next} className="text-xs">
              {step === STEPS.length - 1 ? 'Начать' : 'Далее'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};