"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Trash2, CheckSquare, Square, Loader2 } from "lucide-react";
import { useConversationStore } from "@/lib/stores/conversation";
import { useUIStore } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";
import Fuse from "fuse.js";

export default function ChatList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const headers = useConversationStore((s) => s.headers);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const openDeleteConfirmation = useUIStore((s) => s.openDeleteConfirmation);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(headers, {
      keys: ["title"],
      threshold: 0.3, // Lower threshold means more strict matching
      includeScore: true,
    });
  }, [headers]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return headers;
    }
    return fuse.search(searchQuery).map((result) => result.item);
  }, [headers, searchQuery, fuse]);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedChats.size === filteredChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(filteredChats.map((chat) => chat.id)));
    }
  }, [selectedChats.size, filteredChats]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedChats.size === 0) return;

    openDeleteConfirmation(
      "Delete Selected Chats",
      `Are you sure you want to delete ${selectedChats.size} chat${selectedChats.size > 1 ? "s" : ""}?`,
      async () => {
        setIsDeleting(true);
        try {
          // Delete conversations sequentially to avoid overwhelming IndexedDB
          const chatIds = Array.from(selectedChats);
          for (const chatId of chatIds) {
            await deleteConversation(chatId);
          }
          setSelectedChats(new Set());
        } catch (error) {
          console.error("Error deleting chats:", error);
          // You might want to show an error message to the user here
        } finally {
          setIsDeleting(false);
        }
      },
    );
  }, [
    selectedChats,
    filteredChats,
    openDeleteConfirmation,
    deleteConversation,
  ]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Actions Bar */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search chats by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedChats.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                  isDeleting
                    ? "bg-neutral-100 border-neutral-300 text-neutral-500 cursor-not-allowed dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-400"
                    : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30",
                )}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isDeleting
                    ? "Deleting..."
                    : `Delete (${selectedChats.size})`}
                </span>
              </button>
            )}

            <button
              onClick={handleSelectAll}
              disabled={isDeleting}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                isDeleting
                  ? "bg-neutral-100 border-neutral-300 text-neutral-500 cursor-not-allowed dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-400"
                  : selectedChats.size === filteredChats.length &&
                      filteredChats.length > 0
                    ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700",
              )}
            >
              {selectedChats.size === filteredChats.length &&
              filteredChats.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {selectedChats.size === filteredChats.length &&
                filteredChats.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat List - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {isDeleting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Deleting chats...</span>
            </div>
          </div>
        )}
        <div className="p-4 space-y-2">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              {searchQuery
                ? "No chats found matching your search."
                : "No chats available."}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                  selectedChats.has(chat.id)
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                    : "bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700",
                )}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "flex-shrink-0",
                    isDeleting
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer",
                  )}
                  onClick={() => !isDeleting && handleSelectChat(chat.id)}
                >
                  {selectedChats.has(chat.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 dark:text-white truncate text-sm">
                    {chat.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatDate(chat.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      {filteredChats.length > 0 && (
        <div className="flex-shrink-0 text-sm text-neutral-500 dark:text-neutral-400 text-center py-2 border-t border-neutral-200 dark:border-neutral-700">
          {filteredChats.length} chat{filteredChats.length !== 1 ? "s" : ""}{" "}
          total
          {searchQuery && ` • ${headers.length} total chats`}
        </div>
      )}
    </div>
  );
}
