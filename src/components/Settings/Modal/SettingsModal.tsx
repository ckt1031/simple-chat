"use client";

import { X } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui";
import { cn } from "@/lib/utils";
import GeneralTab from "@/components/Settings/GeneralTab";
import { useHotkeys } from "react-hotkeys-hook";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import Loading from "./Loading";

export const SettingsTabs = [
  { id: "general", label: "General" },
  { id: "providers", label: "Providers" },
  { id: "data", label: "Data" },
  { id: "sync", label: "Sync" },
  { id: "about", label: "About" },
];

const ProvidersTab = dynamic(
  () => import("@/components/Settings/ProvidersTab"),
);
const DataManagementTab = dynamic(
  () => import("@/components/Settings/DataManagement"),
);
const GoogleDriveSyncTab = dynamic(
  () => import("@/components/Settings/GoogleDrive"),
);
const AboutTab = dynamic(() => import("@/components/Settings/AboutTab"));

export default function SettingsModal() {
  const closeSettings = useUIStore((s) => s.closeSettings);
  const [settingsTab, setSettingsTab] = useState("general");

  const handleTabChange = (tabId: string) => {
    setSettingsTab(tabId);
  };

  useHotkeys("esc", () => closeSettings());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div
        className="
        bg-white dark:bg-neutral-900 shadow-xl h-full
        min-w-[320px] sm:min-w-[400px] md:min-w-[600px] lg:min-w-[700px]
        w-full sm:w-[90vw]
        sm:h-[80vh] sm:max-w-4xl sm:rounded-2xl
        flex flex-col sm:flex-row
        sm:border-2 border-neutral-500 dark:border-neutral-700
      "
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 sm:hidden">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            onClick={closeSettings}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden sm:block w-48 bg-neutral-50 dark:bg-neutral-800 sm:rounded-l-2xl">
          <div className="pt-2 px-2">
            <button
              onClick={closeSettings}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-2 space-y-1 dark:text-white">
            {SettingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-2xl transition-colors",
                  settingsTab === tab.id
                    ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-white"
                    : "text-neutral-700 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tabs */}
        <div className="sm:hidden px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex gap-2 overflow-x-auto">
          {SettingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors border",
                settingsTab === tab.id
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                  : "bg-transparent text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <Suspense fallback={<Loading />}>
            {settingsTab === "general" && <GeneralTab />}
            {settingsTab === "providers" && <ProvidersTab />}
            {settingsTab === "data" && <DataManagementTab />}
            {settingsTab === "sync" && <GoogleDriveSyncTab />}
            {settingsTab === "about" && <AboutTab />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
