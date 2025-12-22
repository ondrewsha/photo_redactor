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

export async function generateImageWithPhoto(
  payload: GenerateImageRequest,
  photo: File,
  signal?: AbortSignal,
): Promise<GenerateImageResponse> {
  const form = new FormData();
  for (const id of payload.style_ids) form.append("style_ids", id);
  form.append("user_input", payload.user_input);
  form.append("width", String(payload.width));
  form.append("height", String(payload.height));
  form.append("image", photo);

  return requestJson<GenerateImageResponse>(`${API}/generate/image`, {
    method: "POST",
    body: form,
    signal,
  });
}

export async function generateImageWithPhotos(
  payload: GenerateImageRequest,
  photos: File[],
  signal?: AbortSignal,
): Promise<GenerateImageResponse> {
  const form = new FormData();
  for (const id of payload.style_ids) form.append("style_ids", id);
  form.append("user_input", payload.user_input);
  form.append("width", String(payload.width));
  form.append("height", String(payload.height));
  for (const photo of photos) form.append("image", photo);

  return requestJson<GenerateImageResponse>(`${API}/generate/image`, {
    method: "POST",
    body: form,
    signal,
  });
}

export async function getJobStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobStatusResponse> {
  return requestJson<JobStatusResponse>(`${API}/jobs/${jobId}`, { signal });
}
