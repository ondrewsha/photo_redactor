import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { GalleryItem } from '../types';
import { api, resolveAssetUrl } from '../lib/api';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCopyPrompt: (prompt: string) => void;
  getStyleLabel: (id: string) => string; // Добавили пропс для стилей
}

export const GalleryModal: React.FC<Props> = ({ isOpen, onClose, onCopyPrompt, getStyleLabel }) => {
  const { theme } = useTheme();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null); // Стейт для открытой картинки

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.gallery.list().then(res => setItems(res.items)).finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={cn("absolute inset-0 transition-colors", theme === 'dark' ? 'bg-black/80' : 'bg-white/80')} onClick={onClose} />
        <div className={cn(
          "relative w-full max-w-6xl h-[85vh] flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] border shadow-2xl transition-colors",
          theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900'
        )}>
          
          {/* ЛЕВАЯ ПАНЕЛЬ: Советы */}
          <div className={cn("w-full md:w-80 flex flex-col p-6 border-b md:border-b-0 md:border-r overflow-y-auto", theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-slate-50/50')}>
            <h2 className="text-xl font-black uppercase tracking-tighter mb-4">Как писать промпты?</h2>
            
            <div className="space-y-3 text-sm mb-6">
              <p>1. <b>Формула:</b> Объект + Окружение + Освещение + Детали.</p>
              <p>2. <b>Конкретика:</b> ИИ не понимает "сделай красиво". Пишите "студийный свет", "макро съемка".</p>
              <p>3. <b>Отрицания:</b> Избегайте слова "без". Лучше описывайте то, что <i>должно</i> быть в кадре.</p>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Мастер-шаблоны</h3>
            <div className="space-y-3 mb-6">
              {[
                {
                  title: "📦 Маркетплейс (По фото товара)",
                  text: "Интегрировать объект с входного фото в новую сцену:[ОПИСАНИЕ СЦЕНЫ, например: стоит на белом мраморном подиуме, вокруг брызги чистой воды]. Профессиональная предметная съемка, мягкие реалистичные тени от объекта, студийный свет. Коммерческое качество. Обязательно оставить свободное место [СВЕРХУ/СБОКУ] для рекламного текста."
                },
                {
                  title: "👤 Замена фона/одежды (По фото человека)",
                  text: "Сохранить черты лица и позу человека с входного фото. Изменить окружение: персонаж находится в [НОВАЯ ЛОКАЦИЯ, например: киберпанк-городе под неоновым дождем]. Одет в [НОВАЯ ОДЕЖДА, например: футуристичный плащ]. Освещение:[КАКОЙ СВЕТ, например: контрастный синий и розовый неон]. Кинематографичный кадр, фотореализм."
                },
                {
                  title: "🎨 Генерация с нуля (Абстракция/Сюжет)",
                  text: "[ОСНОВНОЙ СЮЖЕТ, например: Древний замок, парящий в облаках на закате].[АТМОСФЕРА И ДЕТАЛИ, например: водопады, стекающие в бездну, стаи птиц]. Освещение:[ТИП СВЕТА, например: золотые лучи сквозь туман]. Стиль:[ЖЕЛАЕМЫЙ СТИЛЬ, например: фэнтези концепт-арт, эпично]. Детализация высокая, широкая композиция."
                }
              ].map((tmpl, idx) => (
                <div key={idx} className={cn("p-3 rounded-2xl border transition-colors", theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200')}>
                  <div className="font-bold text-sm mb-1">{tmpl.title}</div>
                  <p className="text-[11px] mb-3 text-zinc-500 dark:text-zinc-400 leading-relaxed">{tmpl.text}</p>
                  <Button size="sm" variant="secondary" className="w-full text-xs" onClick={() => { onCopyPrompt(tmpl.text); onClose(); }}>
                    Использовать
                  </Button>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" className="mt-auto w-full" onClick={onClose}>Закрыть</Button>
          </div>

          {/* ПРАВАЯ ПАНЕЛЬ: Галерея */}
          <div className="flex-1 p-6 overflow-y-auto relative">
            <h2 className="text-lg font-bold uppercase tracking-[0.2em] mb-6">Примеры и идеи</h2>
            {loading ? (
              <div className="animate-pulse">Загрузка...</div>
            ) : (
              <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                {items.map(item => (
                  <div key={item.id} className={cn("break-inside-avoid rounded-2xl border p-4 flex flex-col gap-3 group", theme === 'dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white')}>
                    
                    {/* Исходники: Всегда маленькие в ряд */}
                    {item.input_images && item.input_images.length > 0 && (
                      <div className="mb-1">
                        <div className="text-[10px] font-bold uppercase text-indigo-500 mb-1.5">Исходные фото</div>
                        <div className="flex flex-wrap gap-2">
                          {item.input_images.map((img, i) => (
                            <img 
                              key={i} 
                              src={resolveAssetUrl(img) || undefined} 
                              className="rounded-lg w-12 h-12 object-cover border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:scale-110 transition-transform shadow-sm" 
                              alt="Исходник" 
                              onClick={() => setFullscreenImage(img)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Результат: Центрирование, если фото одно */}
                    <div className="text-[10px] font-bold uppercase text-emerald-500 mb-[-4px]">Результат</div>
                    <div className={cn(
                      "grid gap-2",
                      item.result_images.length === 1 ? "flex justify-center" : "grid-cols-2"
                    )}>
                      {item.result_images.map((img, i) => (
                        <img 
                          key={i} 
                          src={resolveAssetUrl(img) || undefined} 
                          className={cn(
                            "rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-md",
                            item.result_images.length === 1 ? "max-h-80 w-auto" : "w-full aspect-[3/4]"
                          )} 
                          alt="Пример" 
                          onClick={() => setFullscreenImage(img)}
                        />
                      ))}
                    </div>
                    
                    {/* Промпт */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-3 group-hover:line-clamp-none transition-all leading-relaxed">
                      "{item.prompt}"
                    </p>
                    
                    {/* Стили */}
                    {item.style_ids && item.style_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.style_ids.map(id => (
                          <span key={id} className={cn("px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-bold border", theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-500')}>
                            {getStyleLabel(id)}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button size="sm" variant="secondary" onClick={() => { onCopyPrompt(item.prompt); onClose(); }}>
                      Скопировать промпт
                    </Button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-zinc-500 text-sm">Галерея пока пуста.</p>}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Полноэкранный просмотрщик картинок */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={resolveAssetUrl(fullscreenImage) || undefined} 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" 
            alt="Увеличенное фото" 
          />
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors backdrop-blur-sm"
            onClick={() => setFullscreenImage(null)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </>
  );
};