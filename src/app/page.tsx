'use client';

import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Chat } from '@/components/Chat';
import { SettingsModal } from '@/components/SettingsModal';
import { useGlobalStore } from '@/lib/stores/global';
import { ModelSelector } from '@/components/ModelSelector';

export default function Home() {
  const { toggleSidebar } = useGlobalStore();

  return (
    <div className="h-screen flex bg-white dark:bg-neutral-900">
      {/* Sidebar overlayed */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center p-3 flex-row gap-2">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Model Selector here */}
          <ModelSelector />
        </div>

        {/* Chat Area fills full width; sidebar overlays */}
        <Chat />
      </div>

      {/* Settings Modal with global state */}
      <SettingsModal />
    </div>
  );
}
