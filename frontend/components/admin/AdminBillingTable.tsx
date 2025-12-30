import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { AdminTransactionsResponse } from '../../types';
import { Button } from '../ui/Button';

const PAGE_SIZE = 10;

export const AdminBillingTable: React.FC = () => {
  const { t } = useTranslation();
  const [emailFilter, setEmailFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminTransactionsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.admin.listTransactions({
        email: emailFilter.trim() || undefined,
        kind: kindFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(response);
    } catch (error) {
      console.error('Admin transactions fetch failed', error);
    } finally {
      setLoading(false);
    }
  }, [emailFilter, kindFilter, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const resetFilters = () => {
    setEmailFilter('');
    setKindFilter('');
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const pageText = `${t.admin.pagination.page} ${data ? data.page : 0} / ${totalPages || 1}`;

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); setPage(1); fetchTransactions(); }}>
        <input
          type="text"
          placeholder={t.admin.filters.email}
          value={emailFilter}
          onChange={(event) => setEmailFilter(event.target.value)}
          className="rounded-2xl border px-4 py-2 text-sm focus:outline-none"
        />
        <input
          type="text"
          placeholder={t.admin.billing.filters.kind}
          value={kindFilter}
          onChange={(event) => setKindFilter(event.target.value)}
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
          <h3 className="text-lg font-black">{t.admin.billing.title}</h3>
          <span className="text-sm uppercase tracking-wider text-zinc-400">{pageText}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.billing.totalAmount}</p>
            <p className="text-xl font-black text-indigo-400">
              {data?.summary.total_amount ?? 0} {t.admin.billing.currency}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.billing.totalCount}</p>
            <p className="text-xl font-black">{data?.summary.total_count ?? 0}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {loading && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
              {t.common.loading}
            </div>
          )}
          {!loading && data && data.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500">
              {t.admin.billing.empty}
            </div>
          )}
          {data?.items.map((tx) => (
            <div
              key={tx.transaction_id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-inner shadow-black/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.billing.kindLabel}</p>
                  <p className="font-black">{tx.kind}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.billing.userLabel}</p>
                  <p className="text-sm">{tx.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.billing.deltaLabel}</p>
                  <p className="text-lg font-black text-indigo-400">{tx.delta}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{t.admin.billing.amountLabel}</p>
                  <p className="text-sm">{tx.amount_rub ?? '?'} {t.admin.billing.currency}</p>
                </div>
              </div>
              {tx.comment && (
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-zinc-500">{tx.comment}</p>
              )}
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
                {t.admin.billing.createdLabel}: {new Date(tx.created_at).toLocaleString()}
              </p>
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
