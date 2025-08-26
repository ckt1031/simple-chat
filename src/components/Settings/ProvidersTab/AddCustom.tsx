import { OfficialProvider, useProviderStore } from "@/lib/stores/provider";
import { useSettingsProviderNavigationStore } from "@/lib/stores/navigation";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { defaultProviderConfig } from "@/lib/api/sdk";

interface Props {
  officialList: { id: OfficialProvider; label: string }[];
  onBack: () => void;
}

export default function AddCustom({ officialList, onBack }: Props) {
  const { addCustomProvider } = useProviderStore();
  const { navigateToConfigure } = useSettingsProviderNavigationStore();

  const handleChoose = (format: OfficialProvider) => {
    const id = addCustomProvider(format);
    navigateToConfigure(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">Select API format</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {officialList.map(({ id, label }) => {
          const Icon = defaultProviderConfig[id].icon;
          return (
            <Card
              key={id}
              variant="bordered"
              className="p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              onClick={() => handleChoose(id)}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <div className="text-sm font-medium">{label}</div>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Use {label}-compatible API
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
