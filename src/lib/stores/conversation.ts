import { createIdGenerator } from "ai";
import { createWithEqualityFn as create } from "zustand/traditional";
import {
  ConversationFolder,
  ConversationHeader,
  deleteConversation as dbDeleteConversation,
  readConversationBody,
  readConversationIndex,
  readFolderIndex,
  upsertConversationHeader,
  writeConversationBody,
} from "./utils/conversation-db";

// In-memory shape for the currently opened conversation
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  selectedModel?: string; // Model selected for this conversation
  isLoading?: boolean;
  abortController?: AbortController;
}

export interface Message {
  id: string;
  content: string;
  reasoning?: string;
  reasoningStartTime?: number;
  reasoningEndTime?: number;
  timestamp: number;
  role: "user" | "assistant";
  model?: string; // Model used to generate this message (for assistant messages)
  // Unified error and abort metadata for rendering notices in UI
  error?: {
    message: string;
    code?: string | number;
  };
  aborted?: boolean;
  assets?: Array<{
    id: string;
    type: "image";
    mimeType?: string;
    name?: string;
  }>;
}

export interface ConversationState {
  // Sidebar: only lightweight headers
  headers: ConversationHeader[];
  folders: ConversationFolder[];
  // Current conversation in memory
  currentConversationId: string | null;
  currentMessages: Message[];
  currentSelectedModel: string | null; // Currently selected model for the active conversation
  tempModelSelection: string | null; // Temporary model selection for new conversations (home page)
  // Loading flags per conversation id (for sidebar spinners)
  loadingById: Record<string, boolean>;
  isHydrated: boolean;
}

export interface ConversationStore extends ConversationState {
  // Initialization / hydration
  hydrateFromDB: () => Promise<void>;
  // Sidebar operations
  createNewConversation: (
    folderId?: string | null,
    initialModel?: string | null,
  ) => string;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  // Opening / switching
  openConversation: (id: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  // Model operations
  updateConversationModel: (modelId: string) => void;
  setTempModelSelection: (modelId: string | null) => void;
  // Message operations (in-memory only during streaming)
  addMessage: (message: Omit<Message, "id">) => string;
  updateMessage: (id: string, updates: Partial<Omit<Message, "id">>) => void;
  appendToMessage: (id: string, text: string) => void;
  appendToReasoning: (id: string, text: string) => void;
  endReasoning: (id: string) => void;
  isLastMessage: (messageId: string) => boolean;
  deleteMessage: (messageId: string) => void;
  removeLastAssistantMessage: (messageId: string) => void;
  // Streaming helpers
  setConversationLoading: (
    conversationId: string,
    loading: boolean,
    abortController?: AbortController,
  ) => void;
  stopConversation: (conversationId: string) => void;
  resetAllLoadingStates: () => void;
  persistCurrentConversation: () => Promise<void>;
  removeAssetReferences: (assetId: string) => void;
}

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  headers: [],
  folders: [],
  currentConversationId: null,
  currentMessages: [],
  currentSelectedModel: null,
  tempModelSelection: null,
  loadingById: {},
  isHydrated: false,

  hydrateFromDB: async () => {
    const [index, folderIndex] = await Promise.all([
      readConversationIndex(),
      readFolderIndex(),
    ]);
    set(() => ({
      headers: index.ids.map((id) => index.headersById[id]).filter(Boolean),
      folders: folderIndex.ids
        .map((id) => folderIndex.byId[id])
        .filter(Boolean),
      isHydrated: true,
    }));
    // Reset loading flags on fresh load
    get().resetAllLoadingStates();
  },

  createNewConversation: (
    folderId?: string | null,
    initialModel?: string | null,
  ) => {
    const newID = createIdGenerator({ size: 16 })();
    const state = get();
    // Use initialModel if provided, otherwise use temp selection, otherwise use default from preferences
    const modelToUse = initialModel ?? state.tempModelSelection;

    const header: ConversationHeader = {
      id: newID,
      title: "New chat",
      createdAt: Date.now(),
      folderId: folderId ?? null,
    };
    set((state) => ({
      headers: [header, ...state.headers],
      currentConversationId: newID,
      currentMessages: [],
      currentSelectedModel: modelToUse ?? null,
      tempModelSelection: null, // Clear temp selection after creating conversation
    }));
    // Persist header and initial body with selected model
    void upsertConversationHeader(header);
    if (modelToUse) {
      void writeConversationBody(newID, {
        messages: [],
        selectedModel: modelToUse,
      });
    }
    return newID;
  },

  updateConversationTitle: async (id: string, title: string) => {
    const state = get();
    const header = state.headers.find((h) => h.id === id);
    if (!header) return;
    const nextHeader = { ...header, title };
    set((s) => ({
      headers: s.headers.map((h) => (h.id === id ? nextHeader : h)),
    }));
    await upsertConversationHeader(nextHeader);
  },

  deleteConversation: async (id: string) => {
    const state = get();
    if (state.currentConversationId === id) {
      set(() => ({
        currentConversationId: null,
        currentMessages: [],
        currentSelectedModel: null,
        tempModelSelection: null,
      }));
    }
    set((s) => ({ headers: s.headers.filter((h) => h.id !== id) }));
    const loadingById = { ...state.loadingById };
    delete loadingById[id];
    set(() => ({ loadingById }));
    await dbDeleteConversation(id);
  },

