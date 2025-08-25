"use client";

import { memo } from "react";
import ChatMessage from "./ChatMessage";
import { useConversationStore } from "@/lib/stores/conversation";

interface MessageItemProps {
  conversationId: string;
  messageId: string;
  onRegenerate: (messageId: string) => void;
  isRegenerating?: boolean;
}

function MessageItem({
  conversationId,
  messageId,
  onRegenerate,
  isRegenerating = false,
}: MessageItemProps) {
  // Select only the single message object by id to minimize re-renders
  const message = useConversationStore((s) =>
    s.currentConversationId === conversationId
      ? s.currentMessages.find((m) => m.id === messageId)
      : undefined,
  );

  // If message no longer exists (deleted), render nothing
  if (!message) return null;

  return (
    <ChatMessage
      conversationId={conversationId}
      message={message}
      onRegenerate={onRegenerate}
      isRegenerating={isRegenerating}
    />
  );
}

export default memo(MessageItem);
