import { requestJson } from "./http";
import type {
  GenerateImageRequest,
  GenerateImageResponse,
  JobStatusResponse,
  StyleCategoryPublic,
} from "../types/nanovisual";

const API = "/api";

export function resolveAssetUrl(imageUrl: string): string {
  if (imageUrl.startsWith("/media/")) return `${API}${imageUrl}`;
  return imageUrl;
}

export async function listCategories(
  signal?: AbortSignal,
): Promise<StyleCategoryPublic[]> {
  return requestJson<StyleCategoryPublic[]>(`${API}/categories`, { signal });
}

export async function generateImage(
  payload: GenerateImageRequest,
  signal?: AbortSignal,
): Promise<GenerateImageResponse> {
  return requestJson<GenerateImageResponse>(`${API}/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export async function getJobStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobStatusResponse> {
  return requestJson<JobStatusResponse>(`${API}/jobs/${jobId}`, { signal });
}
