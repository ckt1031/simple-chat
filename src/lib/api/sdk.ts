import { ModelWithProvider, OfficialProvider, useProviderStore } from "../stores/provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getASDK(model: ModelWithProvider) {
    const { officialProviders, customProviders } = useProviderStore.getState();

    // Resolve the actual provider format and credentials
    let resolvedFormat: OfficialProvider | null = null;
    let apiKey = '';
    let apiBaseURL = '';

    if (
        model.providerId === OfficialProvider.OPENAI ||
        model.providerId === OfficialProvider.GOOGLE ||
        model.providerId === OfficialProvider.OPENROUTER
    ) {
        resolvedFormat = model.providerId as OfficialProvider;
        const prov = officialProviders[resolvedFormat];
        apiKey = prov.apiKey;
        apiBaseURL = prov.apiBaseURL;
    } else if (typeof model.providerId === 'string') {
        const custom = customProviders[model.providerId];
        if (!custom) {
            throw new Error(`Unsupported provider: ${model.providerId}`);
        }
        resolvedFormat = custom.providerFormat;
        apiKey = custom.apiKey;
        apiBaseURL = custom.apiBaseURL;
    }

    if (!apiBaseURL) {
        throw new Error('API key or base URL is not set');
    }

    switch (resolvedFormat) {
        case OfficialProvider.OPENAI: {
            const provider = createOpenAICompatible({ apiKey, baseURL: apiBaseURL, name: 'OpenAI' });
            return provider(model.id);
        }
        case OfficialProvider.GOOGLE: {
            const provider = createGoogleGenerativeAI({ apiKey, baseURL: apiBaseURL || undefined });
            return provider(model.id);
        }
        case OfficialProvider.OPENROUTER: {
            const provider = createOpenRouter({ apiKey, baseURL: apiBaseURL || undefined });
            return provider(model.id);
        }
        default:
            throw new Error(`Unsupported provider: ${model.providerId}`);
    }
}