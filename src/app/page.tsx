"use client";

import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Chat } from "@/components/Chat";
import { SettingsModal } from "@/components/Settings/Modal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import EditTitleModal from "@/components/EditTitleModal";
import { useGlobalStore } from "@/lib/stores/global";
import { ModelSelector } from "@/components/ModelSelector";
import { Suspense } from "react";
import ChatOptionMenu from "@/components/ChatOptionMenu";
import { useSearchParams } from "next/navigation";
import { useConversationStore } from "@/lib/stores/conversation";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

function HomePageContent() {
  const chatId = useSearchParams().get("id");

  const { toggleSidebar, openEditTitle, openDeleteConfirmation } =
    useGlobalStore(
      useShallow((s) => ({
        toggleSidebar: s.toggleSidebar,
        openEditTitle: s.openEditTitle,
        openDeleteConfirmation: s.openDeleteConfirmation,
      })),
    );

  const { currentConversationId, deleteConversation } = useConversationStore(
    useShallow((s) => ({
      currentConversationId: s.currentConversationId,
      deleteConversation: s.deleteConversation,
    })),
  );

  const router = useRouter();

  return (
    <div className="h-screen flex bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Sidebar overlayed */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-2 sm:p-3 flex-row gap-2 flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Model Selector here */}
          <ModelSelector />
          {/* Mobile actions menu on the right */}
          <div className="ml-auto lg:hidden relative">
            <ChatOptionMenu
              alwaysShowButton={true}
              onEdit={() => {
                if (currentConversationId) openEditTitle(currentConversationId);
              }}
              onDelete={() => {
                if (!currentConversationId) return;
                openDeleteConfirmation(
                  "Delete Conversation",
                  "Are you sure you want to delete this conversation? This action cannot be undone.",
                  () => {
                    deleteConversation(currentConversationId);
                    router.push("/");
                  },
                );
              }}
              size="md"
              align="right"
              disabled={!currentConversationId}
              buttonClassName="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            />
          </div>
        </div>

        {/* Chat Area fills full width; sidebar overlays */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Chat chatId={chatId} />
        </div>
      </div>

      {/* Settings Modal with global state */}
      <SettingsModal />

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
