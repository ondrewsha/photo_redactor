import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../lib/cn";
import { useCategories } from "./hooks/useCategories";
import { useGeneration } from "./hooks/useGeneration";
import { useMe } from "./hooks/useMe";
import { AuthModal } from "./components/AuthModal";
import { ImagePreview } from "./components/ImagePreview";
import { PromptInput } from "./components/PromptInput";
import { ProfileModal } from "./components/ProfileModal";
import { StylesLibraryModal } from "./components/StylesLibraryModal";

type SizePreset = { label: string; width: number; height: number };

const sizePresets: SizePreset[] = [
  { label: "Большой • 1024×1024", width: 1024, height: 1024 },
  { label: "Средний • 512×512", width: 512, height: 512 },
  { label: "Маленький • 256×256", width: 256, height: 256 },
];

const MAX_PHOTOS = 4;

export function App() {
  const categories = useCategories();
  const gen = useGeneration();
  const me = useMe();

  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(["none"]);
  const [prompt, setPrompt] = useState("");
  const [sizePreset, setSizePreset] = useState<SizePreset>(sizePresets[0]!);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const helperText = useMemo(() => {
    if (me.state.status === "loading" || me.state.status === "idle") return "Проверяю аккаунт…";
    if (me.state.status === "unauthenticated") return "Войди или зарегистрируйся, чтобы создавать картинки.";
    if (me.state.status === "success" && !me.state.data.email_verified) return "Подтверди почту — без этого нельзя генерировать.";
    if (me.state.status === "success" && me.state.data.balance <= 0) return "Закончились генерации. Купи пакет, чтобы продолжить.";
    return "Опиши простыми словами, что должно быть на картинке.";
  }, [me.state]);

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

  const onSubmit = async () => {
    const styleIds = selectedStyleIds.length ? selectedStyleIds : ["none"];
    const text = prompt.trim();
    if (!text) return;
    if (me.state.status === "unauthenticated" || me.state.data == null) {
      setAuthOpen(true);
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
                Выбери стиль и опиши картинку — остальное сделаю я.
              </div>
            </div>

            <div className="flex items-center gap-3">
              {me.state.status === "success" ? (
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold",
                    "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                  )}
                  title="Открыть профиль"
                >
                  Осталось: {me.state.data.balance}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold",
                    "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                  )}
                >
                  Войти
                </button>
              )}
            </div>
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
                  {categories.status === "error" ? (
                    <button
                      type="button"
                      onClick={() => void categories.reload()}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Повторить
                    </button>
                  ) : null}
                </div>

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
                    <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                      {sizePresets.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setSizePreset(p)}
                          className={cn(
                            "rounded-2xl border px-3 py-2 text-left text-xs",
                            p.label === sizePreset.label
                              ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                              : "border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:border-zinc-700",
                          )}
                          disabled={disabled}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Фото (не обязательно)</div>

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
                              if (next.length >= MAX_PHOTOS) break;
                              next.push(file);
                            }
                            return next;
                          });
                          e.currentTarget.value = "";
                        }}
                        disabled={disabled}
                      />

                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className={cn(
                          "rounded-2xl border px-3 py-2 text-left text-xs",
                          "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                        )}
                        disabled={disabled || photos.length >= MAX_PHOTOS}
                        title={photos.length >= MAX_PHOTOS ? `Можно выбрать не больше ${MAX_PHOTOS} фото` : undefined}
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
                        {photos.length ? `Выбрано: ${photos.length} из ${MAX_PHOTOS}` : `Можно добавить до ${MAX_PHOTOS} фото`}
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
                      Если загрузить фото, я сделаю новую версию на его основе.
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

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

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onAuthed={() => void me.reload()}
        />

        {me.state.status === "success" ? (
          <ProfileModal
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            me={me.state.data}
            onReloadMe={() => void me.reload()}
          />
        ) : null}
      </div>
    </div>
  );
}
