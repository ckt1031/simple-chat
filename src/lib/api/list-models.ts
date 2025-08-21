import { Model, OfficialProvider, ProviderState } from "../stores/provider";
import { defaultProviderConfig } from "./sdk";

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
  const { GoogleGenAI } = await import("@google/genai");

  const client = new GoogleGenAI({
    apiKey: provider.apiKey,
    apiVersion: '', // Provided in baseURL
    httpOptions: {
      baseUrl: provider.apiBaseURL,
    },
  });

  const pager = await client.models.list({ config: { pageSize: 25 } });
  
  let page = pager.page;

  const models: Model[] = [];

  while (true) {
    for (const model of page) {
      if (!model.name) {
        throw new Error("Missing model name");
      }

      // Check if the model is text based
      if (!model.supportedActions?.includes("generateContent")) {
        continue;
      }

      models.push({
        id: model.name,
        name: model.displayName || model.name,
        enabled: provider.models.find((m) => m.id === model.name)?.enabled ?? false,
        source: "fetch" as const,
      });
    }
    
    // If there is no next page, break
    if (!pager.hasNextPage()) {
      break;
    }

    // Get the next page
    page = await pager.nextPage();
  }

  return models;
}

async function listOpenRouterModels(provider: ProviderState) {
  const { OpenAI } = await import("openai");

  const client = new OpenAI({
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
  const { OpenAI } = await import("openai");

  const client = new OpenAI({
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
