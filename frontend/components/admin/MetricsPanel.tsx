import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { AdminMetricsResponse } from '../../types';

const BAR_COLORS = ['#7c3aed', '#6366f1', '#22d3ee', '#34d399', '#f97316', '#facc15', '#fb7185'];

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-3 flex items-end gap-1">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          style={{
            height: `${(value / max) * 100}%`,
            background: BAR_COLORS[index % BAR_COLORS.length],
          }}
          className="w-1 rounded-full transition-all"
        />
      ))}
    </div>
  );
};

export const MetricsPanel: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.admin.metrics();
        setData(response);
      } catch (error) {
        console.error('Metrics fetch failed', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalGenerations = data?.generation_series.reduce((acc, item) => acc + item.value, 0) ?? 0;
  const totalRevenue = data?.revenue_series.reduce((acc, item) => acc + item.value, 0) ?? 0;
  const latestGens = data?.generation_series.at(-1)?.value ?? 0;
  const latestRevenue = data?.revenue_series.at(-1)?.value ?? 0;

  const renderBacklog = () => {
    if (!data) return null;
    return Object.entries(data.backlog).map(([status, count]) => (
      <div key={status} className="flex items-center justify-between text-sm">
        <span className="uppercase tracking-[0.3em] text-xs text-zinc-400">{status}</span>
        <span className="font-black">{count}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-indigo-400">{t.admin.metrics.tagline}</p>
            <h3 className="text-2xl font-black">{t.admin.metrics.title}</h3>
          </div>
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-400">{t.admin.metrics.reload}</span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.metrics.dailyGens}</p>
            <p className="text-3xl font-black">{latestGens}</p>
            <p className="text-xs text-zinc-400">{t.admin.metrics.totalLabel}: {totalGenerations}</p>
            <Sparkline values={data?.generation_series.map((item) => item.value) ?? []} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.metrics.dailyRevenue}</p>
            <p className="text-3xl font-black">{latestRevenue} {t.admin.billing.currency}</p>
            <p className="text-xs text-zinc-400">{t.admin.metrics.totalLabel}: {totalRevenue} {t.admin.billing.currency}</p>
            <Sparkline values={data?.revenue_series.map((item) => item.value) ?? []} />
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.metrics.apiErrors}</p>
            <p className="text-3xl font-black">{data?.api_errors ?? 0}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.metrics.failureRate}</p>
            <p className="text-lg font-black text-red-500">{data?.failure_rate ?? 0}%</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.metrics.backlogTitle}</p>
            <div className="mt-2 space-y-2">{renderBacklog()}</div>
          </div>
        </div>
        {!data && loading && (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 p-4 text-xs uppercase tracking-[0.3em] text-zinc-500">
            {t.common.loading}
          </div>
        )}
      </div>
    </div>
  );
};
