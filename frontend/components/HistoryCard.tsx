import React from 'react';

import { HistoryItem } from '../types';
import { resolveAssetUrl } from '../lib/api';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/I18nContext';

interface HistoryCardProps {
  item: HistoryItem;
  styleNames: string[];
  onDownload: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  onOpen: (item: HistoryItem) => void;
  className?: string;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  styleNames,
  onDownload,
  onDelete,
  onOpen,
  className,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const historyCardRoot = cn(
    "flex flex-col overflow-hidden rounded-[1.75rem] border shadow-lg transition-colors",
    theme === 'dark'
      ? 'border-zinc-800 bg-zinc-900 text-white'
      : 'border-zinc-200 bg-white text-zinc-900',
    className,
  );

  const iconButtonClass = cn(
    "h-9 w-9 rounded-2xl flex items-center justify-center border transition-colors",
    theme === 'dark'
      ? 'border-white/30 bg-black/30 text-white hover:border-white hover:bg-white/10'
      : 'border-zinc-200 bg-white text-zinc-900 hover:border-indigo-500 hover:bg-indigo-50'
  );

  const gradientBg =
    theme === 'dark'
      ? 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(59,56,72,0.95))'
      : 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(226,232,240,0.9))';

  return (
    <div className={historyCardRoot}>
      <div
        className="relative h-28 overflow-hidden flex items-center justify-center"
        style={{ background: gradientBg }}
      >
        <img
          src={resolveAssetUrl(item.image_url)}
          alt={t.history.promptLabel}
          className="max-h-full max-w-full object-contain"
        />
        <div className="absolute inset-0 flex items-start justify-end p-3 gap-2 opacity-0 transition-all hover:opacity-100">
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => onDownload(item)}
            aria-label={t.history.download}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4" />
            </svg>
          </button>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => onDelete(item)}
            aria-label={t.history.delete}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 11v6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11v6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
            </svg>
          </button>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => onOpen(item)}
            aria-label={t.history.open}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h3m7 0h3m-5-5V4m0 16v-3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h4v4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 20H4v-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 16v4h-4" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="text-[10px] uppercase tracking-[0.45em] text-zinc-400">{t.history.promptLabel}</p>
        <p className="text-sm font-semibold leading-snug break-words">{item.user_prompt || item.final_prompt || '—'}</p>
        {styleNames.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-[0.45em] text-zinc-400">
              {t.history.stylesLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {styleNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-current px-3 py-1 text-[11px] uppercase tracking-[0.3em]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
        <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-400">
          {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};
