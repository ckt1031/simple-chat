import { z } from "zod/mini";

const AnthropicModelItemSchema = z.object({
  type: z.literal("model"),
  id: z.string(),
  display_name: z.string(),
  created_at: z.string(),
});

export const AnthropicModelListSchema = z.object({
  data: z.array(AnthropicModelItemSchema),
});
