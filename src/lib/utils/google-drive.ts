import { createStore, get, set, del } from "idb-keyval";
import { Message } from "../stores/conversation";
import { AssetRecord } from "../stores/utils/asset-db";
import { ProviderState } from "../stores/provider";
import { PreferencesState } from "../stores/perferences";

// Google Drive API configuration
const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

// localStorage keys
const TOKENS_STORAGE_KEY = "google_drive_tokens";

// IndexedDB keys for sync metadata
const SYNC_METADATA_STORE = createStore("google-drive-sync", "metadata");
const SYNC_METADATA_KEY = "sync_metadata";

// Initialize IndexedDB stores properly
const initializeStores = async (): Promise<void> => {
  try {
    // Ensure the database and stores exist by performing a test operation
    await get(SYNC_METADATA_KEY, SYNC_METADATA_STORE);
  } catch {
    // Store might not exist, but this is expected for new installations
    console.log("Initializing sync metadata store");
  }
};

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  timestamp: number;
  profile?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
  } | null;
}

// App folder name in Google Drive
const APP_FOLDER_NAME = "Simple Chat Sync";

// Google Drive file interface
interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  createdTime?: string;
}

// New sync file naming convention
const CONFIG_FILE_NAME = "simple-chat-config.json";
const CHAT_FILE_PREFIX = "simple-chat-chat-";
const ASSET_FILE_PREFIX = "simple-chat-asset-";

