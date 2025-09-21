"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  Settings,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useConversationStore, Message } from "@/lib/stores/conversation";
import {
  useProviderStore,
  ProviderState,
  ModelWithProvider,
} from "@/lib/stores/provider";
import { usePreferencesStore } from "@/lib/stores/perferences";
import {
  readConversationIndex,
  readFolderIndex,
  readConversationBody,
  clearAllConversations,
  ConversationFolder,
  ConversationHeader,
  ConversationBody,
} from "@/lib/stores/utils/conversation-db";
import {
  listAllAssets,
  importAssets,
  AssetRecord,
} from "@/lib/stores/utils/asset-db";

interface ExportData {
  version: string;
  timestamp: number;
  conversations: {
    headers: ConversationHeader[];
    folders: ConversationFolder[];
    bodies: Record<string, ConversationBody<Message>>;
  };
  providers: Record<string, ProviderState>;
  preferences: ModelWithProvider | null;
  assets: AssetRecord[];
}

export default function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const conversationStore = useConversationStore();
  const providerStore = useProviderStore();
  const preferencesStore = usePreferencesStore();

  const exportData = async (type: "conversations" | "config" | "full") => {
    setIsExporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const exportData: Partial<ExportData> = {
        version: "0.1.0",
        timestamp: Date.now(),
      };

      if (type === "conversations" || type === "full") {
        const [conversationIndex, folderIndex] = await Promise.all([
          readConversationIndex(),
          readFolderIndex(),
        ]);

        // Get all conversation bodies
        const bodies: Record<string, ConversationBody<Message>> = {};
        for (const id of conversationIndex.ids) {
          const body = await readConversationBody<Message>(id);
          if (body) {
            bodies[id] = body;
          }
        }

        exportData.conversations = {
          headers: conversationIndex.ids
            .map((id) => conversationIndex.headersById[id])
            .filter(Boolean),
          folders: folderIndex.ids
            .map((id) => folderIndex.byId[id])
            .filter(Boolean),
          bodies,
        };
      }

      if (type === "config" || type === "full") {
        exportData.providers = providerStore.providers;
        exportData.preferences = preferencesStore.defaultModel;
      }

      if (type === "full") {
        exportData.assets = await listAllAssets();
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `simple-chat-${type}-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportSuccess(`${type} data exported successfully!`);
    } catch (error) {
      setImportError(
        `Failed to export ${type} data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.version || !data.timestamp) {
        throw new Error("Invalid export file format");
      }

      // Import conversations if present
      if (data.conversations) {
        // Clear existing conversations first
        await conversationStore.clearAllConversations();

        // Import conversations using the store method
        await conversationStore.importConversations({
          headers: data.conversations.headers || [],
          folders: data.conversations.folders || [],
          bodies: data.conversations.bodies || {},
        });
      }

      // Import providers if present
      if (data.providers) {
        providerStore.providers = data.providers;
      }

      // Import preferences if present
      if (data.preferences) {
        preferencesStore.updateSettings({ defaultModel: data.preferences });
      }

      // Import assets if present
      if (data.assets && data.assets.length > 0) {
        await importAssets(data.assets);
      }

      setImportSuccess(
        "Data imported successfully! Please refresh the page to see changes.",
      );
    } catch (error) {
      setImportError(
        `Failed to import data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const clearAllData = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all data? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsClearing(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      await conversationStore.clearAllConversations();
      // Clear providers and preferences
      providerStore.providers = {};
      preferencesStore.updateSettings({ defaultModel: null });

      setImportSuccess("All data cleared successfully!");
    } catch (error) {
      setImportError(
        `Failed to clear data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsClearing(false);
    }
  };

  const resetAllSettings = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all settings to default values? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsResetting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      // Reset preferences to default
      preferencesStore.updateSettings({
        defaultModel: null,
      });

      // Reset all providers to default state
      const allProviders = providerStore.getAllProviders();
      for (const provider of allProviders) {
        providerStore.updateProvider(
          provider.type === "official" ? provider.provider : provider.id,
          {
            enabled: false,
            apiKey: "",
            apiBaseURL: "",
            models: [],
          },
        );
      }

      setImportSuccess("All settings reset to default values!");
    } catch (error) {
      setImportError(
        `Failed to reset settings: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Header */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 rounded-xl">
        <div className="flex items-start gap-3 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Work in Progress - Data Format Not Standardized
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This feature is currently in development. The data format is not
              standardized, versioned, or pinned. We take no responsibility for
              data loss or corruption until version 1.0. Please use with caution
              and always keep backups of your important data.
            </p>
          </div>
        </div>
      </Card>

      {/* Export Section */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Export your chat data, configuration, or complete application data
            to a JSON file.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => exportData("conversations")}
              disabled={isExporting}
              variant="secondary"
              className="w-full"
            >
              {isExporting ? "Exporting..." : "Export Conversations"}
            </Button>
            <Button
              onClick={() => exportData("config")}
              disabled={isExporting}
              variant="secondary"
              className="w-full"
            >
              {isExporting ? "Exporting..." : "Export Config"}
            </Button>
            <Button
              onClick={() => exportData("full")}
              disabled={isExporting}
              variant="secondary"
              className="w-full"
            >
              {isExporting ? "Exporting..." : "Export All Data"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Import Section */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Import previously exported data. This will replace your current
            data.
          </p>

          <div className="space-y-3">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              disabled={isImporting}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 dark:file:bg-neutral-800 dark:file:text-neutral-300 dark:hover:file:bg-neutral-700"
            />
            {isImporting && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Importing data...
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Clear Data Section */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Permanently delete data or reset settings. These actions cannot be
            undone.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={clearAllData}
              disabled={isClearing}
              variant="danger"
              className="flex-1"
            >
              {isClearing ? "Clearing..." : "Clear All Data"}
            </Button>
            <Button
              onClick={resetAllSettings}
              disabled={isResetting}
              variant="danger"
              className="flex-1"
            >
              {isResetting ? "Resetting..." : "Reset Settings"}
            </Button>
          </div>

          <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>
              <strong>Clear All Data:</strong> Deletes all conversations,
              settings, and data
            </p>
            <p>
              <strong>Reset Settings:</strong> Resets provider configurations
              and preferences to defaults
            </p>
          </div>
        </div>
      </Card>

      {/* Status Messages */}
      {importError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <div className="p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              {importError}
            </p>
          </div>
        </Card>
      )}

      {importSuccess && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 rounded-xl">
          <div className="p-4">
            <p className="text-sm text-green-700 dark:text-green-300">
              {importSuccess}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
