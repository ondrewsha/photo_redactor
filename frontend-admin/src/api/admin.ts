const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

const defaultHeaders = (includeContentType = true): HeadersInit => ({
  ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
  'x-csrf-token': getCookie('nv_csrf') || '',
});

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...defaultHeaders(options.method?.toUpperCase() !== 'GET'),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
};

export interface UserSummary {
  user_id: string;
  email: string;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  items: UserSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionItem {
  transaction_id: string;
  email: string;
  delta: number;
  kind: string;
  comment?: string | null;
  amount_rub?: number | null;
  created_at: string;
}

export interface TransactionsResponse {
  items: TransactionItem[];
  summary: {
    by_kind: Record<string, number>;
    total_amount: number;
    total_count: number;
  };
  page: number;
  limit: number;
  total: number;
}

export interface MetricsResponse {
  generation_series: Array<{ label: string; value: number }>;
  revenue_series: Array<{ label: string; value: number }>;
  backlog: Record<string, number>;
  webhooks: Record<string, number>;
  api_errors: number;
  failure_rate: number;
}

export const adminApi = {
  login: (payload: { email: string; password: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),
  fetchUsers: (page = 1, limit = 20) =>
    request<UsersResponse>(`/admin/users?page=${page}&limit=${limit}`),
  adjustBalance: (userId: string, amount: number, comment?: string) =>
    request<UserSummary>(`/admin/users/${userId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, comment }),
    }),
  toggleStatus: (userId: string, isActive: boolean) =>
    request<UserSummary>(`/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ is_active: isActive }),
    }),
  fetchTransactions: (page = 1, limit = 20) =>
    request<TransactionsResponse>(`/admin/transactions?page=${page}&limit=${limit}`),
  fetchMetrics: () => request<MetricsResponse>('/admin/metrics'),
  fetchSession: () => request<{ email: string }>('/auth/me'),
};
