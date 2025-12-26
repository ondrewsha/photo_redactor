import React from 'react';
import { Button } from './ui/Button';
import { useTranslation } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0",
          theme === 'dark' ? 'bg-zinc-950/70' : 'bg-white/80'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-[2rem] border shadow-2xl transition-colors overflow-hidden",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="px-6 py-8 space-y-6">
          <div>
            <h2 className={cn("text-2xl font-black", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
              {t.footer.supportTitle}
            </h2>
            <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
              {t.footer.supportDescription}
            </p>
          </div>
          <div className="rounded-2xl border px-4 py-3 text-sm uppercase tracking-tighter text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-200">
            <span className="font-bold">{t.footer.supportEmailLabel}</span>
            <div className="text-lg font-black">{t.footer.supportEmail}</div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t.footer.supportClose}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
