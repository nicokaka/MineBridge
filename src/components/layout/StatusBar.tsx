import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, HardDrive, RefreshCw } from 'lucide-react';
import { useSyncStore } from '../../stores/syncStore';
import { useCloudStore } from '../../stores/cloudStore';
import { useConnectivity } from '../../hooks/useConnectivity';

export const StatusBar: React.FC = () => {
  const { t } = useTranslation();
  const { activeSyncs } = useSyncStore();
  const { totalStorageBytes } = useCloudStore();
  const { isOnline } = useConnectivity();

  const syncingCount = Object.keys(activeSyncs).length;

  const totalCapacityBytes = 10 * 1024 * 1024 * 1024; // 10 GB Cloudflare R2 Free Limit
  const usedMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);
  const usedGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const percentage = Math.min(100, Math.max(2, (totalStorageBytes / totalCapacityBytes) * 100));

  const displayUsage = totalStorageBytes < 1024 * 1024 * 1024 ? `${usedMB} MB` : `${usedGB} GB`;

  return (
    <footer className="h-8 bg-[#070a12] border-t border-white/10 flex items-center justify-between px-4 text-xs text-slate-400 select-none font-mono">
      {/* Connectivity Indicator */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">{t('status.online')}</span>
            <Wifi size={12} className="text-emerald-400" />
          </>
        ) : (
          <>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            <span className="text-amber-400 font-bold">{t('status.offline')}</span>
            <WifiOff size={12} className="text-amber-400" />
          </>
        )}
      </div>

      {/* Sync Status Counter */}
      {syncingCount > 0 && (
        <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
          <RefreshCw size={12} className="animate-spin" />
          <span>
            {syncingCount} {t('status.syncingCount')}...
          </span>
        </div>
      )}

      {/* Cloud Storage Usage Bar */}
      <div className="flex items-center gap-2">
        <HardDrive size={12} className="text-slate-400" />
        <span>R2 Storage:</span>
        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-slate-300">{displayUsage} / 10 GB</span>
      </div>
    </footer>
  );
};
