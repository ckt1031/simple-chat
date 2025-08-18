import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export enum OfficialProvider {
    OPENAI = 'openai',
    GOOGLE = 'google',
    OPENROUTER = 'openrouter',
}

export interface OfficialProviderState {
    enabled: boolean;

    apiKey: string;
    apiBaseURL: string;

    models: string[];
}

export interface CustomProviderState extends OfficialProviderState {
    type: 'custom';
    providerFormat: OfficialProvider,
}

export interface ProviderState {
    officialProviders: Record<OfficialProvider, OfficialProviderState>;
    customProviders: Record<string, CustomProviderState>;
}

export interface ProviderStore extends ProviderState {
    hasEnabledProviders: () => boolean;
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
            }
        }),
        { name: 'provider', storage: createJSONStorage(() => localStorage) }
    )
);