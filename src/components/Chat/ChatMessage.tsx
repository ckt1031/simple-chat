"use client";

import { memo, useState } from "react";
import { Message, useConversationStore } from "@/lib/stores/conversation";
import { useProviderStore } from "@/lib/stores/provider";
import { cn, formatDate } from "@/lib/utils";
import { MemoizedMarkdown } from "../MemoizedMarkdown";
import ChatActionButtons from "./ChatActionButtons";
import { Loader2 } from "lucide-react";
import ChatEdit from "./ChatEdit";
import ChatAttachmentEditor from "./ChatAttachmentEditor";
import { getErrorDisplayInfo, ChatError } from "@/lib/utils/error-handling";
import { Alert } from "../ui";
import Reasoning from "./Reasoning";
import ChatAttachmentPreview from "./ChatAttachmentPreview";

interface ChatMessageProps {
  message: Message;
  onRegenerate: (messageId: string) => void;
  isRegenerating?: boolean;
  conversationId: string;
}

function ChatMessage({
  message,
  onRegenerate,
  isRegenerating = false,
  conversationId,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const updateMessage = useConversationStore((s) => s.updateMessage);

  // Check if conversation is loading and this is the last assistant message with no content yet
  const isConversationLoading = useConversationStore((s) =>
    Boolean(s.loadingById[conversationId]),
  );
  const isLastMessage = useConversationStore((s) => s.isLastMessage);
  const isGenerating =
    !isUser &&
    isConversationLoading &&
    isLastMessage(message.id) &&
    !message.content;

  // Get model information for display
  const providers = useProviderStore((s) => s.providers);

  // Helper function to get model display name
  const getModelDisplayName = (modelId: string | undefined) => {
    if (!modelId) return null;

    // Parse the model ID (format: "providerId:modelId")
    const [providerId, modelIdentifier] = modelId.split(":");
    if (providerId && modelIdentifier) {
      const provider = providers[providerId];
      if (provider) {
        const model = provider.models.find((m) => m.id === modelIdentifier);
        if (model) {
          return model.name && model.name.trim().length > 0
            ? model.name
            : model.id;
        }
      }
      // Fallback to just the model identifier
      return modelIdentifier;
    }
    return null;
  };

  const modelDisplayName = !isUser ? getModelDisplayName(message.model) : null;

  // Helper function to convert message error to ChatError type
  const getChatError = (error: Message["error"]): ChatError | null => {
    if (!error) return null;

    return {
      message: error.message,
      code: error.code,
    };
  };

  const handleRegenerate = () => {
    if (!isUser) onRegenerate(message.id);
  };

  const saveEdit = (value: string, assets?: Message["assets"]) => {
    const updates: Partial<Message> = {
      content: value,
      timestamp: Date.now(),
    };

    if (assets !== undefined) {
      updates.assets = assets;
    }

    updateMessage(message.id, updates);
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
            {/* Enhanced error display with HTTP details */}
            {!isUser && message.error && (
              <div className="mb-2">
                {(() => {
                  const chatError = getChatError(message.error);
                  if (!chatError) return null;

                  const errorInfo = getErrorDisplayInfo(chatError);

                  return (
                    <Alert variant="error" title={errorInfo.title} compact>
                      <div className="space-y-1">
                        <div>{errorInfo.message}</div>
                        {errorInfo.code != null && (
                          <div className="text-xs opacity-80 font-mono">
                            Code: {String(errorInfo.code)}
                          </div>
                        )}
                      </div>
                    </Alert>
                  );
                })()}
              </div>
            )}
            {!isEditing && message.assets && message.assets.length > 0 && (
              <div className={cn("mb-2 flex flex-wrap gap-2 justify-end")}>
                {message.assets.map((asset) => (
                  <ChatAttachmentPreview key={asset.id} asset={asset} />
                ))}
              </div>
            )}
            {isUser ? (
              isEditing ? (
                message.assets && message.assets.length > 0 ? (
                  <ChatAttachmentEditor
                    initialContent={message.content}
                    initialAssets={message.assets}
                    onCancel={() => setIsEditing(false)}
                    onSave={saveEdit}
                  />
                ) : (
                  <ChatEdit
                    initialValue={message.content}
                    onCancel={() => setIsEditing(false)}
                    onSave={(value) => saveEdit(value)}
                  />
                )
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
                {message.reasoning && (
                  <Reasoning
                    reasoning={message.reasoning}
                    reasoningStartTime={message.reasoningStartTime}
                    reasoningEndTime={message.reasoningEndTime}
                  />
                )}
                {/* Thinking/Generating indicator */}
                {!isUser && isGenerating && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
                {!message.error && (
                  <MemoizedMarkdown
                    key={message.id}
                    id={message.id}
                    content={message.content}
                  />
                )}
              </div>
            )}
          </div>
          {/* Timestamp */}
          <div className="text-xs text-neutral-500 dark:text-neutral-400 px-2">
            {formatDate(message.timestamp)}
            {modelDisplayName && (
              <span className="ml-1 text-neutral-400 dark:text-neutral-500">
                [{modelDisplayName}]
              </span>
            )}
          </div>

          {/* Action Buttons - Show below messages for both user and assistant */}
          <ChatActionButtons
            conversationId={conversationId}
            handleRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
            messageId={message.id}
            onEdit={isUser ? () => setIsEditing(true) : undefined}
            isGenerating={isGenerating}
          />
          {/* Abort notice below the message */}
          {!isUser && message.aborted && (
            <div className="px-2 w-full">
              <Alert variant="warning" title="Generation stopped" compact>
                The response was aborted by the user.
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ChatMessage);
