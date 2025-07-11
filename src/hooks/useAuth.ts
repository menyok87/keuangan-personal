import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { auth } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const { user, error } = await auth.getCurrentUser();
        if (error) {
          console.warn('Auth error:', error);
          setError(error.message);
        } else {
          setError(null);
        }
        setUser(user);
      } catch (error: any) {
        console.warn('Auth initialization error:', error);
        setError(error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setError(null);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error: any) {
        console.warn('Auth state change error:', error);
        setError(error.message);
        setUser(null);
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
      if (!error) {
        setUser(null);
        setError(null);
      }
      return { error };
    } catch (error: any) {
      console.warn('Sign out error:', error);
      // Even if sign out fails, clear local state
      setUser(null);
      setError(null);
      return { error };
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