import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export enum OfficialProvider {
  OPENAI = "OpenAI",
  GOOGLE = "Google",
  OPENROUTER = "OpenRouter",
  GROQ = "Groq",
  MISTRAL = "Mistral",
  DEEPSEEK = "DeepSeek",
  ANTHROPIC = "Anthropic",
}

export interface Model {
  id: string;
  name?: string;
  enabled: boolean;
  source: "fetch" | "custom";
  thinking?: boolean;
}

export interface ModelWithProvider extends Model {
  providerId: OfficialProvider | string;
}

export interface BaseProviderState {
  enabled: boolean;
  apiKey: string;
  apiBaseURL: string;
  models: Model[];
}

export interface OfficialProviderState extends BaseProviderState {
  type: "official";
  provider: OfficialProvider;
}

export interface CustomProviderState extends BaseProviderState {
  type: "custom";
  id: string;
  displayName: string;
  providerFormat: OfficialProvider;
}

export type ProviderState = OfficialProviderState | CustomProviderState;

export interface ProviderStore {
  // State
  providers: Record<string, ProviderState>;

  // Computed
  getOfficialProviders: () => OfficialProviderState[];
  getCustomProviders: () => CustomProviderState[];
  getAllProviders: () => ProviderState[];
  getEnabledProviders: () => ProviderState[];
  hasEnabledProviders: () => boolean;
  getProvider: (id: string) => ProviderState | null;

  // Helpers
  formatModelKey: (providerId: string, modelId: string) => string;
  parseModelKey: (
    key: string,
  ) => { providerId: string; modelId: string } | null;
  resolveModelByKey: (key: string) => ModelWithProvider | null;
  getModelLabel: (providerId: string, modelId: string) => string;
  getProviderLabel: (providerId: string) => string;
  getDisplayText: (value: string | undefined, fallback: string) => string;

  // Grouping
  getEnabledProviderModelGroups: (query?: string) => Array<{
    id: string;
    label: string;
    kind: "official" | "custom";
    officialKey?: OfficialProvider;
    models: Model[];
  }>;

  // Actions
  updateProvider: (id: string, updates: Partial<BaseProviderState>) => void;
  removeProvider: (id: string) => void;
  addCustomProvider: (providerFormat: OfficialProvider) => string;

  // Model management
  applyFetchedModels: (providerId: string, fetchedModels: Model[]) => void;
  clearFetchedModels: (providerId: string) => void;
  addCustomModel: (
    providerId: string,
    model: Pick<Model, "id" | "name">,
  ) => boolean;
  updateModel: (
    providerId: string,
    modelId: string,
    updates: Partial<Pick<Model, "id" | "name" | "enabled">>,
  ) => boolean;
  removeCustomModel: (providerId: string, modelId: string) => void;
}

const createOfficialProvider = (
  provider: OfficialProvider,
): OfficialProviderState => ({
  type: "official",
  provider,
  enabled: false,
  apiKey: "",
  apiBaseURL: "",
  models: [],
});

