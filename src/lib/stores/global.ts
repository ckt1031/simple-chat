import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ModelWithProvider } from "./provider";

export interface SettingsState {
  selectedModel: ModelWithProvider | null;
}

export interface UIState {
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  isHydrated: boolean;
  deleteConfirmation: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };
  editTitle: {
    isOpen: boolean;
    conversationId: string | null;
  };
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

  // Delete Confirmation Actions
  openDeleteConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => void;
  closeDeleteConfirmation: () => void;

  // Edit Title Modal Actions
  openEditTitle: (conversationId: string) => void;
  closeEditTitle: () => void;
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
        isHydrated: false,
        deleteConfirmation: {
          isOpen: false,
          title: "",
          message: "",
          onConfirm: null,
        },
        editTitle: {
          isOpen: false,
          conversationId: null,
        },
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
        set((state) => ({
          ui: { ...state.ui, isSidebarOpen: !state.ui.isSidebarOpen },
        }));
      },
      openSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: true } }));
      },
      closeSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: false } }));
      },
      setHydrated: (hydrated: boolean) => {
        set((state) => ({ ui: { ...state.ui, isHydrated: hydrated } }));
      },
      // Delete Confirmation Actions
      openDeleteConfirmation: (title, message, onConfirm) => {
        set((state) => ({
          ui: {
            ...state.ui,
            deleteConfirmation: {
              isOpen: true,
              title,
              message,
              onConfirm,
            },
          },
        }));
      },
      closeDeleteConfirmation: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            deleteConfirmation: {
              isOpen: false,
              title: "",
              message: "",
              onConfirm: null,
            },
          },
        }));
      },

      // Edit Title Modal Actions
      openEditTitle: (conversationId) => {
        set((state) => ({
          ui: {
            ...state.ui,
            editTitle: { isOpen: true, conversationId },
          },
        }));
      },
      closeEditTitle: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            editTitle: { isOpen: false, conversationId: null },
          },
        }));
      },
    }),
    {
      name: "global",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure defaults after rehydration
          if (!state.ui.deleteConfirmation) {
            state.ui.deleteConfirmation = {
              isOpen: false,
              title: "",
              message: "",
              onConfirm: null,
            };
          }
          if (!state.ui.editTitle) {
            state.ui.editTitle = {
              isOpen: false,
              conversationId: null,
            };
          }
          state.ui.isHydrated = true;
        }
      },
    },
  ),
);