// localStorage token helpers
const getTokens = (): TokenData | null => {
  try {
    const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setTokens = (tokens: TokenData): void => {
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
};

const clearTokens = (): void => {
  localStorage.removeItem(TOKENS_STORAGE_KEY);
};

const isTokenExpired = (tokens: TokenData): boolean => {
  return Date.now() >= tokens.timestamp + tokens.expires_in * 1000;
};

export interface SyncMetadata {
  lastSyncTime: number;
  remoteFileId: string;
  localVersion: number;
  remoteVersion: number;
  lastModified: number;
}

export interface ChatMetadata {
  id: string;
  title?: string;
  lastModified: number;
  folderId?: string;
  messageCount: number;
}

export interface ConfigData {
  version: string;
  timestamp: number;
  providers: Record<string, ProviderState>; // Provider store data
  preferences: PreferencesState; // Preferences store data
  chats: ChatMetadata[]; // Metadata for all chats
}

export interface ChatData {
  id: string;
  title?: string;
  messages: Message[]; // Full message data
  lastModified: number;
  folderId?: string;
}

export interface SyncStatus {
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  progress: number;
}

export interface GoogleDriveSync {
  // Authentication
  authenticate: () => Promise<void>;
  isAuthenticated: () => Promise<boolean>;
  disconnect: () => Promise<void>;

  // Sync operations
  syncToDrive: () => Promise<void>;
  syncFromDrive: () => Promise<void>;
  getSyncStatus: () => Promise<SyncStatus>;

  // Metadata
  getSyncMetadata: () => Promise<SyncMetadata | null>;
  updateSyncMetadata: (metadata: Partial<SyncMetadata>) => Promise<void>;

  // Asset management
  getAssetWithFallback: (assetId: string) => Promise<AssetRecord | null>;
}

class GoogleDriveSyncImpl implements GoogleDriveSync {
  private accessToken: string | null = null;
  private initialized = false;
  private remoteChatMetadata: Map<string, ChatMetadata> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await initializeStores();
      this.initialized = true;
    }
  }

  // Authentication methods
  async authenticate(): Promise<void> {
    try {
      // Get authorization URL from backend
      const urlResponse = await fetch("/api/auth/google/url");
      if (!urlResponse.ok) {
        throw new Error("Failed to get authorization URL");
      }

      const { auth_url } = await urlResponse.json();

      // Redirect to Google OAuth (server-side redirect)
      window.location.href = auth_url;
    } catch (error) {
      throw new Error(
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async handleAuthSuccess(encodedToken: string): Promise<void> {
    try {
      // Decode the token data
      const tokenData: TokenData = JSON.parse(
        Buffer.from(encodedToken, "base64").toString(),
      );

      // Store tokens in localStorage
      setTokens(tokenData);
      this.accessToken = tokenData.access_token;
    } catch (error) {
      throw new Error(
        `Token processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const tokens = getTokens();

    if (!tokens) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(tokens)) {
      // Try to refresh token
      try {
        await this.refreshAccessToken();
        return true;
      } catch {
        return false;
      }
    }

    this.accessToken = tokens.access_token;
    return true;
  }

  private async refreshAccessToken(): Promise<void> {
    const currentTokens = getTokens();
    if (!currentTokens?.refresh_token) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: currentTokens.refresh_token }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const newTokens = await response.json();

    // Update tokens with new access token and expiry
    const updatedTokens: TokenData = {
      ...currentTokens,
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
      timestamp: Date.now(),
    };

    setTokens(updatedTokens);
    this.accessToken = newTokens.access_token;
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    clearTokens();
    await this.ensureInitialized();
    await del(SYNC_METADATA_KEY, SYNC_METADATA_STORE);
  }

  private async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      const tokens = getTokens();
      if (!tokens) {
        throw new Error("Not authenticated");
      }
      this.accessToken = tokens.access_token;
    }
    return this.accessToken!;
  }

  // Google Drive API helpers
  private async makeDriveRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${GOOGLE_DRIVE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error(
        "Authentication expired. Please reconnect to Google Drive.",
      );
    }

    return response;
  }

  private async findOrCreateAppFolder(): Promise<string> {
    // Search for existing app folder
    const searchResponse = await this.makeDriveRequest(
      `/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("Google Drive folder search failed:", {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Failed to search for app folder: ${searchResponse.status} ${searchResponse.statusText}`,
      );
    }

    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const createResponse = await this.makeDriveRequest("/files", {
      method: "POST",
      body: JSON.stringify({
        name: APP_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Google Drive folder creation failed:", {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Failed to create app folder: ${createResponse.status} ${createResponse.statusText}`,
      );
    }

    const folderData = await createResponse.json();
    return folderData.id;
  }

  private async findExistingSyncFile(): Promise<string | null> {
    try {
      const appFolderId = await this.findOrCreateAppFolder();

      // Search for existing sync file in the app folder
      const searchResponse = await this.makeDriveRequest(
        `/files?q=name='simple-chat-sync.json' and '${appFolderId}' in parents and trashed=false`,
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error("Google Drive sync file search failed:", {
          status: searchResponse.status,
          statusText: searchResponse.statusText,
          error: errorText,
        });
        return null;
      }

      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        // Return the most recently modified file
        const sortedFiles = (searchData.files as GoogleDriveFile[]).sort(
          (a: GoogleDriveFile, b: GoogleDriveFile) =>
            new Date(b.modifiedTime).getTime() -
            new Date(a.modifiedTime).getTime(),
        );
        return sortedFiles[0].id;
      }

      return null;
    } catch (error) {
      console.error("Error searching for existing sync file:", error);
      return null;
    }
  }

  // Sync operations
  async syncToDrive(): Promise<void> {
    if (!(await this.isAuthenticated())) {
      throw new Error("Not authenticated");
    }

    const appFolderId = await this.findOrCreateAppFolder();

    // Step 1: Sync configuration and chat metadata
    await this.syncConfigToDrive(appFolderId);

    // Step 2: Sync individual chats that have been modified
    await this.syncModifiedChatsToDrive(appFolderId);

    // Step 3: Upload any missing assets
    await this.syncAssetsToDrive(appFolderId);
  }

  private async syncConfigToDrive(appFolderId: string): Promise<void> {
    try {
      // Get providers and preferences data
      const { useProviderStore } = await import("../stores/provider");
      const { usePreferencesStore } = await import("../stores/perferences");
      const { readConversationIndex } = await import(
        "../stores/utils/conversation-db"
      );

      const [providerStore, preferencesStore, conversationIndex] =
        await Promise.all([
          useProviderStore.getState(),
          usePreferencesStore.getState(),
          readConversationIndex(),
        ]);

      // Get remote chat metadata to compare by reading existing config file
      const remoteConfigData = (await this.downloadFileFromDrive(
        CONFIG_FILE_NAME,
        appFolderId,
      )) as ConfigData | null;
      const remoteChatTimestamps = new Map<string, number>();

      if (remoteConfigData?.chats) {
        for (const chat of remoteConfigData.chats) {
          remoteChatTimestamps.set(chat.id, chat.lastModified);
        }
      }

      // Create chat metadata
      const { readConversationBody } = await import(
        "../stores/utils/conversation-db"
      );
      const chatMetadata: ChatMetadata[] = [];

      for (const chatId of conversationIndex.ids) {
        const header = conversationIndex.headersById[chatId];
        if (header) {
          const body = await readConversationBody<Message>(chatId);
          chatMetadata.push({
            id: chatId,
            title: header.title,
            lastModified: header.createdAt,
            folderId: header.folderId || undefined,
            messageCount: body?.messages?.length || 0,
          });
        }
      }

      // Find chats that were deleted locally and need to be removed from config
      const chatsToRemoveFromConfig: string[] = [];
      for (const remoteChatId of remoteChatTimestamps.keys()) {
        if (!conversationIndex.ids.includes(remoteChatId)) {
          chatsToRemoveFromConfig.push(remoteChatId);
        }
      }

      if (chatsToRemoveFromConfig.length > 0) {
        console.log(
          `Removing ${chatsToRemoveFromConfig.length} deleted chats from config`,
        );
      }

      const configData: ConfigData = {
        version: "0.2.0",
        timestamp: Date.now(),
        providers: providerStore.providers,
        preferences: preferencesStore,
        chats: chatMetadata, // Only includes existing chats
      };

      // Upload config file
      const configFileId = await this.uploadFileToDrive(
        CONFIG_FILE_NAME,
        JSON.stringify(configData, null, 2),
        "application/json",
        appFolderId,
      );

      console.log("Config file uploaded:", configFileId);
    } catch (error) {
      console.error("Failed to sync config:", error);
      throw error;
    }
  }

  private async syncModifiedChatsToDrive(appFolderId: string): Promise<void> {
    try {
      const { readConversationIndex, readConversationBody } = await import(
        "../stores/utils/conversation-db"
      );
      const conversationIndex = await readConversationIndex();

      // Get local chat timestamps
      const localChatTimestamps = new Map<string, number>();
      for (const chatId of conversationIndex.ids) {
        const header = conversationIndex.headersById[chatId];
        if (header?.createdAt) {
          localChatTimestamps.set(chatId, header.createdAt);
        }
      }

      // Get remote chat timestamps (from config file)
      const remoteChatTimestamps = await this.getRemoteChatTimestamps();

      // Find chats that need to be uploaded (new or modified)
      const chatsToUpload: string[] = [];
      for (const [chatId, localTimestamp] of localChatTimestamps) {
        const remoteTimestamp = remoteChatTimestamps.get(chatId);
        if (!remoteTimestamp || localTimestamp > remoteTimestamp) {
          chatsToUpload.push(chatId);
        }
      }

      // Find chats that were deleted locally (exist remotely but not locally)
      const chatsToDelete: string[] = [];
      for (const remoteChatId of remoteChatTimestamps.keys()) {
        if (!localChatTimestamps.has(remoteChatId)) {
          chatsToDelete.push(remoteChatId);
        }
      }

      console.log(`Uploading ${chatsToUpload.length} modified chats`);
      console.log(`Deleting ${chatsToDelete.length} remote chats`);

      // Delete remote chat files that no longer exist locally
      for (const chatId of chatsToDelete) {
        const fileName = `${CHAT_FILE_PREFIX}${chatId}.json`;
        await this.deleteRemoteFile(fileName, appFolderId);
      }

      // Upload each modified chat
      for (const chatId of chatsToUpload) {
        const body = await readConversationBody<Message>(chatId);
        const header = conversationIndex.headersById[chatId];

        if (body && header) {
          const chatData: ChatData = {
            id: chatId,
            title: header.title,
            messages: body.messages,
            lastModified: header.createdAt,
            folderId: header.folderId || undefined,
          };

          const fileName = `${CHAT_FILE_PREFIX}${chatId}.json`;
          await this.uploadFileToDrive(
            fileName,
            JSON.stringify(chatData, null, 2),
            "application/json",
            appFolderId,
          );
        }
      }
    } catch (error) {
      console.error("Failed to sync modified chats:", error);
      throw error;
    }
  }

  private async syncAssetsToDrive(appFolderId: string): Promise<void> {
    try {
      const { listAllAssets } = await import("../stores/utils/asset-db");
      const assets = await listAllAssets();

      // Check which assets are already uploaded
      const uploadedAssets = await this.getUploadedAssetIds();

      // Find assets that need to be uploaded (new)
      const assetsToUpload = assets.filter(
        (asset) => !uploadedAssets.has(asset.id),
      );

      // Find assets that were deleted locally (exist remotely but not locally)
      const assetsToDelete: string[] = [];
      for (const uploadedAssetId of uploadedAssets) {
        if (!assets.some((asset) => asset.id === uploadedAssetId)) {
          assetsToDelete.push(uploadedAssetId);
        }
      }

      console.log(`Uploading ${assetsToUpload.length} new assets`);
      console.log(`Deleting ${assetsToDelete.length} remote assets`);

      // Delete remote asset files that no longer exist locally
      for (const assetId of assetsToDelete) {
        // Since Google Drive API doesn't support wildcards in filenames for search,
        // we need to find all asset files and match by ID
        await this.deleteRemoteAsset(assetId, appFolderId);
      }

      // Upload new assets
      for (const asset of assetsToUpload) {
        const fileName = `${ASSET_FILE_PREFIX}${asset.id}.${this.getFileExtension(asset.mimeType)}`;
        const driveFileId = await this.uploadFileToDrive(
          fileName,
          asset.blob,
          asset.mimeType,
          appFolderId,
        );

        // Update local asset record with Google Drive file ID
        if (driveFileId) {
          const { importAsset } = await import("../stores/utils/asset-db");
          const updatedAsset = { ...asset, driveFileId };
          await importAsset(updatedAsset);
          console.log(
            `Updated local asset ${asset.id} with Drive file ID: ${driveFileId}`,
          );
        }
      }
    } catch (error) {
      console.error("Failed to sync assets:", error);
      throw error;
    }
  }

  async syncFromDrive(): Promise<void> {
    if (!(await this.isAuthenticated())) {
      throw new Error("Not authenticated");
    }

    const appFolderId = await this.findOrCreateAppFolder();

    // Step 1: Sync configuration
    await this.syncConfigFromDrive(appFolderId);

    // Step 2: Sync chats that have been modified
    await this.syncModifiedChatsFromDrive(appFolderId);

    // Step 3: Update asset references (assets are fetched on demand)
    await this.updateAssetReferences();
  }

  private async syncConfigFromDrive(appFolderId: string): Promise<void> {
    try {
      // Download config file
      const configData = (await this.downloadFileFromDrive(
        CONFIG_FILE_NAME,
        appFolderId,
      )) as ConfigData;

      if (!configData) {
        console.log("No config file found, starting fresh");
        return;
      }

      // Import providers
      if (configData.providers) {
        const { useProviderStore } = await import("../stores/provider");
        useProviderStore.setState({ providers: configData.providers });
      }

      // Import preferences
      if (configData.preferences) {
        const { usePreferencesStore } = await import("../stores/perferences");
        const preferencesStore = usePreferencesStore.getState();
        preferencesStore.updateSettings(configData.preferences);
      }

      // Store remote chat metadata for comparison
      this.remoteChatMetadata = new Map(
        configData.chats.map((chat) => [chat.id, chat]),
      );

      console.log(`Loaded config with ${configData.chats.length} chats`);
    } catch (error) {
      console.error("Failed to sync config from drive:", error);
      throw error;
    }
  }

  private async syncModifiedChatsFromDrive(appFolderId: string): Promise<void> {
    try {
      if (!this.remoteChatMetadata) return;

      const { readConversationIndex, deleteConversation } = await import(
        "../stores/utils/conversation-db"
      );
      const conversationIndex = await readConversationIndex();

      // Get local chat IDs
      const localChatIds = new Set(conversationIndex.ids);

      // Get remote chat IDs
      const remoteChatIds = new Set(this.remoteChatMetadata.keys());

      // Find chats to delete locally (exist locally but not remotely)
      const chatsToDeleteLocally = [];
      for (const localChatId of localChatIds) {
        if (!remoteChatIds.has(localChatId)) {
          chatsToDeleteLocally.push(localChatId);
        }
      }

      // Find chats to download (exist remotely)
      const chatsToDownload = Array.from(remoteChatIds);

      console.log(
        `Deleting ${chatsToDeleteLocally.length} local chats not in remote`,
      );
      console.log(`Downloading ${chatsToDownload.length} chats from remote`);

      // Delete local chats that no longer exist remotely
      for (const chatId of chatsToDeleteLocally) {
        try {
          await deleteConversation(chatId);
          console.log(`Deleted local chat: ${chatId}`);
        } catch (error) {
          console.error(`Failed to delete local chat ${chatId}:`, error);
        }
      }

      // Download all remote chats (overwrite mode)
      for (const chatId of chatsToDownload) {
        try {
          const fileName = `${CHAT_FILE_PREFIX}${chatId}.json`;
          const chatData = (await this.downloadFileFromDrive(
            fileName,
            appFolderId,
          )) as ChatData;

          if (chatData) {
            await this.importChatData(chatData);
            console.log(`Downloaded remote chat: ${chatId}`);
          } else {
            console.warn(`Failed to download chat data for: ${chatId}`);
          }
        } catch (error) {
          console.error(`Failed to download/import chat ${chatId}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to sync modified chats from drive:", error);
      throw error;
    }
  }

  private async updateAssetReferences(): Promise<void> {
    // Update local asset records with Google Drive file IDs and restore missing assets
    try {
      const appFolderId = await this.findOrCreateAppFolder();
      const { importAsset, getAsset } = await import(
        "../stores/utils/asset-db"
      );

      // Get all asset files from Google Drive
      const response = await this.makeDriveRequest(
        `/files?q=name contains '${ASSET_FILE_PREFIX}' and '${appFolderId}' in parents and trashed=false&fields=files(id,name,mimeType,size,createdTime)`,
      );

      if (!response.ok) {
        console.error("Failed to list asset files from Google Drive");
        return;
      }

      const data = await response.json();
      const driveAssetFiles = data.files || [];

      // Process each remote asset file
      for (const file of driveAssetFiles) {
        // Extract asset ID from filename (simple-chat-asset-{assetId}.{ext})
        const match = file.name.match(
          new RegExp(`${ASSET_FILE_PREFIX}(.+?)\\.`),
        );
        if (match) {
          const assetId = match[1];

          // Check if asset exists locally
          const localAsset = await getAsset(assetId);

          if (!localAsset) {
            // Asset exists remotely but not locally - restore it
            console.log(
              `Asset ${assetId} exists remotely but not locally, restoring...`,
            );

            try {
              // Download the asset from Google Drive
              const downloadResponse = await this.makeDriveRequest(
                `/files/${file.id}?alt=media`,
              );
              if (!downloadResponse.ok) {
                console.error(
                  `Failed to download asset ${assetId} from Google Drive`,
                );
                continue;
              }

              const blob = await downloadResponse.blob();

              // Create the asset record
              const restoredAsset = {
                id: assetId,
                type: this.getAssetTypeFromMimeType(file.mimeType),
                mimeType: file.mimeType,
                name: file.name,
                size: file.size,
                createdAt: new Date(file.createdTime).getTime(),
                blob: blob,
                driveFileId: file.id, // Store the remote file ID
              };

              // Save to local database
              await importAsset(restoredAsset);
              console.log(`Restored asset ${assetId} from Google Drive`);
            } catch (downloadError) {
              console.error(
                `Failed to restore asset ${assetId}:`,
                downloadError,
              );
            }
          } else if (localAsset && !localAsset.driveFileId) {
            // Asset exists locally but missing drive file ID - update it
            const updatedAsset = { ...localAsset, driveFileId: file.id };
            await importAsset(updatedAsset);
            console.log(
              `Updated asset ${assetId} with Drive file ID: ${file.id}`,
            );
          }
          // If asset exists locally with driveFileId, it's already properly linked
        }
      }

      console.log(
        `Processed ${driveAssetFiles.length} remote assets - restored missing local assets and updated references`,
      );
    } catch (error) {
      console.error("Failed to update asset references:", error);
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const isAuthenticated = await this.isAuthenticated();
    const metadata = await this.getSyncMetadata();

    return {
      isAuthenticated,
      isSyncing: false, // This would be managed by the UI
      lastSyncTime: metadata?.lastSyncTime || null,
      error: null,
      progress: 0,
    };
  }

  async getUserProfile(): Promise<TokenData["profile"]> {
    const tokens = getTokens();
    return tokens?.profile || null;
  }

  async getAssetWithFallback(assetId: string): Promise<AssetRecord | null> {
    const { getAsset } = await import("../stores/utils/asset-db");
    return await getAsset(assetId);
  }

  async getSyncMetadata(): Promise<SyncMetadata | null> {
    await this.ensureInitialized();
    return (await get(SYNC_METADATA_KEY, SYNC_METADATA_STORE)) || null;
  }

  async updateSyncMetadata(updates: Partial<SyncMetadata>): Promise<void> {
    await this.ensureInitialized();
    const current = await this.getSyncMetadata();
    const updated = { ...current, ...updates } as SyncMetadata;
    await set(SYNC_METADATA_KEY, updated, SYNC_METADATA_STORE);
  }

  // Helper methods for new sync architecture
  private async uploadFileToDrive(
    fileName: string,
    content: string | Blob,
    mimeType: string,
    folderId: string,
  ): Promise<string> {
    // Check if file already exists
    const existingFileId = await this.findFileByName(fileName, folderId);

    if (existingFileId) {
      // Update existing file
      const updateResponse = await this.makeDriveRequest(
        `/files/${existingFileId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: fileName,
            mimeType: mimeType,
          }),
        },
      );

      if (!updateResponse.ok) {
        throw new Error(
          `Failed to update file metadata: ${updateResponse.status}`,
        );
      }

      // Upload new content
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
            "Content-Type": mimeType,
          },
          body: content,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(
          `Failed to upload file content: ${uploadResponse.status}`,
        );
      }

      return existingFileId;
    } else {
      // Create new file
      if (typeof content === "string") {
        const boundary =
          "----FormBoundary" + Math.random().toString(36).substr(2, 9);
        const multipartBody = [
          `--${boundary}`,
          "Content-Type: application/json; charset=UTF-8",
          "",
          JSON.stringify({ name: fileName, parents: [folderId] }),
          `--${boundary}`,
          `Content-Type: ${mimeType}`,
          "",
          content,
          `--${boundary}--`,
          "",
        ].join("\r\n");

        const response = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await this.getAccessToken()}`,
              "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to create file: ${response.status}`);
        }

        const data = await response.json();
        return data.id;
      } else {
        // Handle Blob uploads (for assets) using proper multipart format
        const boundary =
          "----FormBoundary" + Math.random().toString(36).substr(2, 9);

        // Convert blob to base64 for multipart
        const arrayBuffer = await content.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, (byte) =>
          String.fromCharCode(byte),
        ).join("");
        const base64Data = btoa(binaryString);

        const multipartBody = [
          `--${boundary}`,
          "Content-Type: application/json; charset=UTF-8",
          "",
          JSON.stringify({ name: fileName, parents: [folderId] }),
          `--${boundary}`,
          `Content-Type: ${mimeType}`,
          "Content-Transfer-Encoding: base64",
          "",
          base64Data,
          `--${boundary}--`,
          "",
        ].join("\r\n");

        const response = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${await this.getAccessToken()}`,
              "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Asset upload failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            fileName,
            mimeType,
            boundary,
          });
          throw new Error(
            `Failed to upload asset: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        return data.id;
      }
    }
  }

  private async downloadFileFromDrive(
    fileName: string,
    folderId: string,
  ): Promise<unknown> {
    try {
      const fileId = await this.findFileByName(fileName, folderId);
      if (!fileId) return null;

      const response = await this.makeDriveRequest(
        `/files/${fileId}?alt=media`,
      );
      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await response.json();
      } else {
        return await response.blob();
      }
    } catch (error) {
      console.error(`Failed to download file ${fileName}:`, error);
      return null;
    }
  }

  private async findFileByName(
    fileName: string,
    folderId: string,
  ): Promise<string | null> {
    try {
      const response = await this.makeDriveRequest(
        `/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`,
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.files?.[0]?.id || null;
    } catch (error) {
      console.error(`Failed to find file ${fileName}:`, error);
      return null;
    }
  }

  private async getRemoteChatTimestamps(): Promise<Map<string, number>> {
    const timestamps = new Map<string, number>();
    if (this.remoteChatMetadata) {
      for (const [chatId, metadata] of this.remoteChatMetadata) {
        timestamps.set(chatId, metadata.lastModified);
      }
    }
    return timestamps;
  }

  private async getUploadedAssetIds(): Promise<Set<string>> {
    try {
      const appFolderId = await this.findOrCreateAppFolder();
      const response = await this.makeDriveRequest(
        `/files?q=name contains '${ASSET_FILE_PREFIX}' and '${appFolderId}' in parents and trashed=false`,
      );

      if (!response.ok) return new Set();

      const data = await response.json();
      const assetIds = new Set<string>();

      for (const file of data.files || []) {
        // Extract asset ID from filename
        const match = file.name.match(
          new RegExp(`${ASSET_FILE_PREFIX}(.+?)\\.`),
        );
        if (match) {
          assetIds.add(match[1]);
        }
      }

      return assetIds;
    } catch (error) {
      console.error("Failed to get uploaded asset IDs:", error);
      return new Set();
    }
  }

  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "application/pdf": "pdf",
    };
    return mimeToExt[mimeType] || "bin";
  }

  private getAssetTypeFromMimeType(mimeType: string): "image" | "pdf" | "file" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    return "file";
  }

  private async deleteRemoteFile(
    fileName: string,
    folderId: string,
  ): Promise<void> {
    try {
      const fileId = await this.findFileByName(fileName, folderId);
      if (!fileId) {
        console.log(`File ${fileName} not found remotely, skipping delete`);
        return;
      }

      const response = await this.makeDriveRequest(`/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error(
          `Failed to delete remote file ${fileName}:`,
          response.status,
        );
      } else {
        console.log(`Successfully deleted remote file: ${fileName}`);
      }
    } catch (error) {
      console.error(`Error deleting remote file ${fileName}:`, error);
    }
  }

  private async deleteRemoteAsset(
    assetId: string,
    folderId: string,
  ): Promise<void> {
    try {
      // Find all asset files and match by asset ID
      const response = await this.makeDriveRequest(
        `/files?q=name contains '${ASSET_FILE_PREFIX}${assetId}' and '${folderId}' in parents and trashed=false`,
      );

      if (!response.ok) {
        console.error(
          `Failed to search for asset ${assetId}:`,
          response.status,
        );
        return;
      }

      const data = await response.json();
      const assetFiles = data.files || [];

      // Delete all matching files (should typically be just one)
      for (const file of assetFiles) {
        const deleteResponse = await this.makeDriveRequest(
          `/files/${file.id}`,
          {
            method: "DELETE",
          },
        );

        if (!deleteResponse.ok) {
          console.error(
            `Failed to delete asset file ${file.name}:`,
            deleteResponse.status,
          );
        } else {
          console.log(`Successfully deleted asset file: ${file.name}`);
        }
      }
    } catch (error) {
      console.error(`Error deleting remote asset ${assetId}:`, error);
    }
  }

  private async importChatData(chatData: ChatData): Promise<void> {
    const { useConversationStore } = await import("../stores/conversation");
    const conversationStore = useConversationStore.getState();

    // Create conversation header
    const header = {
      id: chatData.id,
      title: chatData.title || "Untitled Chat",
      createdAt: chatData.lastModified,
      folderId: chatData.folderId,
    };

    // Import the conversation
    await conversationStore.importConversations({
      headers: [header],
      folders: [],
      bodies: {
        [chatData.id]: {
          messages: chatData.messages,
        },
      },
    });
  }
}

// Export singleton instance
export const googleDriveSync = new GoogleDriveSyncImpl();
