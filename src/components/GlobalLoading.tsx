'use client';

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        {/* App Logo/Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Simple Chat
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Loading your conversations...
          </p>
        </div>
        
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
