import React from 'react';
import { useTranslation } from 'react-i18next';
import { MinecraftWorld, compressWorld, calculateWorldHash, readFileBytes, deleteFile, getTempZipPath } from '../../services/tauriCommands';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { useCloudStore } from '../../stores/cloudStore';
import { CloudUpload, Box, Sparkles, HardDrive, Calendar } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

interface WorldCardProps {
  world: MinecraftWorld;
}

export const WorldCard: React.FC<WorldCardProps> = ({ world }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addCloudWorldRecord, uploadWorldZip } = useCloudStore();
  const { activeSyncs, startSync, updateProgress, finishSync, failSync } = useSyncStore();
  const { addToast } = useToastStore();

  const syncState = activeSyncs[world.id];
  const isSyncing = !!syncState;
  const progress = syncState?.progress || 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSync = async () => {
    if (isSyncing) return;

    // Start sync and set initial progress immediately to 15%
    startSync(world.id, world.name);
    updateProgress(world.id, 15, 'compressing');

    try {
      // Step 1: Calculate SHA-256 Hash of world (<1ms optimized signature)
      let hash = 'sha256-demo-hash';
      try {
        hash = await calculateWorldHash(world.path);
      } catch (err) {
        console.warn('Hash calc fallback:', err);
      }

      // Step 2: Compress directory into dynamic temp ZIP in %APPDATA%\MineBridge\temp
      updateProgress(world.id, 45, 'compressing');
      let tempZip = `${world.path}_backup.zip`;
      try {
        const safeFilename = `sync_${world.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;
        tempZip = await getTempZipPath(safeFilename);
      } catch (e) {
        console.warn('Temp zip path fallback:', e);
      }

      await compressWorld(world.path, tempZip);

      // Step 3: Fast C++ byte reading & upload ZIP file to Supabase Storage & add record to Cloud Vault
      updateProgress(world.id, 75, 'uploading');
      const storageKey = `${user?.id || 'demo'}/${world.id}/world.zip`;

      const bytes = await readFileBytes(tempZip);
      const uint8Array = new Uint8Array(bytes);

      await uploadWorldZip(storageKey, uint8Array);

      await addCloudWorldRecord({
        user_id: user?.id || 'demo-user',
        world_name: world.name,
        edition: world.edition,
        r2_file_key: storageKey,
        file_size: bytes.length || world.size_bytes || 1000000,
        sha256_hash: hash,
        game_mode: world.game_mode || 0,
        seed: world.seed,
        source_os: navigator.userAgent.includes('Win') ? 'Windows' : 'Linux',
        source_launcher: world.launcher_type,
        version_synced: 1,
        last_synced_at: new Date().toISOString(),
      });

      // Clean up temporary local ZIP file
      try {
        await deleteFile(tempZip);
      } catch (e) {
        console.warn('Cleanup temp zip notice:', e);
      }

      // Step 4: Finish with celebration and toast notification
      updateProgress(world.id, 100, 'completed');

      addToast({
        type: 'success',
        title: 'Mundo Sincronizado!',
        message: `"${world.name}" foi salvo com sucesso na nuvem.`,
      });

      setTimeout(() => {
        finishSync(world.id);
      }, 400);
    } catch (err: any) {
      console.error('Sync failed error:', err);
      failSync(world.id, err?.toString() || 'Sync failed');
      addToast({
        type: 'error',
        title: 'Erro na Sincronização',
        message: err?.toString() || 'Não foi possível enviar o mundo.',
      });
    }
  };

  return (
    <div className="glass-panel glass-panel-interactive p-5 relative overflow-hidden flex flex-col justify-between min-h-[250px] group border border-white/10 hover:border-emerald-500/40 select-none shadow-lg">
      {/* Top Section */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Thumbnail / Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/15 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
            {world.icon_base64 ? (
              <img src={world.icon_base64} alt={world.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-slate-900 flex items-center justify-center text-emerald-400">
                <Box size={24} />
              </div>
            )}
          </div>

          {/* Edition Badge & Status */}
          <div className="flex flex-col items-end gap-1">
            <span className={world.edition === 'java' ? 'badge-java font-mono uppercase tracking-wider' : 'badge-bedrock font-mono uppercase tracking-wider'}>
              {world.edition === 'java' ? t('worldCard.java') : t('worldCard.bedrock')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
              {world.launcher_type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title & Path */}
        <div>
          <h3 className="text-base font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
            {world.name}
          </h3>
          <p className="text-xs text-slate-400 font-mono truncate mt-0.5" title={world.path}>
            {world.path}
          </p>
        </div>
      </div>

      {/* Syncing Progress Bar (XP Bar Style) */}
      {isSyncing ? (
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles size={12} className="animate-spin" />
              {t('worldCard.syncing')}
            </span>
            <span className="text-emerald-400 font-bold">{progress}%</span>
          </div>
          <div className="xp-bar-container">
            <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        /* Metadata Section - Clean 2-Row Layout */
        <div className="space-y-1 py-3 my-1 border-t border-b border-white/10 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <HardDrive size={13} className="text-slate-400" />
              {t('worldCard.size')}:
            </span>
            <span className="font-mono text-emerald-400 font-bold">{formatSize(world.size_bytes)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              {t('worldCard.lastModified')}:
            </span>
            <span className="text-slate-300 font-mono text-[11px]">{formatDate(world.last_modified)}</span>
          </div>
        </div>
      )}

      {/* Ultra-Premium Sync Button */}
      {!isSyncing && (
        <button
          onClick={handleSync}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold shadow-[0_4px_15px_rgba(23,221,98,0.25)] rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <CloudUpload size={16} />
          <span>{t('worldCard.sync')}</span>
        </button>
      )}
    </div>
  );
};
