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
    <aside className="w-64 bg-[#0e1322] border-r border-white/10 flex flex-col justify-between p-4 select-none">
      {/* Navigation Links */}
      <div className="space-y-6">
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/10">
            <img
              src={user.avatar_url || 'https://mc-heads.net/avatar/steve'}
              alt={user.name}
              className="w-9 h-9 rounded-lg border border-emerald-500/40 bg-slate-800"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-100 truncate">{user.name}</h4>
              <p className="text-xs text-emerald-400 font-mono truncate">{user.email}</p>
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(23,221,98,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-sm font-medium transition-all"
      >
        <LogOut size={18} />
        <span>{t('nav.logout')}</span>
      </button>
    </aside>
  );
};
