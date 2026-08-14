import { useSyncStore } from '../stores/syncStore';
import { useCloudStore } from '../stores/cloudStore';
import { useAuthStore } from '../stores/authStore';
import { backupWorld, extractWorld, writeFileBytes, deleteFile, getSaveDir, getTempZipPath } from '../services/tauriCommands';

export function useConflictResolver() {
  const { conflict, closeConflict } = useSyncStore();
  const { downloadWorldZip } = useCloudStore();
  const { user } = useAuthStore();

  const resolveKeepLocal = async () => {
    // Keep local version (force overwrite cloud)
    console.log('Resolving conflict: Keeping local version for world', conflict.worldId);
    closeConflict();
  };

  const resolveKeepCloud = async () => {
    // Restore cloud version over local version (safety backup is created automatically by Rust backend before overwriting)
    if (conflict.worldId) {
      try {
        const storageKey = `${user?.id || 'demo'}/${conflict.worldId}/world.zip`;
        const bytes = await downloadWorldZip(storageKey);
        if (bytes) {
          const tempZipPath = await getTempZipPath(`conflict_${conflict.worldId}.zip`);
          await writeFileBytes(tempZipPath, bytes);
          const targetDir = await getSaveDir('java', conflict.worldName || 'world');
          await extractWorld(tempZipPath, targetDir);
          try {
            await deleteFile(tempZipPath);
          } catch (e) {
            console.warn('Cleanup temp zip notice:', e);
          }
        }
      } catch (err) {
        console.error('Error resolving keep cloud conflict:', err);
      }
    }
    closeConflict();
  };

  const resolveKeepBoth = async (worldPath?: string) => {
    // Create a local backup copy first before restoring cloud version
    if (worldPath) {
      try {
        await backupWorld(worldPath);
      } catch (e) {
        console.warn('Backup on keepBoth notice:', e);
      }
    }
    await resolveKeepCloud();
  };

  return {
    conflict,
    resolveKeepLocal,
    resolveKeepCloud,
    resolveKeepBoth,
  };
}
