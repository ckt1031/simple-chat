import {
  ModelWithProvider,
  OfficialProvider,
  useProviderStore,
} from "../stores/provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const defaultProviderConfig = {
  [OfficialProvider.OPENAI]: {
    apiBaseURL: "https://api.openai.com/v1",
  },
  [OfficialProvider.GOOGLE]: {
    apiBaseURL: "https://generativelanguage.googleapis.com/v1beta",
  },
  [OfficialProvider.OPENROUTER]: {
    apiBaseURL: "https://openrouter.ai/api/v1",
  },
};

export function getASDK(model: ModelWithProvider) {
  const { getProvider } = useProviderStore.getState();

  // Resolve the actual provider format and credentials
  let resolvedFormat: OfficialProvider | null = null;
  let apiKey = "";
  let apiBaseURL = "";

  const provider = getProvider(model.providerId);
  if (!provider) {
    throw new Error(`Provider not found: ${model.providerId}`);
  }

  if (provider.type === "official") {
    resolvedFormat = provider.provider;
    apiKey = provider.apiKey;
    apiBaseURL =
      provider.apiBaseURL ||
      defaultProviderConfig[provider.provider].apiBaseURL;
  } else if (provider.type === "custom") {
    resolvedFormat = provider.providerFormat;
    apiKey = provider.apiKey;
    apiBaseURL =
      provider.apiBaseURL ||
      defaultProviderConfig[provider.providerFormat].apiBaseURL;
  }

  switch (resolvedFormat) {
    case OfficialProvider.OPENAI: {
      const provider = createOpenAICompatible({
        apiKey,
        baseURL: apiBaseURL,
        name: "OpenAI",
      });
      return provider(model.id);
    }
    case OfficialProvider.GOOGLE: {
      const provider = createGoogleGenerativeAI({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    case OfficialProvider.OPENROUTER: {
      const provider = createOpenRouter({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    default:
      throw new Error(`Unsupported provider: ${model.providerId}`);
  }
}
