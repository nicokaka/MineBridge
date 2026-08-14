import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, CloudWorldRecord } from '../services/supabaseClient';

const BUCKET_NAME = 'minebridge_worlds';

interface CloudState {
  cloudWorlds: CloudWorldRecord[];
  isLoading: boolean;
  error: string | null;
  totalStorageBytes: number;

  // Actions
  fetchCloudWorlds: () => Promise<void>;
  addCloudWorldRecord: (record: Omit<CloudWorldRecord, 'id' | 'created_at'>) => Promise<boolean>;
  deleteCloudWorldRecord: (id: string, storageKey?: string) => Promise<boolean>;
  uploadWorldZip: (storageKey: string, zipBytes: Uint8Array) => Promise<boolean>;
  downloadWorldZip: (storageKey: string) => Promise<Uint8Array | null>;
}

export const useCloudStore = create<CloudState>()(
  persist(
    (set) => ({
      cloudWorlds: [],
      isLoading: false,
      error: null,
      totalStorageBytes: 0,

      fetchCloudWorlds: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('cloud_worlds')
            .select('*')
            .order('last_synced_at', { ascending: false });

          if (error) {
            console.warn('Cloud worlds fetch notice:', error.message);
            set({ isLoading: false });
            return;
          }

          const remoteWorlds = (data as CloudWorldRecord[]) || [];

          set((state) => {
            // Intelligent Merge: keep local saved items while appending remote records
            const mergedMap = new Map<string, CloudWorldRecord>();

            // First add local saved items
            for (const localWorld of state.cloudWorlds) {
              const key = `${localWorld.world_name}_${localWorld.edition}`;
              mergedMap.set(key, localWorld);
            }

            // Then merge remote items (overwriting with latest cloud timestamp)
            for (const remoteWorld of remoteWorlds) {
              const key = `${remoteWorld.world_name}_${remoteWorld.edition}`;
              mergedMap.set(key, remoteWorld);
            }

            const mergedList = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.last_synced_at).getTime() - new Date(a.last_synced_at).getTime()
            );

            const totalBytes = mergedList.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);

            return {
              cloudWorlds: mergedList,
              totalStorageBytes: totalBytes,
              isLoading: false,
              error: null,
            };
          });
        } catch (err: any) {
          console.warn('Fetch cloud worlds notice:', err);
          set({ isLoading: false });
        }
      },

      uploadWorldZip: async (storageKey: string, zipBytes: Uint8Array) => {
        try {
          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storageKey, zipBytes, {
              contentType: 'application/zip',
              upsert: true,
            });

          if (error) {
            console.error('Supabase storage upload error:', error.message);
            throw new Error(`Erro no Supabase Storage: ${error.message}`);
          }
          return true;
        } catch (err: any) {
          console.error('Upload exception:', err);
          throw err;
        }
      },

      downloadWorldZip: async (storageKey: string) => {
        try {
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(storageKey);

          if (error || !data) {
            console.error('Supabase storage download error:', error?.message);
            throw new Error(error?.message || 'Falha ao baixar o arquivo da nuvem');
          }

          const arrayBuffer = await data.arrayBuffer();
          return new Uint8Array(arrayBuffer);
        } catch (err: any) {
          console.error('Download exception:', err);
          throw err;
        }
      },

      addCloudWorldRecord: async (record) => {
        try {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = uuidRegex.test(record.user_id);

          let insertedRecord: CloudWorldRecord | null = null;

          if (isValidUUID) {
            const { data, error } = await supabase.from('cloud_worlds').insert([record]).select();
            if (error) {
              console.error('Supabase DB insert error:', error.message);
              throw new Error(`Erro ao salvar no banco Supabase: ${error.message}`);
            }
            if (data && data.length > 0) {
              insertedRecord = data[0] as CloudWorldRecord;
            }
          }

          const newRecord: CloudWorldRecord = insertedRecord || {
            id: `cloud-${Date.now()}`,
            created_at: new Date().toISOString(),
            ...record,
          };

          set((state) => {
            const filtered = state.cloudWorlds.filter(
              (w) => !(w.world_name === record.world_name && w.edition === record.edition)
            );
            const newList = [newRecord, ...filtered];
            const totalBytes = newList.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);

            return {
              cloudWorlds: newList,
              totalStorageBytes: totalBytes,
            };
          });

          return true;
        } catch (err: any) {
          console.error('Exception adding cloud record:', err);
          throw err;
        }
      },

      deleteCloudWorldRecord: async (id, storageKey) => {
        try {
          if (storageKey) {
            try {
              await supabase.storage.from(BUCKET_NAME).remove([storageKey]);
            } catch (e) {
              // Ignore storage cleanup error
            }
          }

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(id)) {
            await supabase.from('cloud_worlds').delete().eq('id', id);
          }

          set((state) => {
            const newList = state.cloudWorlds.filter((w) => w.id !== id);
            const totalBytes = newList.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);
            return {
              cloudWorlds: newList,
              totalStorageBytes: totalBytes,
            };
          });

          return true;
        } catch (err) {
          console.warn('Exception deleting cloud record:', err);
          return true;
        }
      },
    }),
    {
      name: 'minebridge_cloud_vault',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cloudWorlds: state.cloudWorlds,
        totalStorageBytes: state.totalStorageBytes,
      }),
    }
  )
);
