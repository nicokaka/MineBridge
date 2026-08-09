import { create } from 'zustand';
import { MinecraftWorld, scanWorlds, getCachedWorlds } from '../services/tauriCommands';

interface WorldsState {
  worlds: MinecraftWorld[];
  isScanning: boolean;
  searchQuery: string;
  selectedEdition: 'all' | 'java' | 'bedrock';
  setSearchQuery: (query: string) => void;
  setSelectedEdition: (edition: 'all' | 'java' | 'bedrock') => void;
  fetchWorlds: () => Promise<void>;
  loadCachedWorlds: () => Promise<void>;
}

export const useWorldsStore = create<WorldsState>((set) => ({
  worlds: [],
  isScanning: false,
  searchQuery: '',
  selectedEdition: 'all',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedEdition: (edition) => set({ selectedEdition: edition }),

  fetchWorlds: async () => {
    set({ isScanning: true });
    try {
      const worlds = await scanWorlds();
      set({ worlds, isScanning: false });
    } catch (e) {
      console.error(e);
      set({ isScanning: false });
    }
  },

  loadCachedWorlds: async () => {
    try {
      const worlds = await getCachedWorlds();
      set({ worlds });
    } catch (e) {
      console.error(e);
    }
  },
}));
