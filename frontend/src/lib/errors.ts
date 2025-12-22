export class HttpError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") return "Отменено";
  if (error instanceof Error) {
    const msg = error.message || "";
    if (msg === "Failed to fetch") return "Нет связи с сервером";
    if (msg.toLowerCase().includes("networkerror")) return "Нет связи с сервером";
    return msg;
  }
  return "Неизвестная ошибка";
}
