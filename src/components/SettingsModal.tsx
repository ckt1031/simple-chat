'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useGlobalStore } from '@/lib/stores/global';
import { cn } from '@/lib/utils';
import GeneralTab from '@/components/Settings/GeneralTab';
import AboutTab from '@/components/Settings/AboutTab';
import ProviderSettingsTab from '@/components/Settings/ProvidersTab';
import { useSearchParams, useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';

export function SettingsModal() {
  const tabs = useMemo(() => [
    { id: 'general', label: 'General' },
    { id: 'providers', label: 'Providers' },
    { id: 'about', label: 'About' },
  ], []);

  const { ui, closeSettings } = useGlobalStore();
  const [activeTab, setActiveTab] = useState('general');
  const searchParams = useSearchParams();
  const router = useRouter();
  const settingsTab = searchParams.get('settings');

  // Handle settings tab from URL parameter
  useEffect(() => {
    if (settingsTab && tabs.some(tab => tab.id === settingsTab)) {
      setActiveTab(settingsTab);
    }
  }, [settingsTab, tabs]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL to reflect the active tab
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('settings', tabId);
    router.push(`/?${newParams.toString()}`);
  };

  const handleClose = () => {
    closeSettings();
    // Remove settings parameter from URL when closing
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('settings');
    router.push(`/?${newParams.toString()}`);
  };

  useHotkeys('esc', () => handleClose());

  if (!ui.isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="
        bg-white dark:bg-neutral-900 shadow-xl h-full
        min-w-[320px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[700px]
        w-full sm:w-[90vw]
        sm:h-[80vh] sm:max-w-4xl sm:rounded-lg
        flex flex-col sm:flex-row
      ">
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 sm:hidden">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden sm:block w-48 bg-neutral-50 dark:bg-neutral-800 sm:rounded-l-lg">
          <div className="pt-2 px-2">
            <button
              onClick={handleClose}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-2 space-y-1 dark:text-white">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

        {/* Mobile Tabs */}
        <div className="sm:hidden px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors border",
                activeTab === tab.id
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                  : "bg-transparent text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'providers' && <ProviderSettingsTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
}
