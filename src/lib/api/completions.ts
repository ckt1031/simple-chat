import { generateText } from "ai";
import { ModelWithProvider } from "../stores/provider";
import { getASDK } from "./sdk";
import { Message } from '../stores/conversation';

export default async function completions(model: ModelWithProvider, messages: Message[]) {
    const { text } = await generateText({
        model: getASDK(model),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return text;
}