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
// (No direct asset imports here; handled by attachment utilities)
import { attachmentToParts } from "@/lib/attachments";

export async function completionsStreaming(
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
        parts.push(
          ...((await attachmentToParts(
            m.assets.map((a) => ({ id: a.id, type: a.type, name: a.name })),
          )) as Array<TextPart | ImagePart | FilePart>),
        );
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
      // Just re-throw the original error - normalizeChatError will handle it
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
