import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ModelWithProvider } from "./provider";

export interface PreferencesState {
  selectedModel: ModelWithProvider | null;
}

interface PreferencesStore extends PreferencesState {
  updateSettings: (newSettings: Partial<PreferencesState>) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      selectedModel: null,
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
