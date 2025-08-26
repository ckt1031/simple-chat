"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/lib/stores/perferences";
import { useConversationStore } from "@/lib/stores/conversation";
import {
  useProviderStore,
  Model,
  ModelWithProvider,
} from "@/lib/stores/provider";
import { useUIStore } from "@/lib/stores/ui";
import { useHotkeys } from "react-hotkeys-hook";
import { useClickAway } from "react-use";
import ModelList, { ProviderGroup } from "./ModelList";

export default function ModelSelector() {
  const {
    currentSelectedModel,
    currentConversationId,
    updateConversationModel,
  } = useConversationStore();

  const { defaultModel } = usePreferencesStore();

  const uiSelectedModel = useUIStore((s) => s.selectedModel);
  const setUiSelectedModel = useUIStore((s) => s.setSelectedModel);

  const {
    providers,
    getOfficialProviders,
    getCustomProviders,
    formatModelKey,
    getModelLabel,
    parseModelKey,
  } = useProviderStore();

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
  }, [providers, getOfficialProviders, getCustomProviders]);

  const handleSelect = (providerId: string, model: Model) => {
    if (currentConversationId) {
      updateConversationModel(formatModelKey(providerId, model.id));
    } else {
      const selected: ModelWithProvider = {
        ...model,
        providerId,
      };
      setUiSelectedModel(selected);
    }
    setOpen(false);
  };

  const handleClearSelection = () => {
    setUiSelectedModel(null);
    setOpen(false);
  };

  const buttonLabel = useMemo(() => {
    // Home page: prefer UI-selected model, then default model
    if (!currentConversationId) {
      if (uiSelectedModel) {
        return uiSelectedModel.name && uiSelectedModel.name.trim().length > 0
          ? uiSelectedModel.name
          : uiSelectedModel.id;
      }
      if (defaultModel) {
        return defaultModel.name && defaultModel.name.trim().length > 0
          ? defaultModel.name
          : defaultModel.id;
      }
      return "Select model";
    }

    // Active conversation: use conversation model or fall back to default
    if (currentSelectedModel) {
      const parsed = parseModelKey(currentSelectedModel);
      if (parsed) return getModelLabel(parsed.providerId, parsed.modelId);
    }
    if (uiSelectedModel) {
      return uiSelectedModel.name && uiSelectedModel.name.trim().length > 0
        ? uiSelectedModel.name
        : uiSelectedModel.id;
    }
    if (defaultModel) {
      return defaultModel.name && defaultModel.name.trim().length > 0
        ? defaultModel.name
        : defaultModel.id;
    }
    return "Select model";
  }, [
    currentSelectedModel,
    currentConversationId,
    uiSelectedModel,
    defaultModel,
    providers,
  ]);

  const isModelSelected = (providerId: string, modelId: string) => {
    const key = formatModelKey(providerId, modelId);
    if (!currentConversationId) {
      if (uiSelectedModel) {
        return (
          uiSelectedModel.providerId === providerId &&
          uiSelectedModel.id === modelId
        );
      }
      if (defaultModel) {
        return (
          defaultModel.providerId === providerId && defaultModel.id === modelId
        );
      }
      return false;
    }
    if (currentSelectedModel) return currentSelectedModel === key;
    if (defaultModel) {
      return (
        defaultModel.providerId === providerId && defaultModel.id === modelId
      );
    }
    return false;
  };

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

          <ModelList
            groups={groups}
            onSelect={handleSelect}
            isModelSelected={isModelSelected}
            selectedLabel="Selected"
            showClearButton={Boolean(!currentConversationId && uiSelectedModel)}
            onClear={handleClearSelection}
            clearButtonText="Clear selection"
            query={query}
            showSearch={true}
            maxHeight="max-h-60 sm:max-h-80"
          />
        </div>
      )}
    </div>
  );
}
