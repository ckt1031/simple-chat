'use client';

import { SquarePen, Trash2, Settings } from 'lucide-react';
import { useChatStore } from '@/lib/stores/global';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    ui,
    toggleSidebar,
    closeSidebar,
    openSettings,
  } = useChatStore();

  const handleNewChat = () => {
    createConversation();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <>
      {ui.isSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transform bg-neutral-100 border-r border-neutral-200 shadow-lg',
          ui.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:left-auto lg:top-auto lg:shadow-none',
          ui.isSidebarOpen ? 'lg:translate-x-0 lg:block' : 'lg:hidden'
        )}
        style={{ width: 256 }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 mb-2">
            <h1 className="text-lg font-bold text-neutral-700">
              Simple Chat
            </h1>
            <button
              onClick={toggleSidebar}
              className="text-gray-500 rounded-full lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
          <div className="px-1.5 flex items-center justify-between">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <SquarePen className="w-4 h-4" />
              <span>New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-1.5 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
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
                        ? 'bg-neutral-200 text-neutral-800'
                        : 'text-neutral-700 hover:bg-neutral-200'
                    )}
                  >
                    <span className="truncate">{conversation.title}</span>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No conversations yet
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={openSettings}
              className="p-1 hover:bg-neutral-200 rounded transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
