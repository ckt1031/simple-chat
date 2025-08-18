'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useGlobalStore } from '@/lib/stores/global';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export function SettingsModal() {
  const { ui, closeSettings } = useGlobalStore();
  const [activeTab, setActiveTab] = useState('general');
  const { theme, setTheme } = useTheme();

  if (!ui.isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex">
        {/* Left Sidebar */}
        <div className="w-48 bg-gray-50 dark:bg-neutral-800 rounded-l-lg">
          <div className="pt-2 px-2">
            <button
              onClick={closeSettings}
              className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-2 space-y-1 dark:text-white">
            {[
              { id: 'general', label: 'General' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  activeTab === tab.id
                    ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white"
                    : "text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">General Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                      Theme
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
