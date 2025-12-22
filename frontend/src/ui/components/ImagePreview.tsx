import { AnimatePresence, motion } from "framer-motion";

import { cn } from "../../lib/cn";

export function ImagePreview(props: {
  phase: "idle" | "composing" | "queued" | "polling" | "completed" | "failed";
  progress: number;
  imageUrl: string | null;
  enhancedText: string | null;
  error: string | null;
  onReset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 shadow-soft">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Preview</div>
            <div className="mt-1 text-xs text-zinc-400">
              {props.phase === "idle" ? "Выбери стиль и опиши сцену" : "Генерация…"}
            </div>
          </div>

          {props.phase !== "idle" ? (
            <button
              type="button"
              className="text-xs text-zinc-400 hover:text-zinc-200"
              onClick={props.onReset}
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40">
          <div className="relative aspect-square w-full">
            <AnimatePresence mode="wait">
              {props.phase === "completed" && props.imageUrl ? (
                <motion.img
                  key="image"
                  src={props.imageUrl}
                  alt="Generated"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : props.phase === "failed" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 grid place-items-center p-6 text-center"
                >
                  <div>
                    <div className="text-sm font-semibold text-red-200">Ошибка</div>
                    <div className="mt-2 text-xs text-zinc-300">{props.error ?? "Unknown error"}</div>
                  </div>
                </motion.div>
              ) : props.phase === "idle" ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 grid place-items-center p-6 text-center"
                >
                  <div>
                    <div className="text-sm font-semibold">Готов к магии</div>
                    <div className="mt-2 text-xs text-zinc-400">
                      Выбери стиль и опиши, что должно быть на картинке.
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-zinc-950" />
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between text-[11px] text-zinc-300">
                      <div>
                        {props.phase === "composing"
                          ? "Улучшаю запрос…"
                          : props.phase === "queued"
                            ? "В очереди…"
                            : "Генерирую…"}
                      </div>
                      <div>{Math.max(0, Math.min(100, props.progress))}%</div>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={cn("h-full rounded-full bg-cyan-400/80 transition-[width] duration-300")}
                        style={{ width: `${Math.max(2, Math.min(100, props.progress))}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {props.enhancedText ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <div className="text-[11px] font-semibold text-zinc-300">AI-версия</div>
            <div className="mt-1 text-xs text-zinc-300/90">{props.enhancedText}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
