'use client';

import { useEffect, useRef } from 'react';
import { useGlobalStore } from '@/lib/stores/global';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useConversationStore } from '@/lib/stores/conversation';
import { OfficialProvider, useProviderStore } from '@/lib/stores/provider';
import completionsStreaming from '@/lib/api/completions-streaming';

export function Chat() {
  const { openSettings, ui, general, setChatRequesting } = useGlobalStore();
  const { hasEnabledProviders, officialProviders, customProviders } = useProviderStore();
  const { conversations, currentConversationId, addMessage, appendToMessage, updateMessage } = useConversationStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      timestamp: Date.now(),
      role: 'user',
      content,
    } as const;
    addMessage(userMessage);

    // Get enabled providers
    if (!hasEnabledProviders()) {
      addMessage({
        timestamp: Date.now(),
        role: 'assistant',
        content: 'No AI providers configured. Please add a provider in settings.',
      });
      return;
    }

    // Ensure a model is selected
    const selected = general.selectedModel;
    if (!selected) {
      addMessage({
        timestamp: Date.now(),
        role: 'assistant',
        content: 'No model selected. Please choose a model from the selector above.',
      });
      return;
    }

    // Ensure the selected model's provider is enabled
    let providerEnabled = false;
    if (
      selected.providerId === OfficialProvider.OPENAI ||
      selected.providerId === OfficialProvider.GOOGLE ||
      selected.providerId === OfficialProvider.OPENROUTER
    ) {
      providerEnabled = officialProviders[selected.providerId].enabled;
    } else if (typeof selected.providerId === 'string') {
      providerEnabled = !!customProviders[selected.providerId]?.enabled;
    }

    if (!providerEnabled) {
      addMessage({
        timestamp: Date.now(),
        role: 'assistant',
        content: "The selected model's provider is disabled. Please enable it in settings.",
      });
      return;
    }

    // Build the message list to send (include the just-added user message)
    const convo = conversations.find((c) => c.id === currentConversationId);
    const messagesForAI = [...(convo?.messages ?? []), { ...userMessage }];

    try {
      setChatRequesting(true);
      // Create a placeholder assistant message to stream into
      const assistantId = addMessage({
        timestamp: Date.now(),
        role: 'assistant',
        content: '',
      });

      const textStream = await completionsStreaming(selected, messagesForAI as any);
      for await (const delta of textStream) {
        appendToMessage(assistantId, delta);
      }
    } catch (err: any) {
      // If we created a placeholder, replace its content with the error; otherwise add a new error message
      const errorText = `Failed to generate a response: ${err?.message || 'Unknown error'}`;
      try {
        // Attempt to update the last assistant message if it was just created
        const convo = conversations.find((c) => c.id === currentConversationId);
        const last = convo?.messages[convo.messages.length - 1];
        if (last && last.role === 'assistant') {
          updateMessage(last.id, { content: errorText });
        } else {
          addMessage({ timestamp: Date.now(), role: 'assistant', content: errorText });
        }
      } catch {
        addMessage({ timestamp: Date.now(), role: 'assistant', content: errorText });
      }
    } finally {
      setChatRequesting(false);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center dark:bg-neutral-900">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome to AI Chat</h1>
          <p className="text-neutral-600 dark:text-white max-w-md">
            Start a new conversation to begin chatting with AI. Make sure to configure your AI providers in settings first.
          </p>
          <button
            onClick={openSettings}
            className="px-4 py-2 bg-neutral-800 text-white dark:text-white rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full dark:bg-neutral-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 px-4">
        {currentConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">What's on your mind?</h2>
              <p className="text-neutral-600 dark:text-white">Start a conversation to begin chatting with AI.</p>
            </div>
          </div>
        ) : (
          currentConversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4">
        <ChatInput
          onSend={handleSendMessage}
          disabled={ui.isChatRequesting}
          isLoading={ui.isChatRequesting}
        />
      </div>
    </div>
  );
}