const createCustomProvider = (
  id: string,
  providerFormat: OfficialProvider,
): CustomProviderState => ({
  type: "custom",
  id,
  providerFormat,
  enabled: false,
  apiKey: "",
  apiBaseURL: "",
  models: [],
  displayName: "Custom Provider",
});

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      providers: {},

      getOfficialProviders: () => {
        const state = get();
        return Object.values(state.providers).filter(
          (p): p is OfficialProviderState => p.type === "official",
        );
      },

      getCustomProviders: () => {
        const state = get();
        return Object.values(state.providers).filter(
          (p): p is CustomProviderState => p.type === "custom",
        );
      },

      getAllProviders: () => {
        return Object.values(get().providers);
      },

      getEnabledProviders: () => {
        return Object.values(get().providers).filter((p) => p.enabled);
      },

      hasEnabledProviders: () => {
        return get()
          .getAllProviders()
          .some((provider) => provider.enabled);
      },

      getProvider: (id: string) => {
        return get().providers[id] || null;
      },

      // Helpers
      formatModelKey: (providerId: string, modelId: string) =>
        `${providerId}:${modelId}`,
      parseModelKey: (key: string) => {
        if (!key) return null;
        const idx = key.indexOf(":");
        if (idx === -1) return null;
        const providerId = key.slice(0, idx);
        const modelId = key.slice(idx + 1);
        if (!providerId || !modelId) return null;
        return { providerId, modelId };
      },
      resolveModelByKey: (key: string) => {
        const parsed = get().parseModelKey(key);
        if (!parsed) return null;
        const provider = get().providers[parsed.providerId];
        if (!provider) return null;
        const model = provider.models.find((m) => m.id === parsed.modelId);
        if (!model) return null;
        return { ...model, providerId: parsed.providerId };
      },
      getModelLabel: (providerId: string, modelId: string) => {
        const provider = get().providers[providerId];
        if (!provider) return modelId;
        const model = provider.models.find((m) => m.id === modelId);
        if (!model) return modelId;
        return get().getDisplayText(model.name, model.id);
      },
      getProviderLabel: (providerId: string) => {
        const provider = get().providers[providerId];
        if (!provider) return providerId;
        if (provider.type === "official") return provider.provider;
        return get().getDisplayText(provider.displayName, provider.id);
      },
      getDisplayText: (value: string | undefined, fallback: string) => {
        if (!value) return fallback;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : fallback;
      },

      getEnabledProviderModelGroups: (query?: string) => {
        const q = (query ?? "").toLowerCase().trim();
        const enabledProviders = get().getEnabledProviders();

        return enabledProviders
          .map((p) => {
            const label =
              p.type === "official"
                ? p.provider
                : get().getDisplayText(p.displayName, p.id);

            const models = p.models.filter((m) => {
              if (!m.enabled) return false;
              if (!q) return true;
              const name = get().getDisplayText(m.name, m.id).toLowerCase();
              return name.includes(q);
            });

            return {
              id: p.type === "official" ? p.provider : p.id,
              label,
              kind: p.type,
              officialKey: p.type === "official" ? p.provider : undefined,
              models,
            };
          })
          .filter((group) => group.models.length > 0);
      },

      updateProvider: (id: string, updates: Partial<BaseProviderState>) => {
        set((state) => {
          const provider = state.providers[id];
          if (!provider) return state;

          return {
            providers: {
              ...state.providers,
              [id]: { ...provider, ...updates },
            },
          };
        });
      },

      removeProvider: (id: string) => {
        set((state) => {
          const { [id]: removed, ...rest } = state.providers;
          return { providers: rest };
        });
      },

      addCustomProvider: (providerFormat: OfficialProvider) => {
        const id = `custom-${Date.now()}`;
        set((state) => ({
          providers: {
            ...state.providers,
            [id]: createCustomProvider(id, providerFormat),
          },
        }));
        return id;
      },

      applyFetchedModels: (providerId: string, fetchedModels: Model[]) => {
        set((state) => {
          const provider = state.providers[providerId];
          if (!provider) return state;

          const oldFetchedById = new Map(
            provider.models
              .filter((m) => m.source === "fetch")
              .map((m) => [m.id, m] as const),
          );

          const fetchedIds = new Set(fetchedModels.map((m) => m.id));
          const dedupCustom = provider.models.filter(
            (m) => m.source === "custom" && !fetchedIds.has(m.id),
          );

          const mergedFetched: Model[] = fetchedModels.map((m) => ({
            id: m.id,
            name: m.name ?? m.id,
            // Ignore incoming enabled; preserve previous if existed, else false
            enabled: oldFetchedById.get(m.id)?.enabled ?? false,
            source: "fetch",
            thinking: m.thinking,
          }));

          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...provider,
                models: [...mergedFetched, ...dedupCustom],
              },
            },
          };
        });
      },

      clearFetchedModels: (providerId: string) => {
        set((state) => {
          const provider = state.providers[providerId];
          if (!provider) return state;

          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...provider,
                models: provider.models.filter((m) => m.source === "custom"),
              },
            },
          };
        });
      },

      addCustomModel: (
        providerId: string,
        model: Pick<Model, "id" | "name">,
      ) => {
        let success = false;
        set((state) => {
          const provider = state.providers[providerId];
          if (!provider) return state;

          const exists = provider.models.some((m) => m.id === model.id);
          if (exists) return state;

          success = true;
          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...provider,
                models: [
                  ...provider.models,
                  {
                    id: model.id,
                    name: model.name ?? model.id,
                    enabled: false,
                    source: "custom",
                    thinking: false,
                  },
                ],
              },
            },
          };
        });
        return success;
      },

      updateModel: (
        providerId: string,
        modelId: string,
        updates: Partial<Pick<Model, "id" | "name" | "enabled">>,
      ) => {
        let success = false;
        set((state) => {
          const provider = state.providers[providerId];
          if (!provider) return state;

          const index = provider.models.findIndex((m) => m.id === modelId);
          if (index === -1) return state;

          const nextId = updates.id ?? modelId;
          if (
            nextId !== modelId &&
            provider.models.some((m) => m.id === nextId)
          ) {
            return state;
          }

          const updated: Model = {
            ...provider.models[index],
            ...updates,
            id: nextId,
          } as Model;
          const nextModels = [...provider.models];
          nextModels[index] = updated;
          success = true;

          return {
            providers: {
              ...state.providers,
              [providerId]: { ...provider, models: nextModels },
            },
          };
        });
        return success;
      },

      removeCustomModel: (providerId: string, modelId: string) => {
        set((state) => {
          const provider = state.providers[providerId];
          if (!provider) return state;

          return {
            providers: {
              ...state.providers,
              [providerId]: {
                ...provider,
                models: provider.models.filter(
                  (m) => !(m.source === "custom" && m.id === modelId),
                ),
              },
            },
          };
        });
      },
    }),
    {
      name: "provider",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Merge default providers with persisted providers
        if (state) {
          const defaultProviders = Object.values(OfficialProvider).reduce(
            (acc, provider) => {
              acc[provider] = createOfficialProvider(provider);
              return acc;
            },
            {} as Record<OfficialProvider, OfficialProviderState>,
          );

          state.providers = {
            ...defaultProviders,
            ...state.providers,
          };
        }
      },
    },
  ),
);
