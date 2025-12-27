
import React, { ChangeEvent, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { api, resolveAssetUrl } from '../lib/api';
import { 
  StyleCategoryPublic, 
  GenerationCapabilities, 
  JobStatus,
  ImageSizePreset,
  HistoryItem 
} from '../types';
import { cn } from '../lib/cn';
import { StylesLibraryModal } from './StylesLibraryModal';
import { HistoryModal } from './HistoryModal';
import { HistoryCard } from './HistoryCard';
import { useTheme } from '../context/ThemeContext';
import { gradientForStyle } from '../lib/gradients';

export const Generator: React.FC = () => {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const { theme } = useTheme();
  const HISTORY_INLINE_LIMIT = 3;
  
  const [prompt, setPrompt] = useState('');
  const [styles, setStyles] = useState<StyleCategoryPublic[]>([]);
  const [caps, setCaps] = useState<GenerationCapabilities | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  
  const [phase, setPhase] = useState<JobStatus | 'idle'>('idle');
  const [, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [rawResultPath, setRawResultPath] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [fullscreenItem, setFullscreenItem] = useState<HistoryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lightPanelShadow = "shadow-[0_30px_70px_rgba(15,23,42,0.08)]";
  const lightPromptShadow = "shadow-[0_35px_75px_rgba(15,23,42,0.1)]";

  const sidePanelClasses = cn(
    "rounded-[2rem] border p-8 transition-colors",
    theme === 'dark'
      ? 'border-zinc-800 bg-zinc-900 text-white shadow-2xl'
      : `border-zinc-200 bg-white text-zinc-900 ${lightPanelShadow}`
  );

  const mainPanelClasses = cn(
    "flex-1 rounded-[3rem] border p-4 relative overflow-hidden min-h-[500px] flex items-center justify-center transition-colors",
    theme === 'dark'
      ? 'border-zinc-800 bg-zinc-900 text-white shadow-2xl'
      : `border-zinc-200 bg-white text-zinc-900 ${lightPromptShadow}`
  );

  const overlayClasses = cn(
    "absolute inset-0 flex flex-col items-center justify-center p-12 space-y-10 z-10 backdrop-blur-sm transition-colors",
    theme === 'dark' ? 'bg-zinc-900/80 text-white' : 'bg-white/85 text-zinc-900 shadow-[0_25px_60px_rgba(15,23,42,0.15)]'
  );

  const textTone = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const mutedTone = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';

  const getStyleLabel = useCallback(
    (style: StyleCategoryPublic) => t.generator.styleNames?.[style.id] ?? style.display_name,
    [t.generator.styleNames]
  );

  const styleLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    styles.forEach((style) => {
      map.set(style.id, getStyleLabel(style));
    });
    map.set('none', t.generator.defaultStyle);
    return map;
  }, [styles, getStyleLabel, t.generator.defaultStyle]);

  const getStyleLabelById = useCallback(
    (id: string) => styleLabelMap.get(id) || id,
    [styleLabelMap]
  );

  const historyStyleLabels = useCallback(
    (entry: HistoryItem) => {
      const ids = Array.isArray(entry.style_ids) ? entry.style_ids : [];
      if (!ids.length) return [t.generator.defaultStyle];
      const labels = ids.map((id) => getStyleLabelById(id));
      return labels.length ? labels : [t.generator.defaultStyle];
    },
    [getStyleLabelById, t.generator.defaultStyle]
  );

  const getPresetLabel = (preset: ImageSizePreset) => {
    const sizeKey = `${preset.width}x${preset.height}`;
    return (
      t.generator.sizeLabels?.[sizeKey] ??
      preset.label ??
      `${preset.width}×${preset.height}`
    );
  };

  const isGemini = caps?.image_provider === 'gemini';
  const geminiAspectRatioOptions = useMemo(() => {
    if (!caps) return [];
    const seen = new Map<string, boolean>();
    caps.size_presets.forEach((preset) => {
      if (preset.aspect_ratio) {
        seen.set(preset.aspect_ratio, true);
      }
    });
    return Array.from(seen.keys());
  }, [caps]);
  const geminiQualityOptions = useMemo(() => {
    if (!caps) return [];
    const seen = new Map<string, boolean>();
    caps.size_presets.forEach((preset) => {
      if (preset.quality) {
        seen.set(preset.quality, true);
      }
    });
    return Array.from(seen.keys());
  }, [caps]);

  useEffect(() => {
    if (!caps) return;
    if (caps.image_provider === 'gemini') {
      if (geminiAspectRatioOptions.length) {
        setSelectedAspectRatio((prev) =>
          geminiAspectRatioOptions.includes(prev) ? prev : geminiAspectRatioOptions[0]
        );
      }
      if (geminiQualityOptions.length) {
        setSelectedQuality((prev) =>
          geminiQualityOptions.includes(prev) ? prev : geminiQualityOptions[0]
        );
      }
      setSelectedSizeId('');
    } else if (caps.size_presets.length) {
      setSelectedSizeId((prev) =>
        caps.size_presets.some((preset) => preset.id === prev) ? prev : caps.size_presets[0].id
      );
      setSelectedAspectRatio('');
      setSelectedQuality('');
    }
  }, [caps, geminiAspectRatioOptions, geminiQualityOptions]);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    try {
      const data = await api.history.list(12);
      setHistory(data.items);
    } catch (err) {
      console.error('Не удалось загрузить историю генераций', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }
    loadHistory();
  }, [user, loadHistory]);

  const selectedPreset = useMemo(() => {
    if (!caps) return undefined;
    if (caps.image_provider === 'gemini' && selectedAspectRatio && selectedQuality) {
      return caps.size_presets.find(
        (preset) => preset.aspect_ratio === selectedAspectRatio && preset.quality === selectedQuality
      );
    }
    return caps.size_presets.find((preset) => preset.id === selectedSizeId);
  }, [caps, selectedAspectRatio, selectedQuality, selectedSizeId]);

  const sizeButtonClass = (selected: boolean) =>
    cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all text-sm",
      selected
        ? theme === 'dark'
          ? "border-indigo-600 bg-indigo-900/20 text-indigo-400 shadow-lg"
          : "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg"
        : theme === 'dark'
          ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900/60"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
    );

  const optionButtonClass = (selected: boolean) =>
    cn(
      "w-full px-4 py-[0.85rem] text-left rounded-2xl border text-sm font-semibold uppercase tracking-tight transition-all",
      selected
        ? theme === "dark"
          ? "border-indigo-500 bg-indigo-900/20 text-indigo-100 shadow-lg"
          : "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg"
        : theme === "dark"
          ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900/60"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
    );

  const hintBadgeClass = theme === 'dark' ? 'bg-rose-900/10 text-rose-200' : 'bg-rose-50 text-rose-600';
  const outOfBalanceClass = theme === 'dark'
    ? 'mt-4 px-8 py-3 rounded-2xl border border-rose-900/30 bg-rose-900/10 text-rose-200 text-xs font-bold uppercase tracking-widest text-center'
    : 'mt-4 px-8 py-3 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 text-xs font-bold uppercase tracking-widest text-center';

  const actionButtonClasses = (variant: 'save' | 'cancel') =>
    cn(
      "h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl transition-colors",
      variant === 'save'
        ? (theme === 'dark'
            ? 'bg-white text-zinc-900 hover:bg-indigo-500 hover:text-white'
            : 'bg-white text-zinc-900 hover:bg-indigo-600 hover:text-white')
        : (theme === 'dark'
            ? 'bg-zinc-900 text-white hover:bg-rose-600'
            : 'bg-zinc-50 text-zinc-900 hover:bg-rose-100')
    );

  const generateButtonClass = cn(
    "h-20 w-20 rounded-[2rem] transition-colors",
    theme === 'dark'
      ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30'
      : 'bg-indigo-500 text-white shadow-[0_35px_80px_rgba(79,70,229,0.45)] hover:bg-indigo-600'
  );
  const selectedPresetLabelClass = cn(
    "md:col-span-2 text-[11px] uppercase tracking-[0.3em]",
    theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
  );
  const historyPanelClass = cn(
    "w-full rounded-[2rem] border p-6 transition-colors",
    theme === 'dark'
      ? 'border-zinc-800 bg-zinc-900/80 text-white shadow-2xl'
      : 'border-zinc-200 bg-white text-zinc-900 shadow-[0_25px_60px_rgba(15,23,42,0.08)]'
  );
  const historyLabelClass = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        const [stylesData, capsData] = await Promise.all([
          api.generation.categories(),
          api.generation.capabilities()
        ]);
        setStyles(stylesData || []);
        setCaps(capsData);
        if (capsData?.size_presets?.length) {
          setSelectedSizeId(capsData.size_presets[0].id);
        }
      } catch (e: any) {
        console.error('Failed to load generator data', e);
        setError(e.message || t.common.error);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [t.common.error]);

  useEffect(() => {
    const urls = uploadedPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadedPhotos]);

  const maxPhotos = Math.max(1, caps?.max_photos ?? 4);
  const canUploadPhotos = Boolean(caps?.supports_source_images);
  const photoLimitText = t.generator.photoLimit.replace('{limit}', String(maxPhotos));

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    setUploadedPhotos((prev) => {
      const merged = [...prev, ...files];
      return merged.slice(0, maxPhotos);
    });
    event.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const openPhotoDialog = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || phase === 'processing' || phase === 'pending' || !user) return;
    
    setPhase('pending');
    setProgress(0);
    setError(null);
    setResultUrl(null);

    try {
      const preset = selectedPreset;
      const styleIds = selectedStyles.length ? selectedStyles : ['none'];
      const payload = {
        style_ids: styleIds,
        user_input: prompt,
        width: preset?.width || 1024,
        height: preset?.height || 1024
      };
      const { job_id } =
        uploadedPhotos.length > 0 && canUploadPhotos
          ? await api.generation.generateWithPhotos({
              ...payload,
              photos: uploadedPhotos.slice(0, maxPhotos),
            })
          : await api.generation.generate(payload);
      setCurrentJobId(job_id);

      const poll = async () => {
        try {
          const status = await api.generation.status(job_id);
          setPhase(status.status);
          setProgress(status.progress || 0);

          if (status.status === 'completed') {
            if (status.result) {
              setRawResultPath(status.result.image_url);
              setResultUrl(resolveAssetUrl(status.result.image_url));
              void loadHistory();
            } else {
              setError('No image result');
            }
            refresh();
            return;
          }

          if (status.status === 'failed') {
            setError(status.error_message || 'Failed');
            return;
          }

          setTimeout(poll, 1500);
        } catch (e) {
          setError(t.common.error);
          setPhase('failed');
        }
      };
      
      poll();
    } catch (e: any) {
      setError(e.message);
      setPhase('failed');
    }
  };

  const buildDownloadUrl = useCallback((imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    const raw = imageUrl.startsWith('http')
      ? new URL(imageUrl).pathname
      : imageUrl;
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `/api${normalized}`;
  }, []);

  const downloadHref = useMemo(() => buildDownloadUrl(rawResultPath), [rawResultPath, buildDownloadUrl]);

  const downloadResource = async (url: string, jobId: string) => {
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const candidateExt = url
        .split('/')
        .pop()
        ?.split(/[\?#]/)[0]
        ?.split('.')
        .pop();
      const mimeExt = blob.type.split('/').pop()?.replace('jpeg', 'jpg');
      const extension = candidateExt || mimeExt || 'webp';
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${jobId}.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleHistoryDownload = (item: HistoryItem) => {
    const downloadLink = buildDownloadUrl(item.image_url);
    if (!downloadLink) return;
    downloadResource(downloadLink, item.job_id);
  };

  const handleHistoryDelete = async (item: HistoryItem) => {
    if (!window.confirm(t.history.deleteConfirm)) return;
    try {
      await api.history.delete(item.job_id);
      setHistory((prev) => prev.filter((entry) => entry.job_id !== item.job_id));
      if (fullscreenItem?.job_id === item.job_id) {
        setFullscreenItem(null);
      }
    } catch (err) {
      console.error('Failed to delete history entry', err);
    }
  };

  const handleHistoryOpen = (item: HistoryItem) => {
    setFullscreenItem(item);
  };

  const closeFullscreen = () => setFullscreenItem(null);

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => {
      if (id === 'none') return [];
      return prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
    });
  };

  if (isInitializing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest animate-pulse">{t.generator.initializing}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        
        <div className="lg:col-span-4 space-y-8">
          <div className={sidePanelClasses}>
            <h3 className={cn("text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2", mutedTone)}>
              <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              {t.generator.styles}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <button
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tighter transition-colors border",
                  selectedStyles.length === 0
                    ? "border-zinc-200 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 bg-transparent"
                    : "border-red-400 text-red-500 hover:bg-red-500 hover:text-white bg-transparent"
                )}
                onClick={() => setSelectedStyles([])}
              >
                {t.generator.defaultStyle}
              </button>
              {styles
                .filter((style) => selectedStyles.includes(style.id))
                .map((style) => (
                  <button
                    key={style.id}
                    onClick={() => toggleStyle(style.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tighter transition-all text-white shadow-lg border border-transparent"
                    style={{ backgroundImage: gradientForStyle(style.id) }}
                  >
                    {getStyleLabel(style)}
                  </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full h-12 rounded-xl" onClick={() => setLibraryOpen(true)}>
              {t.generator.openLibrary}
            </Button>

            <h3 className={cn("text-sm font-bold uppercase tracking-widest mt-10 mb-6 flex items-center gap-2", mutedTone)}>
               <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
               {t.generator.size}
            </h3>
            {isGemini ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-zinc-400">{t.generator.aspectRatio}</p>
                  <div className="space-y-2">
                    {geminiAspectRatioOptions.map((ratio) => (
                      <button
                        key={`ratio-${ratio}`}
                        onClick={() => setSelectedAspectRatio(ratio)}
                        className={optionButtonClass(selectedAspectRatio === ratio)}
                      >
                        <span className="block leading-snug">{ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.45em] text-zinc-400">{t.generator.quality}</p>
                  <div className="space-y-2">
                    {geminiQualityOptions.map((quality) => (
                      <button
                        key={`quality-${quality}`}
                        onClick={() => setSelectedQuality(quality)}
                        className={optionButtonClass(selectedQuality === quality)}
                      >
                        <span className="block leading-snug">{quality}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {selectedPreset && (
                  <p className={selectedPresetLabelClass}>
                    {getPresetLabel(selectedPreset)} • {selectedPreset.width}×{selectedPreset.height}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {caps?.size_presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedSizeId(p.id)}
                    className={sizeButtonClass(selectedSizeId === p.id)}
                  >
                    <span className="font-bold uppercase tracking-tight">{getPresetLabel(p)}</span>
                    <span className="text-[10px] opacity-60 font-mono">
                      {p.width}×{p.height}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-10 space-y-3">
              <h3 className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2", mutedTone)}>
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4C7.029 4 3 8.029 3 13c0 4.971 4.029 9 9 9s9-4.029 9-9c0-4.971-4.029-9-9-9zM12 6.5v.01M12 11.25a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" /></svg>
                {t.generator.photos}
              </h3>
              <p className={cn("text-xs leading-relaxed", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
                {canUploadPhotos ? t.generator.photoInstructions : t.generator.photoUnavailable}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1 shadow-lg"
                  onClick={openPhotoDialog}
                  disabled={!canUploadPhotos}
                >
                  {t.generator.uploadPhoto}
                </Button>
                <span className={cn("text-[11px] uppercase tracking-wider font-bold", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400')}>
                  {photoLimitText}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelection}
              />
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {photoPreviews.map((preview, index) => (
                    <div
                      key={`${preview}-${index}`}
                      className={cn(
                        "relative h-20 overflow-hidden rounded-2xl border transition-all",
                        theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200',
                      )}
                    >
                      <img src={preview} alt={`Uploaded photo ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className={cn(
                          "absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                          theme === 'dark'
                            ? 'bg-white/10 text-white hover:bg-white/20 border border-zinc-700'
                            : 'bg-white text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
                        )}
                        onClick={() => handleRemovePhoto(index)}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col">
          <div className={mainPanelClasses}>
            {phase === 'idle' && !resultUrl && (
              <div className="flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="h-24 w-24 rounded-[2rem] bg-indigo-600/10 flex items-center justify-center animate-pulse">
                  <svg className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h2 className={cn("text-2xl font-black uppercase tracking-tighter", textTone)}>{t.generator.readyTitle}</h2>
                  <p className={cn("max-w-xs text-sm mt-2", mutedTone)}>{t.generator.helperText}</p>
                </div>
              </div>
            )}

            {(phase === 'pending' || phase === 'processing') && (
              <div className={overlayClasses}>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                  <h3 className={cn("text-xl font-black uppercase tracking-[0.2em]", textTone)}>{t.generator.crafting}</h3>
                  <p className={cn("text-xs font-bold uppercase tracking-widest italic opacity-70", mutedTone)}>{phase}...</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setPhase('idle')}>{t.common.cancel}</Button>
              </div>
            )}

            {phase === 'failed' && (
              <div className="flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className={cn("h-20 w-20 rounded-full flex items-center justify-center", hintBadgeClass)}>
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-rose-600 uppercase tracking-tighter">{t.common.error}</h2>
                  <p className="text-zinc-500 text-sm mt-1">{error}</p>
                </div>
                <Button onClick={() => setPhase('idle')} size="lg" className="rounded-2xl">{t.common.tryAgain}</Button>
              </div>
            )}

            {resultUrl && (
              <div
                className={cn(
                  "group relative h-full w-full rounded-[2.5rem] overflow-hidden transition-colors",
                  theme === 'dark'
                    ? 'bg-zinc-800 shadow-inner'
                    : `bg-zinc-50 ${lightPromptShadow}`
                )}
              >
                <img src={resultUrl} className="h-full w-full object-contain" alt="Generated" />
                <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                {downloadHref && (
                  <button
                    type="button"
                    className={actionButtonClasses('save')}
                    disabled={!currentJobId}
                    onClick={() => {
                      if (!currentJobId) return;
                      void downloadResource(downloadHref, currentJobId);
                    }}
                    aria-label={t.history.download}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                )}
              <button 
                className={actionButtonClasses('cancel')}
                onClick={() => {
                  setResultUrl(null);
                  setPhase('idle');
                  setProgress(0);
                  setRawResultPath(null);
                }}
              >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 relative flex gap-4 items-end">
            <div className="flex-1 relative">
              <textarea
                className={cn(
                  "w-full min-h-[140px] rounded-[2.5rem] p-8 pr-12 text-lg font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none",
                  theme === 'dark'
                    ? 'border-zinc-800 bg-zinc-900 text-white shadow-2xl'
                    : `border-zinc-200 bg-white text-zinc-900 ${lightPromptShadow}`
                )}
                placeholder={t.generator.promptPlaceholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={phase === 'pending' || phase === 'processing'}
              />
          </div>
          <div className="flex flex-col gap-2 shrink-0">
              <Button 
                className={generateButtonClass}
                onClick={handleGenerate}
                isLoading={phase === 'pending' || phase === 'processing'}
                disabled={!prompt.trim() || user.balance <= 0}
                size="icon"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </Button>
          </div>
        </div>
        {user && (
          <div className="mt-6">
            <div className={historyPanelClass}>
              <div className="flex items-center justify-between gap-3">
                <h4 className={cn("text-sm font-bold uppercase tracking-[0.4em]", theme === 'dark' ? 'text-zinc-300' : 'text-zinc-500')}>
                  {t.history.title}
                </h4>
                {history.length > HISTORY_INLINE_LIMIT && (
                  <Button variant="ghost" size="sm" className="uppercase tracking-[0.3em]" onClick={() => setHistoryModalOpen(true)}>
                    {t.history.showMore}
                  </Button>
                )}
              </div>
              {history.length === 0 ? (
                <p className={cn("text-sm", historyLabelClass)}>{t.history.empty}</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3 justify-center">
                  {history.slice(0, HISTORY_INLINE_LIMIT).map((entry) => (
                    <HistoryCard
                      key={entry.job_id}
                      item={entry}
                      styleNames={historyStyleLabels(entry)}
                      onDownload={handleHistoryDownload}
                      onDelete={handleHistoryDelete}
                      onOpen={handleHistoryOpen}
                      className="w-full max-w-xs md:max-w-none"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {user.balance <= 0 && (
           <div className={outOfBalanceClass}>
              {t.generator.outOfBalance}
           </div>
          )}
        </div>
      </div>

      <StylesLibraryModal 
        isOpen={libraryOpen} 
        onClose={() => setLibraryOpen(false)}
        styles={styles}
        selectedStyleIds={selectedStyles}
        onToggleStyle={toggleStyle}
      />
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        items={history}
        getStyleLabel={getStyleLabelById}
        onDownload={handleHistoryDownload}
        onDelete={handleHistoryDelete}
        onOpen={handleHistoryOpen}
      />
      {fullscreenItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeFullscreen}
          />
          <div
            className={cn(
              "relative w-full max-w-4xl overflow-hidden rounded-[2rem] border shadow-2xl transition-colors",
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-900'
            )}
          >
          <div className="relative h-96 overflow-hidden pt-4">
              <img
                src={resolveAssetUrl(fullscreenItem.image_url)}
                alt={t.history.promptLabel}
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                className={cn(
                  "absolute top-4 right-4 h-12 w-12 rounded-2xl flex items-center justify-center border transition-colors",
                  theme === 'dark'
                    ? 'border-white/30 bg-black/30 text-white hover:border-white hover:bg-white/10'
                    : 'border-zinc-200 bg-white text-zinc-900 hover:border-indigo-500 hover:bg-indigo-50'
                )}
                onClick={closeFullscreen}
                aria-label={t.common.close}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-[10px] uppercase tracking-[0.45em] text-zinc-400">{t.history.promptLabel}</p>
              <p className="text-lg font-semibold leading-snug">{fullscreenItem.user_prompt}</p>
              <div className="flex flex-wrap gap-2">
                {historyStyleLabels(fullscreenItem).map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-current px-3 py-1 text-[11px] uppercase tracking-[0.3em]"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-400">
                  {new Date(fullscreenItem.created_at).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={cn(
                      "h-10 w-10 rounded-2xl flex items-center justify-center border transition-colors",
                      theme === 'dark'
                        ? 'border-white/30 bg-black/30 text-white hover:border-white hover:bg-white/10'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:border-indigo-500 hover:bg-indigo-50'
                    )}
                    onClick={() => handleHistoryDownload(fullscreenItem)}
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
                    className={cn(
                      "h-10 w-10 rounded-2xl flex items-center justify-center border transition-colors",
                      theme === 'dark'
                        ? 'border-white/30 bg-black/30 text-white hover:border-white hover:bg-white/10'
                        : 'border-zinc-200 bg-white text-zinc-900 hover:border-rose-500 hover:bg-rose-50'
                    )}
                    onClick={() => handleHistoryDelete(fullscreenItem)}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
