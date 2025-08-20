"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/lib/stores/global";
import {
  OfficialProvider,
  useProviderStore,
  Model,
  ModelWithProvider,
  ProviderState,
} from "@/lib/stores/provider";
import { useHotkeys } from "react-hotkeys-hook";
import { useClickAway } from "react-use";

type ProviderGroup = {
  id: string;
  label: string;
  kind: "official" | "custom";
  officialKey?: OfficialProvider;
  data: ProviderState;
};

export function ModelSelector() {
  const selectedModel = useGlobalStore((s) => s.general.selectedModel);
  const updateSettings = useGlobalStore((s) => s.updateSettings);
  const getOfficialProviders = useProviderStore((s) => s.getOfficialProviders);
  const getCustomProviders = useProviderStore((s) => s.getCustomProviders);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);

  const groups: ProviderGroup[] = useMemo(() => {
    const official: ProviderGroup[] = getOfficialProviders()
      .filter((prov) => prov.enabled)
      .map((prov) => ({
        id: prov.provider,
        label: prov.provider,
        kind: "official" as const,
        officialKey: prov.provider,
        data: prov,
      }));

    const customList: ProviderGroup[] = getCustomProviders()
      .filter((prov) => prov.enabled)
      .map((prov) => ({
        id: prov.id,
        label:
          prov.displayName && prov.displayName.trim().length > 0
            ? prov.displayName
            : prov.id,
        kind: "custom" as const,
        data: prov,
      }));

    return [...official, ...customList];
  }, [getOfficialProviders, getCustomProviders]);

  const handleSelect = (providerId: string, model: Model) => {
    const displayName =
      model.name && model.name.trim().length > 0 ? model.name : undefined;
    const next: ModelWithProvider = {
      id: model.id,
      name: displayName,
      enabled: model.enabled,
      source: model.source,
      providerId,
    };
    updateSettings({ selectedModel: next });
    setOpen(false);
  };

  const buttonLabel = useMemo(() => {
    if (selectedModel) {
      return selectedModel.name && selectedModel.name.trim().length > 0
        ? selectedModel.name
        : selectedModel.id;
    }
    return "Select model";
  }, [selectedModel]);

  useHotkeys("ctrl+m", () => setOpen(true));
  useHotkeys("esc", () => setOpen(false));
  useClickAway(dropdownRef, () => setOpen(false));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2 sm:px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
          "min-w-[140px] sm:min-w-[180px] justify-between overflow-hidden",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate max-w-[120px] sm:max-w-[220px] text-left">
          {buttonLabel}
        </span>
        <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-20 mt-2 w-[280px] sm:w-[320px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg max-h-[80vh] overflow-hidden"
        >
          <div className="relative border-neutral-200 dark:border-neutral-700">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models"
              className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md focus:outline-none"
            />
          </div>

          <div className="max-h-60 sm:max-h-80 overflow-y-auto custom-scrollbar">
            {groups.length === 0 && (
              <div className="p-3 text-sm text-neutral-500">
                No enabled providers
              </div>
            )}

            {groups.map((group) => {
              const models = (group.data.models || [])
                .filter((m: Model) => m.enabled)
                .filter((m: Model) => {
                  if (!query.trim()) return true;
                  const display =
                    m.name && m.name.trim().length > 0 ? m.name : m.id;
                  return display.toLowerCase().includes(query.toLowerCase());
                });

              if (models.length === 0) return null;

              return (
                <div key={group.id}>
                  <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800">
                    {group.label}
                  </div>
                  <ul role="listbox" className="py-1">
                    {models.map((m: Model) => {
                      const display =
                        m.name && m.name.trim().length > 0 ? m.name : m.id;
                      return (
                        <li key={`${group.id}:${m.id}`}>
                          <button
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/70 flex items-center justify-between",
                              selectedModel &&
                                selectedModel.id === m.id &&
                                selectedModel.providerId === group.id
                                ? "bg-neutral-50 dark:bg-neutral-800"
                                : "",
                            )}
                            onClick={() => handleSelect(group.id, m)}
                          >
                            <span className="truncate max-w-[240px]">
                              {display}
                            </span>
                            {selectedModel &&
                              selectedModel.id === m.id &&
                              selectedModel.providerId === group.id && (
                                <span className="text-xs text-neutral-500">
                                  Selected
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
        </div>
      )}
    </div>
  );
}
