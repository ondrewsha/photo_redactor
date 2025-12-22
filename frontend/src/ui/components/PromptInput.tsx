import { motion } from "framer-motion";
import { useCallback, useMemo } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "../../lib/cn";
import type { PromptMode } from "../../types/nanovisual";

function IconSparkles(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2l.9 3.6c.3 1.2 1.2 2.1 2.4 2.4L19 9l-3.7.9c-1.2.3-2.1 1.2-2.4 2.4L12 16l-.9-3.7c-.3-1.2-1.2-2.1-2.4-2.4L5 9l3.7-.9c1.2-.3 2.1-1.2 2.4-2.4L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 13l.4 1.5c.2.8.8 1.4 1.6 1.6L9 17l-2 .5c-.8.2-1.4.8-1.6 1.6L5 21l-.4-1.9c-.2-.8-.8-1.4-1.6-1.6L1 17l2-.4c.8-.2 1.4-.8 1.6-1.6L5 13z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBulb(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 18h6M10 22h4M8 14c-1.3-1-2-2.4-2-4a6 6 0 0112 0c0 1.6-.7 3-2 4-.6.5-1 1.2-1 2v1H9v-1c0-.8-.4-1.5-1-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PromptInput(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitDisabled?: boolean;
  mode: PromptMode;
  onModeChange: (mode: PromptMode) => void;
  helperText?: string | null;
}) {
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (props.disabled || props.submitDisabled) return;
        props.onSubmit();
      }
    },
    [props],
  );

  const modeLabel = useMemo(() => {
    if (props.mode === "creative") return "Идея";
    return "Улучшить";
  }, [props.mode]);

  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col gap-3">
          {props.helperText ? (
            <div className="text-xs text-zinc-300/80">{props.helperText}</div>
          ) : null}

          <div className="flex items-end gap-3">
            <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-3 py-2">
              <textarea
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={props.disabled}
                rows={1}
                placeholder="Опиши картинку простыми словами…"
                className={cn(
                  "w-full resize-none bg-transparent text-sm leading-6 outline-none",
                  "placeholder:text-zinc-500",
                )}
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => props.onModeChange("enhance")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                      props.mode === "enhance"
                        ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                        : "border-zinc-700 bg-zinc-950/20 text-zinc-300 hover:border-zinc-600",
                    )}
                    disabled={props.disabled}
                  >
                    <IconSparkles className="h-4 w-4" />
                    Улучшить
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onModeChange("creative")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                      props.mode === "creative"
                        ? "border-violet-400/60 bg-violet-400/10 text-violet-100"
                        : "border-zinc-700 bg-zinc-950/20 text-zinc-300 hover:border-zinc-600",
                    )}
                    disabled={props.disabled}
                  >
                    <IconBulb className="h-4 w-4" />
                    Идея
                  </button>
                </div>

                <div className="text-[11px] text-zinc-500">
                  {modeLabel} • Enter — сгенерировать
                </div>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={props.onSubmit}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "h-[54px] shrink-0 rounded-2xl px-5 text-sm font-semibold shadow-soft",
                "bg-white text-zinc-950 hover:bg-zinc-100",
                "disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300",
              )}
              disabled={props.disabled || props.submitDisabled || props.value.trim().length === 0}
            >
              Generate
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
