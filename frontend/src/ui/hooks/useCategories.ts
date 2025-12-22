import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listCategories } from "../../api/nanovisual";
import type { StyleCategoryPublic } from "../../types/nanovisual";
import { getErrorMessage } from "../../lib/errors";

type LoadState =
  | { status: "idle" | "loading"; data: StyleCategoryPublic[]; error: null }
  | { status: "error"; data: StyleCategoryPublic[]; error: string }
  | { status: "success"; data: StyleCategoryPublic[]; error: null };

export function useCategories() {
  const [state, setState] = useState<LoadState>({
    status: "idle",
    data: [],
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ status: "loading", data: prev.data, error: null }));
    try {
      const data = await listCategories(controller.signal);
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

  const api = useMemo(
    () => ({
      ...state,
      reload: load,
    }),
    [load, state],
  );

  return api;
}
