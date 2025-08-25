"use client";

import { memo, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/lib/stores/perferences";
import { useConversationStore } from "@/lib/stores/conversation";
import {
  OfficialProvider,
  useProviderStore,
  Model,
  ModelWithProvider,
} from "@/lib/stores/provider";
import { useHotkeys } from "react-hotkeys-hook";
import { useClickAway } from "react-use";
import ModelList, { ProviderGroup } from "./ModelList";

function ModelSelector() {
  const currentSelectedModel = useConversationStore(
    (s) => s.currentSelectedModel,
  );
  const currentConversationId = useConversationStore(
    (s) => s.currentConversationId,
  );
  const tempModelSelection = useConversationStore((s) => s.tempModelSelection);
  const updateConversationModel = useConversationStore(
    (s) => s.updateConversationModel,
  );
  const setTempModelSelection = useConversationStore(
    (s) => s.setTempModelSelection,
  );
  const defaultModel = usePreferencesStore((s) => s.defaultModel);
  const updateSettings = usePreferencesStore((s) => s.updateSettings);

  const { providers, getOfficialProviders, getCustomProviders } =
    useProviderStore();

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
      // Update conversation-specific model
      const modelId = `${providerId}:${model.id}`;
      updateConversationModel(modelId);
    } else {
      // Set temp model selection for new conversation on home page
      const modelId = `${providerId}:${model.id}`;
      setTempModelSelection(modelId);
    }
    setOpen(false);
  };

  const handleClearSelection = () => {
    // Only clear temp selection on home page
    setTempModelSelection(null);
    setOpen(false);
  };

  const buttonLabel = useMemo(() => {
    // Home page: use temp selection or default model
    if (!currentConversationId) {
      if (tempModelSelection) {
        // Parse temp selection
        const [providerId, modelId] = tempModelSelection.split(":");
        if (providerId && modelId) {
          const provider = providers[providerId];
          if (provider) {
            const model = provider.models.find((m: Model) => m.id === modelId);
            if (model) {
              return model.name && model.name.trim().length > 0
                ? model.name
                : model.id;
            }
          }
          return modelId;
        }
      }
      // Fall back to default model
      if (defaultModel) {
        return defaultModel.name && defaultModel.name.trim().length > 0
          ? defaultModel.name
          : defaultModel.id;
      }
    }

    // Active conversation: use conversation model or fall back to default
    if (currentSelectedModel) {
      // Parse the model ID to get provider and model info
      const [providerId, modelId] = currentSelectedModel.split(":");
      if (providerId && modelId) {
        const provider = providers[providerId];
        if (provider) {
          const model = provider.models.find((m: Model) => m.id === modelId);
          if (model) {
            return model.name && model.name.trim().length > 0
              ? model.name
              : model.id;
          }
        }
        // Fallback to just the model ID if we can't find the full details
        return modelId;
      }
    }

    // No conversation model set, fall back to default
    if (defaultModel) {
      return defaultModel.name && defaultModel.name.trim().length > 0
        ? defaultModel.name
        : defaultModel.id;
    }

    return "Select model";
  }, [
    currentSelectedModel,
    currentConversationId,
    tempModelSelection,
    defaultModel,
    providers,
  ]);

  const isModelSelected = (providerId: string, modelId: string) => {
    const modelIdString = `${providerId}:${modelId}`;

    // Home page: check temp selection first, then default model
    if (!currentConversationId) {
      if (tempModelSelection) {
        return tempModelSelection === modelIdString;
      }
      if (defaultModel) {
        return (
          defaultModel.providerId === providerId && defaultModel.id === modelId
        );
      }
      return false;
    }

    // Active conversation: check conversation model first, then default model
    if (currentSelectedModel) {
      return currentSelectedModel === modelIdString;
    }
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
            showClearButton={Boolean(
              !currentConversationId && tempModelSelection,
            )}
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

export default memo(ModelSelector);
