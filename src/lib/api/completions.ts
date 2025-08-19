import { FilePart, generateText, ImagePart, ModelMessage, TextPart } from "ai";
import { ModelWithProvider } from "../stores/provider";
import { getASDK } from "./sdk";
import { Message } from '../stores/conversation';
import { getAssetDataURL } from "../assets";

export default async function completions(model: ModelWithProvider, messages: Message[]) {
    const preparedMessages = await Promise.all(
        messages.map(async (m) => {
            if (m.assets && m.assets.length > 0) {
                const parts: Array<TextPart | ImagePart | FilePart> = [];
                const text = (m.content || '').trim();
                if (text.length > 0) {
                    parts.push({ type: 'text', text });
                }
                for (const a of m.assets) {
                    if (a.type === 'image') {
                        const dataUrl = await getAssetDataURL(a.id);
                        if (dataUrl) {
                            parts.push({ type: 'image', image: dataUrl });
                        }
                    }
                }
                return { role: m.role, content: parts } as ModelMessage;
            }
            return { role: m.role, content: m.content } satisfies ModelMessage;
        })
    );

    const { text } = await generateText({
        model: getASDK(model),
        messages: preparedMessages,
    });

    return text;
}