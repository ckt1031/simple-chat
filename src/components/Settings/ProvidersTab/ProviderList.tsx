import { OfficialProvider, useProviderStore } from "@/lib/stores/provider";
import { useNavigationStore } from "@/lib/stores/navigation";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { defaultProviderConfig } from "@/lib/api/sdk";

interface Props {
  officialList: {
    id: OfficialProvider;
    label: string;
  }[];
}

export default function ProviderList({ officialList }: Props) {
  const { getOfficialProviders, getCustomProviders } = useProviderStore();
  const { navigateToConfigure, navigateToAddCustom } = useNavigationStore();

  const officialProviders = getOfficialProviders();
  const customProviders = getCustomProviders();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Providers</h3>

      <Card variant="bordered">
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {officialList.map(({ id, label }) => {
            const provider = officialProviders.find((p) => p.provider === id);
            if (!provider) return null;

            const Icon = defaultProviderConfig[id].icon;

            return (
              <button
                key={id}
                onClick={() => navigateToConfigure(id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs",
                      provider.enabled ? "text-green-600" : "text-neutral-500",
                    )}
                  >
                    {provider.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className="text-neutral-400">›</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <h4 className="text-sm font-semibold mt-6">Custom providers</h4>
      <Card variant="bordered">
        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {customProviders.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">
              No custom providers
            </div>
          )}
          {customProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => navigateToConfigure(provider.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span className="text-sm font-medium">
                {provider.displayName || `Custom (${provider.providerFormat})`}
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-xs",
                    provider.enabled ? "text-green-600" : "text-neutral-500",
                  )}
                >
                  {provider.enabled ? "Enabled" : "Disabled"}
                </span>
                <span className="text-neutral-400">›</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div>
        <Button
          onClick={navigateToAddCustom}
          variant="secondary"
          className="mt-3"
        >
          <span className="text-lg leading-none mr-2">+</span>
          Add custom provider
        </Button>
      </div>
    </div>
  );
}
