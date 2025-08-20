"use client";

import { memo, useState } from "react";
import { Message, useConversationStore } from "@/lib/stores/conversation";
import { cn, formatDate } from "@/lib/utils";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import ChatActionButtons from "./ChatActionButtons";
import { useEffect } from "react";
import { getAssetObjectURL, revokeObjectURL } from "@/lib/assets";
import ChatEdit from "./ChatEdit";

interface ChatMessageProps {
  message: Message;
  onRegenerate: (messageId: string) => void;
  isRegenerating?: boolean;
  conversationId: string;
}

function ChatMessageCmp({
  message,
  onRegenerate,
  isRegenerating = false,
  conversationId,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const updateMessage = useConversationStore((s) => s.updateMessage);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!message.assets || message.assets.length === 0) {
        setImageUrls([]);
        return;
      }
      const urls: string[] = [];
      for (const a of message.assets) {
        if (a.type === "image") {
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
      console.error("Failed to copy message:", err);
    }
  };

  const handleRegenerate = () => {
    if (!isUser) onRegenerate(message.id);
  };

  const saveEdit = (value: string) => {
    updateMessage(message.id, { content: value, timestamp: Date.now() });
    setIsEditing(false);
  };

  const isLongUserMessage =
    isUser &&
    (message.content.length > 500 ||
      (message.content.match(/\n/g)?.length || 0) > 8);
  const displayUserContent =
    !isLongUserMessage || expanded
      ? message.content
      : `${message.content.slice(0, 500)}…`;

  return (
    <div
      className={cn(
        "flex w-full max-w-4xl mx-auto overflow-x-hidden",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex space-x-3 w-full",
          isUser
            ? "max-w-[85%] sm:max-w-[80%] flex-row-reverse space-x-reverse"
            : "flex-row",
        )}
      >
        {/* Message Content */}
        <div
          className={cn(
            "flex flex-col space-y-1 min-w-0 flex-1",
            isUser ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "py-2 rounded-2xl text-sm leading-relaxed relative group break-words max-w-full",
              isUser
                ? "px-3 sm:px-4 bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white"
                : "px-2",
              isEditing && isUser && "w-full",
            )}
          >
            {imageUrls.length > 0 && (
              <div
                className={cn(
                  "mb-2 grid gap-2",
                  imageUrls.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2",
                )}
              >
                {imageUrls.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="attachment"
                    className="rounded-md max-h-32 object-contain bg-neutral-100 dark:bg-neutral-800 w-full"
                  />
                ))}
              </div>
            )}
            {isUser ? (
              isEditing ? (
                <ChatEdit
                  initialValue={message.content}
                  onCancel={() => setIsEditing(false)}
                  onSave={saveEdit}
                />
              ) : (
                <div
                  className="whitespace-pre-wrap select-text break-words overflow-hidden"
                  onClick={() => {
                    if (isLongUserMessage && !expanded) setExpanded(true);
                  }}
                >
                  {displayUserContent}
                  {!expanded && isLongUserMessage && (
                    <span className="ml-1 text-neutral-500 dark:text-neutral-400 underline">
                      Show more
                    </span>
                  )}
                </div>
              )
            ) : (
              <div className="break-words prose prose-sm md:prose-base lg:prose-md prose-neutral dark:prose-invert space-y-2 max-w-full overflow-hidden">
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
              onEdit={isUser ? () => setIsEditing(true) : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = memo(ChatMessageCmp, (prev, next) => {
  return (
    prev.conversationId === next.conversationId &&
    prev.isRegenerating === next.isRegenerating &&
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.timestamp === next.message.timestamp &&
    prev.message.role === next.message.role
  );
});
