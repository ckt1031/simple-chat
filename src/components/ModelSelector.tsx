'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalStore } from '@/lib/stores/global';
import { OfficialProvider, OfficialProviderState, CustomProviderState, useProviderStore, Model, ModelWithProvider } from '@/lib/stores/provider';
import { useHotkeys } from 'react-hotkeys-hook';

type ProviderGroup = {
  id: string;
  label: string;
  kind: 'official' | 'custom';
  officialKey?: OfficialProvider;
  data: OfficialProviderState | CustomProviderState;
};

export function ModelSelector() {
  const { general, updateSettings } = useGlobalStore();
  const { officialProviders, customProviders } = useProviderStore();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const groups: ProviderGroup[] = useMemo(() => {
    const official: ProviderGroup[] = Object.entries(officialProviders)
      .map(([key, prov]) => ({ key: key as OfficialProvider, prov }))
      .filter(({ prov }) => prov.enabled)
      .map(({ key, prov }) => ({
        id: key,
        label: key,
        kind: 'official' as const,
        officialKey: key,
        data: prov,
      }));

    const customList: ProviderGroup[] = Object.entries(customProviders)
      .map(([id, prov]) => ({ id, prov }))
      .filter(({ prov }) => prov.enabled)
      .map(({ id, prov }) => ({
        id,
        label: prov.displayName && prov.displayName.trim().length > 0 ? prov.displayName : id,
        kind: 'custom' as const,
        data: prov,
      }));

    return [...official, ...customList];
  }, [officialProviders, customProviders]);

  const handleSelect = (providerId: string, model: Model) => {
    const displayName = model.name && model.name.trim().length > 0 ? model.name : undefined;
    const next: ModelWithProvider = { id: model.id, name: displayName, enabled: model.enabled, source: model.source, providerId };
    updateSettings({ selectedModel: next });
    setOpen(false);
  };

  const buttonLabel = useMemo(() => {
    if (general.selectedModel) {
      return general.selectedModel.name && general.selectedModel.name.trim().length > 0
        ? general.selectedModel.name
        : general.selectedModel.id;
    }
    return 'Select model';
  }, [general.selectedModel]);

  useHotkeys('ctrl+m', () => setOpen(true));
  useHotkeys('esc', () => setOpen(false));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
          'min-w-[180px] justify-between'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate max-w-[220px] text-left">{buttonLabel}</span>
        <ChevronDown className="w-4 h-4 opacity-70" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-[320px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
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

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {groups.length === 0 && (
              <div className="p-3 text-sm text-neutral-500">No enabled providers</div>
            )}

            {groups.map((group) => {
              const models = (group.data.models || [])
                .filter((m) => m.enabled)
                .filter((m) => {
                  if (!query.trim()) return true;
                  const display = m.name && m.name.trim().length > 0 ? m.name : m.id;
                  return display.toLowerCase().includes(query.toLowerCase());
                });

              if (models.length === 0) return null;

              return (
                <div key={group.id}>
                  <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800">
                    {group.label}
                  </div>
                  <ul role="listbox" className="py-1">
                    {models.map((m) => {
                      const display = m.name && m.name.trim().length > 0 ? m.name : m.id;
                      return (
                        <li key={`${group.id}:${m.id}`}>
                          <button
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/70 flex items-center justify-between',
                              general.selectedModel && general.selectedModel.id === m.id && general.selectedModel.providerId === group.id
                                ? 'bg-neutral-50 dark:bg-neutral-800'
                                : ''
                            )}
                            onClick={() => handleSelect(group.id, m)}
                          >
                            <span className="truncate max-w-[240px]">{display}</span>
                            {general.selectedModel && general.selectedModel.id === m.id && general.selectedModel.providerId === group.id && (
                              <span className="text-xs text-neutral-500">Selected</span>
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


