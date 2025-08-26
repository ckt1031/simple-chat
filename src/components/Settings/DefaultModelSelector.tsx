"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/lib/stores/perferences";
import {
  useProviderStore,
  Model,
  ModelWithProvider,
} from "@/lib/stores/provider";
import ModelList from "@/components/ModelList";

function DefaultModelSelector() {
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50 w-full",
          "justify-between overflow-hidden",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate max-w-[200px] text-left">{buttonLabel}</span>
        <ChevronDown className="w-4 h-4 opacity-70 flex-shrink-0" />
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
            onClear={handleClear}
            clearLabel="Clear default model"
            className="max-h-60"
          />
        </div>
      )}
    </div>
  );
}

export default DefaultModelSelector;
