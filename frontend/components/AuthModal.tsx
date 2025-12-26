
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

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

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

        </form>
      </div>
    </div>
  );
};
