'use client';

import { useMemo, useState } from 'react';
import { OfficialProvider, useProviderStore, OfficialProviderState, CustomProviderState } from '@/lib/stores/provider';
import listModels from '@/lib/api/list-models';
import { cn } from '@/lib/utils';

interface Props {
  isCustom: boolean;
  activeOfficial: OfficialProvider | null;
  activeCustomId: string | null;
  onBack: () => void;
}

export default function ModelsManager({ isCustom, activeOfficial, activeCustomId, onBack }: Props) {
  const store = useProviderStore();
  const provider: (OfficialProviderState | CustomProviderState) | null = useMemo(() => {
    if (isCustom) {
      return activeCustomId ? store.customProviders[activeCustomId] : null;
    }
    return activeOfficial ? store.officialProviders[activeOfficial] : null;
  }, [isCustom, activeOfficial, activeCustomId, store.customProviders, store.officialProviders]);

  const format: OfficialProvider | null = useMemo(() => {
    if (!provider) return null;
    return isCustom
      ? (provider as CustomProviderState).providerFormat
      : (activeOfficial as OfficialProvider);
  }, [isCustom, provider, activeOfficial]);

  const [creating, setCreating] = useState<{ id: string; name: string }>({ id: '', name: '' });
  const [isFetching, setIsFetching] = useState(false);

  if (!provider || !format) return null;

  const onFetch = async () => {
    setIsFetching(true);
    try {
      const models = await listModels(format, provider);
      if (isCustom && activeCustomId) {
        store.applyFetchedModelsToCustom(activeCustomId, models);
      } else if (!isCustom && activeOfficial) {
        store.applyFetchedModelsToOfficial(activeOfficial, models);
      }
    } finally {
      setIsFetching(false);
    }
  };

  const onClearFetched = () => {
    if (isCustom && activeCustomId) {
      store.clearFetchedModelsForCustom(activeCustomId);
    } else if (!isCustom && activeOfficial) {
      store.clearFetchedModelsForOfficial(activeOfficial);
    }
  };

  const onCreate = () => {
    const id = creating.id.trim();
    const name = creating.name.trim() || id;
    if (!id) return;
    if (isCustom && activeCustomId) {
      store.addCustomModelToCustom(activeCustomId, { id, name });
    } else if (!isCustom && activeOfficial) {
      store.addCustomModelToOfficial(activeOfficial, { id, name });
    }
    setCreating({ id: '', name: '' });
  };

  const onToggle = (modelId: string, enabled: boolean) => {
    if (isCustom && activeCustomId) {
      store.updateModelForCustom(activeCustomId, modelId, { enabled });
    } else if (!isCustom && activeOfficial) {
      store.updateModelForOfficial(activeOfficial, modelId, { enabled });
    }
  };

  const onUpdateField = (modelId: string, field: 'name' | 'id', value: string) => {
    if (isCustom && activeCustomId) {
      store.updateModelForCustom(activeCustomId, modelId, { [field]: value } as any);
    } else if (!isCustom && activeOfficial) {
      store.updateModelForOfficial(activeOfficial, modelId, { [field]: value } as any);
    }
  };

  const onRemoveCustomModel = (modelId: string) => {
    if (isCustom && activeCustomId) {
      store.removeCustomModelFromCustom(activeCustomId, modelId);
    } else if (!isCustom && activeOfficial) {
      store.removeCustomModelFromOfficial(activeOfficial, modelId);
    }
  };

  const fetchedModels = provider.models.filter((m) => m.source === 'fetch');
  const customModels = provider.models.filter((m) => m.source === 'custom');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-sm text-neutral-600 dark:text-neutral-300 hover:underline">← Back</button>
        <h3 className="text-lg font-semibold">Manage models</h3>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onFetch}
          disabled={isFetching}
          className={cn(
            'text-sm px-3 py-2 rounded-md border border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
            isFetching && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isFetching ? 'Fetching…' : 'Fetch models'}
        </button>
        <button
          onClick={onClearFetched}
          className="text-sm px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Clear fetched
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Add custom model</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={creating.id}
            onChange={(e) => setCreating((s) => ({ ...s, id: e.target.value }))}
            placeholder="model-id"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
          <input
            value={creating.name}
            onChange={(e) => setCreating((s) => ({ ...s, name: e.target.value }))}
            placeholder="Display name (optional)"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
          <div>
            <button
              onClick={onCreate}
              className="w-full text-sm px-3 py-2 rounded-md border border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Fetched models</h4>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border rounded-lg border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {fetchedModels.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">No fetched models</div>
          )}
          {fetchedModels.map((m) => (
            <div key={m.id} className="px-4 py-3 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={m.name || ''}
                  onChange={(e) => onUpdateField(m.id, 'name', e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={m.id}
                  onChange={(e) => onUpdateField(m.id, 'id', e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>
              <div className="sm:col-span-1 flex items-center justify-end">
                <label className="text-xs mr-2">Enabled</label>
                <input type="checkbox" checked={!!m.enabled} onChange={(e) => onToggle(m.id, e.target.checked)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Custom models</h4>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border rounded-lg border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {customModels.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">No custom models</div>
          )}
          {customModels.map((m) => (
            <div key={m.id} className="px-4 py-3 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={m.name || ''}
                  onChange={(e) => onUpdateField(m.id, 'name', e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={m.id}
                  onChange={(e) => onUpdateField(m.id, 'id', e.target.value)}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                />
              </div>
              <div className="sm:col-span-1 flex items-center justify-end gap-2">
                <label className="text-xs">Enabled</label>
                <input type="checkbox" checked={!!m.enabled} onChange={(e) => onToggle(m.id, e.target.checked)} />
                <button
                  onClick={() => onRemoveCustomModel(m.id)}
                  className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


