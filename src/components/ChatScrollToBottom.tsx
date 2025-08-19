'use client';

import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

export default function ChatScrollToBottom({ visible, onClick, className }: ChatScrollToBottomProps) {
  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2 bottom-20 pointer-events-none transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'pointer-events-auto cursor-pointer flex items-center justify-center p-2 rounded-full shadow-lg',
          'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600',
          'dark:border dark:border-neutral-600'
        )}
        aria-label="Scroll to bottom"
        title="Scroll to bottom"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
  );
}


