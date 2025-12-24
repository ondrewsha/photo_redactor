import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { authLogin, authRegister } from "../../api/nanovisual";
import { cn } from "../../lib/cn";
import { getErrorMessage } from "../../lib/errors";

type Tab = "login" | "register";

function IconX(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 7l10 10M17 7L7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AuthModal(props: {
  open: boolean;
  onClose: () => void;
  onAuthed: () => void;
}) {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!props.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  useEffect(() => {
    if (props.open) return;
    setBusy(false);
    setError(null);
    setMessage(null);
    setPassword("");
  }, [props.open]);

  const title = tab === "login" ? "Вход" : "Регистрация";
  const subtitle =
    tab === "login"
      ? "Войди, чтобы создавать картинки."
      : "Создай аккаунт — и мы дадим 3 генерации после подтверждения почты.";

  const canSubmit = useMemo(() => {
    return email.trim().length >= 3 && password.trim().length >= 8 && !busy;
  }, [busy, email, password]);

  const submit = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const payload = { email: email.trim(), password: password.trim() };
      const resp = tab === "login" ? await authLogin(payload) : await authRegister(payload);
      setMessage(resp.message);
      props.onAuthed();
      props.onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {props.open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={props.onClose}
            aria-label="Закрыть"
          />

          <motion.div
            className={cn(
              "relative w-[min(92vw,460px)]",
              "rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-soft backdrop-blur",
            )}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <div className="text-sm font-semibold text-zinc-50">{title}</div>
                <div className="mt-1 text-xs text-zinc-400">{subtitle}</div>
              </div>
              <button
                type="button"
                onClick={props.onClose}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border",
                  "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100",
                )}
                aria-label="Закрыть"
                title="Закрыть"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2 text-xs font-semibold",
                    tab === "login"
                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-200 hover:border-zinc-700",
                  )}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className={cn(
                    "flex-1 rounded-2xl border px-3 py-2 text-xs font-semibold",
                    tab === "register"
                      ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-200 hover:border-zinc-700",
                  )}
                >
                  Регистрация
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Почта"
                  className={cn(
                    "w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100",
                    "outline-none placeholder:text-zinc-600 focus:border-zinc-700",
                  )}
                  autoComplete="email"
                  inputMode="email"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль (минимум 8 символов)"
                  className={cn(
                    "w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100",
                    "outline-none placeholder:text-zinc-600 focus:border-zinc-700",
                  )}
                  type="password"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                />

                {error ? (
                  <div className="rounded-2xl border border-red-800/40 bg-red-500/10 p-3 text-xs text-red-100">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3 text-xs text-zinc-200">
                    {message}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canSubmit}
                  className={cn(
                    "w-full rounded-2xl px-4 py-3 text-sm font-semibold",
                    "bg-white text-zinc-950 hover:bg-zinc-100",
                    "disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300",
                  )}
                >
                  {busy ? "Подожди…" : tab === "login" ? "Войти" : "Создать аккаунт"}
                </button>

                <a
                  href="/api/auth/google/start"
                  className={cn(
                    "mt-1 block w-full rounded-2xl border px-4 py-3 text-center text-sm font-semibold",
                    "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                  )}
                >
                  Войти через Google
                </a>

                <div className="text-[11px] text-zinc-500">
                  Мы не показываем твои запросы другим людям и не публикуем картинки без тебя.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

