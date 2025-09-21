"use client";

import { useTheme } from "next-themes";
import DefaultModelSelector from "./DefaultModelSelector";

export default function GeneralTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">General Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-3">
            Theme
          </label>
          <div className="flex gap-2">
            {[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "System" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`
                  flex-1 px-4 py-2 rounded-2xl transition-colors
                  border
                  ${
                    theme === option.value
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow"
                      : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }
                  focus:outline-none focus:ring-2 focus:ring-neutral-500
                `}
                aria-pressed={theme === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-white mb-3">
            Default Model
          </label>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            Choose the default model for new conversations. This can be
            overridden per conversation.
          </p>
          <DefaultModelSelector />
        </div>
      </div>
    </div>
  );
}
