'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatEditProps {
    initialValue: string;
    onCancel: () => void;
    onSave: (value: string) => void;
    placeholder?: string;
}

export default function ChatEdit({ initialValue, onCancel, onSave, placeholder = 'Edit your message...' }: ChatEditProps) {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize with a max height; scroll when exceeded
    useEffect(() => {
        if (!textareaRef.current) return;
        const el = textareaRef.current;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Cmd/Ctrl + Enter to save, Esc to cancel
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            submit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const submit = () => {
        const trimmed = value.trim();
        onSave(trimmed);
    };

    return (
        <div className="py-1 max-h-[250px] sm:min-w-[400px] md:min-w-[500px]">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                    'w-full resize-none focus:outline-none text-sm leading-relaxed',
                    'placeholder-neutral-500 dark:placeholder-neutral-400',
                    'max-h-[180px] pr-0.5'
                )}
            />

            <div className="mt-3 flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:opacity-80"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={submit}
                    className="px-3 py-1.5 text-sm rounded-full bg-neutral-900 text-white dark:text-black hover:opacity-80 dark:bg-white"
                >
                    Save
                </button>
            </div>
        </div>
    );
}


