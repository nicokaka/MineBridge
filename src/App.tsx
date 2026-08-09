import React, { useState, useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { WorldGrid } from './components/worlds/WorldGrid';
import { CloudBrowser } from './components/cloud/CloudBrowser';
import { ConflictModal } from './components/worlds/ConflictModal';
import { LoginForm } from './components/auth/LoginForm';
import { detectInstallations, Installation } from './services/tauriCommands';
import { Cpu, Settings as SettingsIcon, Sparkles, RefreshCw, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './i18n';

import { ToastContainer } from './components/ui/ToastContainer';

export const App: React.FC = () => {

  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const {
    autoSyncOnClose,
    includeResourcePacks,
    systemNotifications,
    language,
    setAutoSyncOnClose,
    setIncludeResourcePacks,
    setSystemNotifications,
    setLanguage,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'local' | 'cloud' | 'installations' | 'settings'>('local');
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loadingInstallations, setLoadingInstallations] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (activeTab === 'installations') {
      loadInstallations();
    }
  }, [activeTab]);

  const handleLanguageChange = (lang: 'pt-BR' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const loadInstallations = async () => {
    setLoadingInstallations(true);
    try {
      const res = await detectInstallations();
      setInstallations(res);
    } catch (err) {
      console.error('Failed to load installations:', err);
    } finally {
      setLoadingInstallations(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#070a12] text-slate-100 overflow-hidden select-none">
        <Titlebar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(23,221,98,0.2)]">
            <Sparkles size={32} className="animate-spin text-emerald-400" />
          </div>
          <p className="text-sm font-mono text-slate-300">Carregando MineBridge...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        <Titlebar />
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-slate-100 overflow-hidden select-none">
      {/* Window Titlebar */}
      <Titlebar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* View Switcher */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#0b0f19] via-[#101726] to-[#0d1322]">
          {activeTab === 'local' && <WorldGrid />}
          {activeTab === 'cloud' && <CloudBrowser />}

          {/* Installations Tab */}
          {activeTab === 'installations' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                    <Cpu className="text-emerald-400" />
                    {t('installations.title')}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    {t('installations.subtitle')}
                  </p>
                </div>

                <button
                  onClick={loadInstallations}
                  disabled={loadingInstallations}
                  className="btn-secondary flex items-center gap-2 text-xs"
                >
                  <RefreshCw size={14} className={loadingInstallations ? 'animate-spin text-emerald-400' : ''} />
                  <span>{t('installations.rescan')}</span>
                </button>
              </div>

              {installations.length > 0 ? (
                <div className="space-y-3 max-w-3xl">
                  {installations.map((inst, idx) => (
                    <div
                      key={idx}
                      className="glass-panel p-4 flex items-center justify-between border border-white/10 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm">{inst.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                            {inst.launcher_type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-mono break-all">{inst.path}</p>
                      </div>
                      <span className={inst.edition === 'java' ? 'badge-java' : 'badge-bedrock'}>
                        {inst.edition === 'java' ? 'Java' : 'Bedrock'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  <div className="glass-panel p-4 flex items-center justify-between border border-white/10">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Minecraft Java Edition (Oficial)</h4>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">%APPDATA%\.minecraft\saves</p>
                    </div>
                    <span className="badge-java">Java</span>
                  </div>

                  <div className="glass-panel p-4 flex items-center justify-between border border-white/10">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Minecraft Bedrock Edition (UWP / GDK)</h4>
                      <p className="text-xs text-diamond font-mono mt-0.5">%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP...</p>
                    </div>
                    <span className="badge-bedrock">Bedrock</span>
                  </div>

                  <div className="glass-panel p-4 flex items-center justify-between border border-white/10">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Prism Launcher (Flatpak / Nativo)</h4>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">~/.var/app/org.prismlauncher.PrismLauncher/...</p>
                    </div>
                    <span className="badge-java">Java</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                  <SettingsIcon className="text-emerald-400" />
                  {t('settings.title')}
                </h1>
                <p className="text-sm text-slate-400 mt-1">{t('settings.subtitle')}</p>
              </div>

              <div className="glass-panel p-6 max-w-xl space-y-5 border border-white/10">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-bold">{t('settings.autoSync')}</h4>
                    <p className="text-xs text-slate-400">{t('settings.autoSyncDesc')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncOnClose}
                    onChange={(e) => setAutoSyncOnClose(e.target.checked)}
                    className="toggle accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-bold">{t('settings.resourcePacks')}</h4>
                    <p className="text-xs text-slate-400">{t('settings.resourcePacksDesc')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeResourcePacks}
                    onChange={(e) => setIncludeResourcePacks(e.target.checked)}
                    className="toggle accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h4 className="text-sm font-bold">{t('settings.notifications')}</h4>
                    <p className="text-xs text-slate-400">{t('settings.notificationsDesc')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemNotifications}
                    onChange={(e) => setSystemNotifications(e.target.checked)}
                    className="toggle accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                      <Globe size={15} className="text-emerald-400" />
                      {t('settings.language')}
                    </h4>
                    <p className="text-xs text-slate-400">{t('settings.languageDesc')}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => handleLanguageChange('pt-BR')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        language === 'pt-BR'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      PT-BR
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        language === 'en'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals, Toasts & Status Bar */}
      <ConflictModal />
      <ToastContainer />
      <StatusBar />
    </div>
  );
};


export default App;
