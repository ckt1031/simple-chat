"use client";

import { Trash2, Settings } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui";
import { useConversationStore } from "@/lib/stores/conversation";
import { usePreferencesStore } from "@/lib/stores/perferences";
import { useProviderStore } from "@/lib/stores/provider";
import Button from "@/components/ui/Button";

export default function ResetSettings() {
  const openDeleteConfirmation = useUIStore((s) => s.openDeleteConfirmation);
  const closeSettings = useUIStore((s) => s.closeSettings);

  const conversationStore = useConversationStore();
  const preferencesStore = usePreferencesStore();
  const providerStore = useProviderStore();

  const handleClearAllChats = () => {
    openDeleteConfirmation(
      "Clear All Chats",
      "This will permanently delete all your conversations. This action cannot be undone.",
      async () => {
        try {
          // Clear all conversations from database and reset store state
          await conversationStore.clearAllConversations();

          // Close settings modal
          closeSettings();
        } catch (error) {
          console.error("Error clearing all chats:", error);
        }
      },
    );
  };

  const handleResetAllSettings = () => {
    openDeleteConfirmation(
      "Reset All Settings",
      "This will reset all settings to their default values, including provider configurations and preferences. This action cannot be undone.",
      async () => {
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

          // Close settings modal
          closeSettings();
        } catch (error) {
          console.error("Error resetting all settings:", error);
        }
      },
    );
  };

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-white">
          Danger Zone
        </h4>

        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <Button variant="danger" onClick={handleClearAllChats}>
            Clear All Chats
          </Button>

          <Button variant="danger" onClick={handleResetAllSettings}>
            Reset All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
