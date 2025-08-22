"use client";

import {
  SquarePen,
  Settings,
  Image as ImageIcon,
  PanelLeftClose,
} from "lucide-react";
import { useGlobalStore } from "@/lib/stores/global";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/shallow";
import { Conversations } from "./Conversations";
import Link from "next/link";
import { memo } from "react";

function Sidebar() {
  const { isSidebarOpen, toggleSidebar, closeSidebar, openSettings } =
    useGlobalStore(
      useShallow((s) => ({
        isSidebarOpen: s.ui.isSidebarOpen,
        toggleSidebar: s.toggleSidebar,
        closeSidebar: s.closeSidebar,
        openSettings: s.openSettings,
      })),
    );

  const pathname = usePathname();

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transform bg-neutral-100 dark:bg-neutral-800 border-r md:border-0 border-neutral-200 dark:border-neutral-800 shadow-lg",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:left-auto lg:top-auto lg:shadow-none",
          isSidebarOpen ? "lg:translate-x-0 lg:block" : "lg:hidden",
        )}
        style={{ width: 256 }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 dark:border-neutral-700 mb-2">
            <h1 className="text-lg font-bold text-neutral-700 dark:text-white">
              Simple Chat
            </h1>
            <button
              onClick={toggleSidebar}
              className="text-neutral-500 dark:text-white rounded-full lg:hidden"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>
          <div className="px-1.5 flex items-center justify-between">
            <Link
              href="/"
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <SquarePen className="w-4 h-4" />
              <span>New chat</span>
            </Link>
          </div>

          <div className="px-1.5 mt-0.5">
            <Link
              href="/library"
              className={cn(
                "w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === "/library"
                  ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700",
              )}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Library</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-1.5 py-2">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-white uppercase tracking-wider mb-2 px-3">
                Chats
              </h3>
              <Conversations />
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={openSettings}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              <Settings className="w-4 h-4 text-neutral-500 dark:text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default memo(Sidebar);
