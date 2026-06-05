// API Client untuk PostgreSQL self-hosted
// Menggantikan Supabase client

const API_BASE = import.meta.env.VITE_API_URL || '';

// =================================================
// TOKEN MANAGEMENT
// =================================================

const TOKEN_KEY = 'keuangan_token';
const USER_KEY = 'keuangan_user';

const getToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const setToken = (token: string, user: any) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* ignore */ }
};

const clearTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
};

const getStoredUser = (): any | null => {
  try {
    const str = localStorage.getItem(USER_KEY);
    return str ? JSON.parse(str) : null;
  } catch { return null; }
};

// =================================================
// AUTH STATE LISTENERS
// =================================================

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'INITIAL_SESSION' | 'TOKEN_REFRESHED';
type AuthCallback = (event: AuthEvent, session: { user: any } | null) => void;

const listeners: AuthCallback[] = [];

const emitAuth = (event: AuthEvent, session: { user: any } | null) => {
  listeners.forEach(cb => {
    try { cb(event, session); } catch { /* ignore */ }
  });
};

// =================================================
// HTTP HELPER
// =================================================

async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Permintaan gagal' } };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Koneksi gagal' } };
  }
}

// =================================================
// AUTH
// =================================================

export const auth = {
  signUp: async (email: string, password: string, userData?: { full_name?: string }) => {
    const { data, error } = await apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: userData?.full_name })
    });

    if (data?.token) {
      setToken(data.token, data.user);
      emitAuth('SIGNED_IN', { user: data.user });
    }

    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data?.token) {
      setToken(data.token, data.user);
      emitAuth('SIGNED_IN', { user: data.user });
    }

    return { data, error };
  },

  signOut: async () => {
    clearTokens();
    emitAuth('SIGNED_OUT', null);
    return { error: null };
  },

  getCurrentUser: async () => {
    const token = getToken();
    if (!token) return { user: null, error: null };

    const { data, error } = await apiRequest<{ user: any }>('/auth/me');

    if (error || !data) {
      // Token tidak valid, bersihkan
      if (error?.message?.includes('tidak valid') || error?.message?.includes('kedaluwarsa')) {
        clearTokens();
      }
      return { user: null, error: null };
    }

    // Update stored user
    try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch { /* ignore */ }

    return { user: data.user, error: null };
  },

  onAuthStateChange: (callback: AuthCallback) => {
    listeners.push(callback);

    // Fire initial state
    const user = getStoredUser();
    const token = getToken();
    setTimeout(() => {
      if (token && user) {
        callback('INITIAL_SESSION', { user });
      } else {
        callback('SIGNED_OUT', null);
      }
    }, 0);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = listeners.indexOf(callback);
            if (idx > -1) listeners.splice(idx, 1);
          }
        }
      }
    };
  },

  clearSession: async () => {
    clearTokens();
    emitAuth('SIGNED_OUT', null);
  }
};

// =================================================
// API CLIENT
// =================================================

export const apiClient = {
  get: <T = any>(path: string) => apiRequest<T>(path),

  post: <T = any>(path: string, body: any) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T = any>(path: string, body: any) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T = any>(path: string) =>
    apiRequest<T>(path, { method: 'DELETE' })
};
