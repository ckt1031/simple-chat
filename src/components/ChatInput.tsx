'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function ChatInput({ onSend, disabled = false, placeholder = "Ask anything...", isLoading = false }: ChatInputProps) {
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
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="relative flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-full shadow-sm">
        {/* Plus Button */}
        <button
          type="button"
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
          className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed placeholder-gray-400 bg-transparent"
          rows={1}
          style={{ maxHeight: '120px' }}
        />

        {/* Voice and Send Buttons */}
        <div className="flex items-center space-x-1">
          <button
            type="submit"
            disabled={!message.trim() || disabled || isLoading}
            className={cn(
              "p-3 transition-colors rounded-full",
              message.trim() && !disabled && !isLoading
                ? "bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
