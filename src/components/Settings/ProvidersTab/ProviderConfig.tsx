import Switch from '@/components/Switch';
import { ArrowLeft } from 'lucide-react';
import { useProviderStore } from '@/lib/stores/provider';
import { useNavigationStore } from '@/lib/stores/navigation';
import { useProviderForm } from '@/lib/hooks/useProviderForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface Props {
  providerId: string;
  onBack: () => void;
}

export default function ProviderConfig({ providerId, onBack }: Props) {
  const { getProvider, updateProvider } = useProviderStore();
  const { navigateToManageModels } = useNavigationStore();

  // Always call hooks unconditionally
  const {
    form,
    onSubmit,
    handleDelete,
    isCustom,
    defaultBaseURL,
    isSubmitting,
    isDirty,
    errors,
  } = useProviderForm({
    providerId,
    onSuccess: onBack,
  });

  const provider = getProvider(providerId);
  if (!provider) return null;

  const onToggle = (checked: boolean) => {
    updateProvider(providerId, { enabled: checked });
  };

  const title = isCustom ? 'Configure custom provider' : 'Configure provider';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card variant="bordered">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-medium">Enabled</div>
              <div className="text-xs text-neutral-500">Enable or disable this provider</div>
            </div>
            <Switch checked={provider.enabled} onChange={onToggle} />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {isCustom && (
            <Input
              label="Display name"
              placeholder="My Provider"
              {...form.register('displayName')}
            />
          )}
          
          <Input
            label="API base URL"
            type="url"
            placeholder={defaultBaseURL || "https://api.example.com"}
            error={errors.apiBaseURL?.message}
            helperText={
              !isCustom && defaultBaseURL
                ? provider.apiBaseURL ? 'Custom URL set' : `Default: ${defaultBaseURL}`
                : undefined
            }
            {...form.register('apiBaseURL')}
          />
          
          <Input
            label="API key"
            type="password"
            placeholder="••••••••"
            {...form.register('apiKey')}
          />
          
          <Card
            variant="bordered"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
            onClick={() => navigateToManageModels(providerId)}
          >
            <div className='flex flex-col gap-1 items-start'>
              <div className="text-sm font-medium">Models</div>
              <div className="text-xs text-neutral-500">Fetch and manage models</div>
            </div>
            <span className="text-neutral-400">›</span>
          </Card>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isCustom ? (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
            >
              Delete custom provider
            </Button>
          ) : <span />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !isDirty}
            >
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}


