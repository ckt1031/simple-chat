import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/lib/stores/conversation";
import { useGlobalStore } from "@/lib/stores/global";
import { useRouter } from "next/navigation";

export function Conversations() {
  const openDeleteConfirmation = useGlobalStore(
    (s) => s.openDeleteConfirmation,
  );
  const { conversations, currentConversationId, deleteConversation } =
    useConversationStore();

  const router = useRouter();

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    openDeleteConfirmation(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      () => {
        deleteConversation(id);
        // If we deleted the current conversation, redirect to new chat
        if (currentConversationId === id) {
          router.replace("/");
        }
      },
    );
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/?id=${id}`);
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
            <span className="truncate select-none">{conversation.title}</span>
          </div>
          <button
            onClick={(e) => handleDeleteConversation(e, conversation.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition-all flex-shrink-0"
          >
            <Trash2 className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
          </button>
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
