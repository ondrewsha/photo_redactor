
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';
import { BillingHistoryItem } from '../types';
import { TranslationSchema } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [billingHistoryOpen, setBillingHistoryOpen] = useState(false);
  const [billingHistoryItems, setBillingHistoryItems] = useState<BillingHistoryItem[]>([]);
  const [billingHistoryLoading, setBillingHistoryLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const suggestions = [1, 10, 30, 60, 90, 100];

  const unitPrice = useMemo(() => {
    if (count >= 91) return 10;
    if (count >= 61) return 15;
    if (count >= 31) return 20;
    if (count >= 11) return 25;
    return 30;
  }, [count]);
  const totalPrice = useMemo(() => unitPrice * count, [unitPrice, count]);

  const handlePay = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.billing.pay({ generation_count: count });
      if (resp.confirmation_url) {
        window.location.href = resp.confirmation_url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [count]);

  const openBillingHistory = useCallback(async () => {
    setBillingHistoryLoading(true);
    try {
      const data = await api.billing.history(20);
      setBillingHistoryItems(data.items);
      setBillingHistoryOpen(true);
    } catch (err) {
      console.error('Не удалось загрузить историю пополнений', err);
    } finally {
      setBillingHistoryLoading(false);
    }
  }, []);

  const logoutButtonClass = cn(
    "w-full justify-start border transition-colors uppercase tracking-[0.35em] text-xs text-rose-600 border-rose-100",
    theme === 'dark' ? 'hover:bg-rose-900/20 dark:border-rose-900/30' : 'hover:bg-rose-50'
  );

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setChangePasswordError(t.profile.passwordMismatch);
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    try {
      await api.auth.changePassword({ current_password: currentPassword, new_password: newPassword });
      setChangePasswordSuccess(t.profile.passwordChangeSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setChangePasswordError(error?.message || t.profile.passwordChangeError);
    } finally {
      setChangePasswordLoading(false);
    }
  }, [
  newPassword,
  confirmPassword,
  currentPassword,
  t.profile.passwordMismatch,
  t.profile.passwordChangeSuccess,
  t.profile.passwordChangeError,
]);

  const openChangePasswordModal = useCallback(() => {
    setChangePasswordOpen(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
  }, []);

  const closeChangePasswordModal = useCallback(() => {
    setChangePasswordOpen(false);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
  }, []);

  if (!isOpen || !user) return null;

  const depositItems = billingHistoryItems.filter((entry) => entry.delta > 0);

  const outlineButtonClass = cn(
    "w-full justify-start border transition-colors uppercase tracking-[0.35em] text-xs",
    theme === 'dark'
      ? 'border-zinc-700 text-zinc-200 hover:border-indigo-500 hover:bg-zinc-900/60'
      : 'border-zinc-200 text-zinc-700 hover:border-indigo-400 hover:bg-indigo-50'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-sm transition-colors",
          theme === 'dark' ? 'bg-zinc-950/80' : 'bg-white/70'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-[2rem] border shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                {t.common.profile}
              </h2>
              <p className={cn("text-sm transition-colors", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
                {user.email}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
               <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          </div>

          <div
            className={cn(
              "p-6 rounded-2xl border flex justify-between items-center transition-colors",
              theme === 'dark'
                ? 'bg-indigo-900/10 border-indigo-900/30 text-white'
                : 'bg-indigo-50 border-indigo-100 text-zinc-900 shadow-[0_20px_45px_rgba(79,70,229,0.25)]'
            )}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-widest" >
                <span className={cn(theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600')}>
                  {t.profile.balance}
                </span>
              </div>
              <div className={cn("text-3xl font-black", theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600')}>
                {user.balance}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${user.email_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {user.email_verified ? t.profile.verified : t.profile.notVerified}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">{t.profile.buyGenerations}</h3>
            <div className="flex gap-2">
              {suggestions.map((val) => (
                <button
                  key={val}
                  onClick={() => setCount(val)}
                  disabled={loading}
                  className={cn(
                    "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                    count === val
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                      : theme === 'dark'
                        ? "border-zinc-700 text-zinc-300 hover:border-indigo-400"
                        : "border-zinc-200 text-zinc-600 hover:border-indigo-400"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div
              className={cn(
                "p-4 rounded-xl space-y-2 transition-colors",
                theme === 'dark'
                  ? 'bg-zinc-800/50'
                  : 'bg-zinc-50 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'
              )}
            >
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{count} {t.profile.units}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="mt-3 w-full accent-indigo-500"
                disabled={loading}
              />
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}>{t.profile.unitPrice}</span>
                <span className={cn("font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                  {unitPrice} {t.profile.currency}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>{t.profile.totalPrice}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{totalPrice} {t.profile.currency}</span>
              </div>
            </div>

            <Button className="w-full" size="lg" isLoading={loading} onClick={handlePay}>
              {t.profile.pay}
            </Button>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <Button
              variant="outline"
              className={outlineButtonClass}
              onClick={openBillingHistory}
              isLoading={billingHistoryLoading}
            >
              {t.profile.historyButton}
            </Button>
            <Button
              variant="outline"
              className={outlineButtonClass}
              onClick={openChangePasswordModal}
            >
              {t.profile.changePassword}
            </Button>
            <Button
              variant="outline"
              className={logoutButtonClass}
              onClick={() => {
                logout();
                onClose();
              }}
            >
              {t.common.logout}
            </Button>
          </div>
        </div>
      </div>
      <BillingHistoryModal
        isOpen={billingHistoryOpen}
        onClose={() => setBillingHistoryOpen(false)}
        items={depositItems}
        theme={theme}
        t={t}
      />
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={closeChangePasswordModal}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleChangePassword}
        loading={changePasswordLoading}
        error={changePasswordError}
        success={changePasswordSuccess}
        theme={theme}
        t={t}
      />
    </div>
  );
};

type BillingHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: BillingHistoryItem[];
  theme: 'light' | 'dark';
  t: TranslationSchema;
};

const BillingHistoryModal: React.FC<BillingHistoryModalProps> = ({ isOpen, onClose, items, theme, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 transition-colors",
          theme === 'dark' ? 'bg-black/80' : 'bg-white/80'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-[1.5rem] border shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-zinc-700 border-zinc-200">
          <h3 className="text-lg font-bold uppercase tracking-[0.4em]">{t.profile.historyTitle}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
          {items.length === 0 ? (
            <div className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
              {t.profile.historyEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((entry) => (
                <div
                  key={entry.transaction_id}
                  className={cn(
                    "rounded-2xl border p-4 transition-colors",
                    theme === 'dark'
                      ? 'border-zinc-800 bg-zinc-900/60 shadow-inner'
                      : 'border-zinc-200 bg-white shadow-sm'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                      {t.profile.historyKinds[entry.kind] ?? entry.kind}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      +{entry.delta}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {t.profile.historyDescriptions[entry.kind] ?? entry.comment ?? t.profile.historyDefaultComment}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-zinc-400 dark:text-zinc-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  success: string | null;
  theme: 'light' | 'dark';
  t: TranslationSchema;
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  loading,
  error,
  success,
  theme,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          "absolute inset-0 transition-colors",
          theme === 'dark' ? 'bg-black/80' : 'bg-white/80'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-[1.5rem] border shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="px-6 py-5 border-b dark:border-zinc-700 border-zinc-200">
          <h3 className="text-lg font-bold uppercase tracking-[0.4em]">
            {t.profile.changePasswordTitle}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              {t.profile.currentPassword}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => onCurrentPasswordChange(e.target.value)}
              className={cn(
                "mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition-colors text-sm",
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-900'
              )}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              {t.profile.newPassword}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              className={cn(
                "mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition-colors text-sm",
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-900'
              )}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              {t.profile.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className={cn(
                "mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition-colors text-sm",
                theme === 'dark'
                  ? 'border-zinc-700 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-900'
              )}
            />
          </div>
          {error && (
            <div className="text-sm font-semibold text-rose-400">{error}</div>
          )}
          {success && (
            <div className="text-sm font-semibold text-emerald-400">{success}</div>
          )}
          <Button className="w-full" onClick={onSubmit} isLoading={loading}>
            {t.profile.changePasswordSubmit}
          </Button>
        </div>
      </div>
    </div>
  );
};
