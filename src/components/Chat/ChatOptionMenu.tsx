"use client";

import { memo, useState } from "react";
import { Ellipsis, PencilLine, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClickAway } from "react-use";
import { useConversationStore } from "@/lib/stores/conversation";
import { useShallow } from "zustand/shallow";
import { useUIStore } from "@/lib/stores/ui";
import { useRouter } from "next/navigation";
import { useFloating, offset, flip, shift } from "@floating-ui/react";

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
  const [open, setOpen] = useState(false);

  const iconSize = size === "sm" ? 12 : 16;

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: align === "right" ? "bottom-end" : "bottom-start",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

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

  useClickAway(refs.floating, (event) =>{
    // If the click is on the reference button or any of its children (e.g., the SVG), don't close
    if (refs.reference.current && (refs.reference.current as HTMLElement).contains(event.target as Node)) return;
    setOpen(false);
  });

  return (
    <>
      <button
        ref={refs.setReference}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // Still always show the button on mobile
          "group-hover:opacity-100 transition-opacity",
          "shadow-2xl",
          alwaysShowButton ? "opacity-100" : "opacity-100 lg:opacity-0",
          buttonClassName ||
          "p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md",
        )}
        aria-label="Conversation menu"
        aria-expanded={open}
      >
        <Ellipsis
          className="text-neutral-500 dark:text-neutral-400"
          style={{ width: iconSize, height: iconSize }}
        />
      </button>
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-lg z-20 p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 rounded-xl"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <PencilLine className="w-4 h-4" /> Edit title
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400 flex items-center gap-2 rounded-xl"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" /> Delete chat
          </button>
        </div>
      )}
    </>
  );
}

export default memo(ChatOptionMenu);
