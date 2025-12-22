import { motion } from "framer-motion";
import { useCallback } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "../../lib/cn";

export function PromptInput(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitDisabled?: boolean;
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
                placeholder="Например: «кот в шляпе едет на велосипеде по ночному городу»"
                className={cn(
                  "w-full resize-none bg-transparent text-sm leading-6 outline-none",
                  "placeholder:text-zinc-500",
                )}
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-[11px] text-zinc-500">
                  Чтобы отправить — нажми кнопку справа
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
              Сгенерировать
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
