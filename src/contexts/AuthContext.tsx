import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, api, authApi, tokenStorage, userStorage } from '../lib/api';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: null } | { data: null; error: any }>;
  signUp: (email: string, password: string, full_name?: string) => Promise<{ data: any; error: null } | { data: null; error: any }>;
  signOut: () => Promise<{ error: null } | { error: any }>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = userStorage.get();
    const token = tokenStorage.get();
    if (storedUser && token) {
      setUser({
        ...storedUser,
        user_metadata: { full_name: storedUser.full_name }
      });
    }
    setLoading(false);

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
      userStorage.remove();
      setUser(null);
      setError(null);
      return { error: null };
    } catch (err: any) {
      setUser(null);
      setError(null);
      return { error: err };
    }
  };

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

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
