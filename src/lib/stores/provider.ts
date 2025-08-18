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

    // Custom provider actions
    addCustomProvider: (providerFormat: OfficialProvider) => string; // returns id
    updateCustomProvider: (
        id: string,
        updates: Partial<CustomProviderState>
    ) => void;
    removeCustomProvider: (id: string) => void;
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