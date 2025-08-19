'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Loader2, Square, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function ChatInput({ onSend, onStop, disabled = false, placeholder = "Ask anything...", isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-center space-x-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm min-h-[44px] max-h-[120px]">
        {/* Plus Button */}
        <button
          type="button"
          className="flex-shrink-0 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed placeholder-neutral-500 dark:placeholder-neutral-400 bg-transparent min-h-[20px]"
          rows={1}
          style={{ maxHeight: '120px' }}
        />

        {/* Voice and Send/Stop Buttons */}
        <div className="flex items-center space-x-1">
          {isLoading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 transition-colors rounded-full bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600"
              aria-label="Stop generating"
              title="Stop generating"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!message.trim() || disabled || isLoading}
              className={cn(
                "p-2 transition-colors rounded-full",
                message.trim() && !disabled && !isLoading
                    ? "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                  : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp  className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
