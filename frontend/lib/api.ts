
import { 
  AuthMeResponse, 
  BillingHistoryResponse,
  GenerateImageRequest, 
  GenerateImageWithPhotosRequest,
  JobStatusResponse, 
  StyleCategoryPublic, 
  GenerationCapabilities,
  HistoryListResponse,
  MessageResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_GATEWAY_URL || '/api';

const normalizeBase = (value: string) => (value.replace(/\/+$/, '') || '');
const GATEWAY_BASE = normalizeBase(BASE_URL);

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

async function request<T>(path: string, options?: RequestInit, mockFallback?: T): Promise<T> {
  const method = ((options?.method as string) || 'GET').toUpperCase();
  const url = `${BASE_URL}${path}`;
  const rawHeaders: Record<string, string> = {
    ...((options?.headers as any) || {}),
  };
  const hasContentType = Object.keys(rawHeaders).some(
    (key) => key.toLowerCase() === 'content-type'
  );
  const isFormData = options?.body instanceof FormData;
  if (!hasContentType && !isFormData) {
    rawHeaders['Content-Type'] = 'application/json';
  }
  const headers = rawHeaders;

  const csrfToken = getCookie('nv_csrf');
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers['x-csrf-token'] = csrfToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      // Если есть мок на случай ошибки сервера (например 404/500), возвращаем его
      if (mockFallback !== undefined) return mockFallback;
      
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      try {
        const errData = await response.json();
        errorMessage = errData.message || errData.detail || errorMessage;
      } catch (e) {
        // Ответ не в JSON формате
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // В случае сетевой ошибки (бэкенд не запущен), используем мок если он есть
    if (mockFallback !== undefined) {
      console.warn(`API call to ${path} failed, using mock data.`, error);
      return new Promise((resolve) => setTimeout(() => resolve(mockFallback), 300));
    }
    throw error;
  }
}

// Надежные мок-данные на случай отсутствия связи с бэкендом
const MOCK_CAPS: GenerationCapabilities = {
  image_provider: "openai",
  model: "dall-e-3",
  supports_source_images: false,
  max_photos: 4,
  size_presets: [
    { id: "1024x1024", label: "Квадрат • 1024x1024", width: 1024, height: 1024 },
    { id: "1792x1024", label: "Пейзаж • 1792x1024", width: 1792, height: 1024 },
    { id: "1024x1792", label: "Портрет • 1024x1792", width: 1024, height: 1792 }
  ]
};

const MOCK_CATEGORIES: StyleCategoryPublic[] = [
  { id: "none", category: "Базовые", display_name: "Без стиля", preview_image: "https://picsum.photos/seed/nv_none/400/300" },
  { id: "photoreal", category: "Фото", display_name: "Фотореализм", preview_image: "https://picsum.photos/seed/nv_photo/400/300" },
  { id: "cinematic", category: "Кино", display_name: "Кино", preview_image: "https://picsum.photos/seed/nv_movie/400/300" },
  { id: "anime", category: "Арт", display_name: "Аниме", preview_image: "https://picsum.photos/seed/nv_anime/400/300" },
  { id: "oil_paint", category: "Живопись", display_name: "Масло", preview_image: "https://picsum.photos/seed/nv_oil/400/300" }
];

export const resolveAssetUrl = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return imageUrl;
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  if (GATEWAY_BASE) return `${GATEWAY_BASE}${normalized}`;
  return normalized;
};

export const api = {
  auth: {
    me: () => request<AuthMeResponse>('/auth/me'),
    login: (p: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(p) }),
    register: (p: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(p) }),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
    changePassword: (payload: { current_password: string; new_password: string }) =>
      request<MessageResponse>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  generation: {
    capabilities: () => request<GenerationCapabilities>('/capabilities', undefined, MOCK_CAPS),
    categories: () => request<StyleCategoryPublic[]>('/categories', undefined, MOCK_CATEGORIES),
    generate: (p: GenerateImageRequest) => request<{ job_id: string; status: string }>('/generate', { 
      method: 'POST', 
      body: JSON.stringify(p) 
    }),
    generateWithPhotos: (p: GenerateImageWithPhotosRequest) => {
      const form = new FormData();
      form.append('user_input', p.user_input);
      form.append('width', String(p.width));
      form.append('height', String(p.height));
      (p.style_ids.length ? p.style_ids : ['none']).forEach((id) => {
        form.append('style_ids', id);
      });
      p.photos.forEach((photo) => {
        form.append('image', photo);
      });
      return request<{ job_id: string; status: string }>('/generate/image', {
        method: 'POST',
        body: form,
      });
    },
    status: (id: string) => request<JobStatusResponse>(`/jobs/${id}`),
  },
  history: {
    list: (limit = 12) => request<HistoryListResponse>(`/history?limit=${limit}`),
    delete: (jobId: string) => request<MessageResponse>(`/history/${jobId}`, { method: 'DELETE' }),
  },
  billing: {
    quote: (count: number) => request<any>(`/billing/quote?count=${count}`),
    pay: (p: any) => request<any>('/billing/pay', { method: 'POST', body: JSON.stringify(p) }),
    history: (limit = 20) => request<BillingHistoryResponse>(`/billing/history?limit=${limit}`),
  }
};
