import {
  ModelWithProvider,
  OfficialProvider,
  useProviderStore,
} from "../stores/provider";

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
  [OfficialProvider.GROQ]: {
    apiBaseURL: "https://api.groq.com/openai/v1",
  },
  [OfficialProvider.MISTRAL]: {
    apiBaseURL: "https://api.mistral.ai/v1",
  },
  [OfficialProvider.DEEPSEEK]: {
    apiBaseURL: "https://api.deepseek.com/v1",
  },
};

export async function getASDK(model: ModelWithProvider) {
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
      const { createOpenAICompatible } = await import(
        "@ai-sdk/openai-compatible"
      );
      const provider = createOpenAICompatible({
        apiKey,
        baseURL: apiBaseURL,
        name: "OpenAI",
      });
      return provider(model.id);
    }
    case OfficialProvider.GOOGLE: {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const provider = createGoogleGenerativeAI({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    case OfficialProvider.OPENROUTER: {
      const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
      const provider = createOpenRouter({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    case OfficialProvider.GROQ: {
      const { createGroq } = await import("@ai-sdk/groq");
      const provider = createGroq({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    case OfficialProvider.MISTRAL: {
      const { createMistral } = await import("@ai-sdk/mistral");
      const provider = createMistral({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    case OfficialProvider.DEEPSEEK: {
      const { createDeepSeek } = await import("@ai-sdk/deepseek");
      const provider = createDeepSeek({
        apiKey,
        baseURL: apiBaseURL || undefined,
      });
      return provider(model.id);
    }
    default:
      throw new Error(`Unsupported provider: ${model.providerId}`);
  }
}
