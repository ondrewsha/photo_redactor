import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import type { StyleCategoryPublic } from "../../types/nanovisual";

const gradientsById: Record<string, string> = {
  cyberpunk: "from-fuchsia-500/40 via-cyan-500/10 to-zinc-950",
  oil_paint: "from-amber-500/30 via-rose-500/10 to-zinc-950",
  photoreal: "from-emerald-500/25 via-sky-500/10 to-zinc-950",
  watercolor: "from-sky-500/30 via-violet-500/10 to-zinc-950",
  anime: "from-pink-500/30 via-indigo-500/10 to-zinc-950",
};

export function StyleCard(props: {
  style: StyleCategoryPublic;
  selected: boolean;
  onSelect: (styleId: string) => void;
}) {
  const [imageOk, setImageOk] = useState(true);

  const gradient = useMemo(() => {
    return gradientsById[props.style.id] ?? "from-zinc-800 via-zinc-900 to-zinc-950";
  }, [props.style.id]);

  return (
    <motion.button
      type="button"
      onClick={() => props.onSelect(props.style.id)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border text-left shadow-soft",
        "bg-zinc-900/40 backdrop-blur",
        props.selected ? "border-cyan-400/60" : "border-zinc-800 hover:border-zinc-700",
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />

      {props.style.preview_image && imageOk ? (
        <img
          src={props.style.preview_image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          loading="lazy"
          onError={() => setImageOk(false)}
        />
      ) : null}

      <div className="relative flex min-h-[84px] items-end p-4">
        <div className="flex w-full items-end justify-between gap-4">
          <div>
            <div className="text-base font-semibold leading-tight">{props.style.display_name}</div>
            <div className="mt-1 text-xs text-zinc-200/80">Preset</div>
          </div>

          <div
            className={cn(
              "h-6 w-6 rounded-full border",
              props.selected ? "border-cyan-300 bg-cyan-400/20" : "border-zinc-600 bg-zinc-900/20",
            )}
            aria-hidden
          />
        </div>
      </div>
    </motion.button>
  );
}
