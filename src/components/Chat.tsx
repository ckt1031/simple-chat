"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGlobalStore } from "@/lib/stores/global";
import MessageItem from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { Message, useConversationStore } from "@/lib/stores/conversation";
import { useProviderStore } from "@/lib/stores/provider";
import completionsStreaming from "@/lib/api/completions-streaming";
import { useRouter } from "next/navigation";

interface ChatProps {
  chatId: string | null;
}

export function Chat({ chatId }: ChatProps) {
  const selectedModel = useGlobalStore((s) => s.general.selectedModel);
  const { hasEnabledProviders } = useProviderStore();
  const currentConversationId = useConversationStore(
    (s) => s.currentConversationId,
  );
  const isHydrated = useConversationStore((s) => s.isHydrated);
  const addMessage = useConversationStore((s) => s.addMessage);
  const appendToMessage = useConversationStore((s) => s.appendToMessage);
  const endReasoning = useConversationStore((s) => s.endReasoning);
  const appendToReasoning = useConversationStore((s) => s.appendToReasoning);
  const updateMessage = useConversationStore((s) => s.updateMessage);
  const setCurrentConversation = useConversationStore(
    (s) => s.setCurrentConversation,
  );
  const createNewConversation = useConversationStore(
    (s) => s.createNewConversation,
  );
  const removeLastAssistantMessage = useConversationStore(
    (s) => s.removeLastAssistantMessage,
  );
  const setConversationLoading = useConversationStore(
    (s) => s.setConversationLoading,
  );
  const stopConversation = useConversationStore((s) => s.stopConversation);

  // Track only a stable key of message ids for current conversation to avoid re-renders during token streaming
  const messageIdsKey = useConversationStore((s) => {
    const conv = s.conversations.find((c) => c.id === s.currentConversationId);
    return conv ? conv.messages.map((m) => m.id).join(",") : "";
  });
  const messageIds: string[] = useMemo(() => {
    return messageIdsKey ? messageIdsKey.split(",") : [];
  }, [messageIdsKey]);

  const isCurrentLoading = useConversationStore((s) => {
    const conv = s.conversations.find((c) => c.id === s.currentConversationId);
    return Boolean(conv?.isLoading);
  });
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle URL-based navigation
  useEffect(() => {
    // Wait for store to be hydrated before processing URL
    if (!isHydrated) return;

    if (chatId) {
      // Check if the chat ID exists
      const conversationExists = useConversationStore
        .getState()
        .conversations.find((conv) => conv.id === chatId);
      if (conversationExists) {
        setCurrentConversation(chatId);
      } else {
        // Invalid ID, redirect to new chat
        router.push("/");
      }
    } else {
      // No chat ID, clear current conversation (new chat state)
      setCurrentConversation(null);
    }
  }, [chatId, setCurrentConversation, router, isHydrated]);

  const hasConversation = currentConversationId != null;

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, []);

  useEffect(() => {
    // Only auto-scroll if we're near the bottom or if it's a new message
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const isNearBottom =
        messagesContainer.scrollTop + messagesContainer.clientHeight >=
        messagesContainer.scrollHeight - 100;
      if (isNearBottom || messageIds.length === 1) {
        scrollToBottom();
      }
    }
  }, [messageIds.length, scrollToBottom]);

  // Stable ref for send handler to avoid changing onRegenerate identity
  const handleSendMessageRef = useRef<
    | ((
        content: string,
        isRegenerating?: boolean,
        assets?: Message["assets"],
      ) => Promise<void>)
    | null
  >(null);

  const handleStopGeneration = useCallback(() => {
    if (currentConversationId) {
      stopConversation(currentConversationId);
    }
  }, [currentConversationId, stopConversation]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      isRegenerating = false,
      assets?: Message["assets"],
    ) => {
      let conversationId = currentConversationId;

      // If no current conversation, create one first
      if (!conversationId) {
        conversationId = createNewConversation();
        // Update URL with the new conversation ID
        window.history.pushState(null, "", `/?id=${conversationId}`);
      }

      // Add user message
      const userMessage = {
        timestamp: Date.now(),
        role: "user",
        content,
        assets,
      } as const;
      if (!isRegenerating) {
        addMessage(userMessage);
      }

      // Get enabled providers
      if (!hasEnabledProviders()) {
        addMessage({
          timestamp: Date.now(),
          role: "assistant",
          content: "",
          error: {
            message:
              "No AI providers configured. Please add a provider in settings.",
            kind: "provider",
          },
        });
        return;
      }

      // Ensure a model is selected
      const selected = selectedModel;
      if (!selected) {
        addMessage({
          timestamp: Date.now(),
          role: "assistant",
          content: "",
          error: {
            message:
              "No model selected. Please choose a model from the selector above.",
            kind: "provider",
          },
        });
        return;
      }

      // Build the message list to send (include the just-added user message)
      const convo = useConversationStore
        .getState()
        .conversations.find((c) => c.id === conversationId);
      const messagesForAI = [...(convo?.messages ?? []), { ...userMessage }];

      // Create abort controller for this request
      const abortController = new AbortController();

      try {
        setConversationLoading(conversationId, true, abortController);

        // Create a placeholder assistant message to stream into
        const assistantId = addMessage({
          timestamp: Date.now(),
          role: "assistant",
          content: "",
        });

        const stream = await completionsStreaming(
          selected,
          messagesForAI as Message[],
          abortController.signal,
        );

        for await (const delta of stream.fullStream) {
          if (delta.type === "text-delta") {
            endReasoning(assistantId);
            appendToMessage(assistantId, delta.text);
          } else if (delta.type === "reasoning-start") {
            updateMessage(assistantId, { reasoningStartTime: Date.now() });
          } else if (delta.type === "reasoning-delta") {
            appendToReasoning(assistantId, delta.text);
          } else if (delta.type === "reasoning-end") {
            endReasoning(assistantId);
          }
        }
      } catch (err: unknown) {
        // Check if it was aborted
        if (err instanceof Error && err.name === "AbortError") {
          // User stopped the generation; mark last assistant message as aborted
          const convo = useConversationStore
            .getState()
            .conversations.find((c) => c.id === conversationId);
          const last = convo?.messages[convo.messages.length - 1];
          if (last && last.role === "assistant") {
            updateMessage(last.id, { aborted: true });
          }
        } else {
          // Attach error metadata to the assistant message (or create one)
          const errorText = `Failed to generate a response: ${err instanceof Error ? err.message : "Unknown error"}`;
          const errorKind: "http" | "provider" | "unknown" =
            err instanceof Error && /provider|api key|model/i.test(err.message)
              ? "provider"
              : err && typeof (err as any).status === "number"
                ? "http"
                : "unknown";
          const errorCode = (err as any)?.status ?? (err as any)?.code;
          try {
            // Attempt to update the last assistant message if it was just created
            const convo = useConversationStore
              .getState()
              .conversations.find((c) => c.id === conversationId);
            const last = convo?.messages[convo.messages.length - 1];
            if (last && last.role === "assistant") {
              updateMessage(last.id, {
                error: {
                  message: errorText,
                  kind: errorKind,
                  code: errorCode,
                },
              });
            } else {
              addMessage({
                timestamp: Date.now(),
                role: "assistant",
                content: "",
                error: {
                  message: errorText,
                  kind: errorKind,
                  code: errorCode,
                },
              });
            }
          } catch {
            addMessage({
              timestamp: Date.now(),
              role: "assistant",
              content: "",
              error: {
                message: errorText,
                kind: errorKind,
                code: errorCode,
              },
            });
          }
        }
      } finally {
        setConversationLoading(conversationId, false);
      }
    },
    [
      addMessage,
      appendToMessage,
      appendToReasoning,
      createNewConversation,
      currentConversationId,
      selectedModel,
      hasEnabledProviders,
      router,
      setConversationLoading,
      updateMessage,
    ],
  );

  // Keep the latest handleSendMessage without changing the regenerate callback identity
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    // Access latest state directly to avoid re-creating this callback on stream updates
    const { conversations, currentConversationId, removeLastAssistantMessage } =
      useConversationStore.getState();

    const conv = conversations.find((c) => c.id === currentConversationId);
    const lastMessage = conv?.messages[conv.messages.length - 1];
    if (!lastMessage || lastMessage.id !== messageId) return;

    const userMessage = [...(conv?.messages ?? [])]
      .reverse()
      .find((m) => m.role === "user");
    if (!userMessage) return;

    removeLastAssistantMessage(messageId);
    await handleSendMessageRef.current?.(
      userMessage.content,
      true,
      userMessage.assets,
    );
  }, []);

  const onSend = useCallback(
    (content: string, assets?: Message["assets"]) =>
      handleSendMessage(content, false, assets),
    [handleSendMessage],
  );

  const onStop = handleStopGeneration;

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center dark:bg-neutral-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-white mx-auto"></div>
          <p className="text-neutral-600 dark:text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show new chat interface when no conversation is selected
  if (!hasConversation) {
    return (
      <div className="h-full flex flex-col dark:bg-neutral-900 min-h-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-4 overflow-x-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                What&apos;s on your mind?
              </h2>
              <p className="text-neutral-600 dark:text-white">
                Start a conversation to begin chatting with AI.
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-2 sm:px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <ChatInput
            onSend={onSend}
            onStop={onStop}
            disabled={false}
            isLoading={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col dark:bg-neutral-900 min-h-0 relative overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-4 overflow-x-hidden">
        {messageIds.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                What&apos;s on your mind?
              </h2>
              <p className="text-neutral-600 dark:text-white">
                Start a conversation to begin chatting with AI.
              </p>
            </div>
          </div>
        ) : (
          messageIds.map((messageId) => (
            <MessageItem
              key={messageId}
              conversationId={currentConversationId as string}
              messageId={messageId}
              onRegenerate={handleRegenerateMessage}
              isRegenerating={false}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 py-3 px-2 sm:px-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <ChatInput
          onSend={onSend}
          onStop={onStop}
          disabled={isCurrentLoading}
          isLoading={isCurrentLoading}
        />
      </div>
    </div>
  );
}
