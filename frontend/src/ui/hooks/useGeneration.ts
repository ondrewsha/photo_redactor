import { useCallback, useMemo, useRef, useState } from "react";

import { generateImage, getJobStatus, resolveAssetUrl } from "../../api/nanovisual";
import { getErrorMessage } from "../../lib/errors";
import type { PromptMode } from "../../types/nanovisual";

export type GenerationPhase =
  | "idle"
  | "composing"
  | "queued"
  | "polling"
  | "completed"
  | "failed";

export type GenerationState = {
  phase: GenerationPhase;
  progress: number;
  jobId: string | null;
  enhancedText: string | null;
  imageUrl: string | null;
  error: string | null;
};

const initialState: GenerationState = {
  phase: "idle",
  progress: 0,
  jobId: null,
  enhancedText: null,
  imageUrl: null,
  error: null,
};

export type GenerateParams = {
  styleId: string;
  userInput: string;
  mode: PromptMode;
  width: number;
  height: number;
  seed: number | null;
};

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({
      ...prev,
      phase: prev.phase === "idle" ? "idle" : "failed",
      error: prev.phase === "idle" ? null : "Отменено",
    }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(initialState);
  }, []);

  const generate = useCallback(async (params: GenerateParams) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      phase: "composing",
      progress: 0,
      jobId: null,
      enhancedText: null,
      imageUrl: null,
      error: null,
    });

    try {
      const started = await generateImage(
        {
          style_id: params.styleId,
          user_input: params.userInput,
          mode: params.mode,
          width: params.width,
          height: params.height,
          seed: params.seed,
        },
        controller.signal,
      );

      setState((prev) => ({
        ...prev,
        phase: "polling",
        jobId: started.job_id,
        enhancedText: started.enhanced_user_input,
      }));

      while (!controller.signal.aborted) {
        const status = await getJobStatus(started.job_id, controller.signal);
        setState((prev) => ({
          ...prev,
          progress: status.progress ?? prev.progress,
        }));

        if (status.status === "completed" && status.result?.image_url) {
          setState((prev) => ({
            ...prev,
            phase: "completed",
            progress: 100,
            imageUrl: resolveAssetUrl(status.result!.image_url),
            error: null,
          }));
          return;
        }

        if (status.status === "failed") {
          setState((prev) => ({
            ...prev,
            phase: "failed",
            progress: 100,
            error: status.error_message || "Generation failed",
          }));
          return;
        }

        if (status.status === "pending") {
          setState((prev) => ({ ...prev, phase: "queued" }));
        } else if (status.status === "processing") {
          setState((prev) => ({ ...prev, phase: "polling" }));
        }

        await delay(850, controller.signal);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        phase: "failed",
        error: getErrorMessage(error),
      }));
    }
  }, []);

  return useMemo(
    () => ({
      state,
      generate,
      cancel,
      reset,
    }),
    [cancel, generate, reset, state],
  );
}
