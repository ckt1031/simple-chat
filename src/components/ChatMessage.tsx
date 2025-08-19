'use client';

import { useState } from 'react';
import { Message } from '@/lib/stores/conversation';
import { cn, formatDate } from '@/lib/utils';
import { MemoizedMarkdown } from './MemoizedMarkdown';
import ChatActionButtons from './ChatActionButtons';
import { useEffect } from 'react';
import { getAssetObjectURL, revokeObjectURL } from '@/lib/assets';

interface ChatMessageProps {
  message: Message;
  onRegenerate: (messageId: string) => void;
  isRegenerating?: boolean;
  conversationId: string;
}

export function ChatMessage({ message, onRegenerate, isRegenerating = false, conversationId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!message.assets || message.assets.length === 0) {
        setImageUrls([]);
        return;
      }
      const urls: string[] = [];
      for (const a of message.assets) {
        if (a.type === 'image') {
          const url = await getAssetObjectURL(a.id);
          if (url) urls.push(url);
        }
      }
      if (!cancelled) setImageUrls(urls);
    };
    load();
    return () => {
      cancelled = true;
      imageUrls.forEach((u) => revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleRegenerate = () => {
      onRegenerate(message.id);
  };

  return (
    <div className={cn(
      "flex w-full max-w-3xl mx-auto",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex space-x-3",
        isUser ? "max-w-[80%] flex-row-reverse space-x-reverse" : "flex-row"
      )}>
        {/* Message Content */}
        <div className={cn(
          "flex flex-col space-y-1",
          isUser ? "items-end" : "items-start"
        )}>
          <div
            className={cn(
              "py-2 rounded-2xl text-sm leading-relaxed relative group",
              isUser ? "px-4 bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white" : "px-2"
            )}
          >
            {imageUrls.length > 0 && (
              <div className={cn("mb-2 grid gap-2", imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2") }>
                {imageUrls.map((src, idx) => (
                  <img key={idx} src={src} alt="attachment" className="rounded-md max-h-32 object-contain bg-neutral-100 dark:bg-neutral-800" />
                ))}
              </div>
            )}
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="prose prose-neutral dark:prose-invert space-y-2 max-w-3xl prose-code:whitespace-pre-wrap">
                <MemoizedMarkdown
                  key={message.id}
                  id={message.id}
                  content={message.content}
                />
              </div>
            )}
          </div>
          {/* Timestamp */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 px-2">
            {formatDate(message.timestamp)}
          </div>

          {/* Action Buttons - Show below messages for both user and assistant */}
          <div className="h-5">
            <ChatActionButtons
              handleCopy={handleCopy}
              copied={copied}
              conversationId={conversationId}
              handleRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
              messageId={message.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
