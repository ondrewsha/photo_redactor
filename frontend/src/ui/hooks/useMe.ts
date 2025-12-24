import { useCallback, useEffect, useMemo, useState } from "react";

import { authMe } from "../../api/nanovisual";
import { HttpError, getErrorMessage } from "../../lib/errors";
import type { AuthMeResponse } from "../../types/nanovisual";

export type MeState =
  | { status: "idle" | "loading"; data: AuthMeResponse | null; error: null }
  | { status: "success"; data: AuthMeResponse; error: null }
  | { status: "unauthenticated"; data: null; error: null }
  | { status: "error"; data: AuthMeResponse | null; error: string };

export function useMe() {
  const [state, setState] = useState<MeState>({ status: "idle", data: null, error: null });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    try {
      const data = await authMe();
      setState({ status: "success", data, error: null });
    } catch (error) {
      const http = error instanceof HttpError ? error : null;
      if (http?.status === 401) {
        setState({ status: "unauthenticated", data: null, error: null });
        return;
      }
      setState((prev) => ({ status: "error", data: prev.data, error: getErrorMessage(error) }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(
    () => ({
      state,
      reload,
      setState,
    }),
    [reload, state],
  );
}

