import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export enum OfficialProvider {
    OPENAI = 'OpenAI',
    GOOGLE = 'Google',
    OPENROUTER = 'OpenRouter',
}

export interface Model {
    id: string;
    name?: string;
    enabled: boolean;
    source: 'fetch' | 'custom';
}

export interface ModelWithProvider extends Model {
    providerId: OfficialProvider | string;
}

export interface OfficialProviderState {
    enabled: boolean;

    apiKey: string;
    apiBaseURL: string;

    models: Model[];
}

export interface CustomProviderState extends OfficialProviderState {
    type: 'custom';
    displayName: string;
    providerFormat: OfficialProvider,
}

export interface ProviderState {
    officialProviders: Record<OfficialProvider, OfficialProviderState>;
    customProviders: Record<string, CustomProviderState>;
}

export interface ProviderStore extends ProviderState {
    hasEnabledProviders: () => boolean;
    getProviders: () => Array<OfficialProviderState | CustomProviderState>;

    // Official provider actions
    updateOfficialProvider: (
        provider: OfficialProvider,
        updates: Partial<OfficialProviderState>
    ) => void;

    // Models management - official providers
    applyFetchedModelsToOfficial: (provider: OfficialProvider, fetchedModels: Model[]) => void;
    clearFetchedModelsForOfficial: (provider: OfficialProvider) => void;
    addCustomModelToOfficial: (provider: OfficialProvider, model: Pick<Model, 'id' | 'name'>) => boolean;
    updateModelForOfficial: (
        provider: OfficialProvider,
        modelId: string,
        updates: Partial<Pick<Model, 'id' | 'name' | 'enabled'>>
    ) => boolean;
    removeCustomModelFromOfficial: (provider: OfficialProvider, modelId: string) => void;

    // Custom provider actions
    addCustomProvider: (providerFormat: OfficialProvider) => string; // returns id
    updateCustomProvider: (
        id: string,
        updates: Partial<CustomProviderState>
    ) => void;
    removeCustomProvider: (id: string) => void;

    // Models management - custom providers
    applyFetchedModelsToCustom: (customId: string, fetchedModels: Model[]) => void;
    clearFetchedModelsForCustom: (customId: string) => void;
    addCustomModelToCustom: (customId: string, model: Pick<Model, 'id' | 'name'>) => boolean;
    updateModelForCustom: (
        customId: string,
        modelId: string,
        updates: Partial<Pick<Model, 'id' | 'name' | 'enabled'>>
    ) => boolean;
    removeCustomModelFromCustom: (customId: string, modelId: string) => void;
}

