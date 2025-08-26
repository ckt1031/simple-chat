"use client";

import MessageItem from "./MessageItem";

interface ChatTranscriptProps {
  conversationId: string;
  messageIds: string[];
  onRegenerate: (messageId: string) => Promise<void> | void;
}

export default function ChatTranscript({
  conversationId,
  messageIds,
  onRegenerate,
}: ChatTranscriptProps) {
  return (
    <>
      {messageIds.map((messageId) => (
        <MessageItem
          key={messageId}
          conversationId={conversationId}
          messageId={messageId}
          onRegenerate={onRegenerate}
          isRegenerating={false}
        />
      ))}
    </>
  );
}
