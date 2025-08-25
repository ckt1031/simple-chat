"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePreferencesStore } from "@/lib/stores/perferences";
import MessageItem from "./MessageItem";
import ChatInput from "./ChatInput";
import { Message, useConversationStore } from "@/lib/stores/conversation";
import { useProviderStore, ModelWithProvider } from "@/lib/stores/provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import {
  handleStreamingError,
  createNoProvidersError,
  createNoModelError,
} from "@/lib/utils/chat-error-handling";

export function Chat() {
  const chatId = useSearchParams().get("id");

  // Simplified and grouped store hooks for clarity
  const selectedModel = usePreferencesStore((s) => s.selectedModel);
  const { hasEnabledProviders } = useProviderStore();

  const {
    currentConversationId,
    isHydrated,
    hydrateFromDB,
    addMessage,
    appendToMessage,
    endReasoning,
    appendToReasoning,
    updateMessage,
    setCurrentConversation,
    createNewConversation,
    setConversationLoading,
    stopConversation,
    openConversation,
    persistCurrentConversation,
  } = useConversationStore(
    useShallow((s) => ({
      currentConversationId: s.currentConversationId,
      isHydrated: s.isHydrated,
      hydrateFromDB: s.hydrateFromDB,
      addMessage: s.addMessage,
      appendToMessage: s.appendToMessage,
      endReasoning: s.endReasoning,
      appendToReasoning: s.appendToReasoning,
      updateMessage: s.updateMessage,
      setCurrentConversation: s.setCurrentConversation,
      createNewConversation: s.createNewConversation,
      setConversationLoading: s.setConversationLoading,
      stopConversation: s.stopConversation,
      openConversation: s.openConversation,
      persistCurrentConversation: s.persistCurrentConversation,
    })),
  );

  const defaultModel = usePreferencesStore((s) => s.defaultModel);
  const { getAllProviders } = useProviderStore();
  const providers = getAllProviders();

  // Helper function to get the model for a request
  const getModelForRequest = (
    currentSelectedModel: string | null,
    tempModelSelection: string | null,
    defaultModel: ModelWithProvider | null,
    selectedModel: ModelWithProvider | null,
    providers: ReturnType<typeof getAllProviders>,
  ): ModelWithProvider | null => {
    if (currentSelectedModel) {
      const [providerId, modelId] = currentSelectedModel.split(":");
      const provider = providers.find(
        (p) => (p.type === "custom" ? p.id : p.provider) === providerId,
      );
      if (provider) {
        const model = provider.models.find((m) => m.id === modelId);
        if (model) return { ...model, providerId };
      }
    }

    if (tempModelSelection) {
      const [providerId, modelId] = tempModelSelection.split(":");
      const provider = providers.find(
        (p) => (p.type === "custom" ? p.id : p.provider) === providerId,
      );
      if (provider) {
        const model = provider.models.find((m) => m.id === modelId);
        if (model) return { ...model, providerId };
      }
    }

    return defaultModel || selectedModel;
  };

  // Track only a stable key of message ids for current conversation to avoid re-renders during token streaming
  const messageIdsKey = useConversationStore((s) =>
    s.currentMessages.map((m) => m.id).join(","),
  );
  const messageIds: string[] = useMemo(() => {
    return messageIdsKey ? messageIdsKey.split(",") : [];
  }, [messageIdsKey]);

  const isCurrentLoading = useConversationStore((s) =>
    s.currentConversationId
      ? Boolean(s.loadingById[s.currentConversationId])
      : false,
  );
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial hydration
  useEffect(() => {
    if (!isHydrated) void hydrateFromDB();
  }, [isHydrated, hydrateFromDB]);

  // Handle URL-based navigation
  useEffect(() => {
    // Wait for store to be hydrated before processing URL
    if (!isHydrated) return;

    if (chatId) {
      // Check if the chat ID exists in headers
      const { headers, currentConversationId, currentMessages } =
        useConversationStore.getState();
      const exists = headers.find((h) => h.id === chatId);
      if (exists) {
        // Only load from DB if we aren't already on this convo with messages
        const shouldLoad =
          currentConversationId !== chatId || currentMessages.length === 0;
        if (shouldLoad) {
          void openConversation(chatId);
        } else {
          // Ensure store reflects the same id (no-op if already set)
          setCurrentConversation(chatId);
        }
      } else {
        // ID may be for a just-created, not-yet-persisted conversation.
        // Keep it as current without redirecting.
        setCurrentConversation(chatId);
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
        // Use temp model selection if available, otherwise use default model
        const tempModelSelection =
          useConversationStore.getState().tempModelSelection;
        const initialModelId =
          tempModelSelection ??
          (defaultModel
            ? `${defaultModel.providerId}:${defaultModel.id}`
            : null);
        conversationId = createNewConversation(null, initialModelId);
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
        addMessage(createNoProvidersError());
        return;
      }

      // Get the model to use for this request
      const currentSelectedModel =
        useConversationStore.getState().currentSelectedModel;
      const tempModelSelection =
        useConversationStore.getState().tempModelSelection;
      const selectedModelToUse = getModelForRequest(
        currentSelectedModel,
        tempModelSelection,
        defaultModel,
        selectedModel,
        providers,
      );
      if (!selectedModelToUse) {
        addMessage(createNoModelError());
        return;
      }

      // Build the message list to send (include the just-added user message)
      const { currentConversationId: curId, currentMessages } =
        useConversationStore.getState();
      const useCur = curId === conversationId ? currentMessages : [];
      const messagesForAI = [...useCur, { ...userMessage }];

      // Create abort controller for this request
      const abortController = new AbortController();

      // Create a placeholder assistant message to stream into
      // Use the selected model for this conversation
      const modelForMessage = selectedModelToUse
        ? `${selectedModelToUse.providerId}:${selectedModelToUse.id}`
        : undefined;

      const assistantId = addMessage({
        timestamp: Date.now(),
        role: "assistant",
        content: "",
        model: modelForMessage,
      });

      try {
        setConversationLoading(conversationId, true, abortController);

        const { completionsStreaming } = await import(
          "@/lib/api/completions-streaming"
        );

        const stream = await completionsStreaming(
          selectedModelToUse,
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
          const { currentConversationId, currentMessages } =
            useConversationStore.getState();
          const isSame = currentConversationId === conversationId;
          const last = isSame
            ? currentMessages[currentMessages.length - 1]
            : undefined;
          if (last && last.role === "assistant") {
            updateMessage(last.id, { aborted: true });
          }
        } else {
          // Use the new error handling utility to handle streaming errors
          // Note: assistantId is available in this scope since it's in the same try block
          handleStreamingError(err, conversationId, assistantId);
        }
      } finally {
        setConversationLoading(conversationId, false);
        // Persist the whole conversation body once generation ends (success, error, or abort)
        await persistCurrentConversation();
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
      openConversation,
      persistCurrentConversation,
    ],
  );

  // Keep the latest handleSendMessage without changing the regenerate callback identity
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    // Access latest state directly to avoid re-creating this callback on stream updates
    const { currentMessages, removeLastAssistantMessage } =
      useConversationStore.getState();

    const lastMessage = currentMessages[currentMessages.length - 1];
    if (!lastMessage || lastMessage.id !== messageId) return;

    const userMessage = [...currentMessages]
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

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <p className="text-center opacity-50 dark:text-white p-5">
        Initializing conversation...
      </p>
    );
  }

  // Simplified chat interface rendering
  const showEmptyState = !hasConversation || messageIds.length === 0;

  return (
    <div className="h-full flex flex-col dark:bg-neutral-900 min-h-0 relative overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-4 overflow-x-hidden">
        {showEmptyState ? (
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
      <div
        className={cn(
          "flex-shrink-0 overflow-hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900",
          hasConversation ? "py-3 px-2 sm:px-4" : "px-2 sm:px-4 py-2",
        )}
      >
        <ChatInput
          onSend={onSend}
          onStop={handleStopGeneration}
          disabled={hasConversation ? isCurrentLoading : false}
          isLoading={hasConversation ? isCurrentLoading : false}
        />
      </div>
    </div>
  );
}
