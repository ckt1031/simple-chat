import { OfficialProvider } from '@/lib/stores/provider';
import { ArrowLeft } from 'lucide-react';

interface Props {
  officialList: { id: OfficialProvider; label: string }[];
  onBack: () => void;
  onChoose: (format: OfficialProvider) => void;
}

export default function AddCustom({ officialList, onBack, onChoose }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-sm text-neutral-600 dark:text-neutral-300 hover:opacity-80"
        >
          <ArrowLeft />
        </button>
        <h3 className="text-lg font-semibold">Select API format</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {officialList.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChoose(id)}
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


