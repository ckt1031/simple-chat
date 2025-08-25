import { createStore, del, get, set } from "idb-keyval";

// Centralized DB and store names so we can reuse the same IndexedDB database
const dbStore = createStore("conversation-db", "conversations");

// Key helpers
const INDEX_KEY = "conv:index";
const BODY_KEY = (id: string) => `conv:body:${id}`;
const FOLDER_INDEX_KEY = "folder:index";

// Types for the conversation persistence layer
export type ConversationFolder = {
  id: string;
  name: string;
  createdAt: number;
};

export type ConversationHeader = {
  id: string;
  title: string;
  createdAt: number;
  folderId?: string | null;
};

export type ConversationBody<Message> = {
  messages: Message[];
  selectedModel?: string; // Model selected for this conversation
};

type ConversationIndex = {
  ids: string[];
  headersById: Record<string, ConversationHeader>;
};

type FolderIndex = {
  ids: string[];
  byId: Record<string, ConversationFolder>;
};

// Index operations
export async function readConversationIndex(): Promise<ConversationIndex> {
  const idx = (await get(INDEX_KEY, dbStore)) as ConversationIndex | undefined;
  if (idx && Array.isArray(idx.ids)) return idx;
  return { ids: [], headersById: {} };
}

export async function writeConversationIndex(
  index: ConversationIndex,
): Promise<void> {
  await set(INDEX_KEY, index, dbStore);
}

export async function upsertConversationHeader(
  header: ConversationHeader,
): Promise<void> {
  const index = await readConversationIndex();
  if (!index.headersById[header.id]) {
    index.ids.unshift(header.id);
  }
  index.headersById[header.id] = header;
  await writeConversationIndex(index);
}

export async function removeConversationFromIndex(id: string): Promise<void> {
  const index = await readConversationIndex();
  index.ids = index.ids.filter((x) => x !== id);
  delete index.headersById[id];
  await writeConversationIndex(index);
}

// Body operations
export async function readConversationBody<M>(
  id: string,
): Promise<ConversationBody<M> | null> {
  const body = (await get(BODY_KEY(id), dbStore)) as
    | ConversationBody<M>
    | undefined;
  return body ?? null;
}

export async function writeConversationBody<M>(
  id: string,
  body: ConversationBody<M>,
): Promise<void> {
  await set(BODY_KEY(id), body, dbStore);
}

export async function deleteConversationBody(id: string): Promise<void> {
  await del(BODY_KEY(id), dbStore);
}

// Folder operations (single depth support only)
export async function readFolderIndex(): Promise<FolderIndex> {
  const idx = (await get(FOLDER_INDEX_KEY, dbStore)) as FolderIndex | undefined;
  if (idx && Array.isArray(idx.ids)) return idx;
  return { ids: [], byId: {} };
}

export async function writeFolderIndex(index: FolderIndex): Promise<void> {
  await set(FOLDER_INDEX_KEY, index, dbStore);
}

export async function upsertFolder(folder: ConversationFolder): Promise<void> {
  const index = await readFolderIndex();
  if (!index.byId[folder.id]) {
    index.ids.push(folder.id);
  }
  index.byId[folder.id] = folder;
  await writeFolderIndex(index);
}

export async function removeFolder(folderId: string): Promise<void> {
  const index = await readFolderIndex();
  index.ids = index.ids.filter((x) => x !== folderId);
  delete index.byId[folderId];
  await writeFolderIndex(index);
}

// High-level helpers
export async function deleteConversation(id: string): Promise<void> {
  await Promise.all([
    removeConversationFromIndex(id),
    deleteConversationBody(id),
  ]);
}
