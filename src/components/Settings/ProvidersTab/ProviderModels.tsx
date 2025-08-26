"use client";

import { useState } from "react";
import { useProviderStore } from "@/lib/stores/provider";
import listModels from "@/lib/api/list-models";
import { ArrowLeft, Plus, Search, Trash } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Switch from "@/components/Switch";
import Alert from "@/components/ui/Alert";
import { normalizeChatError } from "@/lib/utils/error-handling";

interface Props {
  providerId: string;
  onBack: () => void;
}

export default function ModelsManager({ providerId, onBack }: Props) {
  const {
    getProvider,
    applyFetchedModels,
    clearFetchedModels,
    addCustomModel,
    updateModel,
    removeCustomModel,
  } = useProviderStore();
  const provider = getProvider(providerId);

  const [creating, setCreating] = useState<{ id: string; name: string }>({
    id: "",
    name: "",
  });
  const [isFetching, setIsFetching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!provider) return null;

  const format =
    provider.type === "custom" ? provider.providerFormat : provider.provider;

  const onFetch = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const models = await listModels(format, provider);
      applyFetchedModels(providerId, models);
    } catch (err) {
      const { message } = normalizeChatError(err);
      setError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const onClearFetched = () => {
    clearFetchedModels(providerId);
  };

  const onCreate = () => {
    const id = creating.id.trim();
    const name = creating.name.trim() || id;
    if (!id) return;

    if (addCustomModel(providerId, { id, name })) {
      setCreating({ id: "", name: "" });
    }
  };

  const onToggle = (modelId: string, enabled: boolean) => {
    updateModel(providerId, modelId, { enabled });
  };

  const onUpdateField = (
    modelId: string,
    field: "name" | "id",
    value: string,
  ) => {
    updateModel(providerId, modelId, { [field]: value });
  };

  const onRemoveCustomModel = (modelId: string) => {
    removeCustomModel(providerId, modelId);
  };

  const fetchedModels = provider.models.filter((m) => m.source === "fetch");
  const customModels = provider.models.filter((m) => m.source === "custom");

  // Filter models based on search query
  const filteredFetchedModels = fetchedModels.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCustomModels = customModels.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">Manage models</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onFetch} disabled={isFetching} variant="primary">
          {isFetching ? "Fetching…" : "Fetch models"}
        </Button>
        <Button onClick={onClearFetched} variant="secondary">
          Clear fetched
        </Button>
      </div>

      {error && (
        <Alert variant="error" title="Failed to fetch models">
          {error}
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search models..."
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Custom models</h4>
          <Card variant="bordered" className="p-4">
            <div className="text-sm font-medium mb-2">Add custom model</div>
            <div className="flex flex-col md:flex-row gap-2 items-left">
              <Input
                value={creating.id}
                onChange={(e) =>
                  setCreating((s) => ({ ...s, id: e.target.value }))
                }
                placeholder="gpt-4o"
                className="flex-1"
              />
              <Input
                value={creating.name}
                onChange={(e) =>
                  setCreating((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Display name (optional)"
                className="flex-1"
              />
              <Button onClick={onCreate} variant="primary" size="sm">
                <Plus />
              </Button>
            </div>
          </Card>
        </div>

        {[
          {
            title: "Custom models",
            models: filteredCustomModels,
            emptyMsg: searchQuery
              ? "No custom models match your search"
              : "No custom models",
            showDelete: true,
            onDelete: onRemoveCustomModel,
          },
          {
            title: "Fetched models",
            models: filteredFetchedModels,
            emptyMsg: searchQuery
              ? "No fetched models match your search"
              : "No fetched models",
            showDelete: false,
            onDelete: undefined,
          },
        ].map(
          (
            { title, models, emptyMsg, showDelete, onDelete },
            idx, // idx: 0 for custom, 1 for fetched
          ) => (
            <div className="space-y-3" key={title}>
              {idx === 1 && <h4 className="text-sm font-semibold">{title}</h4>}
              {idx === 0 && null}
              <Card variant="bordered">
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {models.length === 0 && (
                    <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                      {emptyMsg}
                    </div>
                  )}
                  {models.map((m) => (
                    <div
                      key={m.id}
                      className="px-4 py-3 grid grid-cols-1 md:grid-cols-6 gap-3 items-center"
                    >
                      <div className="md:col-span-2">
                        <Input
                          type="text"
                          value={m.name || ""}
                          onChange={(e) =>
                            onUpdateField(m.id, "name", e.target.value)
                          }
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Input
                          type="text"
                          value={m.id}
                          onChange={(e) =>
                            onUpdateField(m.id, "id", e.target.value)
                          }
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center justify-end gap-2">
                        <Switch
                          checked={!!m.enabled}
                          onChange={(checked) => onToggle(m.id, checked)}
                        />
                        {showDelete && (
                          <button
                            onClick={() => onDelete?.(m.id)}
                            className="text-neutral-500 hover:text-neutral-600 hover:opacity-80 pl-2"
                          >
                            <Trash className="w-5 h-" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