  openConversation: async (id: string) => {
    const state = get();
    const header = state.headers.find((h) => h.id === id);
    if (!header) return;
    // If we're already viewing this conversation and have in-memory messages, keep them.
    if (
      state.currentConversationId === id &&
      state.currentMessages.length > 0
    ) {
      set(() => ({ currentConversationId: id }));
      return;
    }
    const body = await readConversationBody<Message>(id);
    set(() => ({
      currentConversationId: id,
      currentMessages: body?.messages ?? [],
      currentSelectedModel: body?.selectedModel ?? null,
      tempModelSelection: null, // Clear temp selection when opening existing conversation
    }));
  },

  setCurrentConversation: (id: string | null) => {
    // Only set the id; callers that switch to an existing conv should call openConversation
    set(() => ({
      currentConversationId: id,
      tempModelSelection: null, // Clear temp selection when changing conversation
    }));
  },

  updateConversationModel: (modelId: string) => {
    const state = get();
    if (!state.currentConversationId) return;

    // Update in-memory state
    set(() => ({
      currentSelectedModel: modelId,
    }));

    // Persist immediately
    void writeConversationBody(state.currentConversationId, {
      messages: state.currentMessages,
      selectedModel: modelId,
    });
  },

  setTempModelSelection: (modelId: string | null) => {
    set(() => ({
      tempModelSelection: modelId,
    }));
  },

  addMessage: (message: Omit<Message, "id">) => {
    const id = createIdGenerator({ prefix: "msg", size: 16 })();
    set((state) => {
      const isUser = message.role === "user";
      const isFirstInConv = state.currentMessages.length === 0;
      let headers = state.headers;
      if (isUser && isFirstInConv && state.currentConversationId) {
        const base =
          message.content && message.content.trim().length > 0
            ? message.content
            : message.assets && message.assets.length > 0
              ? "(Image message)"
              : "New chat";
        const updatedTitle =
          base.slice(0, 50) + (base.length > 50 ? "..." : "");
        headers = headers.map((h) =>
          h.id === state.currentConversationId
            ? { ...h, title: updatedTitle }
            : h,
        );
      }
      return {
        headers,
        currentMessages: [...state.currentMessages, { ...message, id }],
      };
    });
    return id;
  },

  updateMessage: (id: string, updates: Partial<Omit<Message, "id">>) => {
    set((state) => ({
      currentMessages: state.currentMessages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    }));
  },

  appendToMessage: (id: string, text: string) => {
    set((state) => ({
      currentMessages: state.currentMessages.map((m) =>
        m.id === id ? { ...m, content: (m.content || "") + text } : m,
      ),
    }));
  },

  appendToReasoning: (id: string, text: string) => {
    set((state) => ({
      currentMessages: state.currentMessages.map((m) =>
        m.id === id
          ? {
              ...m,
              reasoning: (m.reasoning || "") + text,
              reasoningStartTime:
                m.reasoningStartTime !== undefined
                  ? m.reasoningStartTime
                  : Date.now(),
            }
          : m,
      ),
    }));
  },

  endReasoning: (id: string) => {
    set((state) => ({
      currentMessages: state.currentMessages.map((m) => {
        if (m.id === id && !m.reasoningEndTime) {
          return { ...m, reasoningEndTime: Date.now() };
        }
        return m;
      }),
    }));
  },

  isLastMessage: (messageId: string) => {
    const state = get();
    const last = state.currentMessages[state.currentMessages.length - 1];
    return last?.id === messageId;
  },

  deleteMessage: (messageId: string) => {
    set((state) => ({
      currentMessages: state.currentMessages.filter((m) => m.id !== messageId),
    }));
  },

  removeLastAssistantMessage: (messageId: string) => {
    const state = get();
    const lastMessage = state.currentMessages[state.currentMessages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.id === messageId) {
      set((s) => ({
        currentMessages: s.currentMessages.slice(0, -1),
      }));
    }
  },

  setConversationLoading: (
    conversationId: string,
    loading: boolean,
    abortController?: AbortController,
  ) => {
    set((state) => {
      const loadingById = { ...state.loadingById, [conversationId]: loading };
      // Also update abort controller flag for current if matches
      const shouldUpdateCurrent =
        state.currentConversationId === conversationId;
      return {
        loadingById,
        // Attach abort controller to a synthetic Conversation for current view needs
        // We avoid storing this in headers to keep headers lightweight
        ...(shouldUpdateCurrent
          ? {
              // no-op for now, Chat tracks abortController locally via closures
            }
          : {}),
      };
    });
  },

  stopConversation: (conversationId: string) => {
    // We rely on Chat's AbortController instance; just flip loading flag
    set((state) => ({
      loadingById: { ...state.loadingById, [conversationId]: false },
    }));
  },

  resetAllLoadingStates: () => {
    set(() => ({ loadingById: {} }));
  },

  persistCurrentConversation: async () => {
    const state = get();
    const id = state.currentConversationId;
    if (!id) return;
    const header = state.headers.find((h) => h.id === id);
    if (header) {
      await upsertConversationHeader(header);
    }
    await writeConversationBody(id, {
      messages: state.currentMessages,
      selectedModel: state.currentSelectedModel ?? undefined,
    });
  },

  removeAssetReferences: (assetId: string) => {
    set((state) => ({
      currentMessages: state.currentMessages.map((m) => {
        if (!m.assets || m.assets.length === 0) return m;
        const filtered = m.assets.filter((a) => a.id !== assetId);
        if (filtered.length === m.assets.length) return m;
        return { ...m, assets: filtered };
      }),
    }));
  },
}));
