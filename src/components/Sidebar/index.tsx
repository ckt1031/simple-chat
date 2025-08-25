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
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import isMobile from "@/lib/is-mobile";

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

  // Swipe gesture for mobile - only enabled on mobile devices and when sidebar is open
  const swipeBind = useSwipeGesture({
    onSwipeLeft: closeSidebar,
    enabled: isMobile() && isSidebarOpen,
  });

  const contentVisibilityClass = isSidebarOpen
    ? "opacity-100 transition-opacity duration-500 lg:delay-300 ease-out" // Fade in after sidebar starts opening
    : "opacity-0 transition-opacity duration-200 ease-in"; // Fade out quickly when closing

  return (
    <>
      {/* Animated overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-neutral-900/30 lg:hidden transition-opacity duration-300 ease-in-out",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={closeSidebar}
      />

      {/* Animated sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-lg transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:left-auto lg:top-auto lg:shadow-none lg:translate-x-0",
          isSidebarOpen ? "w-64" : "lg:w-0",
          "lg:transition-[width] duration-300 ease-in-out",
          "overflow-hidden min-w-0 max-w-full",
          !isSidebarOpen ? "pointer-events-none" : "",
        )}
        {...swipeBind()}
      >
        <div className={cn("flex h-full flex-col", contentVisibilityClass)}>
          {/* Header with enhanced animations */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 dark:border-neutral-800 mb-2">
            <h1 className="text-lg font-bold text-neutral-700 dark:text-white transition-colors duration-200">
              Simple Chat
            </h1>
            <button
              onClick={toggleSidebar}
              className="text-neutral-500 dark:text-white rounded-full lg:hidden hover:bg-neutral-200 dark:hover:bg-neutral-700 p-1 transition-all duration-200 hover:scale-110"
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* New chat button with enhanced hover */}
          <div className="px-1.5 flex items-center justify-between">
            <Link
              href="/"
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <SquarePen className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              <span>New chat</span>
            </Link>
          </div>

          {/* Library link with enhanced hover */}
          <div className="px-1.5 mt-0.5">
            <Link
              href="/library"
              className={cn(
                "w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-[1.02]",
                pathname === "/library"
                  ? "bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700",
              )}
            >
              <ImageIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span>Library</span>
            </Link>
          </div>

          {/* Conversations section */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-1.5 py-2">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-white uppercase tracking-wider mb-2 px-3 transition-colors duration-200">
                Chats
              </h3>
              <Conversations />
            </div>
          </div>

          {/* Settings button with enhanced hover */}
          <div className="p-4">
            <button
              onClick={openSettings}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-all duration-200 hover:scale-110 hover:rotate-12"
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
