'use client';

import { useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '@/lib/stores/global';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Message, useConversationStore } from '@/lib/stores/conversation';
import { OfficialProvider, useProviderStore } from '@/lib/stores/provider';
import completionsStreaming from '@/lib/api/completions-streaming';
import { useRouter } from 'next/navigation';
import ChatScrollToBottom from './ChatScrollToBottom';

interface ChatProps {
  chatId: string | null;
}

export function Chat({ chatId }: ChatProps) {
  const { general } = useGlobalStore();
  const { hasEnabledProviders, officialProviders, customProviders } = useProviderStore();
  const { 
    conversations, 
    currentConversationId, 
    isHydrated, 
    addMessage, 
    appendToMessage, 
    updateMessage, 
    setCurrentConversation, 
    createNewConversation, 
    removeLastAssistantMessage,
    setConversationLoading,
    stopConversation
  } = useConversationStore();
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Handle URL-based navigation
  useEffect(() => {
    // Wait for store to be hydrated before processing URL
    if (!isHydrated) return;
    
    if (chatId) {
      // Check if the chat ID exists
      const conversationExists = conversations.find(conv => conv.id === chatId);
      if (conversationExists) {
        setCurrentConversation(chatId);
      } else {
        // Invalid ID, redirect to new chat
        router.push('/');
      }
    } else {
      // No chat ID, clear current conversation (new chat state)
      setCurrentConversation(null);
    }
  }, [chatId, conversations, setCurrentConversation, router, isHydrated]);

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    // Only auto-scroll if we're near the bottom or if it's a new message
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const isNearBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 100;
      if (isNearBottom || currentConversation?.messages.length === 1) {
        scrollToBottom();
      }
    }
  }, [currentConversation?.messages]);

  // Track scroll to show/hide the button
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;
    const onScroll = () => {
      const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      setShowScrollButton(!nearBottom);
    };
    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [currentConversation?.id]);

  const handleRegenerateMessage = async (messageId: string) => {
    // In the regeneration, we only allow re-generating the last message
    const lastMessage = currentConversation?.messages[currentConversation.messages.length - 1];
    if (!lastMessage || lastMessage.id !== messageId) return;

    const userMessage = [...(currentConversation?.messages ?? [])].reverse().find(m => m.role === 'user');
    if (!userMessage) return;

    // Remove the last AI generated message if it exists
    removeLastAssistantMessage(messageId);
    handleSendMessage(userMessage.content, true, userMessage.assets);
  };

  const handleStopGeneration = () => {
    if (currentConversationId) {
      stopConversation(currentConversationId);
    }
  };

  const handleSendMessage = async (content: string, isRegenerating = false, assets?: Message['assets']) => {
    let conversationId = currentConversationId;
    
    // If no current conversation, create one first
    if (!conversationId) {
      conversationId = createNewConversation();
      // Update URL with the new conversation ID
      router.push(`/?id=${conversationId}`);
    }

    // Add user message
    const userMessage = {
      timestamp: Date.now(),
      role: 'user',
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
    const convo = conversations.find((c) => c.id === conversationId);
    const messagesForAI = [...(convo?.messages ?? []), { ...userMessage }];

    // Create abort controller for this request
    const abortController = new AbortController();
    
    try {
      setConversationLoading(conversationId, true, abortController);
      
      // Create a placeholder assistant message to stream into
      const assistantId = addMessage({
        timestamp: Date.now(),
        role: 'assistant',
        content: '',
      });

      const textStream = await completionsStreaming(selected, messagesForAI as Message[], abortController.signal);
      for await (const delta of textStream) {
        appendToMessage(assistantId, delta);
      }
    } catch (err: unknown) {
      // Check if it was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped the generation, update the message to indicate it was stopped
        const convo = conversations.find((c) => c.id === conversationId);
        const last = convo?.messages[convo.messages.length - 1];
        if (last && last.role === 'assistant') {
          updateMessage(last.id, { content: last.content + '\n\n*Generation stopped by user*' });
        }
      } else {
        // If we created a placeholder, replace its content with the error; otherwise add a new error message
        const errorText = `Failed to generate a response: ${err instanceof Error ? err.message : 'Unknown error'}`;
        try {
          // Attempt to update the last assistant message if it was just created
          const convo = conversations.find((c) => c.id === conversationId);
          const last = convo?.messages[convo.messages.length - 1];
          if (last && last.role === 'assistant') {
            updateMessage(last.id, { content: errorText });
          } else {
            addMessage({ timestamp: Date.now(), role: 'assistant', content: errorText });
          }
        } catch {
          addMessage({ timestamp: Date.now(), role: 'assistant', content: errorText });
        }
      }
    } finally {
      setConversationLoading(conversationId, false);
    }
  };

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
  if (!currentConversation) {
    return (
      <div className="h-full flex flex-col dark:bg-neutral-900 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 px-4">
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">What&apos;s on your mind?</h2>
              <p className="text-neutral-600 dark:text-white">Start a conversation to begin chatting with AI.</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <ChatInput
            onSend={(content, assets) => handleSendMessage(content, false, assets)}
            onStop={handleStopGeneration}
            disabled={false}
            isLoading={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col dark:bg-neutral-900 min-h-0 relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 px-4">
        {currentConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">What&apos;s on your mind?</h2>
              <p className="text-neutral-600 dark:text-white">Start a conversation to begin chatting with AI.</p>
            </div>
          </div>
        ) : (
          currentConversation.messages.map((message) => (
            <ChatMessage
              conversationId={currentConversation.id}
              key={message.id} 
              message={message} 
              onRegenerate={handleRegenerateMessage}
              isRegenerating={false}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatScrollToBottom visible={showScrollButton} onClick={scrollToBottom} />

      {/* Input */}
      <div className="flex-shrink-0 py-2 px-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <ChatInput
          onSend={(content, assets) => handleSendMessage(content, false, assets)}
          onStop={handleStopGeneration}
          disabled={currentConversation.isLoading}
          isLoading={currentConversation.isLoading}
        />
      </div>
    </div>
  );
}
