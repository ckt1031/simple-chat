'use client';

import { Message } from '@/lib/stores/conversation';
import { cn, formatDate } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[80%] space-x-3",
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}>
        {/* Message Content */}
        <div className={cn(
          "flex flex-col space-y-1",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "px-4 py-2 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white"
              : "bg-neutral-800 text-neutral-100 dark:bg-neutral-700 dark:text-white"
          )}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 px-2">
            {formatDate(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
