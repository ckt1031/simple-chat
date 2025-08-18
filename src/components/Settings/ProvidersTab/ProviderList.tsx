import { OfficialProvider, useProviderStore } from "@/lib/stores/provider";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
    officialList: {
        id: OfficialProvider;
        label: string;
    }[]
    setView: (view: 'list' | 'add-custom' | 'configure-official' | 'configure-custom') => void;
    setActiveOfficial: (id: OfficialProvider) => void;
    setActiveCustomId: (id: string) => void;
}

export default function ProviderList({ officialList, setView, setActiveOfficial, setActiveCustomId }: Props) {
    const { officialProviders, customProviders } = useProviderStore();
    const customList = useMemo(() => Object.entries(customProviders).map(([id, p]) => ({ id, p })), [customProviders]);

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