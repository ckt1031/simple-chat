import {
  FilePart,
  ImagePart,
  ModelMessage,
  smoothStream,
  streamText,
  TextPart,
} from "ai";
import { ModelWithProvider } from "../stores/provider";
import { Message } from "../stores/conversation";
import { getASDK } from "./sdk";
import { getAssetDataURL } from "../assets";

export default async function completionsStreaming(
  model: ModelWithProvider,
  messages: Message[],
  abortSignal?: AbortSignal,
) {
  const transform = smoothStream();

  const preparedMessages = await Promise.all(
    messages.map(async (m) => {
      if (m.assets && m.assets.length > 0) {
        const parts: Array<TextPart | ImagePart | FilePart> = [];
        const text = (m.content || "").trim();
        if (text.length > 0) {
          parts.push({ type: "text", text });
        }
        for (const a of m.assets) {
          if (a.type === "image") {
            const dataUrl = await getAssetDataURL(a.id);
            if (dataUrl) {
              parts.push({ type: "image", image: dataUrl });
            }
          }
        }
        return { role: m.role, content: parts } as ModelMessage;
      }
      return { role: m.role, content: m.content } satisfies ModelMessage;
    }),
  );

  return streamText({
    model: await getASDK(model),
    messages: preparedMessages,
    abortSignal,
    experimental_transform: transform,
    onError: (err) => {
      // Surface more explicit errors (e.g., HTTP) to the caller via thrown error
      // The caller will attach error metadata to the assistant message
      // We simply rethrow to keep existing control flow
      throw err;
    },
    providerOptions: {
      google: {
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE",
          },
        ],
        ...(model.thinking
          ? { thinkingConfig: { includeThoughts: true } }
          : {}),
      },
    },
  });
}
