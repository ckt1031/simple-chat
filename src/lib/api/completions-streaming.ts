import { streamText, smoothStream } from 'ai';
import { ModelWithProvider } from '../stores/provider';
import { Message } from '../stores/conversation';
import { getASDK } from './sdk';

export default async function completionsStreaming(model: ModelWithProvider, messages: Message[]) {
    const transform = smoothStream();

    const { textStream } = streamText({
        model: getASDK(model),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        experimental_transform: transform,
    });

    return textStream;
}