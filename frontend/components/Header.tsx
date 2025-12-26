import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import { cn } from '../lib/cn';
import { Locale } from '../types';

interface Props {
  onAuthClick: (tab: 'login' | 'register') => void;
  onProfileClick: () => void;
}

export const Header: React.FC<Props> = ({ onAuthClick, onProfileClick }) => {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme, isDark } = useTheme();
  const [langOpen, setLangOpen] = useState(false);

  const headerClass = cn(
    "sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors",
    theme === 'dark'
      ? 'border-zinc-800 bg-zinc-950/80 text-white'
      : 'border-zinc-200 bg-white/70 text-zinc-900'
  );

  const brandClass = cn(
    "text-lg font-black tracking-tighter uppercase transition-colors",
    theme === 'dark' ? 'text-white' : 'text-zinc-900'
  );

  const langMenuClass = cn(
    "absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border p-2 shadow-2xl transition-colors",
    theme === 'dark'
      ? 'border-zinc-800 bg-zinc-900 text-white'
      : 'border-zinc-200 bg-white text-zinc-900'
  );

  const profileButtonClass = cn(
    "flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-2xl border transition-all group",
    theme === 'dark'
      ? 'bg-zinc-1000 border-zinc-900 text-white shadow-[0_10px_25px_rgba(0,0,0,0.7)] hover:border-transparent hover:bg-zinc-800'
      : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-100',
    theme === 'light' ? 'shadow-[0_15px_30px_rgba(15,23,42,0.1)]' : ''
  );

  const profileBalanceTone = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';

  const profileCircleClass = cn(
    "h-10 w-10 rounded-xl flex items-center justify-center font-bold transition-colors duration-200",
    theme === 'dark'
      ? 'bg-indigo-600 text-white shadow-indigo-500/20'
      : 'bg-indigo-600 text-white hover:bg-indigo-500/90'
  );

  const languages: { code: Locale; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
    { code: 'de', label: 'Deutsch' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
    { code: 'kk', label: 'Қазақша' },
  ];

  return (
    <header className={headerClass}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 transition-all group-hover:rotate-12 group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className={brandClass}>NanoVisual</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLangOpen(!langOpen)}
              className="uppercase font-black tracking-widest text-[10px] w-12 h-10 rounded-xl"
            >
              {locale}
            </Button>
            {langOpen && (
              <div className={langMenuClass}>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLocale(l.code);
                      setLangOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-tight transition-colors",
                      locale === l.code
                        ? "bg-indigo-600 text-white"
                        : theme === 'dark'
                          ? "text-zinc-300 hover:bg-zinc-800"
                          : "text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    {l.label}
                    {locale === l.code && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-xl"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </Button>

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={onProfileClick}
                className={profileButtonClass}
              >
                <div className="text-right hidden sm:block">
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${profileBalanceTone}`}>{t.profile.balance}</div>
                  <div className="text-sm font-black text-indigo-600">{user.balance}</div>
                </div>
                <div className={profileCircleClass}>
                  {user.email[0].toUpperCase()}
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onAuthClick('login')} className="hidden sm:flex">
                {t.common.login}
              </Button>
              <Button onClick={() => onAuthClick('register')} className="shadow-lg shadow-indigo-500/20">
                {t.common.register}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
