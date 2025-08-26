"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { OfficialProvider, Model } from "@/lib/stores/provider";
import { defaultProviderConfig } from "@/lib/api/sdk";

export type ProviderGroup = {
  id: string;
  label: string;
  kind: "official" | "custom";
  officialKey?: OfficialProvider;
  models: Model[];
};

interface ModelListProps {
  groups: ProviderGroup[];
  onSelect: (providerId: string, model: Model) => void;
  isSelected: (providerId: string, modelId: string) => boolean;
  selectedLabel?: string;
  onClear?: () => void; // If provided, show a clear button at the top
  clearLabel?: string;
  className?: string;
}

function ModelList({
  groups,
  onSelect,
  isSelected,
  selectedLabel = "Selected",
  onClear,
  clearLabel = "Clear selection",
  className,
}: ModelListProps) {
  return (
    <div className={cn("overflow-y-auto", className)}>
      {onClear && (
        <div className="p-2 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClear}
            className="w-full text-left px-2 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded"
          >
            {clearLabel}
          </button>
        </div>
      )}

      {groups.length === 0 && (
        <div className="p-3 text-sm text-neutral-500">No enabled providers</div>
      )}

      {groups.map((group) => {
        const models = group.models || [];
        if (models.length === 0) return null;

        const Icon =
          defaultProviderConfig[group.officialKey as OfficialProvider]?.icon;

        return (
          <div key={group.id}>
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                {Icon && (
                  <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                )}
                <span className="text-sm font-medium">{group.label}</span>
              </div>
            </div>
            <ul role="listbox" className="py-1">
              {models.map((m: Model) => {
                const display = m.name ?? m.id;
                return (
                  <li key={`${group.id}:${m.id}`}>
                    <button
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/70 flex items-center justify-between",
                        isSelected(group.id, m.id)
                          ? "bg-neutral-50 dark:bg-neutral-800"
                          : "",
                      )}
                      onClick={() => onSelect(group.id, m)}
                    >
                      <span className="truncate max-w-[240px]">{display}</span>
                      {isSelected(group.id, m.id) && (
                        <span className="text-xs text-neutral-500">
                          {selectedLabel}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default memo(ModelList);
