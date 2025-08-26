"use client";

import { memo, useState } from "react";
import { Message, useConversationStore } from "@/lib/stores/conversation";
import { usePreferencesStore } from "@/lib/stores/perferences";
import { useProviderStore } from "@/lib/stores/provider";
import { cn, formatDate } from "@/lib/utils";
import { MemoizedMarkdown } from "../MemoizedMarkdown";
import ChatActionButtons from "./ChatActionButtons";
import { useEffect } from "react";
import {
  getAssetObjectURL,
  revokeObjectURL,
} from "@/lib/stores/utils/asset-db";
import { Loader2 } from "lucide-react";
import ChatEdit from "./ChatEdit";
import { getErrorDisplayInfo, ChatError } from "@/lib/utils/error-handling";
import { Alert } from "../ui";
import Reasoning from "./Reasoning";

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [fileLinks, setFileLinks] = useState<
    { id: string; name?: string; url: string }[]
  >([]);
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
  const defaultModel = usePreferencesStore((s) => s.defaultModel);
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

  // Determine which model to show (only if different from default)
  const messageModel = message.model;
  const shouldShowModel = !isUser;
  const modelDisplayName = shouldShowModel
    ? getModelDisplayName(messageModel)
    : null;

  // Helper function to convert message error to ChatError type
  const getChatError = (error: Message["error"]): ChatError | null => {
    if (!error) return null;

    return {
      message: error.message,
      code: error.code,
    };
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!message.assets || message.assets.length === 0) {
        setImageUrls([]);
        return;
      }
      const urls: string[] = [];
      const files: { id: string; name?: string; url: string }[] = [];
      for (const a of message.assets) {
        const url = await getAssetObjectURL(a.id);
        if (!url) continue;
        if (a.type === "image") urls.push(url);
        else files.push({ id: a.id, name: a.name, url });
      }
      if (!cancelled) {
        setImageUrls(urls);
        setFileLinks(files);
      }
    };
    load();
    return () => {
      cancelled = true;
      imageUrls.forEach((u) => revokeObjectURL(u));
      fileLinks.forEach((f) => revokeObjectURL(f.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id]);

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
                  {fileLinks.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {fileLinks.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 text-xs text-neutral-800 dark:text-neutral-200 hover:underline"
                          title={f.name || "File"}
                        >
                          <span className="truncate">{f.name || "File"}</span>
                        </a>
                      ))}
                    </div>
                  )}
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
          <div className="h-5">
            <ChatActionButtons
              conversationId={conversationId}
              handleRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
              messageId={message.id}
              onEdit={isUser ? () => setIsEditing(true) : undefined}
              isGenerating={isGenerating}
            />
          </div>
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
