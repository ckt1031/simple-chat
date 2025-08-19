import { StateStorage } from "zustand/middleware/persist"
import { get, set, del, createStore } from 'idb-keyval' // can use anything: IndexedDB, Ionic Storage, etc.

const DEFAULT_DB_NAME = 'simple-chat'
const conversationStore = createStore(DEFAULT_DB_NAME, 'conversations')

// Keys helpers
const conversationIndexKey = 'index'
const buildConversationKey = (id: string) => `conversation:${id}`

type PersistedPayload = {
    version: number
    state: PersistedStateShape
}

type StoredMessage = {
    id: string
    content: string
    timestamp: number
    role: 'user' | 'assistant'
}

type StoredConversation = {
    id: string
    title: string
    messages: StoredMessage[]
    isLoading?: boolean
}

type PersistedStateShape = {
    conversations: StoredConversation[]
    currentConversationId: string | null
    isHydrated: boolean
}

type ConversationMeta = {
    id: string
    title: string
}

type ConversationIndex = {
    ids: string[]
    metaById: Record<string, ConversationMeta>
}

// Custom storage object
export const ConversationIndxedStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const index: ConversationIndex | undefined = await get(conversationIndexKey, conversationStore)

        // Fallback to legacy single-blob storage if index doesn't exist yet
        if (!index || !Array.isArray(index.ids)) {
            return (await get(name, conversationStore)) || null
        }

        // Read the minimal root payload (for version and any extra root fields)
        const rootPayloadRaw = await get(name, conversationStore)
        let version = 0
        let rootState: PersistedStateShape = {
            conversations: [],
            currentConversationId: null,
            isHydrated: false,
        }
        if (rootPayloadRaw) {
            if (typeof rootPayloadRaw === 'string') {
                try {
                    const parsed = JSON.parse(rootPayloadRaw) as PersistedPayload
                    version = parsed?.version ?? 0
                    rootState = parsed?.state ?? rootState
                } catch {
                    // ignore parse errors and keep defaults
                }
            } else if (typeof rootPayloadRaw === 'object') {
                const obj = rootPayloadRaw as PersistedPayload
                version = obj?.version ?? 0
                rootState = obj?.state ?? rootState
            }
        }

        // Materialize conversations in the same order as the index
        const conversations: StoredConversation[] = []
        for (const id of index.ids) {
            const conv = (await get(buildConversationKey(id), conversationStore)) as StoredConversation | undefined
            if (conv) conversations.push(conv)
        }

        const reconstructed: PersistedPayload = {
            version,
            state: {
                ...rootState,
                conversations,
            },
        }

        return JSON.stringify(reconstructed)
    },
    setItem: async (name: string, value: string): Promise<void> => {
        let payload: PersistedPayload
        try {
            payload = JSON.parse(value)
        } catch {
            // If parsing fails, store as-is as a last resort
            await set(name, value, conversationStore)
            return
        }

        const state: PersistedStateShape = (payload.state ?? {
            currentConversationId: null,
            isHydrated: false,
        }) as PersistedStateShape
        const conversations: StoredConversation[] = Array.isArray(state.conversations) ? state.conversations : []

        const previousIndex: ConversationIndex | undefined = await get(conversationIndexKey, conversationStore)
        const previousIds = new Set(previousIndex?.ids ?? [])

        const ids: string[] = []
        const metaById: Record<string, ConversationMeta> = {}

        // Write each conversation and collect metadata
        for (const conv of conversations) {
            if (!conv?.id) continue
            const id: string = conv.id
            ids.push(id)
            metaById[id] = { id, title: String(conv.title ?? '') }
            await set(buildConversationKey(id), conv, conversationStore)
            previousIds.delete(id)
        }

        // Clean up any conversations that no longer exist
        for (const removedId of previousIds) {
            await del(buildConversationKey(removedId), conversationStore)
        }

        // Persist the lightweight index
        const newIndex: ConversationIndex = { ids, metaById }
        await set(conversationIndexKey, newIndex, conversationStore)

        // Persist a minimal root payload to keep versioning and non-conversation fields
        const minimalRoot: PersistedPayload = {
            version: payload.version ?? 0,
            state: {
                currentConversationId: state.currentConversationId,
                isHydrated: state.isHydrated,
                conversations: [],
            },
        }
        await set(name, JSON.stringify(minimalRoot), conversationStore)
    },
    removeItem: async (name: string): Promise<void> => {
        const index: ConversationIndex | undefined = await get(conversationIndexKey, conversationStore)
        if (index?.ids?.length) {
            await Promise.all(index.ids.map((id) => del(buildConversationKey(id), conversationStore)))
        }
        await del(conversationIndexKey, conversationStore)
        await del(name, conversationStore)
    },
}
