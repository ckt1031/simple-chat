import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/lib/stores/conversation";
import { useGlobalStore } from "@/lib/stores/global";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ChatOptionMenu from "@/components/ChatOptionMenu";

export function Conversations() {
  const openDeleteConfirmation = useGlobalStore(
    (s) => s.openDeleteConfirmation,
  );
  const openEditTitle = useGlobalStore((s) => s.openEditTitle);
  const { conversations, currentConversationId, deleteConversation } =
    useConversationStore();
  const updateConversationTitle = useConversationStore(
    (s) => s.updateConversationTitle,
  );

  const router = useRouter();

  const handleDeleteConversation = (id: string) => {
    openDeleteConfirmation(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      () => {
        deleteConversation(id);
        // If we deleted the current conversation, redirect to new chat
        if (currentConversationId === id) {
          router.push("/");
        }
      },
    );
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/?id=${id}`);
  };

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const startInlineEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const current = conversations.find((c) => c.id === id)?.title || "";
    setEditingId(id);
    setEditingValue(current);
  };

  const saveInlineEdit = () => {
    if (!editingId) return;
    const trimmed = editingValue.trim();
    updateConversationTitle(editingId, trimmed.length ? trimmed : "New chat");
    setEditingId(null);
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => handleSelectConversation(conversation.id)}
          className={cn(
            "group flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
            currentConversationId === conversation.id
              ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white"
              : "text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700",
          )}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {conversation.isLoading && (
              <Loader2 className="w-3 h-3 animate-spin text-blue-500 flex-shrink-0" />
            )}
            {editingId === conversation.id ? (
              <input
                className="w-full bg-transparent outline-none border-b border-neutral-400/50 focus:border-blue-500 text-inherit"
                value={editingValue}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={saveInlineEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveInlineEdit();
                  if (e.key === "Escape") cancelInlineEdit();
                }}
              />
            ) : (
              <span
                className="truncate select-none"
                onDoubleClick={(e) => startInlineEdit(e, conversation.id)}
                title={conversation.title}
              >
                {conversation.title}
              </span>
            )}
          </div>
          <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100">
            <ChatOptionMenu
              onEdit={() => openEditTitle(conversation.id)}
              onDelete={() => handleDeleteConversation(conversation.id)}
              size="sm"
              align="right"
            />
          </div>
        </div>
      ))}
      {conversations.length === 0 && (
        <div className="px-3 py-2 text-sm text-neutral-500">
          No conversations yet
        </div>
      )}
    </div>
  );
}
