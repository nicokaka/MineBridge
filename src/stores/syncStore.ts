import { create } from 'zustand';
import confetti from 'canvas-confetti';

interface SyncTask {
  worldId: string;
  worldName: string;
  progress: number; // 0 to 100
  status: 'idle' | 'compressing' | 'uploading' | 'downloading' | 'extracting' | 'completed' | 'error';
  errorMessage?: string;
}

interface ConflictState {
  isOpen: boolean;
  worldId?: string;
  worldName?: string;
  localTime?: string;
  cloudTime?: string;
  localSize?: string;
  cloudSize?: string;
}

interface SyncStoreState {
  activeSyncs: Record<string, SyncTask>;
  conflict: ConflictState;
  startSync: (worldId: string, worldName: string) => void;
  updateProgress: (worldId: string, progress: number, status: SyncTask['status']) => void;
  finishSync: (worldId: string) => void;
  failSync: (worldId: string, error: string) => void;
  triggerConflict: (info: Omit<ConflictState, 'isOpen'>) => void;
  closeConflict: () => void;
}

export const useSyncStore = create<SyncStoreState>((set) => ({

  activeSyncs: {},
  conflict: { isOpen: false },

  startSync: (worldId, worldName) => {
    set((state) => ({
      activeSyncs: {
        ...state.activeSyncs,
        [worldId]: {
          worldId,
          worldName,
          progress: 5,
          status: 'compressing',
        },
      },
    }));
  },

  updateProgress: (worldId, progress, status) => {
    set((state) => ({
      activeSyncs: {
        ...state.activeSyncs,
        [worldId]: {
          ...state.activeSyncs[worldId],
          progress,
          status,
        },
      },
    }));
  },

  finishSync: (worldId) => {
    set((state) => {
      const copy = { ...state.activeSyncs };
      delete copy[worldId];
      return { activeSyncs: copy };
    });

    // Fire emerald celebration confetti!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#17dd62', '#7efc20', '#2cb9a8', '#dda520'],
    });
  },

  failSync: (worldId, error) => {
    set((state) => ({
      activeSyncs: {
        ...state.activeSyncs,
        [worldId]: {
          ...state.activeSyncs[worldId],
          progress: 0,
          status: 'error',
          errorMessage: error,
        },
      },
    }));
  },

  triggerConflict: (info) => {
    set({ conflict: { ...info, isOpen: true } });
  },

  closeConflict: () => {
    set({ conflict: { isOpen: false } });
  },
}));
