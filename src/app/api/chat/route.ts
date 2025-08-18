import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(request: Request) {
  try {
    const { messages, provider } = await request.json();

    if (!provider || !provider.apiKey) {
      return new Response('Provider configuration is required', { status: 400 });
    }

    // Set environment variables for the AI SDK
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    const originalGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;

    let result;
    try {
      switch (provider.type) {
        case 'openai':
          process.env.OPENAI_API_KEY = provider.apiKey;
          if (provider.apiBaseUrl) {
            process.env.OPENAI_BASE_URL = provider.apiBaseUrl;
          }
          result = await generateText({
            model: openai(provider.model),
            messages: messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          });
          break;
        case 'google':
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = provider.apiKey;
          if (provider.apiBaseUrl) {
            process.env.GOOGLE_GENERATIVE_AI_BASE_URL = provider.apiBaseUrl;
          }
          result = await generateText({
            model: google(provider.model),
            messages: messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          });
          break;
        case 'anthropic':
          process.env.ANTHROPIC_API_KEY = provider.apiKey;
          if (provider.apiBaseUrl) {
            process.env.ANTHROPIC_BASE_URL = provider.apiBaseUrl;
          }
          result = await generateText({
            model: anthropic(provider.model),
            messages: messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
            })),
          });
          break;
        default:
          return new Response('Unsupported provider type', { status: 400 });
      }
    } finally {
      // Restore original environment variables
      if (originalOpenAIKey !== undefined) {
        process.env.OPENAI_API_KEY = originalOpenAIKey;
      }
      if (originalGoogleKey !== undefined) {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleKey;
      }
      if (originalAnthropicKey !== undefined) {
        process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
      }
    }

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
