'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/stores/global';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

export function Chat() {
  const { 
    conversations, 
    currentConversationId, 
    addMessage, 
    setLoading, 
    isLoading,
    settings,
    openSettings,
  } = useChatStore();
  
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
    if (!currentConversationId) return;

    // Add user message
    addMessage(currentConversationId, {
      role: 'user',
      content,
    });

    // Get enabled providers
    const enabledProviders = settings.providers.filter(p => p.enabled);
    if (enabledProviders.length === 0) {
      addMessage(currentConversationId, {
        role: 'assistant',
        content: 'No AI providers configured. Please add a provider in settings.',
      });
      return;
    }

    // Use the first enabled provider
    const provider = enabledProviders[0];
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...currentConversation?.messages || [],
            { role: 'user', content }
          ],
          provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      addMessage(currentConversationId, {
        role: 'assistant',
        content: data.text,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage(currentConversationId, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your provider configuration.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">What's on the agenda today?</h1>
          <p className="text-gray-600 max-w-md">
            Start a new conversation to begin chatting with AI. Make sure to configure your AI providers in settings first.
          </p>
          <button
            onClick={openSettings}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">What's on the agenda today?</h2>
              <p className="text-gray-600">Start a conversation to begin chatting with AI.</p>
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
      <div className="p-4 border-t border-gray-200">
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={isLoading}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
