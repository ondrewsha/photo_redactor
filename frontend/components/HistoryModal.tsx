import React from 'react';
import { Button } from './ui/Button';
import { HistoryItem } from '../types';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/I18nContext';
import { HistoryCard } from './HistoryCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  getStyleLabel: (id: string) => string;
  onDownload: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  onOpen: (item: HistoryItem) => void;
  page: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
}

export const HistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  getStyleLabel,
  onDownload,
  onDelete,
  onOpen,
  page,
  total,
  limit,
  onPageChange,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (!isOpen) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

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
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {items.map((item) => {
                const ids = Array.isArray(item.style_ids) ? item.style_ids : [];
                const styleLabels = ids.length
                  ? ids.map((id) => getStyleLabel(id))
                  : [t.generator.defaultStyle];
                return (
                <HistoryCard
                    key={item.job_id}
                    item={item}
                    styleNames={styleLabels}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onOpen={onOpen}
                    className="w-full max-w-xs md:max-w-none"
                  />
                );
              })}
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-t",
          theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
        )}>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
              {t.history.prev}
            </Button>
            <span>
              {t.history.pageLabel} {page} / {totalPages}
            </span>
            <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
              {t.history.next}
            </Button>
          </div>
          <Button onClick={onClose}>{t.history.modalClose}</Button>
        </div>
      </div>
    </div>
  );
};
