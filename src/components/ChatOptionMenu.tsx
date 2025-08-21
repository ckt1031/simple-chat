"use client";

import { useState } from "react";
import { MoreVertical, PencilLine, Trash2 } from "lucide-react";

interface ChatOptionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  buttonClassName?: string;
  align?: "left" | "right";
}

export default function ChatOptionMenu({
  onEdit,
  onDelete,
  size = "sm",
  disabled,
  buttonClassName,
  align = "right",
}: ChatOptionMenuProps) {
  const [open, setOpen] = useState(false);

  const iconSize = size === "sm" ? 12 : 16;
  const containerAlign = align === "right" ? "right-0" : "left-0";

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ||
          "p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-all"
        }
        aria-label="Conversation menu"
        disabled={disabled}
      >
        <MoreVertical
          className="text-neutral-500 dark:text-neutral-400"
          style={{ width: iconSize, height: iconSize }}
        />
      </button>
      {open && (
        <div
          className={`absolute ${containerAlign} mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg z-20`}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            disabled={disabled}
          >
            <PencilLine className="w-4 h-4" /> Edit title
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-red-600 dark:text-red-400 flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            disabled={disabled}
          >
            <Trash2 className="w-4 h-4" /> Delete chat
          </button>
        </div>
      )}
    </div>
  );
}
