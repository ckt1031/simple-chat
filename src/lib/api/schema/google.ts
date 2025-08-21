import { z } from "zod/mini";

const GoogleModelItemSchema = z.object({
  name: z.string(),
  version: z.string(),
  displayName: z.string(),
  description: z.string(),
  inputTokenLimit: z.number(),
  outputTokenLimit: z.number(),
  supportedGenerationMethods: z.array(z.string()),
});

export const GoogleModelListSchema = z.object({
  models: z.array(GoogleModelItemSchema),
  nextPageToken: z.optional(z.string()),
});
