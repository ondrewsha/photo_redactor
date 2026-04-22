import React, { useEffect, useState } from 'react';
import { useTranslation } from '../context/I18nContext';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'login' | 'register' | 'reset';
  resetTokenFromUrl?: string | null; // Добавляем пропс для токена
}

type AuthTab = 'login' | 'register' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab,
  resetTokenFromUrl 
}) => {
  const [tab, setTab] = useState<AuthTab>(initialTab === 'login' ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setResetSent(false); // Сбрасываем состояние при каждом открытии
      
      const storedToken = sessionStorage.getItem('nv_reset_token');
      if (initialTab === 'reset' && storedToken) {
        setResetToken(storedToken);
      } else {
        setResetToken(null);
      }
    }
  }, [isOpen, initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await api.auth.login({ email, password });
      } else if (tab === 'register') {
        const refCode = localStorage.getItem('nv_ref');
        await api.auth.register({ email, password, referral_code: refCode || undefined });
        localStorage.removeItem('nv_ref');
      } else {
        // Сброс пароля
        if (resetToken) {
          // Шаг 2: Установка нового пароля
          if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
          }
          await api.auth.resetPassword({ token: resetToken, new_password: password });
          sessionStorage.removeItem('nv_reset_token');
          setResetToken(null);
          setError('');
          setTab('login'); // Переключаем на вход после успеха
        } else {
          // Шаг 1: Отправка ссылки
          await api.auth.forgotPassword({ email });
          setResetSent(true); // Показываем экран успеха
        }
      }
      if (tab !== 'reset') {
        await refresh();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={cn("absolute inset-0 backdrop-blur-sm transition-colors", theme === 'dark' ? 'bg-zinc-950/80' : 'bg-white/70')} onClick={onClose} />
      <div className={cn("relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl transition-colors", theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900')}>
        
        <div className="flex p-6 pb-0">
          <button className={`flex-1 pb-4 text-center text-sm font-semibold border-b-2 transition-all ${tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`} onClick={() => setTab('login')}>{t.common.login}</button>
          <button className={`flex-1 pb-4 text-center text-sm font-semibold border-b-2 transition-all ${tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`} onClick={() => setTab('register')}>{t.common.register}</button>
        </div>

        {tab === 'reset' ? (
          <div className="p-8 space-y-4">
            <h2 className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
              {resetToken ? 'Установка нового пароля' : resetSent ? 'Письмо отправлено' : 'Восстановление доступа'}
            </h2>
            
            {resetSent ? (
              <div className="space-y-6 pt-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
                    Мы отправили инструкцию на <br/>
                    <span className="font-semibold text-indigo-500">{email}</span>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Проверьте папку «Спам», если письмо не пришло в течение 2 минут.
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <Button className="w-full" size="lg" onClick={() => setTab('login')}>Вернуться ко входу</Button>
                  <button type="button" className="w-full text-center text-sm text-indigo-500 hover:text-indigo-600 font-medium transition-colors" onClick={() => setResetSent(false)}>
                    Попробовать другой email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                {!resetToken ? (
                  <>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
                      Укажите email, и мы отправим ссылку для сброса пароля.
                    </p>
                    <input type="email" placeholder="Email аккаунта" required value={email} onChange={e => setEmail(e.target.value)} className={cn("w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", theme === 'dark' ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900')} />
                  </>
                ) : (
                  <>
                    <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
                      Придумайте надёжный пароль для вашего аккаунта.
                    </p>
                    <input type="password" placeholder="Новый пароль (мин. 8 символов)" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className={cn("w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", theme === 'dark' ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900')} />
                    <input type="password" placeholder="Повторите пароль" required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={cn("w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", theme === 'dark' ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900')} />
                  </>
                )}
                
                {error && <div className="text-sm font-medium text-rose-500 bg-rose-500/10 p-3 rounded-xl text-center">{error}</div>}
                
                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  {resetToken ? 'Сохранить пароль' : 'Отправить ссылку'}
                </Button>
                <button type="button" className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 mt-2" onClick={() => setTab('login')}>← Вернуться ко входу</button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div className="space-y-2">
              <h2 className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>{tab === 'login' ? t.auth.loginTitle : t.auth.registerTitle}</h2>
              <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>{tab === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}</p>
            </div>

            <div className="space-y-4 pt-4">
              <input type="email" placeholder={t.auth.email} required className={cn("w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", theme === 'dark' ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900')} value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder={t.auth.password} required minLength={8} className={cn("w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", theme === 'dark' ? 'border-zinc-800 bg-zinc-800 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-900')} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <div className="text-sm font-medium text-rose-500 bg-rose-500/10 p-3 rounded-xl text-center">{error}</div>}

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>{tab === 'login' ? t.common.login : t.common.register}</Button>
            
            {tab === 'login' && (
              <button type="button" className="w-full text-center text-sm text-indigo-500 hover:text-indigo-600 font-medium" onClick={() => setTab('reset')}>Забыли пароль?</button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};