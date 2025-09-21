import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <Loader className="w-5 h-5 animate-spin text-neutral-600 dark:text-neutral-400" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading...
        </p>
      </div>
    </div>
  );
}
