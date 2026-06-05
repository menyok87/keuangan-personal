import { useState, useEffect } from 'react';
import { auth } from '../lib/api';

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  occupation?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cek user saat ini
    const getUser = async () => {
      try {
        const { user, error } = await auth.getCurrentUser();
        if (error) {
          setError(error.message);
        } else {
          setError(null);
        }
        setUser(user);
      } catch (err: any) {
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen untuk perubahan auth state
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
        } else if (session?.user) {
          setUser(session.user);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await auth.signOut();
      setUser(null);
      setError(null);
      return { error };
    } catch (err: any) {
      setUser(null);
      setError(null);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    isAuthenticated: !!user
  };
};
