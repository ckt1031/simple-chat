"use client";

import { X } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";
import { useHotkeys } from "react-hotkeys-hook";
import ChatList from "./ChatList";

export default function ChatManagementModal() {
  const closeChatManagement = useUIStore((s) => s.closeChatManagement);

  useHotkeys("esc", () => closeChatManagement());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div
        className="
        bg-white dark:bg-neutral-900 shadow-xl h-full
        min-w-[320px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[700px]
        w-full sm:w-[90vw]
        sm:h-[80vh] sm:max-w-4xl sm:rounded-2xl
        flex flex-col
        sm:border-2 border-neutral-500 dark:border-neutral-700
      "
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 sm:hidden">
          <h2 className="text-base font-semibold">Chat Management</h2>
          <button
            onClick={closeChatManagement}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            aria-label="Close chat management"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">
            Chat Management
          </h2>
          <button
            onClick={closeChatManagement}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            aria-label="Close chat management"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <ChatList />
        </div>
      </div>
    </div>
  );
}
