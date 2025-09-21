import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/lib/stores/conversation";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import ChatOptionMenu from "@/components/Chat/ChatOptionMenu";
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
    // Don't navigate if already on this conversation
    if (convStore.currentConversationId === id) return;

    router.replace(`/?id=${id}`);
  };

  // Removed inline edit to simplify conversations list

  return (
    <div className="space-y-1">
      {!convStore.isHydrated && (
        <div className="px-3 py-2 text-sm text-neutral-500">
          Loading conversations...
        </div>
      )}
      {convStore.isHydrated &&
        conversations.map((conversation) => {
          const isLoading = convStore.loadingById[conversation.id];
          const isCurrent = convStore.currentConversationId === conversation.id;

          return (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-all duration-200 cursor-pointer",
                isCurrent
                  ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-white shadow-sm"
                  : "text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700",
                isLoading && "opacity-75",
              )}
              onClick={() => handleSelectConversation(conversation.id)}
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {isLoading && (
                  <Loader className="w-3 h-3 animate-spin text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "truncate select-none max-w-[250px] lg:max-w-full transition-opacity",
                    isLoading && "opacity-70",
                  )}
                  title={conversation.title}
                >
                  {conversation.title}
                </span>
              </div>
              <div
                className="relative flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ChatOptionMenu
                  size="sm"
                  align="right"
                  conversationId={conversation.id}
                />
              </div>
            </div>
          );
        })}
      {convStore.isHydrated && conversations.length === 0 && (
        <div className="px-3 py-2 text-sm text-neutral-500">
          No conversations yet
        </div>
      )}
    </div>
  );
}
