import { create } from 'zustand';
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

export const useCloudStore = create<CloudState>((set, get) => ({
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
        set({ isLoading: false, error: error.message });
        return;
      }

      const worlds = (data as CloudWorldRecord[]) || [];
      const totalBytes = worlds.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);

      set({
        cloudWorlds: worlds,
        totalStorageBytes: totalBytes,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Fetch cloud worlds exception:', err);
      set({ isLoading: false, error: err.message || 'Error fetching cloud worlds' });
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
        return false;
      }
      return true;
    } catch (err) {
      console.error('Upload exception:', err);
      return false;
    }
  },

  downloadWorldZip: async (storageKey: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(storageKey);

      if (error || !data) {
        console.error('Supabase storage download error:', error?.message);
        return null;
      }

      const arrayBuffer = await data.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (err) {
      console.error('Download exception:', err);
      return null;
    }
  },

  addCloudWorldRecord: async (record) => {
    try {
      const { data, error } = await supabase.from('cloud_worlds').insert([record]).select();

      if (error) {
        console.error('Failed to insert cloud record:', error);
        return false;
      }

      if (data) {
        await get().fetchCloudWorlds();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Exception adding cloud record:', err);
      return false;
    }
  },

  deleteCloudWorldRecord: async (id, storageKey) => {
    try {
      // 1. Delete from storage if storageKey provided
      if (storageKey) {
        await supabase.storage.from(BUCKET_NAME).remove([storageKey]);
      }

      // 2. Delete DB record
      const { error } = await supabase.from('cloud_worlds').delete().eq('id', id);

      if (error) {
        console.error('Failed to delete cloud record:', error);
        return false;
      }

      await get().fetchCloudWorlds();
      return true;
    } catch (err) {
      console.error('Exception deleting cloud record:', err);
      return false;
    }
  },
}));
