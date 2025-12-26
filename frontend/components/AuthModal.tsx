
import React, { useState } from 'react';
import { useTranslation } from '../context/I18nContext';
import { Button } from './ui/Button';
import { api, buildGatewayUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cn';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab }) => {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await api.auth.login({ email, password });
      } else {
        await api.auth.register({ email, password });
      }
      await refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    const url = buildGatewayUrl('/auth/google/start');
    window.location.href = url;
  };

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
          "relative w-full max-w-md overflow-hidden rounded-3xl border shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-zinc-800 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="flex p-6 pb-0">
          <button 
            className={`flex-1 pb-4 text-center text-sm font-semibold border-b-2 transition-all ${tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setTab('login')}
          >
            {t.common.login}
          </button>
          <button 
            className={`flex-1 pb-4 text-center text-sm font-semibold border-b-2 transition-all ${tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => setTab('register')}
          >
            {t.common.register}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-2">
            <h2 className={cn("text-2xl font-bold", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
              {tab === 'login' ? t.auth.loginTitle : t.auth.registerTitle}
            </h2>
            <p className={cn("text-sm", theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500')}>
              {tab === 'login' ? t.auth.loginSubtitle : t.auth.registerSubtitle}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <input 
              type="email" 
              placeholder={t.auth.email} 
              required
              className={cn(
                "w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
                theme === 'dark'
                  ? 'border-zinc-800 bg-zinc-800 text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-900'
              )}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" 
              placeholder={t.auth.password} 
              required
              minLength={8}
              className={cn(
                "w-full rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
                theme === 'dark'
                  ? 'border-zinc-800 bg-zinc-800 text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-900'
              )}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-sm font-medium text-rose-500">{error}</div>}

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            {tab === 'login' ? t.common.login : t.common.register}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className={cn(
                "w-full border-t transition-colors",
                theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
              )} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={cn(
                "px-2",
                theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-white text-zinc-500'
              )}>
                Or
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" size="lg" type="button" onClick={handleGoogleAuth}>
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t.auth.googleAuth}
          </Button>
        </form>
      </div>
    </div>
  );
};
