import { User } from './types.ts';

const PROD_API_BASE = 'https://resistanceiq-api.onrender.com';

function resolveBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL?.trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/$/, '');
    return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0' && host !== '') {
      return `${PROD_API_BASE}/api/v1`;
    }
  }
  if ((import.meta as any).env?.PROD) {
    return `${PROD_API_BASE}/api/v1`;
  }
  return '/api/v1';
}

const BASE_URL = resolveBaseUrl();

export async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('riq_auth_token') || localStorage.getItem('riq_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && endpoint !== '/auth/login') {
      localStorage.removeItem('riq_auth_token');
      localStorage.removeItem('riq_token');
      localStorage.removeItem('riq_refresh_token');
    }
    let errorDetail = response.statusText;
    try {
      const errData = await response.json();
      errorDetail = errData.detail || JSON.stringify(errData);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP Error ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const authApi = {
  register: async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    organization_name: string;
    password: string;
    confirm_password?: string;
  }) => {
    const res = await fetchJSON<{ access_token: string; refresh_token?: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      localStorage.setItem('riq_auth_token', res.access_token);
      localStorage.setItem('riq_token', res.access_token);
    }
    if (res.refresh_token) {
      localStorage.setItem('riq_refresh_token', res.refresh_token);
    }
    return res;
  },

  login: async (email: string, password?: string) => {
    const res = await fetchJSON<{ access_token: string; refresh_token?: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.access_token) {
      localStorage.setItem('riq_auth_token', res.access_token);
      localStorage.setItem('riq_token', res.access_token);
    }
    if (res.refresh_token) {
      localStorage.setItem('riq_refresh_token', res.refresh_token);
    }
    return res;
  },

  getCurrentUser: () => fetchJSON<User>('/auth/me'),

  updateProfile: (payload: { first_name?: string; last_name?: string; display_name?: string }) =>
    fetchJSON<User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { current_password: string; new_password: string }) =>
    fetchJSON<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (token: string) =>
    fetchJSON<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  forgotPassword: (email: string) =>
    fetchJSON<{ message: string; expires_in_minutes: number }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    fetchJSON<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),

  inviteUser: (email: string, full_name: string, role: string) =>
    fetchJSON<{ message: string; user_id: string; invitation_token: string }>('/auth/invite', {
      method: 'POST',
      body: JSON.stringify({ email, full_name, role }),
    }),

  acceptInvite: (token: string, password: string, first_name?: string, last_name?: string) =>
    fetchJSON<{ message: string }>('/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token, password, first_name, last_name }),
    }),

  logout: () => {
    try {
      fetchJSON('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      localStorage.removeItem('riq_auth_token');
      localStorage.removeItem('riq_token');
      localStorage.removeItem('riq_refresh_token');
    }
  },
};
