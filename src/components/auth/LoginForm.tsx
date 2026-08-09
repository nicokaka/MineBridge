import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { Particles } from '../ui/Particles';
import { Layers, ArrowRight, Loader2, AlertCircle, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { Provider } from '@supabase/supabase-js';

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const {
    loginWithEmail,
    signUpWithEmail,
    loginWithOAuth,
    loginDemo,
    isLoading,
    authError,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (!email || !password) return;

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      if (!res.success && res.error) {
        // If login failed on remote instance (e.g. invalid credentials or unconfirmed email), provide clear guidance
        console.warn('Login attempt:', res.error);
      }
    } else {
      const res = await signUpWithEmail(email, password);
      if (res.success) {
        if (res.requiresConfirmation) {
          setSuccessMessage('Conta criada! Enviamos um e-mail de confirmação. Por favor verifique sua caixa de entrada.');
        } else {
          setSuccessMessage('Conta criada com sucesso! Você já pode entrar.');
        }
        setMode('login');
      }

    }
  };

  const handleOAuth = async (provider: Provider) => {
    clearError();
    setSuccessMessage(null);
    const res = await loginWithOAuth(provider);
    if (!res.success && res.error) {
      // Fallback to demo mode if OAuth provider is not configured on Supabase dashboard
      loginDemo(`${provider}@minecraft.net`);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#070a12] p-4 overflow-hidden select-none">
      <Particles />

      {/* Central Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 glass-panel border border-emerald-500/30 shadow-[0_0_50px_rgba(23,221,98,0.15)] space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_25px_rgba(23,221,98,0.2)]">
            <Layers size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            {t('auth.welcome')}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {mode === 'login' ? t('auth.signInTitle') : 'Criar nova conta no MineBridge'}
          </p>
        </div>

        {/* Error Notification Alert */}
        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs animate-shake">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{authError}</p>
            </div>
          </div>
        )}

        {/* Success Message Alert */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400 text-xs">
            <ShieldCheck size={16} className="flex-shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t('auth.emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('auth.emailPlaceholder')}
              className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t('auth.passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-emerald flex items-center justify-center gap-2 py-3 mt-2 text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>{t('auth.signIn')}</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>{t('auth.signUp')}</span>
                <UserPlus size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="text-center text-xs">
          {mode === 'login' ? (
            <button
              onClick={() => {
                setMode('register');
                clearError();
              }}
              className="text-slate-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {t('auth.noAccount')} <span className="text-emerald-400 font-bold underline">{t('auth.signUp')}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('login');
                clearError();
              }}
              className="text-slate-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {t('auth.hasAccount')} <span className="text-emerald-400 font-bold underline">{t('auth.signIn')}</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-[#0e1424] text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            {t('auth.orContinueWith')}
          </span>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleOAuth('discord')}
            className="flex items-center justify-center py-2.5 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/25 transition-all text-xs font-semibold"
          >
            Discord
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center py-2.5 rounded-xl bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 transition-all text-xs font-semibold"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('azure')}
            className="flex items-center justify-center py-2.5 rounded-xl bg-[#00A4EF]/15 border border-[#00A4EF]/30 text-[#00A4EF] hover:bg-[#00A4EF]/25 transition-all text-xs font-semibold"
          >
            Microsoft
          </button>
        </div>

        {/* Demo Fast Access Button */}
        <button
          type="button"
          onClick={() => loginDemo('steve@minecraft.net')}
          className="w-full py-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 text-xs font-mono flex items-center justify-center gap-2 transition-all"
        >
          <LogIn size={13} />
          <span>Entrar como Convidado (Modo Demo)</span>
        </button>
      </div>
    </div>
  );
};
