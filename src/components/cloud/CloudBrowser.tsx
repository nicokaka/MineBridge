import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Download, Sparkles, CheckCircle2, HardDrive, RefreshCw, Layers, AlertTriangle, Trash2 } from 'lucide-react';
import { useCloudStore } from '../../stores/cloudStore';
import { CloudWorldRecord } from '../../services/supabaseClient';
import { extractWorld, writeFileBytes, deleteFile, getSaveDir, getTempZipPath } from '../../services/tauriCommands';
import confetti from 'canvas-confetti';

export const CloudBrowser: React.FC = () => {
  const { t } = useTranslation();
  const { cloudWorlds, isLoading, error, fetchCloudWorlds, downloadWorldZip, deleteCloudWorldRecord } = useCloudStore();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreDone, setRestoreDone] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCloudWorlds();
  }, [fetchCloudWorlds]);

  const handleRestore = async (world: CloudWorldRecord) => {
    setRestoringId(world.id);

    try {
      // 1. Download ZIP file from Supabase Storage
      const zipBytes = await downloadWorldZip(world.r2_file_key);
      if (!zipBytes) {
        throw new Error('Falha ao baixar o arquivo .zip da nuvem.');
      }

      // 2. Get dynamic cross-platform temp ZIP path
      const tempZipPath = await getTempZipPath(`restore_${world.id}.zip`);
      await writeFileBytes(tempZipPath, zipBytes);

      // 3. Determine dynamic target save directory for current system & user
      const targetDir = await getSaveDir(world.edition, world.world_name);

      // 4. Extract (Rust extractWorld automatically backs up existing targetDir if present!)
      await extractWorld(tempZipPath, targetDir);

      // 5. Clean up temp zip
      try {
        await deleteFile(tempZipPath);
      } catch (e) {
        console.warn('Temp zip cleanup notice:', e);
      }

      setRestoringId(null);
      setRestoreDone(world.id);

      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#2cb9a8', '#17dd62', '#dda520'],
      });

      setTimeout(() => setRestoreDone(null), 4000);
    } catch (err: any) {
      console.error('Error restoring world from cloud:', err);
      alert(`Erro ao restaurar o mundo: ${err.message || err}`);
      setRestoringId(null);
    }
  };

  const handleDelete = async (world: CloudWorldRecord) => {
    if (!confirm(`Tem certeza que deseja excluir o mundo "${world.world_name}" da nuvem?`)) {
      return;
    }

    setDeletingId(world.id);
    try {
      await deleteCloudWorldRecord(world.id, world.r2_file_key);
    } catch (err) {
      console.error('Error deleting cloud world:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(0) + ' KB';
    return mb.toFixed(1) + ' MB';
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            {t('cloud.title')}
            <span className="text-xs bg-diamond/20 text-diamond border border-diamond/30 px-2.5 py-0.5 rounded-full font-mono font-normal">
              {cloudWorlds.length} {cloudWorlds.length === 1 ? 'salvo' : 'salvos'}
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('cloud.subtitle')}</p>
        </div>

        <button
          onClick={fetchCloudWorlds}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2 text-xs"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-diamond' : ''} />
          <span>{t('cloud.refreshButton')}</span>
        </button>
      </div>

      {/* DB Schema Alert Notice */}
      {error && (
        <div className="glass-panel p-4 border border-amber-500/40 bg-amber-500/10 flex items-start gap-3 text-amber-300 text-xs">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Aviso de Conexão com a Nuvem</h4>
            <p className="text-slate-300">
              Certifique-se de executar o script <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 font-mono">supabase_schema.sql</code> no SQL Editor do seu Supabase.
            </p>
            <p className="text-[11px] text-amber-400/80 font-mono mt-1">Detalhes: {error}</p>
          </div>
        </div>
      )}

      {/* Cloud Worlds Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-diamond/10 border border-diamond/30 flex items-center justify-center text-diamond animate-pulse">
            <Sparkles size={32} className="animate-spin" />
          </div>
          <p className="text-sm text-slate-300 font-mono">Conectando ao repositório Supabase Storage...</p>
        </div>
      ) : cloudWorlds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cloudWorlds.map((world) => {
            const isRestoring = restoringId === world.id;
            const isDone = restoreDone === world.id;
            const isDeleting = deletingId === world.id;

            return (
              <div
                key={world.id}
                className="glass-panel p-4 flex flex-col justify-between h-56 border border-white/10 hover:border-diamond/40 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/15 flex items-center justify-center text-diamond shadow-inner">
                      <Cloud size={24} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={world.edition === 'java' ? 'badge-java' : 'badge-bedrock'}>
                        {world.edition === 'java' ? t('worldCard.java') : t('worldCard.bedrock')}
                      </span>
                      <button
                        onClick={() => handleDelete(world)}
                        disabled={isDeleting || isRestoring}
                        title="Excluir mundo da nuvem"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={14} className={isDeleting ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mt-3 truncate">{world.world_name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                    <HardDrive size={12} className="text-slate-500" />
                    <span>{world.source_os} • {world.source_launcher}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>{formatSize(world.file_size)}</span>
                    <span>{formatDate(world.last_synced_at)}</span>
                  </div>

                  <button
                    onClick={() => handleRestore(world)}
                    disabled={isRestoring || isDeleting}
                    className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-[0_4px_14px_rgba(44,185,168,0.25)]'
                    }`}
                  >
                    {isRestoring ? (
                      <>
                        <Sparkles size={14} className="animate-spin" />
                        <span>{t('cloud.downloading')}</span>
                      </>
                    ) : isDone ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>{t('cloud.restored')}</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>{t('cloud.restoreButton')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel p-12 text-center max-w-md mx-auto my-8 space-y-4 border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-diamond mx-auto shadow-inner">
            <Layers size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-200">{t('cloud.emptyCloud')}</h3>
          <p className="text-xs text-slate-400">{t('cloud.emptyCloudDesc')}</p>
        </div>
      )}
    </div>
  );
};
