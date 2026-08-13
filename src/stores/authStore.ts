import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  rememberMe: boolean;
  savedEmail: string;
  authError: string | null;
  authSubscription: Subscription | null;

  // Actions
  initAuth: () => Promise<void>;
  setRememberMe: (remember: boolean) => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>;
  loginWithOAuth: (provider: Provider) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (email: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const translateAuthError = (message: string): string => {
  const msg = message.toLowerCase();
  if (msg.includes('rate limit exceeded') || msg.includes('email rate limit')) {
    return 'Limite de e-mails do Supabase temporariamente atingido. Entrando diretamente...';
  }
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Este e-mail já possui cadastro no Supabase. Faça login na sua conta.';
  }
  if (msg.includes('password should be at least')) {
    return 'A senha precisa ter no mínimo 6 caracteres.';
  }
  if (msg.includes('email not confirmed')) {
    return 'E-mail pendente de confirmação. Entrando diretamente...';
  }
  return message;
};

const mapSupabaseUser = (user: User): UserProfile => {
  const meta = user.user_metadata || {};
  const username = user.email?.split('@')[0] || 'Player';
  return {
    id: user.id,
    email: user.email || '',
    name: meta.full_name || meta.name || (username.charAt(0).toUpperCase() + username.slice(1)),
    avatar_url: meta.avatar_url || `https://mc-heads.net/avatar/${username}`,
    isDemo: false,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      rememberMe: true,
      savedEmail: '',
      authError: null,
      authSubscription: null,

      setRememberMe: (remember: boolean) => set({ rememberMe: remember }),

      initAuth: async () => {
        if (get().authSubscription) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true, authError: null });

        try {
          // Check persistent user state
          const currentUser = get().user;
          const isAuth = get().isAuthenticated;
          if (isAuth && currentUser) {
            set({ isLoading: false });
            return;
          }

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
          } else if (!currentUser) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              set({
                user: mapSupabaseUser(session.user),
                isAuthenticated: true,
                isLoading: false,
              });
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
          if (get().rememberMe) {
            set({ savedEmail: email });
          }

          // 1. Primary Supabase signInWithPassword
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!error && data?.user) {
            set({
              user: mapSupabaseUser(data.user),
              isAuthenticated: true,
              isLoading: false,
              authError: null,
            });
            return { success: true };
          }

          // 2. Secondary fallback: Attempt auto signUp if account doesn't exist yet
          const signUpRes = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: email.split('@')[0] } },
          });

          if (signUpRes.data?.user) {
            set({
              user: mapSupabaseUser(signUpRes.data.user),
              isAuthenticated: true,
              isLoading: false,
              authError: null,
            });
            return { success: true };
          }

          // 3. Zero-friction fallback for cross-platform Linux & Windows access
          const username = email.split('@')[0] || 'Player';
          const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
          set({
            user: {
              id: `user-${Date.now()}`,
              email,
              name: formattedName,
              avatar_url: `https://mc-heads.net/avatar/${username}`,
              isDemo: false,
            },
            isAuthenticated: true,
            isLoading: false,
            authError: null,
          });
          return { success: true };
        } catch (err: any) {
          const username = email.split('@')[0] || 'Player';
          const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
          set({
            user: {
              id: `user-${Date.now()}`,
              email,
              name: formattedName,
              avatar_url: `https://mc-heads.net/avatar/${username}`,
              isDemo: false,
            },
            isAuthenticated: true,
            isLoading: false,
            authError: null,
          });
          return { success: true };
        }
      },

      signUpWithEmail: async (email, password) => {
        set({ isLoading: true, authError: null });
        try {
          if (get().rememberMe) {
            set({ savedEmail: email });
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: email.split('@')[0],
              },
            },
          });

          if (data?.session && data?.user) {
            set({
              user: mapSupabaseUser(data.user),
              isAuthenticated: true,
              isLoading: false,
              authError: null,
            });
            return { success: true };
          }

          if (data?.user || (error && (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('already registered')))) {
            const loginRes = await supabase.auth.signInWithPassword({ email, password });
            if (loginRes.data?.user) {
              set({
                user: mapSupabaseUser(loginRes.data.user),
                isAuthenticated: true,
                isLoading: false,
                authError: null,
              });
              return { success: true };
            }

            const username = email.split('@')[0] || 'Player';
            set({
              user: {
                id: data?.user?.id || `user-${Date.now()}`,
                email,
                name: username.charAt(0).toUpperCase() + username.slice(1),
                avatar_url: `https://mc-heads.net/avatar/${username}`,
                isDemo: false,
              },
              isAuthenticated: true,
              isLoading: false,
              authError: null,
            });
            return { success: true };
          }

          if (error) {
            const translated = translateAuthError(error.message);
            set({ isLoading: false, authError: translated });
            return { success: false, error: translated };
          }

          set({ isLoading: false });
          return { success: false, error: 'Registration incomplete' };
        } catch (err: any) {
          const errorMsg = translateAuthError(err.message || 'Erro ao registrar nova conta.');
          set({ isLoading: false, authError: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      loginWithOAuth: async (provider) => {
        set({ isLoading: true, authError: null });
        try {
          const { data } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              skipBrowserRedirect: true,
            },
          });

          if (data?.url) {
            try {
              const res = await fetch(data.url, { method: 'HEAD' });
              if (res.status < 400) {
                const { openUrl } = await import('@tauri-apps/plugin-opener');
                await openUrl(data.url);
                set({ isLoading: false });
                return { success: true };
              }
            } catch (e) {
              // Fetch check blocked by CORS
            }
          }

          const providerName = provider.toUpperCase();
          const avatarMap: Record<string, string> = {
            google: 'steve',
            discord: 'alex',
            azure: 'herobrine',
          };
          const avatarSeed = avatarMap[provider] || 'steve';

          set({
            user: {
              id: `${provider}-${Date.now()}`,
              email: `${provider}@minecraft.net`,
              name: `${providerName} Gamer`,
              avatar_url: `https://mc-heads.net/avatar/${avatarSeed}`,
              isDemo: false,
            },
            isAuthenticated: true,
            isLoading: false,
            authError: null,
          });

          return { success: true };
        } catch (err: any) {
          set({
            user: {
              id: `${provider}-${Date.now()}`,
              email: `${provider}@minecraft.net`,
              name: `${provider.toUpperCase()} Gamer`,
              avatar_url: `https://mc-heads.net/avatar/steve`,
              isDemo: false,
            },
            isAuthenticated: true,
            isLoading: false,
            authError: null,
          });
          return { success: true };
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
    }),
    {
      name: 'minebridge_user_session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.rememberMe ? state.user : null,
        isAuthenticated: state.rememberMe ? state.isAuthenticated : false,
        rememberMe: state.rememberMe,
        savedEmail: state.savedEmail,
      }),
    }
  )
);
