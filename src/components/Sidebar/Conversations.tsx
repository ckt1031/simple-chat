import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation, useConversationStore } from "@/lib/stores/conversation";
import { useGlobalStore } from "@/lib/stores/global";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import ChatOptionMenu from "@/components/ChatOptionMenu";
import { useShallow } from "zustand/react/shallow";

export function Conversations() {
  const globalStore = useGlobalStore(
    useShallow((s) => ({
      openDeleteConfirmation: s.openDeleteConfirmation,
      openEditTitle: s.openEditTitle,
    })),
  );

  const convStore = useConversationStore(
    useShallow((s) => ({
      currentConversationId: s.currentConversationId,
      deleteConversation: s.deleteConversation,
      updateConversationTitle: s.updateConversationTitle,
    })),
  );

  const conversationCompare = useCallback(
    (a: Conversation[], b: Conversation[]) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (a[i].id !== b[i].id || a[i].title !== b[i].title) return false;
      }
      return true;
    },
    [],
  );

  const conversations = useConversationStore(
    (s) => s.conversations,
    conversationCompare,
  );

  const router = useRouter();

  const handleDeleteConversation = (id: string) => {
    globalStore.openDeleteConfirmation(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      () => {
        convStore.deleteConversation(id);
        // If we deleted the current conversation, redirect to new chat
        if (convStore.currentConversationId === id) {
          router.replace("/");
        }
      },
    );
  };

  const handleSelectConversation = (id: string) => {
    router.replace(`/?id=${id}`);
  };

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const startInlineEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const current = conversations.find((c) => c.id === id)?.title || "";
    setEditingId(id);
    setEditingValue(current);
  };

  const saveInlineEdit = () => {
    if (!editingId) return;
    const trimmed = editingValue.trim();
    convStore.updateConversationTitle(
      editingId,
      trimmed.length ? trimmed : "New chat",
    );
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
            convStore.currentConversationId === conversation.id
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
              onEdit={() => globalStore.openEditTitle(conversation.id)}
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
