import { HttpError } from "../lib/errors";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    return decodeURIComponent(part.slice(name.length + 1));
  }
  return null;
}

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
  const method = (options.method ?? "GET").toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (needsCsrf && !headers.has("x-csrf-token")) {
    const csrf = getCookie("nv_csrf");
    if (csrf) headers.set("x-csrf-token", csrf);
  }
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body != null && !headers.has("content-type") && !isFormData) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
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
