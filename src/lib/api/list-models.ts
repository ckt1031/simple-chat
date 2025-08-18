import openai from 'openai';
import { Model, OfficialProvider, OfficialProviderState } from '../stores/provider';
import { GoogleGenAI } from '@google/genai';

export default async function listModels(format: OfficialProvider, provider: OfficialProviderState): Promise<Model[]> {
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

async function listGoogleGenAIModels(provider: OfficialProviderState) {
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
        };
    });
}

async function listOpenRouterModels(provider: OfficialProviderState) {
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
    }));
}

async function listModelsOpenAI(provider: OfficialProviderState) {
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
    }));
}