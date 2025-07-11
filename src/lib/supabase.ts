import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore storage errors
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore storage errors
        }
      }
    }
  }
});

// Helper function to clear invalid session data
const clearInvalidSession = async () => {
  try {
    // Clear all auth-related localStorage items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Sign out to clear any remaining session state
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Error clearing invalid session:', error);
  }
};

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, userData?: any) => {
    // First try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: undefined
      }
    });
    
    // If signup successful but user needs confirmation, try to sign in directly
    if (signUpData.user && !signUpData.session && signUpError?.message?.includes('confirmation')) {
      // Try to sign in immediately (for cases where email confirmation is disabled)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInData.session) {
        return { data: signInData, error: null };
      }
    }
    
    return { data: signUpData, error: signUpError };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // If there's a refresh token error, clear the session
      if (error && error.message.includes('refresh_token_not_found')) {
        await clearInvalidSession();
        return { user: null, error: null };
      }
      
      return { user, error };
    } catch (error: any) {
      // Handle any other auth errors by clearing session
      if (error.message.includes('refresh_token') || error.message.includes('Invalid Refresh Token')) {
        await clearInvalidSession();
        return { user: null, error: null };
      }
      return { user: null, error };
    }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  clearSession: clearInvalidSession
};