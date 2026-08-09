import React from 'react';
import { useTranslation } from 'react-i18next';
import { HardDrive, Cloud, Settings, LogOut, Cpu } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  activeTab: 'local' | 'cloud' | 'installations' | 'settings';
  setActiveTab: (tab: 'local' | 'cloud' | 'installations' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { id: 'local', label: t('nav.localWorlds'), icon: HardDrive },
    { id: 'cloud', label: t('nav.cloudWorlds'), icon: Cloud },
    { id: 'installations', label: t('nav.installations'), icon: Cpu },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ] as const;

  return (
    <aside className="w-64 bg-[#090d18] border-r border-white/10 flex flex-col justify-between p-4 select-none flex-shrink-0">
      {/* Navigation Links */}
      <div className="space-y-6">
        {/* User Profile Card */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner">
            <img
              src={user.avatar_url || 'https://mc-heads.net/avatar/steve'}
              alt={user.name}
              className="w-10 h-10 rounded-xl border border-emerald-500/40 bg-slate-950 flex-shrink-0"
            />
            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-extrabold text-slate-100 truncate">{user.name}</h4>
                {user.isDemo && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-400 font-mono truncate mt-0.5">{user.email}</p>
            </div>
          </div>
        )}

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(23,221,98,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-bold transition-all"
      >
        <LogOut size={16} />
        <span>{t('nav.logout')}</span>
      </button>
    </aside>
  );
};
