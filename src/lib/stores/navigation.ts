import { create } from "zustand";

export type ProviderView =
  | "list"
  | "add-custom"
  | "configure"
  | "manage-models";

export interface NavigationState {
  view: ProviderView;
  activeProviderId: string | null;

  // Actions
  navigateToList: () => void;
  navigateToAddCustom: () => void;
  navigateToConfigure: (providerId: string) => void;
  navigateToManageModels: (providerId: string) => void;
  goBack: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  view: "list",
  activeProviderId: null,

  navigateToList: () => set({ view: "list", activeProviderId: null }),

  navigateToAddCustom: () =>
    set({ view: "add-custom", activeProviderId: null }),

  navigateToConfigure: (providerId: string) =>
    set({
      view: "configure",
      activeProviderId: providerId,
    }),

  navigateToManageModels: (providerId: string) =>
    set({
      view: "manage-models",
      activeProviderId: providerId,
    }),

  goBack: () => {
    const { view } = get();
    if (view === "configure" || view === "manage-models") {
      set({ view: "list", activeProviderId: null });
    } else if (view === "add-custom") {
      set({ view: "list", activeProviderId: null });
    }
  },
}));
