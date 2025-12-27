import React from 'react';
import { Button } from './ui/Button';
import { HistoryItem } from '../types';
import { cn } from '../lib/cn';
import { resolveAssetUrl } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/I18nContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, items }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 transition-colors",
          theme === 'dark' ? 'bg-black/80' : 'bg-white/70'
        )}
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden rounded-[2rem] border shadow-2xl transition-colors",
        theme === 'dark'
          ? 'border-zinc-800 bg-zinc-900 text-white'
          : 'border-zinc-200 bg-white text-zinc-900 shadow-[0_35px_90px_rgba(15,23,42,0.15)]'
      )}>
        <div className={cn(
          "flex items-center justify-between px-6 py-5 border-b",
          theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
        )}>
          <h3 className="text-lg font-bold uppercase tracking-[0.45em]">{t.history.modalTitle}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-sm font-bold uppercase tracking-widest text-zinc-500">{t.history.empty}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.job_id}
                  className={cn(
                    "overflow-hidden rounded-[1.5rem] border shadow-lg transition-colors",
                    theme === 'dark'
                      ? 'border-zinc-800 bg-zinc-900'
                      : 'border-zinc-200 bg-white'
                  )}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={resolveAssetUrl(item.image_url)}
                      alt={t.history.promptLabel}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-[10px] uppercase tracking-[0.45em] text-zinc-400">{t.history.promptLabel}</p>
                    <p className="text-sm font-semibold leading-snug text-zinc-900 dark:text-white">{item.prompt}</p>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={cn(
          "flex justify-end px-6 py-4 border-t",
          theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
        )}>
          <Button onClick={onClose}>{t.history.modalClose}</Button>
        </div>
      </div>
    </div>
  );
};
