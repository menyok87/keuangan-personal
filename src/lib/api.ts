// ============================================================
// API Client - menggantikan Supabase client
// ============================================================

const TOKEN_KEY = 'keuangan_token';
const USER_KEY = 'keuangan_user';

export interface AppUser {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  occupation?: string;
  phone?: string;
  location?: string;
  bio?: string;
  // Shim untuk komponen yang masih menggunakan user?.user_metadata?.full_name
  user_metadata?: { full_name?: string };
}

export const tokenStorage = {
  get: (): string | null => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token: string): void => {
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  }
};

export const userStorage = {
  get: (): AppUser | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set: (user: AppUser): void => {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
  }
};

// Core fetch wrapper
async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401) {
    tokenStorage.remove();
    // Dispatch event agar useAuth bisa handle logout tanpa circular imports
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Sesi login berakhir. Silakan login ulang.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: any) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: any) =>
    apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) =>
    apiFetch(path, { method: 'DELETE' })
};

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me')
};
