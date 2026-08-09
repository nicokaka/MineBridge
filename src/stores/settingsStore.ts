import { create } from 'zustand';

interface SettingsState {
  autoSyncOnClose: boolean;
  includeResourcePacks: boolean;
  systemNotifications: boolean;
  language: 'pt-BR' | 'en';

  // Actions
  setAutoSyncOnClose: (enabled: boolean) => void;
  setIncludeResourcePacks: (enabled: boolean) => void;
  setSystemNotifications: (enabled: boolean) => void;
  setLanguage: (lang: 'pt-BR' | 'en') => void;
}

const SETTINGS_STORAGE_KEY = 'minebridge_settings';

const loadSavedSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load settings from storage:', e);
  }
  return {
    autoSyncOnClose: true,
    includeResourcePacks: true,
    systemNotifications: true,
    language: 'pt-BR',
  };
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadSavedSettings();

  const persist = (updated: Partial<SettingsState>) => {
    try {
      const current = get();
      const next = { ...current, ...updated };
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          autoSyncOnClose: next.autoSyncOnClose,
          includeResourcePacks: next.includeResourcePacks,
          systemNotifications: next.systemNotifications,
          language: next.language,
        })
      );
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  };

  return {
    ...initial,

    setAutoSyncOnClose: (enabled) => {
      set({ autoSyncOnClose: enabled });
      persist({ autoSyncOnClose: enabled });
    },

    setIncludeResourcePacks: (enabled) => {
      set({ includeResourcePacks: enabled });
      persist({ includeResourcePacks: enabled });
    },

    setSystemNotifications: (enabled) => {
      set({ systemNotifications: enabled });
      persist({ systemNotifications: enabled });
    },

    setLanguage: (lang) => {
      set({ language: lang });
      persist({ language: lang });
    },
  };
});
