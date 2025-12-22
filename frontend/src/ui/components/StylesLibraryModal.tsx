import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import type { StyleCategoryPublic } from "../../types/nanovisual";

function IconX(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCheck(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M20 7L10.5 16.5 4 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StylesLibraryModal(props: {
  open: boolean;
  onClose: () => void;
  styles: StyleCategoryPublic[];
  selectedStyleIds: string[];
  onToggleStyle: (styleId: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!props.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  useEffect(() => {
    if (!props.open) setQuery("");
  }, [props.open]);

  const stylesSorted = useMemo(() => {
    const list = [...props.styles];
    list.sort((a, b) => {
      if (a.id === "none") return -1;
      if (b.id === "none") return 1;
      return a.display_name.localeCompare(b.display_name, "ru");
    });
    return list;
  }, [props.styles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stylesSorted;
    return stylesSorted.filter((s) => s.display_name.toLowerCase().includes(q));
  }, [query, stylesSorted]);

  return (
    <AnimatePresence>
      {props.open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={props.onClose}
            aria-label="Закрыть"
          />

          <motion.div
            className={cn(
              "relative w-[min(92vw,520px)] max-h-[88dvh]",
              "rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-soft backdrop-blur",
            )}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <div className="text-sm font-semibold text-zinc-50">Библиотека стилей</div>
                <div className="mt-1 text-xs text-zinc-400">Можно выбрать несколько</div>
              </div>
              <button
                type="button"
                onClick={props.onClose}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                  "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100",
                )}
                aria-label="Закрыть"
                title="Закрыть"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по стилям"
                className={cn(
                  "w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100",
                  "outline-none placeholder:text-zinc-600 focus:border-zinc-700",
                )}
              />

              <div className="mt-3 max-h-[52vh] space-y-2 overflow-auto pr-1">
                {filtered.map((style) => {
                  const selected = props.selectedStyleIds.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => props.onToggleStyle(style.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left",
                        selected
                          ? "border-cyan-400/60 bg-cyan-400/10 text-zinc-50"
                          : "border-zinc-800 bg-zinc-950/30 text-zinc-200 hover:border-zinc-700",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={style.preview_image}
                          alt=""
                          className={cn(
                            "h-10 w-14 rounded-xl object-cover",
                            selected ? "ring-1 ring-cyan-300/60" : "ring-1 ring-zinc-800",
                          )}
                          loading="lazy"
                        />
                        <div className="text-sm font-semibold">{style.display_name}</div>
                      </div>
                      <div
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full border",
                          selected ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-zinc-700 text-zinc-500",
                        )}
                        aria-hidden
                      >
                        {selected ? <IconCheck className="h-4 w-4" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={props.onClose}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
                >
                  Готово
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
