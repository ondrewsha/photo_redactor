
import React, { useMemo, useState } from 'react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const suggestions = [1, 10, 30, 60, 90, 100];

  const unitPrice = useMemo(() => {
    if (count >= 91) return 10;
    if (count >= 61) return 15;
    if (count >= 31) return 20;
    if (count >= 11) return 25;
    return 30;
  }, [count]);
  const totalPrice = useMemo(() => unitPrice * count, [unitPrice, count]);

  if (!isOpen || !user) return null;

  const handlePay = async () => {
    setLoading(true);
    try {
      const resp = await api.billing.pay({ generation_count: count });
      if (resp.confirmation_url) {
        window.location.href = resp.confirmation_url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm transition-colors",
          theme === 'dark' ? 'bg-zinc-950/80' : 'bg-white/70'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-[2rem] border shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                {t.common.profile}
              </h2>
              <p className={cn("text-sm transition-colors", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
                {user.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>

          <div
            className={cn(
              "p-6 rounded-2xl border flex justify-between items-center transition-colors",
              theme === 'dark'
                ? 'bg-indigo-900/10 border-indigo-900/30 text-white'
                : 'bg-indigo-50 border-indigo-100 text-zinc-900 shadow-[0_20px_45px_rgba(79,70,229,0.25)]'
            )}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" >
                <span className={cn(theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600')}>
                  {t.profile.balance}
                </span>
              </div>
              <div className={cn("text-3xl font-black", theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600')}>
                {user.balance}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${user.email_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {user.email_verified ? t.profile.verified : t.profile.notVerified}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t.profile.buyGenerations}</h3>
            <div className="flex gap-2">
              {suggestions.map((val) => (
                <button
                  key={val}
                  onClick={() => setCount(val)}
                  disabled={loading}
                  className={cn(
                    "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                    count === val
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                      : theme === 'dark'
                        ? "border-zinc-700 text-zinc-300 hover:border-indigo-400"
                        : "border-zinc-200 text-zinc-600 hover:border-indigo-400"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div
              className={cn(
                "p-4 rounded-xl space-y-2 transition-colors",
                theme === 'dark'
                  ? 'bg-zinc-800/50'
                  : 'bg-zinc-50 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'
              )}
            >
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{count} {t.profile.units}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-500"
                disabled={loading}
              />
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}>{t.profile.unitPrice}</span>
                <span className={cn("font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                  {unitPrice} {t.profile.currency}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>{t.profile.totalPrice}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{totalPrice} {t.profile.currency}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" isLoading={loading} onClick={handlePay}>
              {t.profile.pay}
            </Button>
          </div>

          <div className="pt-4 flex flex-col gap-2">
             <Button variant="ghost" className={cn("w-full justify-start transition-colors", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600')}>
               {t.profile.changePassword}
            </Button>
             <Button
               variant="outline"
               className={cn(
                 "w-full text-rose-600 border-rose-100 transition-colors",
                 theme === 'dark' ? 'hover:bg-rose-900/20 dark:border-rose-900/30' : 'hover:bg-rose-50'
               )}
               onClick={() => { logout(); onClose(); }}
             >
               {t.common.logout}
            </Button>
         </div>
        </div>
      </div>
    </div>
  );
};
