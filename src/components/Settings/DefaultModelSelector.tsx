"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/lib/stores/perferences";
import {
  useProviderStore,
  Model,
  ModelWithProvider,
} from "@/lib/stores/provider";
import ModelList from "@/components/ModelList";
import { defaultProviderConfig } from "@/lib/api/sdk";
import { useClickAway } from "react-use";

function DefaultModelSelector() {
  const ref = useRef<HTMLDivElement>(null);
  const defaultModel = usePreferencesStore((s) => s.defaultModel);
  const updateSettings = usePreferencesStore((s) => s.updateSettings);

  const { providers, getEnabledProviderModelGroups, getDisplayText } =
    useProviderStore();

  const [open, setOpen] = useState(false);

  const groups = useMemo(
    () => getEnabledProviderModelGroups(),
    [providers, getEnabledProviderModelGroups],
  );

  const handleSelect = (providerId: string, model: Model) => {
    const next: ModelWithProvider = {
      ...model,
      providerId,
    };
    updateSettings({ defaultModel: next });
    setOpen(false);
  };

  const handleClear = () => {
    updateSettings({ defaultModel: null });
    setOpen(false);
  };

  const buttonLabel = defaultModel
    ? getDisplayText(defaultModel.name, defaultModel.id)
    : "No default model";

  const SelectedIcon = useMemo(() => {
    if (!defaultModel) return undefined;
    const provider = providers[defaultModel.providerId];
    const resolvedKey =
      provider?.type === "official"
        ? provider.provider
        : provider?.providerFormat;
    return resolvedKey ? defaultProviderConfig[resolvedKey]?.icon : undefined;
  }, [defaultModel, providers]);

  useClickAway(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 w-full",
          "justify-between overflow-hidden",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate max-w-[200px] text-left">
          {SelectedIcon && (
            <SelectedIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
          )}
          <span className="truncate">{buttonLabel}</span>
        </span>
        <span className="flex items-center gap-2">
          {defaultModel && (
            <span
              role="button"
              aria-label="Clear default model"
              title="Clear default model"
              tabIndex={0}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear();
                }
              }}
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg max-h-[60vh] overflow-hidden">
          <ModelList
            groups={groups}
            onSelect={handleSelect}
            isSelected={(providerId, modelId) =>
              defaultModel?.providerId === providerId &&
              defaultModel?.id === modelId
            }
            selectedLabel="Default"
            className="max-h-60"
          />
        </div>
      )}
    </div>
  );
}

export default DefaultModelSelector;
