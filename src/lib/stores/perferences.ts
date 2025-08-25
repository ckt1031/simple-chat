import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ModelWithProvider } from "./provider";

export interface PreferencesState {
  selectedModel: ModelWithProvider | null; // Global model selection (legacy, will be replaced by per-conversation)
  defaultModel: ModelWithProvider | null; // Default model for new conversations
}

interface PreferencesStore extends PreferencesState {
  updateSettings: (newSettings: Partial<PreferencesState>) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      selectedModel: null,
      defaultModel: null,
      updateSettings: (newSettings) => {
        set((state) => ({
          ...state,
          ...newSettings,
        }));
      },
    }),
    {
      name: "preferences",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
