import openai from "openai";
import { Model, OfficialProvider, ProviderState } from "../stores/provider";
import type { Model as GoogleGenAIModel } from "@google/genai";
import { defaultProviderConfig } from "./sdk";
import { GoogleModelListSchema } from "./schema/google";

export default async function listModels(
  format: OfficialProvider,
  provider: ProviderState,
): Promise<Model[]> {
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
  const getGoogleResponse = async (pageToken?: string) => {
    const url = new URL(`${provider.apiBaseURL}/models`);

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        "x-goog-api-key": provider.apiKey,
      },
    });

    const data = await response.json();

    return GoogleModelListSchema.parse(data);
  };

  let pageToken: string | undefined;
  let models: (GoogleGenAIModel & Model)[] = [];
  let hasMore = true;

  while (hasMore) {
    const response = await getGoogleResponse(pageToken);
    const textModels = response.models.filter((model) =>
      model.supportedGenerationMethods.includes("generateContent"),
    );
    models.push(
      ...textModels.map((model) => ({
        id: model.name,
        name: model.displayName,
        enabled:
          provider.models.find((m) => m.id === model.name)?.enabled ?? false,
        source: "fetch" as const,
      })),
    );
    pageToken = response.nextPageToken;
    hasMore = response.nextPageToken !== undefined;
  }

  return models;
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
    name: "name" in model ? (model.name as string) : model.id,
    enabled: provider.models.find((m) => m.id === model.id)?.enabled ?? false,
    source: "fetch" as const,
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
    source: "fetch" as const,
  }));
}
