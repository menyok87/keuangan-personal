import { useState, useEffect } from 'react';
import { AppUser, api, authApi, tokenStorage, userStorage } from '../lib/api';

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restore sesi dari localStorage saat mount
    const storedUser = userStorage.get();
    const token = tokenStorage.get();
    if (storedUser && token) {
      // Tambahkan shim user_metadata untuk komponen lama
      setUser({
        ...storedUser,
        user_metadata: { full_name: storedUser.full_name }
      });
    }
    setLoading(false);

    // Listen untuk forced logout dari api.ts (401 response)
    const handleLogout = () => {
      setUser(null);
      setError(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      tokenStorage.set(data.token);
      const appUser: AppUser = {
        ...data.user,
        user_metadata: { full_name: data.user.full_name }
      };
      userStorage.set(appUser);
      setUser(appUser);
      setError(null);
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const signUp = async (email: string, password: string, full_name?: string) => {
    try {
      const data = await authApi.register(email, password, full_name);
      tokenStorage.set(data.token);
      const appUser: AppUser = {
        ...data.user,
        user_metadata: { full_name: data.user.full_name }
      };
      userStorage.set(appUser);
      setUser(appUser);
      setError(null);
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      tokenStorage.remove();
      setUser(null);
      setError(null);
      return { error: null };
    } catch (err: any) {
      // Tetap clear state meski ada error
      setUser(null);
      setError(null);
      return { error: err };
    }
  };

  // Update user di state & storage (untuk setelah update profil)
  const refreshUser = async () => {
    try {
      const data = await api.get('/auth/me');
      const appUser: AppUser = {
        ...data.user,
        user_metadata: { full_name: data.user.full_name }
      };
      userStorage.set(appUser);
      setUser(appUser);
    } catch {
      // Ignore refresh errors
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAuthenticated: !!user
  };
};
