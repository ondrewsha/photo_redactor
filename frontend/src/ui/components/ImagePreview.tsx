import { AnimatePresence, motion } from "framer-motion";

import { cn } from "../../lib/cn";

export function ImagePreview(props: {
  phase: "idle" | "composing" | "queued" | "polling" | "completed" | "failed";
  progress: number;
  imageUrl: string | null;
  error: string | null;
  onReset: () => void;
  onCancel?: () => void;
}) {
  const canDownload = props.phase === "completed" && Boolean(props.imageUrl);
  const subtitle =
    props.phase === "idle"
      ? "Опиши, что хочешь увидеть"
      : props.phase === "completed"
        ? "Готово. Можно скачать."
        : props.phase === "failed"
          ? "Не получилось. Попробуй ещё раз."
          : "Создаю изображение…";
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 shadow-soft">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Результат</div>
            <div className="mt-1 text-xs text-zinc-400">{subtitle}</div>
          </div>

          {props.phase !== "idle" ? (
            <div className="flex items-center gap-2">
              {canDownload && props.imageUrl ? (
                <a
                  href={props.imageUrl}
                  download
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs",
                    "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:border-zinc-700 hover:text-zinc-50",
                  )}
                  title="Скачать"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path
                      d="M12 3v10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 11l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 21h14"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  Скачать
                </a>
              ) : null}

              <button
                type="button"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                  "border-zinc-800 bg-zinc-950/30 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100",
                )}
                onClick={props.onReset}
                title="Сбросить"
                aria-label="Сбросить"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path
                    d="M20 12a8 8 0 10-2.3 5.7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 8v4h-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40">
          <div className="relative aspect-square w-full">
            <AnimatePresence mode="wait">
              {props.phase === "completed" && props.imageUrl ? (
                <motion.img
                  key="image"
                  src={props.imageUrl}
                  alt="Сгенерированное изображение"
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
                    <div className="mt-2 text-xs text-zinc-300">{props.error ?? "Неизвестная ошибка"}</div>
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

                  <div className="absolute inset-0 grid place-items-center p-6 text-center">
                    <div>
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
                      <div className="mt-3 text-xs text-zinc-300">
                        {props.phase === "composing"
                          ? "Готовлю описание…"
                          : props.phase === "queued"
                            ? "Жду очередь…"
                            : "Рисую картинку…"}
                      </div>
                      {props.onCancel ? (
                        <button
                          type="button"
                          onClick={props.onCancel}
                          className={cn(
                            "mt-4 rounded-2xl border px-4 py-2 text-xs",
                            "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                          )}
                        >
                          Отменить
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
