import { cn } from "@/lib/utils";
import { Loader2, Square, ArrowUp } from "lucide-react";

interface SendStopButtonProps {
    isLoading?: boolean;
    onStop?: () => void;
    disabled: boolean;
}

export default function SendStopButton({
    isLoading,
    onStop,
    disabled,
  }: SendStopButtonProps) {
    return (
      <div className="flex items-center space-x-1">
        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="p-2 transition-colors rounded-full bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
            aria-label="Stop generating"
            title="Stop generating"
          >
            <Square className="w-4 h-4" strokeWidth={1.5} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled}
            className={cn(
              "p-2 transition-colors rounded-full",
              !disabled
                ? "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <ArrowUp className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>
    );
  }