'use client';

import { useMemo, useState } from 'react';
import Switch from '@/components/Switch';
import { cn } from '@/lib/utils';
import { OfficialProvider, OfficialProviderState, CustomProviderState, useProviderStore } from '@/lib/stores/provider';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type View = 'list' | 'add-custom' | 'configure-official' | 'configure-custom';

export default function ProviderSettingsTab() {
  const {
    officialProviders,
    customProviders,
    updateOfficialProvider,
    updateCustomProvider,
    addCustomProvider,
    removeCustomProvider,
  } = useProviderStore();

  const [view, setView] = useState<View>('list');
  const [activeOfficial, setActiveOfficial] = useState<OfficialProvider | null>(null);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);

  const officialList = useMemo(() => [
    { id: OfficialProvider.OPENAI, label: 'OpenAI' },
    { id: OfficialProvider.GOOGLE, label: 'Google' },
    { id: OfficialProvider.OPENROUTER, label: 'OpenRouter' },
  ], []);

  const customList = useMemo(() => Object.entries(customProviders).map(([id, p]) => ({ id, p })), [customProviders]);

  function handleAddCustom(format: OfficialProvider) {
    const id = addCustomProvider(format);
    setActiveCustomId(id);
    setView('configure-custom');
  }

  function renderList() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Providers</h3>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border rounded-lg border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {officialList.map(({ id, label }) => {
            const provider = officialProviders[id];
            if (!provider) return null;
            return (
              <button
                key={id}
                onClick={() => { setActiveOfficial(id); setView('configure-official'); }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs', provider.enabled ? 'text-green-600' : 'text-neutral-500')}>{provider.enabled ? 'Enabled' : 'Disabled'}</span>
                  <span className="text-neutral-400">›</span>
                </div>
              </button>
            );
          })}
        </div>

        <h4 className="text-sm font-semibold mt-6">Custom providers</h4>
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border rounded-lg border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {customList.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">No custom providers</div>
          )}
          {customList.map(({ id, p }) => (
            <button
              key={id}
              onClick={() => { setActiveCustomId(id); setView('configure-custom'); }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span className="text-sm font-medium">{p.displayName || `Custom (${p.providerFormat})`}</span>
              <div className="flex items-center gap-3">
                <span className={cn('text-xs', p.enabled ? 'text-green-600' : 'text-neutral-500')}>{p.enabled ? 'Enabled' : 'Disabled'}</span>
                <span className="text-neutral-400">›</span>
              </div>
            </button>
          ))}
        </div>

        <div>
          <button
            onClick={() => setView('add-custom')}
            className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <span className="text-lg leading-none">+</span>
            Add custom provider
          </button>
        </div>
      </div>
    );
  }

  function renderAddCustom() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className="text-sm text-neutral-600 dark:text-neutral-300 hover:underline"
          >
            ← Back
          </button>
          <h3 className="text-lg font-semibold">Select API format</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {officialList.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleAddCustom(id)}
              className="border rounded-lg p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
            >
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-neutral-500 mt-1">Use {label}-compatible API</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderConfig(isCustom: boolean) {
    const back = () => { setView('list'); setActiveOfficial(null); setActiveCustomId(null); };
    const title = isCustom ? 'Configure custom provider' : 'Configure provider';

    const provider = isCustom
      ? (activeCustomId ? customProviders[activeCustomId] : null)
      : (activeOfficial ? officialProviders[activeOfficial] : null);

    if (!provider) return null;

    const onToggle = (checked: boolean) => {
      if (isCustom && activeCustomId) {
        updateCustomProvider(activeCustomId, { enabled: checked });
      } else if (!isCustom && activeOfficial) {
        updateOfficialProvider(activeOfficial, { enabled: checked });
      }
    };

    const FormSchema = z.object({
      displayName: z.string().optional(),
      apiBaseURL: z.union([z.string().url().min(1, 'Required'), z.literal('')]).optional(),
      apiKey: z.string().optional(),
    });
    type FormValues = z.infer<typeof FormSchema>;

    function ConfigForm({ provider }: { provider: OfficialProviderState | CustomProviderState }) {
      const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: {
          displayName: isCustom ? (provider as CustomProviderState).displayName : undefined,
          apiBaseURL: provider.apiBaseURL,
          apiKey: provider.apiKey,
        },
      });

      const onSubmit = (values: any) => {
        const updates: any = {
          apiBaseURL: values.apiBaseURL ?? '',
          apiKey: values.apiKey ?? '',
        };
        if (isCustom) {
          updates.displayName = values.displayName ?? (provider as CustomProviderState).displayName;
        }
        if (isCustom && activeCustomId) {
          updateCustomProvider(activeCustomId, updates as any);
        } else if (!isCustom && activeOfficial) {
          updateOfficialProvider(activeOfficial, updates as any);
        }
        back();
      };

      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3">
            <div>
              <div className="text-sm font-medium">Enabled</div>
              <div className="text-xs text-neutral-500">Enable or disable this provider</div>
            </div>
            <Switch checked={provider.enabled} onChange={onToggle} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isCustom && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Display name</label>
                <input
                  type="text"
                  placeholder="My Provider"
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                  {...register('displayName')}
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">API base URL</label>
              <input
                type="text"
                placeholder="https://api.example.com"
                className={cn(
                  'w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600',
                  'border-neutral-300 dark:border-neutral-700'
                )}
                {...register('apiBaseURL')}
              />
              {errors.apiBaseURL && (
                <div className="text-xs text-red-600 dark:text-red-400">{errors.apiBaseURL.message as any}</div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">API key</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
                {...register('apiKey')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Models</label>
              <div className="text-xs text-neutral-500">Model fetching will be added later.</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isCustom && activeCustomId ? (
              <button
                type="button"
                onClick={() => { removeCustomProvider(activeCustomId); back(); }}
                className="text-sm px-3 py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                Delete custom provider
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={back}
                className="text-sm px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className={cn(
                  'text-sm px-3 py-2 rounded-md border border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
                  (isSubmitting || !isDirty) && 'opacity-60 cursor-not-allowed'
                )}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={back} className="text-sm text-neutral-600 dark:text-neutral-300 hover:underline">← Back</button>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <ConfigForm provider={provider} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === 'list' && renderList()}
      {view === 'add-custom' && renderAddCustom()}
      {view === 'configure-official' && renderConfig(false)}
      {view === 'configure-custom' && renderConfig(true)}
    </div>
  );
}
