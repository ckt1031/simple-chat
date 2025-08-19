import { createIdGenerator } from "ai";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    isLoading?: boolean;
    abortController?: AbortController;
}

export interface Message {
    id: string;
    content: string;
    timestamp: number;
    role: 'user' | 'assistant';
}

export interface ConversationState {
    conversations: Conversation[];
    currentConversationId: string | null;
    isHydrated: boolean;
}

export interface ConversationStore extends ConversationState {
    createNewConversation: () => string;
    updateConversation: (conversation: Conversation) => void;
    updateConversationTitle: (id: string, title: string) => void;
    deleteConversation: (id: string) => void;
    setCurrentConversation: (id: string | null) => void;
    setHydrated: (hydrated: boolean) => void;
    addMessage: (message: Omit<Message, 'id'>) => string;
    updateMessage: (id: string, updates: Partial<Omit<Message, 'id'>>) => void;
    appendToMessage: (id: string, text: string) => void;
    isLastMessage: (conversationId: string, messageId: string) => boolean;
    deleteMessage: (conversationId: string, messageId: string) => void;
    removeLastAssistantMessage: (messageId: string) => void;
    setConversationLoading: (conversationId: string, loading: boolean, abortController?: AbortController) => void;
    stopConversation: (conversationId: string) => void;
    resetAllLoadingStates: () => void;
}

export const useConversationStore = create<ConversationStore>()(
    persist(
        (set, get) => ({
            conversations: [],
            currentConversationId: null,
            isHydrated: false,
            createNewConversation: () => {
                const newID = createIdGenerator({ size: 16 })();
                set((state) => ({
                    conversations: [{ id: newID, title: 'New chat', messages: [], isLoading: false },...state.conversations],
                    currentConversationId: newID,
                }));
                return newID;
            },
            setCurrentConversation: (id: string | null) => {
                set(() => ({ currentConversationId: id }));
            },
            setHydrated: (hydrated: boolean) => {
                set(() => ({ isHydrated: hydrated }));
            },
            updateConversation: (conversation: Conversation) => {
                set((state) => ({ conversations: state.conversations.map(c => c.id === conversation.id ? conversation : c) }));
            },
            updateConversationTitle: (id: string, title: string) => {
                set((state) => ({ conversations: state.conversations.map(c => c.id === id ? { ...c, title } : c) }));
            },
            deleteConversation: (id: string) => {
                set((state) => ({ conversations: state.conversations.filter(c => c.id !== id) }));
            },
            addMessage: (message: Omit<Message, 'id'>) => {
                const id = createIdGenerator({ prefix: 'msg', size: 16 })();
                set((state) => {
                    const updatedConversations = state.conversations.map(c => {
                        if (c.id === state.currentConversationId) {
                            const updatedMessages = [...c.messages, { ...message, id }];
                            // Update title if this is the first user message
                            let updatedTitle = c.title;
                            if (message.role === 'user' && c.messages.length === 0) {
                                updatedTitle = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
                            }
                            return { ...c, messages: updatedMessages, title: updatedTitle };
                        }
                        return c;
                    });
                    return { conversations: updatedConversations };
                });
                return id;
            },
            updateMessage: (id: string, updates: Partial<Omit<Message, 'id'>>) => {
                set((state) => ({
                    conversations: state.conversations.map((c) => {
                        if (c.id !== state.currentConversationId) return c;
                        return {
                            ...c,
                            messages: c.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
                        };
                    }),
                }));
            },
            appendToMessage: (id: string, text: string) => {
                set((state) => ({
                    conversations: state.conversations.map((c) => {
                        if (c.id !== state.currentConversationId) return c;
                        return {
                            ...c,
                            messages: c.messages.map((m) => (m.id === id ? { ...m, content: (m.content || '') + text } : m)),
                        };
                    }),
                }));
            },
            isLastMessage: (conversationId: string, messageId: string) => {
                const state = get();
                const conversation = state.conversations.find(c => c.id === conversationId);
                if (!conversation) return false;
                return conversation.messages[conversation.messages.length - 1].id === messageId;
            },
            deleteMessage: (conversationId: string, messageId: string) => {
                set((state) => ({
                    conversations: state.conversations.map((c) => ({
                        ...c,
                        messages: c.messages.filter((m) => m.id !== messageId),
                    })),
                }));
            },
            removeLastAssistantMessage: (messageId: string) => {
                // Remove the last message if it's an assistant message, do not remove user or any earlier assistant messages
                // Check if the last message is an assistant message
                const state = get();
                const conversation = state.conversations.find(c => c.id === state.currentConversationId);
                if (!conversation) return;
                
                const lastMessage = conversation.messages[conversation.messages.length - 1];

                if (lastMessage?.role === 'assistant' && lastMessage.id === messageId) {
                    set((state) => ({
                        conversations: state.conversations.map((c) => ({
                            ...c,
                            messages: c.messages.filter((m) => m.id !== lastMessage.id),
                        })),
                    }));
                }
            },
            setConversationLoading: (conversationId: string, loading: boolean, abortController?: AbortController) => {
                set((state) => ({
                    conversations: state.conversations.map((c) => 
                        c.id === conversationId 
                            ? { ...c, isLoading: loading, abortController: loading ? abortController : undefined }
                            : c
                    ),
                }));
            },
            stopConversation: (conversationId: string) => {
                const state = get();
                const conversation = state.conversations.find(c => c.id === conversationId);
                if (conversation?.abortController) {
                    conversation.abortController.abort();
                }
                set((state) => ({
                    conversations: state.conversations.map((c) => 
                        c.id === conversationId 
                            ? { ...c, isLoading: false, abortController: undefined }
                            : c
                    ),
                }));
            },
            resetAllLoadingStates: () => {
                set((state) => ({
                    conversations: state.conversations.map((c) => ({
                        ...c,
                        isLoading: false,
                        abortController: undefined,
                    })),
                }));
            },
        }),
        { 
            name: 'conversation', 
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                conversations: state.conversations.map(conv => ({
                    ...conv,
                    abortController: undefined // Exclude AbortController from persistence
                })),
                currentConversationId: state.currentConversationId,
                isHydrated: state.isHydrated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHydrated(true);
                    // Reset all loading states on rehydration to handle page reloads
                    state.resetAllLoadingStates();
                }
            },
        }
    )
);