import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ModelWithProvider } from './provider';

export interface SettingsState {
  selectedModel: ModelWithProvider | null;
}

export interface UIState {
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
}

interface GlobalState {
  ui: UIState;
  general: SettingsState;
}

interface GlobalStore extends GlobalState {
  // Actions
  updateSettings: (settings: Partial<SettingsState>) => void;

  // UI Actions
  openSettings: () => void;
  closeSettings: () => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useGlobalStore = create<GlobalStore>()(
  persist(
    (set) => ({
      general: {
        selectedModel: null,
      },
      ui: {
        isSidebarOpen: true,
        isSettingsOpen: false,
      },
      updateSettings: (newSettings) => {
        set((state) => ({
          general: { ...state.general, ...newSettings },
        }));
      },
      // UI Actions
      openSettings: () => {
        set((state) => ({ ui: { ...state.ui, isSettingsOpen: true } }));
      },
      closeSettings: () => {
        set((state) => ({ ui: { ...state.ui, isSettingsOpen: false } }));
      },
      toggleSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: !state.ui.isSidebarOpen } }));
      },
      openSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: true } }));
      },
      closeSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: false } }));
      },
    }),
    {
      name: 'global',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
