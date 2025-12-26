
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../context/I18nContext';
import { Button } from './ui/Button';
import { StyleCategoryPublic } from '../types';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';
import { gradientForStyle } from '../lib/gradients';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  styles: StyleCategoryPublic[];
  selectedStyleIds: string[];
  onToggleStyle: (id: string) => void;
}

export const StylesLibraryModal: React.FC<Props> = ({ isOpen, onClose, styles, selectedStyleIds, onToggleStyle }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { theme } = useTheme();
  const styleNameMap = t.generator.styleNames;
  const getStyleLabel = (style: StyleCategoryPublic) =>
    styleNameMap?.[style.id] ?? style.display_name;

  const filteredStyles = useMemo(() => {
    const query = search.toLowerCase();
    return styles.filter((s) => {
      const label = getStyleLabel(s).toLowerCase();
      return label.includes(query) || s.display_name.toLowerCase().includes(query);
    });
  }, [styles, search, styleNameMap]);

  const categories = useMemo(() => {
    const map = new Map<string, StyleCategoryPublic[]>();
    filteredStyles.forEach(s => {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries());
  }, [filteredStyles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm transition-colors",
          theme === 'dark' ? 'bg-zinc-950/70' : 'bg-white/70'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden rounded-[2rem] border shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900 shadow-[0_25px_60px_rgba(15,23,42,0.08)]'
        )}
      >
        <div className={cn(
          "p-6 flex justify-between items-center border-b transition-colors",
          theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
        )}>
          <h2 className={cn("text-xl font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>{t.generator.openLibrary}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
           <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </Button>
      </div>
        
        <div className={cn("p-6 transition-colors", theme === 'dark' ? 'bg-zinc-900/30' : 'bg-zinc-50')}>
          <input 
            type="text" 
            placeholder={t.generator.searchStyles} 
            className={cn(
              "w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-800 text-white'
                : 'border-zinc-200 bg-white text-zinc-900'
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {categories.length === 0 && (
            <div className="text-center py-12 text-zinc-500 font-bold uppercase tracking-widest">{t.generator.noStylesFound}</div>
          )}
          {categories.map(([cat, items]) => (
            <div key={cat} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{cat}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map(s => (
                      <button
                        key={s.id}
                        onClick={() => onToggleStyle(s.id)}
                        className={cn(
                          "group relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all active:scale-95",
                          selectedStyleIds.includes(s.id) ? "ring-4 ring-indigo-500 border-transparent" : "border-zinc-200 dark:border-zinc-800"
                        )}
                        style={{ backgroundImage: gradientForStyle(s.id) }}
                      >
                        <div className="absolute inset-0 bg-black/20" />
                          <div className="relative z-10 flex h-full flex-col justify-center p-4 text-white">
                            <span className="text-[12px] font-bold uppercase leading-snug">{getStyleLabel(s)}</span>
                          </div>
                        {selectedStyleIds.includes(s.id) && (
                          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
            </div>
          ))}
        </div>

        <div className={cn(
            "p-6 flex justify-end border-t transition-colors",
            theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
          )}>
          <Button onClick={onClose} size="lg">{t.common.done}</Button>
        </div>
      </div>
    </div>
  );
};
