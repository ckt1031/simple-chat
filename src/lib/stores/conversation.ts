import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
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
    addConversation: (conversation: Omit<Conversation, 'id'>) => void;
    updateConversation: (conversation: Conversation) => void;
    updateConversationTitle: (id: string, title: string) => void;
    deleteConversation: (id: string) => void;
    setCurrentConversation: (id: string | null) => void;
    setHydrated: (hydrated: boolean) => void;
    addMessage: (message: Omit<Message, 'id'>) => string;
    updateMessage: (id: string, updates: Partial<Omit<Message, 'id'>>) => void;
    appendToMessage: (id: string, text: string) => void;
}

export const useConversationStore = create<ConversationStore>()(
    persist(
        (set) => ({
            conversations: [],
            currentConversationId: null,
            isHydrated: false,
            createNewConversation: () => {
                const newID = crypto.randomUUID();
                set((state) => ({
                    conversations: [{ id: newID, title: 'New chat', messages: [] },...state.conversations],
                    currentConversationId: newID,
                }));
                return newID;
            },
            setCurrentConversation: (id: string | null) => {
                set((state) => ({ currentConversationId: id }));
            },
            setHydrated: (hydrated: boolean) => {
                set((state) => ({ isHydrated: hydrated }));
            },
            addConversation: (conversation: Omit<Conversation, 'id'>) => {
                set((state) => ({ conversations: [...state.conversations, { ...conversation, id: crypto.randomUUID() }] }));
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
                const id = crypto.randomUUID();
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
        }),
        { 
            name: 'conversation', 
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHydrated(true);
                }
            },
        }
    )
);