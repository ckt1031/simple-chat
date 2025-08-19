'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Square, ArrowUp, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveImageAsset } from '@/lib/assets';

interface ChatInputProps {
  onSend: (message: string, assets?: { id: string; type: 'image'; mimeType?: string; name?: string; }[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function ChatInput({ onSend, onStop, disabled = false, placeholder = "Ask anything...", isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; type: 'image'; mimeType?: string; name?: string; previewUrl: string; }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /**
   * Whether the textarea is more than single line.
   */
  const [isSingleLine, setIsSingleLine] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      const assetsForSend = attachments.map(({ id, type, mimeType, name }) => ({ id, type, mimeType, name }));
      onSend(message.trim(), assetsForSend);
      setMessage('');
      // Revoke preview URLs and clear attachments
      attachments.forEach(a => URL.revokeObjectURL(a.previewUrl));
      setAttachments([]);
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
      setIsSingleLine(message.split('\n').length <= 1);
    }
  }, [message]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length === 0) return;

    const saved = await Promise.all(images.map(async (file) => {
      const record = await saveImageAsset(file);
      const previewUrl = URL.createObjectURL(file);
      return { id: record.id, type: 'image' as const, mimeType: record.mimeType, name: record.name, previewUrl };
    }));
    setAttachments(prev => [...prev, ...saved]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const target = prev.find(a => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(a => a.id !== id);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto p-1 mb-2">
          {attachments.map(att => (
            <div key={att.id} className="relative h-16 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700">
              <img src={att.previewUrl} alt={att.name || 'image'} className="object-cover w-full h-full" />
              <button type="button" onClick={() => removeAttachment(att.id)} className="absolute cursor-pointer top-1 right-1 bg-neutral-900 text-white rounded-full p-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={
        cn(
          "relative flex items-center space-x-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm min-h-[44px] max-h-[120px]",
          isSingleLine ? "rounded-full" : "rounded-xl"
        )
      }>
        {/* Plus Button */}
        <button
          type="button"
          onClick={handleUploadClick}
          className="flex-shrink-0 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="custom-scrollbar w-full resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed placeholder-neutral-500 dark:placeholder-neutral-400 bg-transparent min-h-[20px]"
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
              <Square className="w-4 h-4" strokeWidth={1.5} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!(message.trim() || attachments.length > 0) || disabled || isLoading}
              className={cn(
                "p-2 transition-colors rounded-full",
                (message.trim() || attachments.length > 0) && !disabled && !isLoading
                  ? "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600"
                  : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed"
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
      </div>
    </form>
  );
}
