"use client";

import { Menu, Save } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Chat } from "@/components/Chat";
import { SettingsModal } from "@/components/Settings/Modal";
import { ChatManagementModal } from "@/components/Chat/Management";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import EditTitleModal from "@/components/EditTitleModal";
import ModelSelector from "@/components/ModelSelector";
import { Suspense, useEffect } from "react";
import ChatOptionMenu from "@/components/Chat/ChatOptionMenu";
import { useUIStore } from "@/lib/stores/ui";
import { useConversationStore } from "@/lib/stores/conversation";
import { googleDriveSync } from "@/lib/utils/google-drive";

function HomePageContent() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const isPersisting = useConversationStore((s) => s.isPersisting);

  // Handle Google OAuth callback and auto-sync on load
  useEffect(() => {
    const handleGoogleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get("google_auth_success");

      const error = urlParams.get("error");

      if (authSuccess) {
        try {
          await googleDriveSync.handleAuthSuccess(authSuccess);
          // Clean up URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          // Show success message (you could add a toast notification here)
          console.log("Google Drive authentication successful!");
        } catch (err) {
          console.error("Google Drive authentication failed:", err);
        }
      } else if (error) {
        console.error("Google Drive authentication error:", error);
        // Clean up URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    };

    handleGoogleAuth();
  }, []);

  return (
    <div className="h-full flex bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Sidebar overlayed */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden">
        {/* Header */}
        <header className="flex items-center p-2 sm:p-3 flex-row gap-2 flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Model Selector here */}
          <ModelSelector />
          {/* Persistence indicator */}
          {isPersisting && (
            <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <Save className="w-3 h-3 animate-pulse" />
              <span>Saving...</span>
            </div>
          )}
          {/* Mobile actions menu on the right */}
          <div className="ml-auto lg:hidden relative">
            <ChatOptionMenu
              alwaysShowButton={true}
              size="md"
              align="right"
              buttonClassName="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            />
          </div>
        </header>

        {/* Chat Area fills full width; sidebar overlays */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <Chat />
        </main>
      </div>

      {/* Settings Modal with global state */}
      <SettingsModal />

      {/* Chat Management Modal */}
      <ChatManagementModal />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />

      {/* Edit Title Modal */}
      <EditTitleModal />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}
