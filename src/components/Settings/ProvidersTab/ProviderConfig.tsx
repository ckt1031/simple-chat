import Switch from '@/components/Switch';
import { cn } from '@/lib/utils';
import { OfficialProvider, OfficialProviderState, CustomProviderState, useProviderStore } from '@/lib/stores/provider';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';
import { zodResolver } from '@hookform/resolvers/zod';

interface Props {
  isCustom: boolean;
  activeOfficial: OfficialProvider | null;
  activeCustomId: string | null;
  onBack: () => void;
  onManageModels: () => void;
}

export default function ProviderConfig({ isCustom, activeOfficial, activeCustomId, onBack, onManageModels }: Props) {
  const { officialProviders, customProviders, updateOfficialProvider, updateCustomProvider, removeCustomProvider } = useProviderStore();

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
    displayName: z.optional(z.string()),
    apiBaseURL: z.optional(z.union([z.url(), z.literal('')])),
    apiKey: z.optional(z.string()),
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

    const onSubmit = (values: FormValues) => {
      const updates: Partial<OfficialProviderState & CustomProviderState> = {
        apiBaseURL: values.apiBaseURL ?? '',
        apiKey: values.apiKey ?? '',
      };
      if (isCustom) {
        (updates as Partial<CustomProviderState>).displayName = values.displayName ?? (provider as CustomProviderState).displayName;
      }
      if (isCustom && activeCustomId) {
        updateCustomProvider(activeCustomId, updates as Partial<CustomProviderState>);
      } else if (!isCustom && activeOfficial) {
        updateOfficialProvider(activeOfficial, updates as Partial<OfficialProviderState>);
      }
      onBack();
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
              <div className="text-xs text-red-600 dark:text-red-400">{errors.apiBaseURL.message}</div>
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
          <button
            type="button"
            onClick={onManageModels}
            className="w-full flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          >
            <div className='flex flex-col gap-1 items-start'>
              <div className="text-sm font-medium">Models</div>
              <div className="text-xs text-neutral-500">Fetch and manage models</div>
            </div>
            <span className="text-neutral-400">›</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isCustom && activeCustomId ? (
            <button
              type="button"
              onClick={() => { removeCustomProvider(activeCustomId); onBack(); }}
              className="text-sm px-3 py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              Delete custom provider
            </button>
          ) : <span />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
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
        <button onClick={onBack} className="text-sm text-neutral-600 dark:text-neutral-300 hover:underline">← Back</button>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ConfigForm provider={provider} />
    </div>
  );
}


