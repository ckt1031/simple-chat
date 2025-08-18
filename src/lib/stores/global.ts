import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'google' | 'anthropic';
  apiKey: string;
  apiBaseUrl?: string;
  model: string;
  enabled: boolean;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  providers: AIProvider[];
}

export interface UIState {
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  settings: Settings;
  ui: UIState;
}

interface ChatStore extends ChatState {
  isLoading: boolean;
  
  // Actions
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  setCurrentConversation: (id: string | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  addProvider: (provider: AIProvider) => void;
  updateProvider: (id: string, provider: Partial<AIProvider>) => void;
  deleteProvider: (id: string) => void;
  setLoading: (loading: boolean) => void;
  
  // UI Actions
  openSettings: () => void;
  closeSettings: () => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setSidebarWidth: (width: number) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      conversations: [],
      currentConversationId: null,
      settings: {
        theme: 'system',
        providers: [],
      },
      ui: {
        isSidebarOpen: true,
        isSettingsOpen: false,
      },
      isLoading: false,

      createConversation: (title = 'New Chat') => {
        const id = crypto.randomUUID();
        const conversation: Conversation = {
          id,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: [conversation, ...state.conversations],
          currentConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: Date.now() } : conv
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, newMessage],
                  updatedAt: Date.now(),
                  title: conv.title === 'New Chat' && message.role === 'user'
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                    : conv.title,
                }
              : conv
          ),
        }));
      },

      setCurrentConversation: (id) => {
        set({ currentConversationId: id });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      addProvider: (provider) => {
        set((state) => ({
          settings: {
            ...state.settings,
            providers: [...state.settings.providers, provider],
          },
        }));
      },

      updateProvider: (id, provider) => {
        set((state) => ({
          settings: {
            ...state.settings,
            providers: state.settings.providers.map((p) =>
              p.id === id ? { ...p, ...provider } : p
            ),
          },
        }));
      },

      deleteProvider: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            providers: state.settings.providers.filter((p) => p.id !== id),
          },
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      // UI Actions
      openSettings: () => {
        set((state) => ({ ui: { ...state.ui, isSettingsOpen: true } }));
      },
      closeSettings: () => {
        set((state) => ({ ui: { ...state.ui, isSettingsOpen: false } }));
      },
      toggleSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: !state.ui.isSidebarOpen } }));
      },
      openSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: true } }));
      },
      closeSidebar: () => {
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: false } }));
      },
      setSidebarWidth: (width: number) => {
        const clamped = Math.max(240, Math.min(width, 480));
        set((state) => ({ ui: { ...state.ui, sidebarWidth: clamped } }));
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
