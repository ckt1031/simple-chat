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
}

export interface ConversationStore extends ConversationState {
    createNewConversation: () => void;
    addConversation: (conversation: Omit<Conversation, 'id'>) => void;
    updateConversation: (conversation: Conversation) => void;
    deleteConversation: (id: string) => void;
    setCurrentConversation: (id: string) => void;
    addMessage: (message: Omit<Message, 'id'>) => void;
}

export const useConversationStore = create<ConversationStore>()(
    persist(
        (set) => ({
            conversations: [],
            currentConversationId: null,
            createNewConversation: () => {
                const newID = crypto.randomUUID();
                set((state) => ({
                    conversations: [...state.conversations, { id: newID, title: 'New chat', messages: [] }],
                    currentConversationId: newID,
                }));
            },
            setCurrentConversation: (id: string) => {
                set((state) => ({ currentConversationId: id }));
            },
            addConversation: (conversation: Omit<Conversation, 'id'>) => {
                set((state) => ({ conversations: [...state.conversations, { ...conversation, id: crypto.randomUUID() }] }));
            },
            updateConversation: (conversation: Conversation) => {
                set((state) => ({ conversations: state.conversations.map(c => c.id === conversation.id ? conversation : c) }));
            },
            deleteConversation: (id: string) => {
                set((state) => ({ conversations: state.conversations.filter(c => c.id !== id) }));
            },
            addMessage: (message: Omit<Message, 'id'>) => {
                set((state) => ({ conversations: state.conversations.map(c => c.id === state.currentConversationId ? { ...c, messages: [...c.messages, { ...message, id: crypto.randomUUID() }] } : c) }));
            }
        }),
        { name: 'conversation', storage: createJSONStorage(() => localStorage) }
    )
);