import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../lib/cn";
import type { ImageSizePreset } from "../types/nanovisual";
import { useCategories } from "./hooks/useCategories";
import { useCapabilities } from "./hooks/useCapabilities";
import { useGeneration } from "./hooks/useGeneration";
import { useMe } from "./hooks/useMe";
import { AuthModal } from "./components/AuthModal";
import { ImagePreview } from "./components/ImagePreview";
import { PromptInput } from "./components/PromptInput";
import { ProfileModal } from "./components/ProfileModal";
import { StylesLibraryModal } from "./components/StylesLibraryModal";

const FALLBACK_SIZE_PRESETS = [
  { id: "1024x1024", label: "Квадрат • 1024×1024", width: 1024, height: 1024, aspect_ratio: null, quality: null },
  { id: "1536x1024", label: "Пейзаж • 1536×1024", width: 1536, height: 1024, aspect_ratio: null, quality: null },
  { id: "1024x1536", label: "Портрет • 1024×1536", width: 1024, height: 1536, aspect_ratio: null, quality: null },
] satisfies ImageSizePreset[];

const MAX_PHOTOS = 4;

function IconUser(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      aria-hidden
    >
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 20a8 8 0 0116 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function App() {
  const categories = useCategories();
  const caps = useCapabilities();
  const gen = useGeneration();
  const me = useMe();

  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(["none"]);
  const [prompt, setPrompt] = useState("");
  const [sizePresetId, setSizePresetId] = useState<string>(FALLBACK_SIZE_PRESETS[0].id);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "register">("login");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const meData = me.state.data;
  const hasAccount = meData != null;
  const checkingAccount = (me.state.status === "loading" || me.state.status === "idle") && meData == null;

  const sizePresets = useMemo(() => {
    if (caps.data?.size_presets?.length) return caps.data.size_presets;
    return [...FALLBACK_SIZE_PRESETS];
  }, [caps.data]);

  const sizePreset = useMemo(() => {
    return sizePresets.find((p) => p.id === sizePresetId) ?? sizePresets[0]!;
  }, [sizePresetId, sizePresets]);

  useEffect(() => {
    if (!sizePresets.length) return;
    if (sizePresets.some((p) => p.id === sizePresetId)) return;
    setSizePresetId(sizePresets[0]!.id);
  }, [sizePresetId, sizePresets]);

  const geminiSplitSizeUi =
    caps.data?.image_provider === "gemini"
    && sizePresets.some((p) => Boolean(p.aspect_ratio) && Boolean(p.quality));

  const geminiAspectRatios = useMemo(() => {
    if (!geminiSplitSizeUi) return [];
    const set = new Set<string>();
    for (const p of sizePresets) {
      if (p.aspect_ratio) set.add(p.aspect_ratio);
    }
    const order = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [geminiSplitSizeUi, sizePresets]);

  const geminiQualities = useMemo(() => {
    if (!geminiSplitSizeUi) return [];
    const set = new Set<string>();
    for (const p of sizePresets) {
      if (p.quality) set.add(p.quality);
    }
    const order = ["1K", "2K", "4K"];
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [geminiSplitSizeUi, sizePresets]);

  const [geminiAspectRatio, setGeminiAspectRatio] = useState<string>("1:1");
  const [geminiQuality, setGeminiQuality] = useState<string>("1K");

  const geminiAspectRatioLabel = (value: string) => {
    if (value === "1:1") return "Квадрат";
    if (value === "16:9") return "Пейзаж";
    if (value === "9:16") return "Портрет";
    return value;
  };

  useEffect(() => {
    if (!geminiSplitSizeUi) return;
    const preset = sizePresets.find((p) => p.id === sizePresetId);
    if (preset?.aspect_ratio && preset.quality) {
      setGeminiAspectRatio(preset.aspect_ratio);
      setGeminiQuality(preset.quality);
      return;
    }
    if (geminiAspectRatios.length && !geminiAspectRatios.includes(geminiAspectRatio)) {
      setGeminiAspectRatio(geminiAspectRatios[0]!);
    }
    if (geminiQualities.length && !geminiQualities.includes(geminiQuality)) {
      setGeminiQuality(geminiQualities[0]!);
    }
  }, [
    geminiAspectRatio,
    geminiAspectRatios,
    geminiQuality,
    geminiQualities,
    geminiSplitSizeUi,
    sizePresetId,
    sizePresets,
  ]);

  useEffect(() => {
    if (!geminiSplitSizeUi) return;
    const preset = sizePresets.find((p) => p.aspect_ratio === geminiAspectRatio && p.quality === geminiQuality);
    if (!preset) return;
    if (preset.id === sizePresetId) return;
    setSizePresetId(preset.id);
  }, [geminiAspectRatio, geminiQuality, geminiSplitSizeUi, sizePresetId, sizePresets]);

  const supportsPhotos = caps.data?.supports_source_images ?? true;
  const maxPhotos = caps.data?.max_photos ?? MAX_PHOTOS;

  useEffect(() => {
    if (supportsPhotos) return;
    if (!photos.length) return;
    setPhotos([]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }, [photos.length, supportsPhotos]);

  const helperText = useMemo(() => {
    if (!meData) {
      if (me.state.status === "loading" || me.state.status === "idle") return "Проверяю аккаунт…";
      return "Войди или зарегистрируйся, чтобы создавать картинки.";
    }
    if (!meData.email_verified) return "Подтверди почту — без этого нельзя генерировать.";
    if (meData.balance <= 0) return "Закончились генерации. Купи пакет, чтобы продолжить.";
    return "Опиши простыми словами, что должно быть на картинке.";
  }, [meData, me.state.status]);

  const disabled = gen.state.phase === "composing" || gen.state.phase === "queued" || gen.state.phase === "polling";

  const styleNameById = useMemo(() => {
    const map = new Map<string, string>([
      ["none", "Без стиля"],
      ["cyberpunk", "Киберпанк"],
      ["oil_paint", "Масло"],
      ["photoreal", "Фотореализм"],
      ["watercolor", "Акварель"],
      ["anime", "Аниме"],
    ]);
    for (const s of categories.data) map.set(s.id, s.display_name);
    return map;
  }, [categories.data]);

  const toggleStyle = (styleId: string) => {
    setSelectedStyleIds((prev) => {
      if (styleId === "none") return ["none"];

      const next = new Set(prev);
      if (next.has(styleId)) next.delete(styleId);
      else next.add(styleId);

      next.delete("none");

      const out = Array.from(next);
      return out.length ? out : ["none"];
    });
  };

  const selectedStyleNames = useMemo(() => {
    return selectedStyleIds.map((id) => styleNameById.get(id) ?? id);
  }, [selectedStyleIds, styleNameById]);

  const photoUrls = useMemo(() => {
    return photos.map((file) => URL.createObjectURL(file));
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const url of photoUrls) URL.revokeObjectURL(url);
    };
  }, [photoUrls]);

  const resetAll = () => {
    gen.reset();
    setPrompt("");
    setPhotos([]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verify = params.get("verify");
    const pay = params.get("pay");
    const google = params.get("google");
    const trial = params.get("trial");

    if (verify === "ok") setNotice({ kind: "ok", text: trial === "1" ? "Почта подтверждена. Бонус: 3 генерации." : "Почта подтверждена." });
    if (verify === "bad") setNotice({ kind: "bad", text: "Не получилось подтвердить почту. Попробуй ещё раз." });
    if (pay === "ok") setNotice({ kind: "ok", text: "Оплата прошла. Генерации добавлены." });
    if (google === "ok") setNotice({ kind: "ok", text: trial === "1" ? "Вход через Google выполнен. Бонус: 3 генерации." : "Вход через Google выполнен." });
    if (google === "bad") setNotice({ kind: "bad", text: "Не получилось войти через Google." });

    if (verify || pay || google || trial) {
      params.delete("verify");
      params.delete("pay");
      params.delete("google");
      params.delete("trial");
      const q = params.toString();
      window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
      void me.reload();
    }
  }, [me.reload]);

  const openAuth = (tab: "login" | "register") => {
    setAuthInitialTab(tab);
    setAuthOpen(true);
  };

  const onSubmit = async () => {
    const styleIds = selectedStyleIds.length ? selectedStyleIds : ["none"];
    const text = prompt.trim();
    if (!text) return;
    if (me.state.status === "unauthenticated" || me.state.data == null) {
      openAuth("login");
      return;
    }
    if (!me.state.data.email_verified || me.state.data.balance <= 0) {
      setProfileOpen(true);
      return;
    }
    await gen.generate({
      styleIds,
      userInput: text,
      width: sizePreset.width,
      height: sizePreset.height,
      photos,
      onStarted: () => void me.reload(),
      onFinished: () => void me.reload(),
    });
  };

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-20 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute -right-20 -top-32 h-[520px] w-[520px] rounded-full bg-violet-500/15 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-32 pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xl font-semibold tracking-tight">NanoVisual</div>
              <div className="mt-1 text-sm text-zinc-400">
                Создавай картинки простыми словами.
              </div>
            </div>

            {meData ? (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-semibold",
                    "border-zinc-800 bg-zinc-950/20 text-zinc-200",
                  )}
                  title="Остаток генераций"
                >
                  Осталось: {meData.balance}
                </div>
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                    "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                  )}
                  title="Профиль"
                  aria-label="Профиль"
                >
                  <IconUser className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          {notice ? (
            <div
              className={cn(
                "mt-4 rounded-2xl border p-4 text-sm",
                notice.kind === "ok"
                  ? "border-emerald-700/40 bg-emerald-500/10 text-emerald-50"
                  : "border-red-800/40 bg-red-500/10 text-red-100",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>{notice.text}</div>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-xs text-zinc-200/80 hover:text-zinc-50"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : null}

          {checkingAccount ? (
            <div className="grid min-h-[70dvh] place-items-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
                <div className="mt-3 text-sm text-zinc-300">Проверяю аккаунт…</div>
              </div>
            </div>
          ) : hasAccount ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
              <main className="space-y-6">
                <ImagePreview
                  phase={gen.state.phase}
                  progress={gen.state.progress}
                  imageUrl={gen.state.imageUrl}
                  error={gen.state.error}
                  onReset={resetAll}
                  onCancel={gen.cancel}
                />
              </main>

              <aside className="space-y-6 lg:sticky lg:top-6">
                <section className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-4 shadow-soft sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">Настройки</div>
                      <div className="mt-1 text-xs text-zinc-400">Стиль и размер</div>
                    </div>
                    {caps.status === "error" || categories.status === "error" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void caps.reload();
                          void categories.reload();
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Повторить
                      </button>
                    ) : null}
                  </div>

                  {caps.status === "error" ? (
                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-xs text-zinc-300">
                      Не удалось загрузить настройки генерации: {caps.error}
                    </div>
                  ) : null}

                  {categories.status === "error" ? (
                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-xs text-zinc-300">
                      Не удалось загрузить список стилей: {categories.error}
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-6">
                    <div>
                      <div className="text-xs font-semibold text-zinc-300">Стили</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedStyleNames.map((name, idx) => (
                          <button
                            key={`${selectedStyleIds[idx]}:${name}`}
                            type="button"
                            onClick={() => toggleStyle(selectedStyleIds[idx]!)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs",
                              "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                            )}
                            disabled={disabled}
                            title="Нажми, чтобы убрать"
                          >
                            {name}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3">
                        <div className="text-[11px] font-semibold text-zinc-400">Популярные</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {["none", "photoreal", "cyberpunk", "watercolor", "anime", "oil_paint"].map((id) => {
                            const selected = selectedStyleIds.includes(id);
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => toggleStyle(id)}
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs",
                                  selected
                                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                                    : "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                                )}
                                disabled={categories.status === "loading" || categories.status === "idle" || disabled}
                              >
                                {styleNameById.get(id) ?? id}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLibraryOpen(true)}
                          className={cn(
                            "rounded-2xl border px-3 py-2 text-left text-xs",
                            "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                          )}
                          disabled={categories.status === "loading" || categories.status === "idle" || disabled}
                        >
                          Открыть библиотеку стилей
                        </button>
                        <div className="text-[11px] text-zinc-500">Можно выбрать несколько</div>
                      </div>
                    </div>

                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Размер</div>
                    {geminiSplitSizeUi ? (
                      <>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] font-semibold text-zinc-400">Соотношение</div>
                            <div className="mt-2 space-y-2">
                              {geminiAspectRatios.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setGeminiAspectRatio(value)}
                                  className={cn(
                                    "w-full rounded-2xl border px-3 py-2 text-left text-xs",
                                    value === geminiAspectRatio
                                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                                      : "border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:border-zinc-700",
                                  )}
                                  disabled={disabled}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{geminiAspectRatioLabel(value)}</span>
                                    <span className="text-[11px] text-zinc-400">{value}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-semibold text-zinc-400">Качество</div>
                            <div className="mt-2 space-y-2">
                              {geminiQualities.map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setGeminiQuality(value)}
                                  className={cn(
                                    "w-full rounded-2xl border px-3 py-2 text-left text-xs",
                                    value === geminiQuality
                                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                                      : "border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:border-zinc-700",
                                  )}
                                  disabled={disabled}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-zinc-500">Выбрано: {sizePreset.label}</div>
                      </>
                    ) : (
                      <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                        {sizePresets.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSizePresetId(p.id)}
                            className={cn(
                              "rounded-2xl border px-3 py-2 text-left text-xs",
                              p.id === sizePreset.id
                                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                                : "border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:border-zinc-700",
                            )}
                            disabled={disabled}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Фото (не обязательно)</div>

                    {!supportsPhotos ? (
                      <div className="mt-2 text-[11px] text-zinc-500">
                        Текущая модель не умеет работать с фото.
                      </div>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (!files.length) return;
                          setPhotos((prev) => {
                            const next = prev.slice();
                            for (const file of files) {
                              if (next.length >= maxPhotos) break;
                              next.push(file);
                            }
                            return next;
                          });
                          e.currentTarget.value = "";
                        }}
                        disabled={disabled || !supportsPhotos}
                      />

                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className={cn(
                          "rounded-2xl border px-3 py-2 text-left text-xs",
                          "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                        )}
                        disabled={disabled || !supportsPhotos || photos.length >= maxPhotos}
                        title={
                          !supportsPhotos
                            ? "Эта модель не умеет работать с фото"
                            : photos.length >= maxPhotos
                              ? `Можно выбрать не больше ${maxPhotos} фото`
                              : undefined
                        }
                      >
                        {photos.length ? "Добавить фото" : "Загрузить фото"}
                      </button>

                      {photos.length ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotos([]);
                              if (photoInputRef.current) photoInputRef.current.value = "";
                            }}
                            className={cn(
                              "rounded-2xl border px-3 py-2 text-left text-xs",
                              "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                            )}
                            disabled={disabled}
                          >
                            Убрать все
                          </button>
                        ) : null}

                      <div className="text-[11px] text-zinc-500">
                        {photos.length ? `Выбрано: ${photos.length} из ${maxPhotos}` : `Можно добавить до ${maxPhotos} фото`}
                      </div>
                    </div>

                      {photos.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {photoUrls.map((url, idx) => (
                            <div
                              key={`${idx}:${url}`}
                              className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30"
                            >
                              <img src={url} alt="" className="h-28 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                                className={cn(
                                  "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border",
                                  "border-zinc-800 bg-zinc-950/60 text-zinc-200 hover:border-zinc-700 hover:text-zinc-50",
                                )}
                                aria-label="Убрать фото"
                                title="Убрать фото"
                                disabled={disabled}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  aria-hidden
                                >
                                  <path
                                    d="M7 7l10 10M17 7L7 17"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}

                    <div className="mt-2 text-[11px] text-zinc-500">
                      {supportsPhotos ? "Если загрузить фото, я сделаю новую версию на его основе." : "Фото сейчас недоступны для этой модели."}
                    </div>
                  </div>
                </div>
              </section>
            </aside>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
              <div className="space-y-4">
                <div className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Создай картинку простыми словами
                </div>
                <div className="max-w-xl text-sm text-zinc-300">
                  Выбирай стили, добавляй свои фото и получай результат без сложных настроек.
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className={cn(
                      "rounded-2xl px-5 py-3 text-sm font-semibold",
                      "bg-white text-zinc-950 hover:bg-zinc-100",
                    )}
                  >
                    Войти
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth("register")}
                    className={cn(
                      "rounded-2xl border px-5 py-3 text-sm font-semibold",
                      "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                    )}
                  >
                    Регистрация
                  </button>
                </div>
                <div className="text-xs text-zinc-500">
                  Для генерации нужно подтвердить почту.
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-5 shadow-soft sm:p-6">
                <div className="text-sm font-semibold">Как это работает</div>
                <div className="mt-3 space-y-3 text-sm text-zinc-300">
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-cyan-400/80" />
                    <div>Пишешь, что хочешь увидеть на картинке.</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-violet-400/80" />
                    <div>Выбираешь стили и размер.</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400/80" />
                    <div>Нажимаешь «Создать», и я рисую результат.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {hasAccount ? (
          <>
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={() => void onSubmit()}
              disabled={disabled}
              submitDisabled={selectedStyleIds.length === 0}
              helperText={helperText}
            />

            <StylesLibraryModal
              open={libraryOpen}
              onClose={() => setLibraryOpen(false)}
              styles={categories.data}
              selectedStyleIds={selectedStyleIds}
              onToggleStyle={toggleStyle}
            />
          </>
        ) : null}

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onAuthed={() => void me.reload()}
          initialTab={authInitialTab}
        />

        {meData ? (
          <ProfileModal
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            me={meData}
            onReloadMe={() => void me.reload()}
          />
        ) : null}
      </div>
    </div>
  );
}
