import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ModelWithProvider } from "./provider";

export interface SettingsState {
  selectedModel: ModelWithProvider | null;
}

export interface UIState {
  isSidebarOpen: boolean;
  isHydrated: boolean;
  isSettingsOpen: boolean;
  isChatManagementOpen: boolean;
  /**
   * Model to be selected in home and chat pages.
   */
  selectedModel: ModelWithProvider | null;
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

interface UIStore extends UIState {
  // UI Actions
  openSettings: () => void;
  closeSettings: () => void;
  openChatManagement: () => void;
  closeChatManagement: () => void;

  // Home and chat page model selection
  setSelectedModel: (model: ModelWithProvider | null) => void;

  toggleSidebar: () => void;

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

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isSettingsOpen: false,
      isChatManagementOpen: false,
      isHydrated: false,
      selectedModel: null,
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
      // UI Actions
      openSettings: () => {
        set({ isSettingsOpen: true });
      },
      closeSettings: () => {
        set({ isSettingsOpen: false });
      },
      openChatManagement: () => {
        set({ isChatManagementOpen: true });
      },
      closeChatManagement: () => {
        set({ isChatManagementOpen: false });
      },
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
      setSelectedModel: (model: ModelWithProvider | null) => {
        set({ selectedModel: model });
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      // Delete Confirmation Actions
      openDeleteConfirmation: (title, message, onConfirm) => {
        set({
          deleteConfirmation: {
            isOpen: true,
            title,
            message,
            onConfirm,
          },
        });
      },
      closeDeleteConfirmation: () => {
        set({
          deleteConfirmation: {
            isOpen: false,
            title: "",
            message: "",
            onConfirm: null,
          },
        });
      },

      // Edit Title Modal Actions
      openEditTitle: (conversationId) => {
        set({
          editTitle: { isOpen: true, conversationId },
        });
      },
      closeEditTitle: () => {
        set({
          editTitle: { isOpen: false, conversationId: null },
        });
      },
    }),
    {
      name: "ui",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
