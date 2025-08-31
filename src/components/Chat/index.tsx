"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePreferencesStore } from "@/lib/stores/perferences";
import ChatInput from "./ChatInput";
import ChatEmptyState from "./ChatEmptyState";
import ChatTranscript from "./ChatTranscript";
import { Message, useConversationStore } from "@/lib/stores/conversation";
import { useProviderStore } from "@/lib/stores/provider";
import { useUIStore } from "@/lib/stores/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import {
  handleStreamingError,
  createNoProvidersError,
  createNoModelError,
} from "@/lib/utils/chat-error-handling";

export function Chat() {
  const router = useRouter();
  const chatId = useSearchParams().get("id");

  const defaultModel = usePreferencesStore((s) => s.defaultModel);
  const uiSelectedModel = useUIStore((s) => s.selectedModel);

  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

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
    currentSelectedModel,
    removeLastAssistantMessage,
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
      currentSelectedModel: s.currentSelectedModel,
      removeLastAssistantMessage: s.removeLastAssistantMessage,
    })),
  );

  const { hasEnabledProviders, resolveModelByKey, formatModelKey } =
    useProviderStore();

  const messageIdsKey = useConversationStore((s) =>
    s.currentMessages.map((m) => m.id).join(","),
  );
  const messageIds: string[] = useMemo(
    () => messageIdsKey.split(","),
    [messageIdsKey],
  );

  const isCurrentLoading = useConversationStore((s) =>
    s.currentConversationId
      ? Boolean(s.loadingById[s.currentConversationId])
      : false,
  );

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
  }, [chatId, setCurrentConversation, router, isHydrated, openConversation]);

  const hasConversation = currentConversationId != null;

  const handleStopGeneration = () => {
    if (currentConversationId) {
      stopConversation(currentConversationId);
      abortController?.abort();
      setAbortController(null);
    }
  };

  const getSelectedModelForRequest = () => {
    // Conversation store
    if (currentSelectedModel && currentConversationId) {
      const resolved = resolveModelByKey(currentSelectedModel);
      if (resolved) return resolved;
    }
    // UI store
    if (uiSelectedModel) return uiSelectedModel;
    // Preferences store
    if (defaultModel) return defaultModel;
    return null;
  };

  const handleSendMessage = async (
    content: string,
    isRegenerating = false,
    assets?: Message["assets"],
  ) => {
    let conversationId = currentConversationId;

    if (!conversationId) {
      const initialModelKey = uiSelectedModel
        ? formatModelKey(uiSelectedModel.providerId, uiSelectedModel.id)
        : defaultModel
          ? formatModelKey(defaultModel.providerId, defaultModel.id)
          : null;
      conversationId = createNewConversation(null, initialModelKey);
      window.history.pushState(null, "", `/?id=${conversationId}`);
    }

    const userMessage: Omit<Message, "id"> = {
      timestamp: Date.now(),
      role: "user",
      content,
      assets,
    };
    if (!isRegenerating) addMessage(userMessage);

    if (!hasEnabledProviders()) {
      addMessage(createNoProvidersError());
      return;
    }

    const selected = getSelectedModelForRequest();

    if (!selected) {
      addMessage(createNoModelError());
      return;
    }

    const { currentConversationId: curId, currentMessages } =
      useConversationStore.getState();
    const useCur = curId === conversationId ? currentMessages : [];

    const abortController = new AbortController();
    setAbortController(abortController);

    const modelForMessage = formatModelKey(selected.providerId, selected.id);

    const assistantId = addMessage({
      timestamp: Date.now(),
      role: "assistant",
      content: "",
      model: modelForMessage,
    });

    try {
      setConversationLoading(conversationId, true);

      const { completionsStreaming } = await import(
        "@/lib/api/completions-streaming"
      );

      const stream = await completionsStreaming(
        selected,
        useCur as Message[],
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
      if (err instanceof Error && err.name === "AbortError") {
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
        handleStreamingError(err, conversationId, assistantId);
      }
    } finally {
      setConversationLoading(conversationId, false);
      await persistCurrentConversation();
    }
  };

  const handleRegenerateMessage = useCallback(
    async (messageId: string) => {
      const { currentMessages } = useConversationStore.getState();
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (!lastMessage || lastMessage.id !== messageId) return;

      const userMessage = [...currentMessages]
        .reverse()
        .find((m) => m.role === "user");
      if (!userMessage) return;

      removeLastAssistantMessage(messageId);
      await handleSendMessage(userMessage.content, true, userMessage.assets);
    },
    [handleSendMessage, removeLastAssistantMessage],
  );

  const onSend = (content: string, assets?: Message["assets"]) => {
    void handleSendMessage(content, false, assets);
  };

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
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 overflow-x-hidden">
        {showEmptyState ? (
          <ChatEmptyState />
        ) : (
          <ChatTranscript
            conversationId={currentConversationId as string}
            messageIds={messageIds}
            onRegenerate={handleRegenerateMessage}
          />
        )}
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
