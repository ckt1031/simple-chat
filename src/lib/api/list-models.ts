import openai from 'openai';
import { Model, OfficialProvider, ProviderState } from '../stores/provider';
import { GoogleGenAI } from '@google/genai';
import { defaultProviderConfig } from './sdk';

export default async function listModels(format: OfficialProvider, provider: ProviderState): Promise<Model[]> {
    if (!provider.apiBaseURL || provider.apiBaseURL.length === 0) {
        provider.apiBaseURL = defaultProviderConfig[format].apiBaseURL;
    }

    switch (format) {
        case OfficialProvider.OPENAI:
            return await listModelsOpenAI(provider);
        case OfficialProvider.OPENROUTER:
            return await listOpenRouterModels(provider);
        case OfficialProvider.GOOGLE:
            return await listGoogleGenAIModels(provider);
        default:
            throw new Error(`Unsupported provider: ${format}`);
    }
}

async function listGoogleGenAIModels(provider: ProviderState) {
    const client = new GoogleGenAI({
        apiKey: provider.apiKey,
        httpOptions: {
            baseUrl: provider.apiBaseURL,
        },
    });

    const response = await client.models.list();

    // Handle pager
    return response.page.map((model) => {
        if (!model.name || !model.displayName) {
            throw new Error('Missing model name')
        }
        
        return {
            id: model.name,
            name: model.displayName,
            enabled: provider.models.find((m) => m.id === model.name)?.enabled ?? false,
            source: 'fetch' as const,
        };
    });
}

async function listOpenRouterModels(provider: ProviderState) {
    const client = new openai({
        apiKey: provider.apiKey,
        baseURL: provider.apiBaseURL,
        dangerouslyAllowBrowser: true,
    });

    const response = await client.models.list();

    return response.data.map((model) => ({
        id: model.id,
        // 'name' present in OpenRouter models
        name: 'name' in model ? (model.name as string) : model.id,
        enabled: provider.models.find((m) => m.id === model.id)?.enabled ?? false,
        source: 'fetch' as const,
    }));
}

async function listModelsOpenAI(provider: ProviderState) {
    const client = new openai({
        apiKey: provider.apiKey,
        baseURL: provider.apiBaseURL,
        dangerouslyAllowBrowser: true,
    });

    const response = await client.models.list();

    return response.data.map((model) => ({
        id: model.id,
        name: model.id,
        enabled: provider.models.find((m) => m.id === model.id)?.enabled ?? false,
        source: 'fetch' as const,
    }));
}