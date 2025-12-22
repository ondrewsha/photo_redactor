import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { cn } from "../lib/cn";
import type { PromptMode } from "../types/nanovisual";
import { useCategories } from "./hooks/useCategories";
import { useGeneration } from "./hooks/useGeneration";
import { ImagePreview } from "./components/ImagePreview";
import { PromptInput } from "./components/PromptInput";
import { StyleCard } from "./components/StyleCard";
import { StyleCardSkeleton } from "./components/Skeletons";

type SizePreset = { label: string; width: number; height: number };

const sizePresets: SizePreset[] = [
  { label: "1:1 • 1024", width: 1024, height: 1024 },
  { label: "4:5 • 896×1120", width: 896, height: 1120 },
  { label: "16:9 • 1280×720", width: 1280, height: 720 },
];

export function App() {
  const categories = useCategories();
  const gen = useGeneration();

  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<PromptMode>("enhance");
  const [sizePreset, setSizePreset] = useState<SizePreset>(sizePresets[0]!);
  const [seedInput, setSeedInput] = useState("");

  const helperText = useMemo(() => {
    if (!selectedStyleId) return "Сначала выбери стиль.";
    if (mode === "creative") return "Введи 2–3 слова, а NanoVisual предложит идею.";
    return "Опиши сцену простыми словами — я добавлю детали и соберу промпт за кадром.";
  }, [mode, selectedStyleId]);

  const disabled = gen.state.phase === "composing" || gen.state.phase === "queued" || gen.state.phase === "polling";

  const seed = useMemo(() => {
    const v = seedInput.trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  }, [seedInput]);

  const onSubmit = async () => {
    const styleId = selectedStyleId?.trim();
    if (!styleId) return;
    const text = prompt.trim();
    if (!text) return;
    await gen.generate({
      styleId,
      userInput: text,
      mode,
      width: sizePreset.width,
      height: sizePreset.height,
      seed,
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
                Пресеты + скрытая инженерия — без сложных промптов.
              </div>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <a
                className="text-sm text-zinc-400 hover:text-zinc-200"
                href="/api/health"
                target="_blank"
                rel="noreferrer"
              >
                Gateway
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <main className="space-y-6">
              <ImagePreview
                phase={gen.state.phase}
                progress={gen.state.progress}
                imageUrl={gen.state.imageUrl}
                enhancedText={gen.state.enhancedText}
                error={gen.state.error}
                onReset={gen.reset}
              />

              <section className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-4 shadow-soft sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Стили</div>
                    <div className="mt-1 text-xs text-zinc-400">Выбери визуальный пресет</div>
                  </div>
                  {categories.status === "error" ? (
                    <button
                      type="button"
                      onClick={() => void categories.reload()}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>

                {categories.status === "error" ? (
                  <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-xs text-zinc-300">
                    Не удалось загрузить стили: {categories.error}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.status === "loading" || categories.status === "idle"
                    ? Array.from({ length: 6 }).map((_, i) => <StyleCardSkeleton key={i} />)
                    : categories.data.map((style) => (
                        <StyleCard
                          key={style.id}
                          style={style}
                          selected={style.id === selectedStyleId}
                          onSelect={setSelectedStyleId}
                        />
                      ))}
                </div>
              </section>
            </main>

            <aside className="hidden lg:block">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-6 shadow-soft">
                <div className="text-sm font-semibold">Настройки</div>
                <div className="mt-1 text-xs text-zinc-400">Размер, seed</div>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Размер</div>
                    <div className="mt-2 grid gap-2">
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
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-zinc-300">Seed (опционально)</div>
                    <input
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      placeholder="например 42"
                      className={cn(
                        "mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm",
                        "outline-none placeholder:text-zinc-600 focus:border-zinc-700",
                      )}
                      disabled={disabled}
                    />
                    <div className="mt-2 text-[11px] text-zinc-500">
                      Один и тот же seed + промпт → более повторяемый результат.
                    </div>
                  </div>

                  {disabled ? (
                    <motion.button
                      type="button"
                      onClick={gen.cancel}
                      whileTap={{ scale: 0.99 }}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/20 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700"
                    >
                      Cancel
                    </motion.button>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={() => void onSubmit()}
          disabled={disabled}
          submitDisabled={!selectedStyleId}
          mode={mode}
          onModeChange={setMode}
          helperText={helperText}
        />
      </div>
    </div>
  );
}
