import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

import { cn } from "../lib/cn";
import { useCategories } from "./hooks/useCategories";
import { useGeneration } from "./hooks/useGeneration";
import { ImagePreview } from "./components/ImagePreview";
import { PromptInput } from "./components/PromptInput";
import { StylesLibraryModal } from "./components/StylesLibraryModal";

type SizePreset = { label: string; width: number; height: number };

const sizePresets: SizePreset[] = [
  { label: "1:1 • 1024×1024", width: 1024, height: 1024 },
];

export function App() {
  const categories = useCategories();
  const gen = useGeneration();

  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>(["none"]);
  const [prompt, setPrompt] = useState("");
  const [sizePreset, setSizePreset] = useState<SizePreset>(sizePresets[0]!);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const helperText = useMemo(() => {
    return "Опиши простыми словами, что должно быть на картинке.";
  }, []);

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

  const resetAll = () => {
    gen.reset();
    setPrompt("");
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const onSubmit = async () => {
    const styleIds = selectedStyleIds.length ? selectedStyleIds : ["none"];
    const text = prompt.trim();
    if (!text) return;
    await gen.generate({
      styleIds,
      userInput: text,
      width: sizePreset.width,
      height: sizePreset.height,
      photo,
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
          </div>

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
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setPhoto(file);
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
                        disabled={disabled}
                      >
                        {photo ? "Заменить фото" : "Загрузить фото"}
                      </button>
                      {photo ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null);
                            if (photoInputRef.current) photoInputRef.current.value = "";
                          }}
                          className={cn(
                            "rounded-2xl border px-3 py-2 text-left text-xs",
                            "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                          )}
                          disabled={disabled}
                        >
                          Убрать
                        </button>
                      ) : null}
                      {photo ? (
                        <div className="text-[11px] text-zinc-500">{photo.name}</div>
                      ) : null}
                    </div>
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
      </div>
    </div>
  );
}
