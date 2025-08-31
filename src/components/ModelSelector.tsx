"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
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
import ModelList from "./ModelList";
import { defaultProviderConfig } from "@/lib/api/sdk";

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
    formatModelKey,
    getModelLabel,
    parseModelKey,
    getEnabledProviderModelGroups,
    getDisplayText,
  } = useProviderStore();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const groups = useMemo(
    () => getEnabledProviderModelGroups(query),
    [providers, query, getEnabledProviderModelGroups],
  );

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

  const resolveIconByProviderId = (providerId: string) => {
    const provider = providers[providerId];
    if (!provider) return undefined;
    const resolvedKey =
      provider.type === "official"
        ? provider.provider
        : provider.providerFormat;
    return resolvedKey ? defaultProviderConfig[resolvedKey]?.icon : undefined;
  };

  const buildLabelAndIcon = (
    providerId: string,
    modelId: string,
    name?: string,
  ) => {
    return {
      label: name
        ? getDisplayText(name, modelId)
        : getModelLabel(providerId, modelId),
      icon: resolveIconByProviderId(providerId),
    } as const;
  };

  const selectedModelAndIcon = useMemo(() => {
    // Home page: prefer UI-selected model, then default model
    if (!currentConversationId) {
      if (uiSelectedModel)
        return buildLabelAndIcon(
          uiSelectedModel.providerId,
          uiSelectedModel.id,
          uiSelectedModel.name,
        );
      if (defaultModel)
        return buildLabelAndIcon(
          defaultModel.providerId,
          defaultModel.id,
          defaultModel.name,
        );
      return { label: "Select model", icon: undefined } as const;
    }

    // Active conversation: use conversation model or fall back to default
    if (currentSelectedModel) {
      const parsed = parseModelKey(currentSelectedModel);
      if (parsed) return buildLabelAndIcon(parsed.providerId, parsed.modelId);
    }
    if (uiSelectedModel)
      return buildLabelAndIcon(
        uiSelectedModel.providerId,
        uiSelectedModel.id,
        uiSelectedModel.name,
      );
    if (defaultModel)
      return buildLabelAndIcon(
        defaultModel.providerId,
        defaultModel.id,
        defaultModel.name,
      );
    return { label: "Select model", icon: undefined } as const;
  }, [
    currentSelectedModel,
    currentConversationId,
    uiSelectedModel,
    defaultModel,
    providers,
    getDisplayText,
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
  useClickAway(dropdownRef, (event) => {
    // If the click is on the reference button or any of its children (e.g., the SVG), don't close
    if (
      buttonRef.current &&
      (buttonRef.current as HTMLElement).contains(event.target as Node)
    ) {
      return;
    }
    
    setOpen(false);
  });

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
          "min-w-[140px] sm:min-w-[180px] justify-between overflow-hidden",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate max-w-[120px] sm:max-w-[220px] text-left">
          {selectedModelAndIcon.icon && (
            <selectedModelAndIcon.icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
          )}
          <span className="truncate">{selectedModelAndIcon.label}</span>
        </span>
        <ChevronRight className="w-4 h-4 opacity-70 flex-shrink-0" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-20 mt-2 w-[280px] sm:w-[320px] rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg max-h-[80vh] overflow-hidden"
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
            isSelected={isModelSelected}
            selectedLabel="Selected"
            className="max-h-60 sm:max-h-80"
          />
        </div>
      )}
    </div>
  );
}
