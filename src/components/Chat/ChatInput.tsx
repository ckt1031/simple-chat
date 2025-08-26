"use client";

import { useState, useRef, useCallback, memo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createImageAttachment,
  createPdfAttachment,
  createGenericFileAttachment,
} from "@/lib/attachments";
import InputAttachmentsPreview from "../InputAttachmentsPreview";
import SendStopButton from "../SendStopButton";
import { useDropArea } from "react-use";

interface ChatInputProps {
  onSend: (
    message: string,
    assets?: {
      id: string;
      type: "image" | "pdf" | "file";
      mimeType?: string;
      name?: string;
    }[],
  ) => void;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

function ChatInput({
  onSend,
  onStop,
  disabled = false,
  placeholder = "Ask anything...",
  isLoading = false,
}: ChatInputProps) {
  const [hasText, setHasText] = useState(false);
  const [attachments, setAttachments] = useState<
    {
      id: string;
      type: "image" | "pdf" | "file";
      mimeType?: string;
      name?: string;
      previewUrl: string;
    }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (disabled) return;
      const text = (textareaRef.current?.value || "").trim();
      if (text || attachments.length > 0) {
        const assetsForSend = attachments.map(
          ({ id, type, mimeType, name }) => ({
            id,
            type,
            mimeType,
            name,
          }),
        );
        onSend(text, assetsForSend);
        if (textareaRef.current) textareaRef.current.value = "";
        // Revoke preview URLs and clear attachments
        attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
        setAttachments([]);
        // Reset the textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }
    },
    [attachments, disabled, onSend],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFiles = useCallback(async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const pdfs = files.filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (images.length === 0 && pdfs.length === 0) return;

    const createImage = (file: File) => createImageAttachment(file);
    const createPdf = (file: File) => createPdfAttachment(file);
    const createGeneric = (file: File) => createGenericFileAttachment(file);

    const otherFiles = files.filter(
      (f) =>
        !f.type.startsWith("image/") &&
        !(
          f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
        ),
    );

    const [savedImages, savedPdfs, savedOthers] = await Promise.all([
      Promise.all(images.map(createImage)),
      Promise.all(pdfs.map(createPdf)),
      Promise.all(otherFiles.map(createGeneric)),
    ]);
    const combined = [...savedImages, ...savedPdfs, ...savedOthers];
    setAttachments((prev) => {
      const next = [...prev, ...combined];
      const currentText = (textareaRef.current?.value || "").trim();
      setHasText(currentText.length > 0 || next.length > 0);
      return next;
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((a) => a.id !== id);
      // Update hasText depending on remaining attachments and current text
      const currentText = (textareaRef.current?.value || "").trim();
      setHasText(currentText.length > 0 || next.length > 0);
      return next;
    });
  }, []);

  const canSend =
    (hasText || attachments.length > 0) && !disabled && !isLoading;

  const handleTextareaInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const value = e.currentTarget.value;
      if (textareaRef.current) textareaRef.current.value = value;
      setHasText(value.length > 0 || attachments.length > 0);
      e.currentTarget.style.height = "auto";
      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
    },
    [attachments.length],
  );

  const [dropBond, dropState] = useDropArea({
    onFiles: async (files) => {
      // Files can be FileList or File[] depending on source; normalize
      const list = Array.isArray(files)
        ? files
        : Array.from(files as unknown as File[]);
      await processFiles(list as File[]);
    },
    onUri: () => {},
    onText: () => {},
  });

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      {/* Attachments preview */}
      <InputAttachmentsPreview
        attachments={attachments}
        onRemove={removeAttachment}
      />

      <div
        {...dropBond}
        className={cn(
          "relative flex items-center space-x-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full shadow-sm min-h-[44px] max-h-[300px]",
          "rounded-xl",
          "transition-all duration-300",
          // bigger
          dropState.over
            ? "scale-101 shadow-lg ring ring-blue-500/50"
            : undefined,
        )}
      >
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
          accept="image/*,application/pdf,.pdf,text/plain,.txt,.md,.markdown,.srt,.csv,application/json"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          // value={message}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-full max-h-[200px]",
            "w-full resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed placeholder-neutral-500 dark:placeholder-neutral-400 bg-transparent",
          )}
          style={{ height: "auto" }}
          rows={1}
        />

        {/* Send/Stop Buttons */}
        <SendStopButton
          isLoading={isLoading}
          onStop={onStop}
          disabled={!canSend}
        />
      </div>
    </form>
  );
}

export default memo(ChatInput);
