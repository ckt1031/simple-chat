"use client";

import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Chat } from "@/components/Chat";
import { SettingsModal } from "@/components/Settings/Modal";
import { ChatManagementModal } from "@/components/Chat/Management";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import EditTitleModal from "@/components/EditTitleModal";
import ModelSelector from "@/components/ModelSelector";
import { Suspense } from "react";
import ChatOptionMenu from "@/components/Chat/ChatOptionMenu";
import { useUIStore } from "@/lib/stores/ui";

function HomePageContent() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

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
