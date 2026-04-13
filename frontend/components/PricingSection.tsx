import React, { useState, useMemo } from 'react';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';
import { calculateUnitPrice, calculateTotalPrice } from '../lib/pricing';

export const PricingSection: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [count, setCount] = useState(20);
  
  const unitPrice = useMemo(() => calculateUnitPrice(count), [count]);
  const totalPrice = useMemo(() => calculateTotalPrice(count), [count]);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-4xl text-center mb-16">
        <h2 className={cn(
          "text-4xl font-black uppercase tracking-tighter sm:text-5xl mb-4",
          theme === 'dark' ? 'text-white' : 'text-zinc-900'
        )}>
          Прозрачная стоимость
        </h2>
        <p className="text-zinc-500 uppercase text-sm font-bold tracking-widest">
          Чем больше пакет, тем дешевле каждая генерация
        </p>
      </div>

      <div className={cn(
        "mx-auto max-w-2xl rounded-[3rem] p-8 sm:p-12 border transition-all",
        theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-800 shadow-2xl' 
          : 'bg-white border-zinc-100 shadow-[0_40px_80px_rgba(15,23,42,0.08)]'
      )}>
        <div className="space-y-10">
          {/* Ползунок */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black uppercase tracking-widest text-indigo-500">Количество</span>
              <span className={cn("text-4xl font-black", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                {count} <span className="text-lg text-zinc-500">шт.</span>
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
              <span>10 генераций</span>
              <span>100 генераций</span>
            </div>
          </div>

          {/* Детализация */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Цена за одну</p>
              <p className={cn("text-2xl font-black", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                {unitPrice} ₽
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Итого к оплате</p>
              <p className="text-4xl font-black text-indigo-600">
                {totalPrice} ₽
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl text-center">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              ⚡️ После оплаты генерации мгновенно зачисляются на ваш аккаунт.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};