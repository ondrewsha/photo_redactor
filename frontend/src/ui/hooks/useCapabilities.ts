import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getCapabilities } from "../../api/nanovisual";
import type { GenerationCapabilities } from "../../types/nanovisual";
import { getErrorMessage } from "../../lib/errors";

type LoadState =
  | { status: "idle" | "loading"; data: GenerationCapabilities | null; error: null }
  | { status: "error"; data: GenerationCapabilities | null; error: string }
  | { status: "success"; data: GenerationCapabilities; error: null };

export function useCapabilities() {
  const [state, setState] = useState<LoadState>({
    status: "idle",
    data: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ status: "loading", data: prev.data, error: null }));
    try {
      const data = await getCapabilities(controller.signal);
      setState({ status: "success", data, error: null });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        status: "error",
        data: prev.data,
        error: getErrorMessage(error),
      }));
    }
  }, []);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  return useMemo(
    () => ({
      ...state,
      reload: load,
    }),
    [load, state],
  );
}

