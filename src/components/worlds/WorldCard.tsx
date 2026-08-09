import React from 'react';
import { useTranslation } from 'react-i18next';
import { MinecraftWorld, compressWorld, calculateWorldHash, readFileBytes, deleteFile } from '../../services/tauriCommands';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { useCloudStore } from '../../stores/cloudStore';
import { CloudUpload, Box, Sparkles } from 'lucide-react';

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

    startSync(world.id, world.name);

    try {
      // Step 1: Calculate SHA-256 Hash of world
      updateProgress(world.id, 15, 'compressing');
      let hash = 'sha256-demo-hash';
      try {
        hash = await calculateWorldHash(world.path);
      } catch (err) {
        console.warn('Hash calc fallback:', err);
      }

      // Step 2: Compress directory into ZIP
      updateProgress(world.id, 45, 'compressing');
      const tempZip = `${world.path}_backup.zip`;
      await compressWorld(world.path, tempZip);

      // Step 3: Upload ZIP file to Supabase Storage & add record to Supabase DB
      updateProgress(world.id, 75, 'uploading');
      const storageKey = `${user?.id || 'demo'}/${world.id}/world.zip`;

      if (user?.id && !user.isDemo) {
        // Read compressed ZIP file bytes via Tauri
        const bytes = await readFileBytes(tempZip);
        const uint8Array = Uint8Array.from(bytes);

        // Upload to Supabase Storage Bucket
        const uploadSuccess = await uploadWorldZip(storageKey, uint8Array);
        if (!uploadSuccess) {
          throw new Error('Falha ao enviar arquivo para o Supabase Storage');
        }

        // Add record in PostgreSQL database
        await addCloudWorldRecord({
          user_id: user.id,
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
      }

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
      failSync(world.id, err?.toString() || 'Sync failed');
      addToast({
        type: 'error',
        title: 'Erro na Sincronização',
        message: err?.toString() || 'Não foi possível enviar o mundo.',
      });
    }
  };


  return (
    <div className="glass-panel glass-panel-interactive p-4 relative overflow-hidden flex flex-col justify-between h-56 group border border-white/10 hover:border-emerald-500/40 select-none">
      {/* Top Section */}
      <div>
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
            <span className={world.edition === 'java' ? 'badge-java' : 'badge-bedrock'}>
              {world.edition === 'java' ? t('worldCard.java') : t('worldCard.bedrock')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {world.launcher_type.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title & Path */}
        <div className="mt-3">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
            {world.name}
          </h3>
          <p className="text-xs text-slate-400 font-mono truncate mt-0.5" title={world.path}>
            {world.path}
          </p>
        </div>
      </div>

      {/* Syncing Progress Bar (XP Bar Style) */}
      {isSyncing ? (
        <div className="space-y-1.5 my-2">
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
        /* Metadata Footer */
        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 font-medium">{t('worldCard.size')}: </span>
            <span className="text-slate-200 font-mono">{formatSize(world.size_bytes)}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">{t('worldCard.lastModified')}: </span>
            <span className="text-slate-300">{formatDate(world.last_modified)}</span>
          </div>
        </div>
      )}

      {/* Sync Action Button */}
      {!isSyncing && (
        <div className="mt-3">
          <button
            onClick={handleSync}
            className="w-full btn-emerald flex items-center justify-center gap-2 text-xs py-2"
          >
            <CloudUpload size={14} />
            <span>{t('worldCard.sync')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
