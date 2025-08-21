// {
//     "object": "list",
//     "data": [
//         {
//             "id": "gpt-5-nano",
//             "object": "model",
//             "created": 1686935002,
//             "owned_by": "openai"
//         },

import { z } from "zod/mini";

export const OpenAIListModelsItemSchema = z.object({
  id: z.string(),
  created: z.number(),
  owned_by: z.string(),
  object: z.literal("model"),
});

export const OpenAIListModelsSchema = z.object({
  object: z.literal("list"),
  data: z.array(OpenAIListModelsItemSchema),
});

// OpenRouter
// https://openrouter.ai/docs/api-reference/list-available-models
export const OpenRouterListModelsSchema = z.object({
  ...OpenAIListModelsItemSchema.shape,
  name: z.string(),
});

export const OpenRouterListModelsResponseSchema = z.object({
  models: z.array(OpenRouterListModelsSchema),
});
