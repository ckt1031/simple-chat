'use client';

import { SquarePen, Trash2, Settings, Loader2 } from 'lucide-react';
import { useGlobalStore } from '@/lib/stores/global';
import { cn } from '@/lib/utils';
import { useConversationStore } from '@/lib/stores/conversation';
import { useRouter } from 'next/navigation';

export function Sidebar() {
  const {
    ui,
    toggleSidebar,
    closeSidebar,
    openSettings,
  } = useGlobalStore();

  const { conversations, currentConversationId, deleteConversation } = useConversationStore();
  const router = useRouter();

  const handleSelectConversation = (id: string) => {
    router.push(`/?id=${id}`);
  };

  const handleNewChat = () => {
    router.push('/');
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
    // If we deleted the current conversation, redirect to new chat
    if (currentConversationId === id) {
      router.push('/');
    }
  };

  return (
    <>
      {ui.isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transform bg-neutral-100 dark:bg-neutral-800 border-r md:border-0 border-neutral-200 dark:border-neutral-800 shadow-lg',
          ui.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:left-auto lg:top-auto lg:shadow-none',
          ui.isSidebarOpen ? 'lg:translate-x-0 lg:block' : 'lg:hidden'
        )}
        style={{ width: 256 }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 dark:border-neutral-700 mb-2">
            <h1 className="text-lg font-bold text-neutral-700 dark:text-white">
              Simple Chat
            </h1>
            <button
              onClick={toggleSidebar}
              className="text-neutral-500 dark:text-white rounded-full lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
          <div className="px-1.5 flex items-center justify-between">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <SquarePen className="w-4 h-4" />
              <span>New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-1.5 py-2">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-white uppercase tracking-wider mb-2 px-3">
                Chats
              </h3>
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                      currentConversationId === conversation.id
                        ? 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white'
                        : 'text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    )}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      {conversation.isLoading && (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-500 flex-shrink-0" />
                      )}
                      <span className="truncate">{conversation.title}</span>
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
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={openSettings}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              <Settings className="w-4 h-4 text-neutral-500 dark:text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
