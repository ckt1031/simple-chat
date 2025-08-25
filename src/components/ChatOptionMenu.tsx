"use client";

import { memo, useRef, useState } from "react";
import { MoreVertical, PencilLine, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickAway } from "react-use";
import { useConversationStore } from "@/lib/stores/conversation";
import { useShallow } from "zustand/shallow";
import { useUIStore } from "@/lib/stores/ui";
import { useRouter } from "next/navigation";

interface ChatOptionMenuProps {
  size?: "sm" | "md";
  buttonClassName?: string;
  align?: "left" | "right";
  alwaysShowButton?: boolean;
  conversationId?: string;
}

function ChatOptionMenu({
  size = "sm",
  buttonClassName,
  align = "right",
  alwaysShowButton = false,
  conversationId,
}: ChatOptionMenuProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const iconSize = size === "sm" ? 12 : 16;
  const containerAlign = align === "right" ? "right-0" : "left-0";

  const { openEditTitle, openDeleteConfirmation } = useUIStore(
    useShallow((s) => ({
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

  const targetConversationId = conversationId || currentConversationId;

  const onEdit = () => {
    if (targetConversationId) openEditTitle(targetConversationId);
  };

  const onDelete = () => {
    if (!targetConversationId) return;

    openDeleteConfirmation(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      () => {
        deleteConversation(targetConversationId);
        router.push("/");
      },
    );
  };

  useClickAway(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // Still always show the button on mobile
          "group-hover:opacity-100 transition-opacity",
          alwaysShowButton ? "opacity-100" : "opacity-100 lg:opacity-0",
          buttonClassName ||
            "p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-all",
        )}
        aria-label="Conversation menu"
      >
        <MoreVertical
          className="text-neutral-500 dark:text-neutral-400"
          style={{ width: iconSize, height: iconSize }}
        />
      </button>
      {open && (
        <div
          className={`absolute ${containerAlign} mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg z-20`}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <PencilLine className="w-4 h-4" /> Edit title
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400 flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" /> Delete chat
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ChatOptionMenu);
