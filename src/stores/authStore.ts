import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { User, Provider, Subscription } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  isDemo?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  authSubscription: Subscription | null;

  // Actions
  initAuth: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>;
  loginWithOAuth: (provider: Provider) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (email: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const mapSupabaseUser = (user: User): UserProfile => {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Player',
    avatar_url: meta.avatar_url || `https://mc-heads.net/avatar/${user.email?.split('@')[0] || 'steve'}`,
    isDemo: false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  authSubscription: null,

  initAuth: async () => {
    // Prevent duplicate initialization / subscriptions
    if (get().authSubscription) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true, authError: null });

    try {
      // 1. Get active session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Supabase auth session check notice:', error.message);
      }

      if (session?.user) {
        set({
          user: mapSupabaseUser(session.user),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // 2. Subscribe to auth state changes safely
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: mapSupabaseUser(session.user),
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // Only clear if not in manual demo mode
          const currentUser = get().user;
          if (!currentUser?.isDemo) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      });

      set({ authSubscription: subscription });
    } catch (err: any) {
      console.error('Failed to initialize auth:', err);
      set({ isLoading: false });
    }
  },

  loginWithEmail: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        set({
          user: mapSupabaseUser(data.user),
          isAuthenticated: true,
          isLoading: false,
          authError: null,
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'User missing' };
    } catch (err: any) {
      const errorMsg = err.message || 'Falha ao conectar com o serviço de autenticação.';
      set({ isLoading: false, authError: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ isLoading: true, authError: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0],
          },
        },
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      // If user requires email confirmation, session will be null
      const requiresConfirmation = !data.session;

      if (data.user) {
        if (!requiresConfirmation) {
          set({
            user: mapSupabaseUser(data.user),
            isAuthenticated: true,
            isLoading: false,
            authError: null,
          });
        } else {
          set({ isLoading: false });
        }
        return { success: true, requiresConfirmation };
      }

      set({ isLoading: false });
      return { success: false, error: 'Registration incomplete' };
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao registrar nova conta.';
      set({ isLoading: false, authError: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  loginWithOAuth: async (provider) => {
    set({ isLoading: true, authError: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        set({ isLoading: false, authError: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao conectar via OAuth.';
      set({ isLoading: false, authError: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  loginDemo: (email) => {
    const name = email.split('@')[0] || 'Steve';
    set({
      user: {
        id: `demo-${Date.now()}`,
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        avatar_url: `https://mc-heads.net/avatar/${name}`,
        isDemo: true,
      },
      isAuthenticated: true,
      isLoading: false,
      authError: null,
    });
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authError: null,
      });
    }
  },

  clearError: () => set({ authError: null }),
}));
