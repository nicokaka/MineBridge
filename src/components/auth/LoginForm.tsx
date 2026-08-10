import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { Particles } from '../ui/Particles';
import { Layers, ArrowRight, Loader2, AlertCircle, ShieldCheck, UserPlus, UserCheck, CheckSquare, Square } from 'lucide-react';
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
    rememberMe,
    savedEmail,
    setRememberMe,
  } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [savedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    if (!email || !password) return;

    if (mode === 'login') {
      const res = await loginWithEmail(email, password);
      if (!res.success && res.error) {
        console.warn('Login attempt notice:', res.error);
      }
    } else {
      const res = await signUpWithEmail(email, password);
      if (res.success) {
        setSuccessMessage('Conta criada com sucesso! Sessão iniciada.');
      }
    }
  };

  const handleOAuth = async (provider: Provider) => {
    clearError();
    setSuccessMessage(null);

    await loginWithOAuth(provider);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#15181d] p-6 overflow-hidden select-none mc-bg-stone-bricks">
      {/* Nether & Redstone Dust Ambient Particles */}
      <Particles />

      {/* Minecraft Quartz Block Central Card - Crisp 90-degree Pixel Bevel */}
      <div className="relative z-10 w-full max-w-md p-8 mc-card-quartz space-y-5 text-slate-900">
        
        {/* Minecraft Stacked Emerald Block Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2cf07b] via-[#129a48] to-[#08401d] border-2 border-[#60f89d] border-b-4 border-r-4 border-[#04240f] flex items-center justify-center text-white mx-auto shadow-md">
            <Layers size={36} className="drop-shadow-md text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-wider mc-font-pixel uppercase drop-shadow-sm mt-1">
              BEM-VINDO AO MINEBRIDGE
            </h2>
            <p className="text-sm text-slate-700 mc-font-vt font-bold mt-0.5">
              {mode === 'login' ? t('auth.signInTitle') : 'Criar nova conta no MineBridge'}
            </p>
          </div>
        </div>

        {/* Error Notification Alert */}
        {authError && (
          <div className="p-3 bg-red-500/15 border-2 border-red-600 flex items-start gap-2.5 text-red-950 text-xs font-mono font-bold animate-shake">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 leading-relaxed">
              <p>{authError}</p>
            </div>
          </div>
        )}

        {/* Success Notification Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border-2 border-emerald-600 flex items-center gap-2.5 text-emerald-950 text-xs font-mono font-bold">
            <ShieldCheck size={18} className="flex-shrink-0 text-emerald-700" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 mc-font-vt tracking-wider uppercase">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('auth.emailPlaceholder')}
              className="w-full mc-input px-3.5 py-2.5 text-slate-950 placeholder-slate-600 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-800 mc-font-vt tracking-wider uppercase">
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full mc-input px-3.5 py-2.5 text-slate-950 placeholder-slate-600 font-bold"
            />
          </div>

          {/* Remember Login Checkbox (Salvar Login) */}
          <div 
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center gap-2 text-sm text-slate-800 mc-font-vt font-bold cursor-pointer hover:text-slate-950 transition-colors pt-1 select-none"
          >
            {rememberMe ? (
              <CheckSquare size={18} className="text-emerald-800 flex-shrink-0" />
            ) : (
              <Square size={18} className="text-slate-600 flex-shrink-0" />
            )}
            <span>Salvar login (Entrar automaticamente)</span>
          </div>

          {/* Minecraft 3D Emerald Block Primary Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mc-btn-emerald py-3 flex items-center justify-center gap-2 shadow-md uppercase font-bold"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>PROCESSANDO...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>{t('auth.signIn')}</span>
                <ArrowRight size={20} />
              </>
            ) : (
              <>
                <span>{t('auth.signUp')}</span>
                <UserPlus size={20} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register Mode */}
        <div className="text-center text-sm mc-font-vt font-bold">
          {mode === 'login' ? (
            <button
              onClick={() => {
                setMode('register');
                clearError();
              }}
              className="text-slate-700 hover:text-emerald-800 transition-colors"
            >
              {t('auth.noAccount')} <span className="text-blue-800 font-bold underline">{t('auth.signUp')}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setMode('login');
                clearError();
              }}
              className="text-slate-700 hover:text-emerald-800 transition-colors"
            >
              {t('auth.hasAccount')} <span className="text-blue-800 font-bold underline">{t('auth.signIn')}</span>
            </button>
          )}
        </div>

        {/* Clean Minecraft Divider */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-400" />
          </div>
          <span className="relative px-3 bg-[#dedede] text-xs text-slate-700 uppercase tracking-widest mc-font-vt font-bold">
            {t('auth.orContinueWith')}
          </span>
        </div>

        {/* 3D Minecraft Textured OAuth Provider Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Discord Dark Oak Wood 3D Button */}
          <button
            type="button"
            onClick={() => handleOAuth('discord')}
            className="mc-btn-wood py-2.5 px-2 flex items-center justify-center gap-1.5 shadow"
          >
            <svg className="w-4 h-4 fill-current text-[#5865F2]" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
            </svg>
            <span>Discord</span>
          </button>

          {/* Google Quartz 3D Block Button */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="mc-btn-quartz py-2.5 px-2 flex items-center justify-center gap-1.5 shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          {/* Microsoft Stone 3D Block Button */}
          <button
            type="button"
            onClick={() => handleOAuth('azure')}
            className="mc-btn-stone py-2.5 px-2 flex items-center justify-center gap-1.5 shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span>Microsoft</span>
          </button>
        </div>

        {/* Guest Demo Fast Access Link */}
        <button
          type="button"
          onClick={() => loginDemo('steve@minecraft.net')}
          className="w-full py-2.5 mc-btn-stone text-xs flex items-center justify-center gap-2"
        >
          <UserCheck size={16} className="text-emerald-400" />
          <span>Entrar como Convidado (Modo Demo)</span>
        </button>
      </div>
    </div>
  );
};
