import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/lib/stores/conversation";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import ChatOptionMenu from "@/components/ChatOptionMenu";
import { useShallow } from "zustand/react/shallow";
import { deepEqual } from "fast-equals";

export function Conversations() {
  const convStore = useConversationStore(
    useShallow((s) => ({
      isHydrated: s.isHydrated,
      currentConversationId: s.currentConversationId,
      deleteConversation: s.deleteConversation,
      updateConversationTitle: s.updateConversationTitle,
      headers: s.headers,
      loadingById: s.loadingById,
    })),
  );

  const conversationCompare = useCallback(
    (
      a: ReturnType<typeof useConversationStore.getState>["headers"],
      b: ReturnType<typeof useConversationStore.getState>["headers"],
    ) => {
      const a2 = a.map((c) => ({ id: c.id, title: c.title }));
      const b2 = b.map((c) => ({ id: c.id, title: c.title }));
      return deepEqual(a2, b2);
    },
    [],
  );

  const conversations = useConversationStore(
    (s) => s.headers,
    conversationCompare,
  );

  const router = useRouter();

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
      {!convStore.isHydrated && (
        <div className="px-3 py-2 text-sm text-neutral-500">
          Loading conversations...
        </div>
      )}
      {convStore.isHydrated &&
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => handleSelectConversation(conversation.id)}
            className={cn(
              "group flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
              convStore.currentConversationId === conversation.id
                ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white"
                : "text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700",
            )}
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              {convStore.loadingById[conversation.id] && (
                <Loader2 className="w-3 h-3 animate-spin text-neutral-500 flex-shrink-0" />
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
                  className="truncate select-none max-w-[250px] lg:max-w-full"
                  onDoubleClick={(e) => startInlineEdit(e, conversation.id)}
                  title={conversation.title}
                >
                  {conversation.title}
                </span>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <ChatOptionMenu
                size="sm"
                align="right"
                conversationId={conversation.id}
              />
            </div>
          </div>
        ))}
      {convStore.isHydrated && conversations.length === 0 && (
        <div className="px-3 py-2 text-sm text-neutral-500">
          No conversations yet
        </div>
      )}
    </div>
  );
}
