import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { authChangePassword, authLogout, authResendVerification, billingPay } from "../../api/nanovisual";
import { cn } from "../../lib/cn";
import { getErrorMessage } from "../../lib/errors";
import type { AuthMeResponse } from "../../types/nanovisual";

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

export function ProfileModal(props: {
  open: boolean;
  onClose: () => void;
  me: AuthMeResponse;
  onReloadMe: () => void;
}) {
  const suggestions = [1, 10, 50, 200, 500, 1000] as const;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [count, setCount] = useState<number>(10);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!props.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  useEffect(() => {
    if (!props.open) return;
    setError(null);
    setMessage(null);
    setBusy(false);
  }, [props.open]);

  const unitPriceRub = useMemo(() => {
    if (count <= 10) return 30;
    if (count <= 50) return 25;
    if (count <= 200) return 20;
    if (count <= 500) return 15;
    return 12;
  }, [count]);

  const totalPriceRub = useMemo(() => {
    return unitPriceRub * count;
  }, [count, unitPriceRub]);

  const resend = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await authResendVerification();
      setMessage(resp.message);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await authLogout();
      props.onReloadMe();
      props.onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword.trim() || newPassword.trim().length < 8) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await authChangePassword({
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
      });
      setMessage(resp.message);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const resp = await billingPay({ generation_count: count });
      if (resp.confirmation_url) {
        window.location.href = resp.confirmation_url;
        return;
      }
      setMessage("Платёж создан. Открой страницу оплаты.");
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
              "relative w-[min(92vw,520px)] max-h-[88dvh] overflow-auto",
              "rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-soft backdrop-blur",
            )}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div>
                <div className="text-sm font-semibold text-zinc-50">Профиль</div>
                <div className="mt-1 text-xs text-zinc-400">{props.me.email}</div>
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
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-200">
                <div className="flex items-center justify-between gap-3">
                  <div>Осталось генераций</div>
                  <div className="font-semibold">{props.me.balance}</div>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {props.me.email_verified ? "Почта подтверждена." : "Почта не подтверждена — без этого нельзя генерировать."}
                </div>
                {!props.me.email_verified ? (
                  <button
                    type="button"
                    onClick={() => void resend()}
                    className={cn(
                      "mt-3 rounded-2xl border px-4 py-2 text-xs font-semibold",
                      "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                    )}
                    disabled={busy}
                  >
                    Отправить письмо ещё раз
                  </button>
                ) : null}
              </div>

              {error ? (
                <div className="mt-3 rounded-2xl border border-red-800/40 bg-red-500/10 p-3 text-xs text-red-100">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3 text-xs text-zinc-200">
                  {message}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <div className="text-xs font-semibold text-zinc-300">Купить генерации</div>

                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => {
                    const active = s === count;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCount(s)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          active
                            ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100"
                            : "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                        )}
                        disabled={busy}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-zinc-100">{count} шт.</div>
                    <div className="text-xs text-zinc-400">
                      {unitPriceRub} ₽ за штуку
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={1000}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-3 w-full"
                    disabled={busy}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-300">
                    <div>Итого</div>
                    <div className="font-semibold">{totalPriceRub} ₽</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void pay()}
                    className={cn(
                      "mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold",
                      "bg-white text-zinc-950 hover:bg-zinc-100",
                      "disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300",
                    )}
                    disabled={busy}
                  >
                    {busy ? "Подожди…" : "Оплатить"}
                  </button>
                  <div className="mt-2 text-[11px] text-zinc-500">
                    После оплаты генерации сразу появятся в кошельке.
                  </div>
                </div>

                <div className="text-xs font-semibold text-zinc-300">Сменить пароль</div>
                <div className="grid gap-2">
                  <input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Текущий пароль"
                    className={cn(
                      "w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100",
                      "outline-none placeholder:text-zinc-600 focus:border-zinc-700",
                    )}
                    type="password"
                    autoComplete="current-password"
                    disabled={busy}
                  />
                  <input
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Новый пароль (минимум 8 символов)"
                    className={cn(
                      "w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-100",
                      "outline-none placeholder:text-zinc-600 focus:border-zinc-700",
                    )}
                    type="password"
                    autoComplete="new-password"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => void changePassword()}
                    className={cn(
                      "rounded-2xl border px-4 py-2 text-xs font-semibold",
                      "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                    disabled={busy || !currentPassword.trim() || newPassword.trim().length < 8}
                  >
                    Обновить пароль
                  </button>
                  <div className="text-[11px] text-zinc-500">
                    Если входишь только через Google, пароль может быть не задан.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void logout()}
                  className={cn(
                    "mt-2 w-full rounded-2xl border px-4 py-3 text-sm font-semibold",
                    "border-zinc-800 bg-zinc-950/20 text-zinc-200 hover:border-zinc-700",
                  )}
                  disabled={busy}
                >
                  Выйти
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
