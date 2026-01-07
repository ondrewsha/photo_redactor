import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { AdminUsersResponse, AdminUserSummary } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

const PAGE_SIZE = 10;

export const AdminUserTable: React.FC = () => {
  const { t } = useTranslation();
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.admin.listUsers({
        email: emailFilter.trim() || undefined,
        role: roleFilter || undefined,
        is_active:
          statusFilter === 'active'
            ? true
            : statusFilter === 'inactive'
              ? false
              : undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(response);
    } catch (error) {
      console.error('Admin users fetch failed', error);
    } finally {
      setLoading(false);
    }
  }, [emailFilter, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const resetFilters = () => {
    setEmailFilter('');
    setRoleFilter('');
    setStatusFilter('all');
    setPage(1);
  };

  const refresh = async () => {
    await fetchUsers();
  };

  const handleAdjustBalance = async (user: AdminUserSummary) => {
    const raw = window.prompt(t.admin.actions.changeBalancePrompt, '0');
    if (!raw) return;
    const amount = Number(raw);
    if (Number.isNaN(amount) || amount === 0) return;
    try {
      await api.admin.adjustBalance(
        user.user_id,
        { amount, comment: `${amount > 0 ? '+' : ''}${amount}` },
        `adjust_balance_${user.user_id}`
      );
      alert(t.admin.notifications.balanceUpdated);
      await refresh();
    } catch (error) {
      console.error('Adjust balance failed', error);
      alert(t.common.error);
    }
  };

  const handleToggleStatus = async (user: AdminUserSummary) => {
    if (!window.confirm(t.admin.prompts.statusConfirm)) return;
    try {
      await api.admin.setUserStatus(
        user.user_id,
        { is_active: !user.is_active },
        `${user.is_active ? 'disable_user' : 'enable_user'}_${user.user_id}`
      );
      alert(t.admin.notifications.statusUpdated);
      await refresh();
    } catch (error) {
      console.error('Toggle status failed', error);
      alert(t.common.error);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
  const pageText = `${t.admin.pagination.page} ${data ? data.page : 0} / ${totalPages || 1}`;

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap gap-3" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder={t.admin.filters.email}
          value={emailFilter}
          onChange={(event) => setEmailFilter(event.target.value)}
          className="rounded-2xl border px-4 py-2 text-sm focus:outline-none"
        />
        <input
          type="text"
          placeholder={t.admin.filters.role}
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-2xl border px-4 py-2 text-sm focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
          className="rounded-2xl border px-4 py-2 text-sm focus:outline-none"
        >
          <option value="all">{t.admin.filters.status}</option>
          <option value="active">{t.admin.status.active}</option>
          <option value="inactive">{t.admin.status.inactive}</option>
        </select>
        <Button type="submit" className="shadow-lg shadow-indigo-500/20">
          {t.admin.filters.search}
        </Button>
        <Button variant="outline" onClick={resetFilters}>
          {t.admin.filters.reset}
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">{t.admin.usersTab}</h3>
          <div className="text-sm uppercase tracking-widest text-zinc-400">{pageText}</div>
        </div>
        <div className="mt-4 space-y-4">
          {loading && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm uppercase text-zinc-500">
              {t.common.loading}
            </div>
          )}
          {!loading && data && data.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center text-sm uppercase text-zinc-500">
              {t.common.error}
            </div>
          )}
          {data?.items.map((user) => (
            <div
              key={user.user_id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-inner shadow-black/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm uppercase tracking-widest text-zinc-400">{t.admin.headings.email}</p>
                  <p className="text-base font-black">{user.email}</p>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    {t.admin.headings.role}: {user.role}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    {t.admin.headings.created}: {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-zinc-400">{t.admin.headings.balance}</p>
                  <p className="text-lg font-black text-indigo-500">{user.balance}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-widest text-zinc-400">
                  {t.admin.headings.status}: {user.is_active ? t.admin.status.active : t.admin.status.inactive}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAdjustBalance(user)}>
                    {t.admin.actions.adjustBalance}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('text-sm font-black uppercase tracking-widest', user.is_active ? 'text-red-500' : 'text-green-400')}
                    onClick={() => handleToggleStatus(user)}
                  >
                    {user.is_active ? t.admin.actions.toggleActive : t.admin.actions.toggleInactive}
                  </Button>
                </div>
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
