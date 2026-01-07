const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};
const defaultHeaders = (includeContentType = true) => ({
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    'x-csrf-token': getCookie('nv_csrf') || '',
});
const request = async (path, options = {}) => {
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
export const adminApi = {
    login: (payload) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    logout: () => request('/auth/logout', {
        method: 'POST',
    }),
    fetchUsers: (page = 1, limit = 20) => request(`/admin/users?page=${page}&limit=${limit}`),
    adjustBalance: (userId, amount, comment) => request(`/admin/users/${userId}/balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, comment }),
    }),
    toggleStatus: (userId, isActive) => request(`/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ is_active: isActive }),
    }),
    fetchTransactions: (page = 1, limit = 20) => request(`/admin/transactions?page=${page}&limit=${limit}`),
    fetchMetrics: () => request('/admin/metrics'),
    fetchJobs: (page = 1, limit = 20, status) => {
        const query = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (status)
            query.set('status', status);
        return request(`/admin/jobs?${query.toString()}`);
    },
    rerunJob: (jobId) => request(`/admin/jobs/${jobId}/rerun`, {
        method: 'POST',
    }),
    cancelJob: (jobId) => request(`/admin/jobs/${jobId}/cancel`, {
        method: 'POST',
    }),
    fetchSession: () => request('/auth/me'),
};
