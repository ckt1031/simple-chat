'use client';

import { Message } from '@/lib/stores/conversation';
import { cn, formatDate } from '@/lib/utils';
import { MemoizedMarkdown } from './MemoizedMarkdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
          <div className={cn(
            "py-2 rounded-2xl text-sm leading-relaxed",
            isUser ? "px-4 bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white" : "px-2"
          )}>
            {
              isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="prose prose-neutral dark:prose-invert space-y-2">
                  <MemoizedMarkdown
                    key={message.id}
                    id={message.id}
                    content={message.content}
                  />
                </div>
              )
            }
          </div>

          {/* Timestamp */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 px-2">
            {formatDate(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
