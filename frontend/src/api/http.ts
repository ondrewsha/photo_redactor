import { HttpError } from "../lib/errors";

async function readBodySafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (options.body != null && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await readBodySafe(response);
  if (!response.ok) {
    const message =
      (data as any)?.message ||
      (data as any)?.detail ||
      `${response.status} ${response.statusText}`;
    throw new HttpError(String(message), response.status, data);
  }
  return data as T;
}
