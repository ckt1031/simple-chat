"use client";

export default function ChatEmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          What&apos;s on your mind?
        </h2>
        <p className="text-neutral-600 dark:text-white">
          Start a conversation to begin chatting with AI.
        </p>
      </div>
    </div>
  );
}