export const useProviderStore = create<ProviderStore>()(
    persist(
        (set, get) => ({
            officialProviders: {
                [OfficialProvider.OPENAI]: {
                    enabled: false,
                    apiKey: '',
                    apiBaseURL: '',
                    models: [],
                },
                [OfficialProvider.GOOGLE]: {
                    enabled: false,
                    apiKey: '',
                    apiBaseURL: '',
                    models: [],
                },
                [OfficialProvider.OPENROUTER]: {
                    enabled: false,
                    apiKey: '',
                    apiBaseURL: '',
                    models: [],
                },
            },
            customProviders: {},
            getProviders: () => {
                const officialProviders = Object.values(get().officialProviders);
                const customProviders = Object.values(get().customProviders);
                return [...officialProviders, ...customProviders];
            },
            hasEnabledProviders: () => {
                const officialProviders = Object.values(get().officialProviders);
                const customProviders = Object.values(get().customProviders);
                return officialProviders.some(provider => provider.enabled) || customProviders.some(provider => provider.enabled);
            },
            updateOfficialProvider: (provider, updates) => {
                set((state) => ({
                    officialProviders: {
                        ...state.officialProviders,
                        [provider]: { ...state.officialProviders[provider], ...updates },
                    },
                }));
            },
            applyFetchedModelsToOfficial: (provider, fetchedModels) => {
                set((state) => {
                    const current = state.officialProviders[provider];
                    const oldFetchedById = new Map(
                        current.models
                            .filter((m) => m.source === 'fetch')
                            .map((m) => [m.id, m] as const)
                    );
                    const fetchedIds = new Set(fetchedModels.map((m) => m.id));
                    const dedupCustom = current.models.filter(
                        (m) => m.source === 'custom' && !fetchedIds.has(m.id)
                    );
                    const mergedFetched: Model[] = fetchedModels.map((m) => ({
                        id: m.id,
                        name: m.name ?? m.id,
                        enabled: oldFetchedById.get(m.id)?.enabled ?? m.enabled ?? false,
                        source: 'fetch',
                        providerId: provider,
                    }));
                    return {
                        officialProviders: {
                            ...state.officialProviders,
                            [provider]: {
                                ...current,
                                models: [...mergedFetched, ...dedupCustom],
                            },
                        },
                    } as Partial<ProviderState>;
                });
            },
            clearFetchedModelsForOfficial: (provider) => {
                set((state) => {
                    const current = state.officialProviders[provider];
                    return {
                        officialProviders: {
                            ...state.officialProviders,
                            [provider]: {
                                ...current,
                                models: current.models.filter((m) => m.source === 'custom'),
                            },
                        },
                    } as Partial<ProviderState>;
                });
            },
            addCustomModelToOfficial: (provider, model) => {
                let success = false;
                set((state) => {
                    const current = state.officialProviders[provider];
                    const exists = current.models.some((m) => m.id === model.id);
                    if (exists) return {};
                    success = true;
                    return {
                        officialProviders: {
                            ...state.officialProviders,
                            [provider]: {
                                ...current,
                                models: [
                                    ...current.models,
                                    { id: model.id, name: model.name ?? model.id, enabled: false, source: 'custom', providerId: provider },
                                ],
                            },
                        },
                    } as Partial<ProviderState>;
                });
                return success;
            },
            updateModelForOfficial: (provider, modelId, updates) => {
                let success = false;
                set((state) => {
                    const current = state.officialProviders[provider];
                    const index = current.models.findIndex((m) => m.id === modelId);
                    if (index === -1) return {};
                    const nextId = updates.id ?? modelId;
                    if (nextId !== modelId && current.models.some((m) => m.id === nextId)) {
                        return {};
                    }
                    const updated: Model = { ...current.models[index], ...updates, id: nextId } as Model;
                    const nextModels = [...current.models];
                    nextModels[index] = updated;
                    success = true;
                    return {
                        officialProviders: {
                            ...state.officialProviders,
                            [provider]: { ...current, models: nextModels },
                        },
                    } as Partial<ProviderState>;
                });
                return success;
            },
            removeCustomModelFromOfficial: (provider, modelId) => {
                set((state) => {
                    const current = state.officialProviders[provider];
                    return {
                        officialProviders: {
                            ...state.officialProviders,
                            [provider]: {
                                ...current,
                                models: current.models.filter((m) => !(m.source === 'custom' && m.id === modelId)),
                            },
                        },
                    } as Partial<ProviderState>;
                });
            },
            addCustomProvider: (providerFormat) => {
                const id = `custom-${Date.now()}`;
                set((state) => ({
                    customProviders: {
                        ...state.customProviders,
                        [id]: {
                            type: 'custom',
                            providerFormat,
                            enabled: false,
                            apiKey: '',
                            apiBaseURL: '',
                            models: [],
                            displayName: 'Custom Provider',
                        },
                    },
                }));
                return id;
            },
            updateCustomProvider: (id, updates) => {
                set((state) => ({
                    customProviders: {
                        ...state.customProviders,
                        [id]: { ...state.customProviders[id], ...updates },
                    },
                }));
            },
            removeCustomProvider: (id) => {
                set((state) => {
                    const { [id]: _removed, ...rest } = state.customProviders;
                    return { customProviders: rest } as Partial<ProviderState>;
                });
            },
            applyFetchedModelsToCustom: (customId, fetchedModels) => {
                set((state) => {
                    const current = state.customProviders[customId];
                    if (!current) return {};
                    const oldFetchedById = new Map(
                        current.models
                            .filter((m) => m.source === 'fetch')
                            .map((m) => [m.id, m] as const)
                    );
                    const fetchedIds = new Set(fetchedModels.map((m) => m.id));
                    const dedupCustom = current.models.filter(
                        (m) => m.source === 'custom' && !fetchedIds.has(m.id)
                    );
                    const mergedFetched: Model[] = fetchedModels.map((m) => ({
                        id: m.id,
                        name: m.name ?? m.id,
                        enabled: oldFetchedById.get(m.id)?.enabled ?? m.enabled ?? false,
                        source: 'fetch',
                    }));
                    return {
                        customProviders: {
                            ...state.customProviders,
                            [customId]: {
                                ...current,
                                models: [...mergedFetched, ...dedupCustom],
                            },
                        },
                    } as Partial<ProviderState>;
                });
            },
            clearFetchedModelsForCustom: (customId) => {
                set((state) => {
                    const current = state.customProviders[customId];
                    if (!current) return {};
                    return {
                        customProviders: {
                            ...state.customProviders,
                            [customId]: {
                                ...current,
                                models: current.models.filter((m) => m.source === 'custom'),
                            },
                        },
                    } as Partial<ProviderState>;
                });
            },
            addCustomModelToCustom: (customId, model) => {
                let success = false;
                set((state) => {
                    const current = state.customProviders[customId];
                    if (!current) return {};
                    const exists = current.models.some((m) => m.id === model.id);
                    if (exists) return {};
                    success = true;
                    return {
                        customProviders: {
                            ...state.customProviders,
                            [customId]: {
                                ...current,
                                models: [
                                    ...current.models,
                                    { id: model.id, name: model.name ?? model.id, enabled: false, source: 'custom' },
                                ],
                            },
                        },
                    } as Partial<ProviderState>;
                });
                return success;
            },
            updateModelForCustom: (customId, modelId, updates) => {
                let success = false;
                set((state) => {
                    const current = state.customProviders[customId];
                    if (!current) return {};
                    const index = current.models.findIndex((m) => m.id === modelId);
                    if (index === -1) return {};
                    const nextId = updates.id ?? modelId;
                    if (nextId !== modelId && current.models.some((m) => m.id === nextId)) {
                        return {};
                    }
                    const updated: Model = { ...current.models[index], ...updates, id: nextId } as Model;
                    const nextModels = [...current.models];
                    nextModels[index] = updated;
                    success = true;
                    return {
                        customProviders: {
                            ...state.customProviders,
                            [customId]: { ...current, models: nextModels },
                        },
                    } as Partial<ProviderState>;
                });
                return success;
            },
            removeCustomModelFromCustom: (customId, modelId) => {
                set((state) => {
                    const current = state.customProviders[customId];
                    if (!current) return {};
                    return {
                        customProviders: {
                            ...state.customProviders,
                            [customId]: {
                                ...current,
                                models: current.models.filter((m) => !(m.source === 'custom' && m.id === modelId)),
                            },
                        },
                    } as Partial<ProviderState>;
                });
            },
        }),
        {
            name: 'provider',
            storage: createJSONStorage(() => localStorage),
            version: 2,
            migrate: (persisted, version) => {
                const state = (persisted || {}) as Partial<ProviderState>;
                const oldOfficial: any = (state as any).officialProviders || {};

                const getOrDefault = (keyNew: OfficialProvider, keyOld: string): OfficialProviderState => {
                    return (
                        oldOfficial[keyNew] ||
                        oldOfficial[keyOld] || {
                            enabled: false,
                            apiKey: '',
                            apiBaseURL: '',
                            models: [],
                        }
                    );
                };

                const migratedOfficial: Record<OfficialProvider, OfficialProviderState> = {
                    [OfficialProvider.OPENAI]: getOrDefault(OfficialProvider.OPENAI, 'openai'),
                    [OfficialProvider.GOOGLE]: getOrDefault(OfficialProvider.GOOGLE, 'google'),
                    [OfficialProvider.OPENROUTER]: getOrDefault(OfficialProvider.OPENROUTER, 'openrouter'),
                };

                const oldCustom: any = (state as any).customProviders || {};
                const migratedCustom: Record<string, CustomProviderState> = {} as any;
                for (const id of Object.keys(oldCustom)) {
                    const p = oldCustom[id] || {};
                    let format = p.providerFormat as OfficialProvider | string | undefined;
                    if (format === 'openai') format = OfficialProvider.OPENAI;
                    if (format === 'google') format = OfficialProvider.GOOGLE;
                    if (format === 'openrouter') format = OfficialProvider.OPENROUTER;
                    migratedCustom[id] = {
                        type: 'custom',
                        providerFormat: (format as OfficialProvider) || OfficialProvider.OPENAI,
                        enabled: !!p.enabled,
                        apiKey: p.apiKey ?? '',
                        apiBaseURL: p.apiBaseURL ?? '',
                        models: Array.isArray(p.models) ? p.models : [],
                        displayName: p.displayName ?? `Custom (${(format as OfficialProvider) || OfficialProvider.OPENAI})`,
                    };
                }

                return {
                    officialProviders: migratedOfficial,
                    customProviders: migratedCustom,
                } as ProviderState;
            },
        }
    )
);