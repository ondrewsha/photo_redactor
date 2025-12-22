import { requestJson } from "./http";
import type {
  ComposePromptRequest,
  ComposePromptResponse,
  CreateJobRequest,
  CreateJobResponse,
  JobStatusResponse,
  StyleCategoryPublic,
} from "../types/nanovisual";

const PROMPT_API = "/api/prompt";
const GEN_API = "/api/gen";

export function resolveGenAssetUrl(imageUrl: string): string {
  if (imageUrl.startsWith("/media/")) return `${GEN_API}${imageUrl}`;
  return imageUrl;
}

export async function listCategories(
  signal?: AbortSignal,
): Promise<StyleCategoryPublic[]> {
  return requestJson<StyleCategoryPublic[]>(`${PROMPT_API}/categories`, { signal });
}

export async function composePrompt(
  payload: ComposePromptRequest,
  signal?: AbortSignal,
): Promise<ComposePromptResponse> {
  return requestJson<ComposePromptResponse>(`${PROMPT_API}/compose`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export async function createJob(
  payload: CreateJobRequest,
  signal?: AbortSignal,
): Promise<CreateJobResponse> {
  return requestJson<CreateJobResponse>(`${GEN_API}/jobs`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export async function getJobStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobStatusResponse> {
  return requestJson<JobStatusResponse>(`${GEN_API}/jobs/${jobId}`, { signal });
}
