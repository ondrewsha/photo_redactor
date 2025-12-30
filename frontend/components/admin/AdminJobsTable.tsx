import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { AdminJobsResponse } from '../../types';
import { Button } from '../ui/Button';

const PAGE_SIZE = 10;

export const AdminJobsTable: React.FC = () => {
  const { t } = useTranslation();
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminJobsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.admin.listJobs({
        email: emailFilter.trim() || undefined,
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(response);
    } catch (error) {
      console.error('Admin jobs fetch failed', error);
    } finally {
      setLoading(false);
    }
  }, [emailFilter, statusFilter, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const pageText = `${t.admin.pagination.page} ${data ? data.page : 0} / ${totalPages || 1}`;

  const handleAction = useCallback(
    async (jobId: string, type: 'rerun' | 'cancel') => {
      try {
        if (type === 'rerun') {
          await api.admin.rerunJob(jobId);
          alert(t.admin.notifications.jobRerun);
        } else {
          await api.admin.cancelJob(jobId);
          alert(t.admin.notifications.jobCancel);
        }
        await fetchJobs();
      } catch (error) {
        console.error('Job action failed', error);
        alert(t.common.error);
      }
    },
    [fetchJobs, t]
  );

  const resetFilters = () => {
    setEmailFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); setPage(1); fetchJobs(); }}>
        <input
          type="text"
          placeholder={t.admin.filters.email}
          value={emailFilter}
          onChange={(event) => setEmailFilter(event.target.value)}
          className="rounded-2xl border px-4 py-2 text-sm focus:outline-none"
        />
        <input
          type="text"
          placeholder={t.admin.filters.status}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border px-4 py-2 text-sm focus:outline-none"
        />
        <Button type="submit" className="shadow-lg shadow-indigo-500/20">
          {t.admin.filters.search}
        </Button>
        <Button variant="outline" onClick={resetFilters}>
          {t.admin.filters.reset}
        </Button>
      </form>

      <div className="rounded-[2.5rem] border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">{t.admin.jobsTable.title}</h3>
          <span className="text-sm uppercase tracking-wider text-zinc-400">{pageText}</span>
        </div>
        {data?.backlog && Object.keys(data.backlog).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(data.backlog).map(([status, count]) => (
              <span
                key={status}
                className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em]"
              >
                {status}: {count}
              </span>
            ))}
          </div>
        )}
        <div className="mt-6 space-y-4">
          {loading && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
              {t.common.loading}
            </div>
          )}
          {!loading && data && data.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
              {t.admin.jobsTable.empty}
            </div>
          )}
          {data?.items.map((job) => (
            <div
              key={job.reservation_id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-inner shadow-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.jobsTable.jobId}</p>
                  <p className="font-black">{job.job_id ?? job.reservation_id}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.jobsTable.statusLabel}</p>
                  <p className="text-sm">{job.status}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.jobsTable.userEmail}</p>
                  <p className="text-sm">{job.user_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.jobsTable.created}</p>
                  <p className="text-sm">{new Date(job.created_at).toLocaleString()}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.jobsTable.updated}</p>
                  <p className="text-sm">{new Date(job.updated_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAction(job.job_id ?? job.reservation_id, 'rerun')}>
                  {t.admin.jobsTable.actions.rerun}
                </Button>
                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleAction(job.job_id ?? job.reservation_id, 'cancel')}>
                  {t.admin.jobsTable.actions.cancel}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={!data || data.page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t.admin.pagination.prev}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!data || (data.total && page >= Math.ceil(data.total / data.limit))}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t.admin.pagination.next}
          </Button>
        </div>
      </div>
    </div>
  );
};
