import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConflictResolver } from '../../hooks/useConflict';
import { AlertTriangle, HardDrive, Cloud, Copy, Check } from 'lucide-react';

export const ConflictModal: React.FC = () => {
  const { t } = useTranslation();
  const { conflict, resolveKeepLocal, resolveKeepCloud, resolveKeepBoth } = useConflictResolver();

  if (!conflict.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="glass-panel w-full max-w-lg p-6 space-y-6 border border-amber-500/40 shadow-[0_0_50px_rgba(221,165,32,0.2)]">
        {/* Header */}
        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{t('conflict.title')}</h3>
            <p className="text-xs text-slate-400">{t('conflict.subtitle')}</p>
          </div>
        </div>

        {/* Versions Comparison Box */}
        <div className="grid grid-cols-2 gap-4">
          {/* Local Version */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <HardDrive size={14} className="text-emerald-400" />
              <span>{t('conflict.localVersion')}</span>
            </div>
            <p className="text-xs text-slate-400">{conflict.localTime || 'Modificado recentemente'}</p>
            <p className="text-xs font-mono text-emerald-400">{conflict.localSize || '342 MB'}</p>
          </div>

          {/* Cloud Version */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
              <Cloud size={14} className="text-diamond" />
              <span>{t('conflict.cloudVersion')}</span>
            </div>
            <p className="text-xs text-slate-400">{conflict.cloudTime || 'Salvo na nuvem'}</p>
            <p className="text-xs font-mono text-diamond">{conflict.cloudSize || '310 MB'}</p>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={resolveKeepLocal}
            className="w-full btn-emerald flex items-center justify-center gap-2 text-xs py-2.5"
          >
            <Check size={14} />
            <span>{t('conflict.keepLocal')}</span>
          </button>

          <button
            onClick={resolveKeepCloud}
            className="w-full btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 border-diamond/40 text-diamond hover:bg-diamond/10"
          >
            <Cloud size={14} />
            <span>{t('conflict.keepCloud')}</span>
          </button>

          <button
            onClick={() => resolveKeepBoth()}
            className="w-full btn-secondary flex items-center justify-center gap-2 text-xs py-2.5"
          >
            <Copy size={14} />
            <span>{t('conflict.keepBoth')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
