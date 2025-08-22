import { z } from "zod/mini";

const GoogleModelItemSchema = z.object({
  name: z.string(),
  version: z.string(),
  displayName: z.string(),
  description: z.optional(z.string()),
  inputTokenLimit: z.number(),
  outputTokenLimit: z.number(),
  supportedGenerationMethods: z.array(z.string()),
  thinking: z.optional(z.boolean()),
});

export const GoogleModelListSchema = z.object({
  models: z.array(GoogleModelItemSchema),
  nextPageToken: z.optional(z.string()),
});
