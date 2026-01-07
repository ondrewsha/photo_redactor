import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/I18nContext';
import { Button } from '../ui/Button';
import { AdminUserTable } from './AdminUserTable';
import { AdminBillingTable } from './AdminBillingTable';
import { AdminJobsTable } from './AdminJobsTable';
import { MetricsPanel } from './MetricsPanel';
import { cn } from '../../lib/cn';

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ open, onClose }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<'users' | 'transactions' | 'jobs' | 'metrics'>('users');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className={cn(
          "relative z-10 w-full max-w-5xl rounded-[3rem] border p-6 shadow-2xl transition-colors",
          theme === 'dark'
            ? 'border-white/10 bg-zinc-950 text-white'
            : 'border-zinc-200 bg-white text-zinc-900'
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-400">{t.admin.subtitle}</p>
            <h2 className="text-3xl font-black">{t.admin.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="sr-only">{t.common.close}</span>
              ×
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { key: 'users', label: t.admin.usersTab },
            { key: 'transactions', label: t.admin.transactionsTab },
            { key: 'jobs', label: t.admin.jobsTab },
            { key: 'metrics', label: t.admin.metricsTab },
          ].map((tab) => (
            <button
              key={tab.key}
              className={cn(
                'rounded-2xl px-5 py-2 text-sm font-black uppercase tracking-[0.3em] transition',
                activeTab === tab.key
                  ? theme === 'dark'
                    ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : theme === 'dark'
                    ? 'bg-zinc-900/80 border border-white/20 text-white'
                    : 'bg-zinc-900/80 border border-zinc-200 text-white'
              )}
              onClick={() => setActiveTab(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'users' && <AdminUserTable />}
          {activeTab === 'transactions' && <AdminBillingTable />}
          {activeTab === 'jobs' && <AdminJobsTable />}
          {activeTab === 'metrics' && <MetricsPanel />}
        </div>
      </div>
    </div>
  );
};
