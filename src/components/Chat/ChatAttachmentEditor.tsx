"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHotkeys } from "react-hotkeys-hook";
import {
  createImageAttachment,
  createPdfAttachment,
  createGenericFileAttachment,
} from "@/lib/attachments";
import { getAssetObjectURL } from "@/lib/stores/utils/asset-db";
import type { Message } from "@/lib/stores/conversation";
import ImageViewer from "../ImageViewer";

interface AttachmentItem {
  id: string;
  type: "image" | "pdf" | "file";
  mimeType?: string;
  name?: string;
  previewUrl: string;
}

interface ChatAttachmentEditorProps {
  initialContent: string;
  initialAssets?: Message["assets"];
  onCancel: () => void;
  onSave: (content: string, attachments: Message["assets"]) => void;
  placeholder?: string;
}

export default function ChatAttachmentEditor({
  initialContent,
  initialAssets = [],
  onCancel,
  onSave,
  placeholder = "Edit your message...",
}: ChatAttachmentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialContent);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  useHotkeys("esc", () => onCancel());
  useHotkeys("shift+enter", () => submit(), { enableOnFormTags: ["TEXTAREA"] });

  // Load initial attachments
  useEffect(() => {
    const loadInitialAttachments = async () => {
      if (initialAssets.length === 0) {
        setAttachments([]);
        return;
      }

      const loadedAttachments = await Promise.all(
        initialAssets.map(async (asset) => {
          const previewUrl = await getAssetObjectURL(asset.id);
          return {
            ...asset,
            previewUrl: previewUrl || "",
          };
        }),
      );

      setAttachments(loadedAttachments.filter((att) => att.previewUrl !== ""));
    };

    loadInitialAttachments();
  }, [initialAssets]);

  const submit = () => {
    // Convert attachments back to Message asset format (without previewUrl)
    const assetsForSave = attachments.map(({ previewUrl, ...asset }) => asset);
    onSave(content.trim(), assetsForSave);

    // Clean up URLs since we're done with them
    attachments.forEach((att) => {
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    });
  };

  const handleTextareaInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const value = e.currentTarget.value;
      setContent(value);
      e.currentTarget.style.height = "auto";
      e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
    },
    [],
  );

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
    const otherFiles = files.filter(
      (f) =>
        !f.type.startsWith("image/") &&
        !(
          f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
        ),
    );

    if (images.length === 0 && pdfs.length === 0 && otherFiles.length === 0)
      return;

    const createImage = (file: File) => createImageAttachment(file);
    const createPdf = (file: File) => createPdfAttachment(file);
    const createGeneric = (file: File) => createGenericFileAttachment(file);

    const [savedImages, savedPdfs, savedOthers] = await Promise.all([
      Promise.all(images.map(createImage)),
      Promise.all(pdfs.map(createPdf)),
      Promise.all(otherFiles.map(createGeneric)),
    ]);

    const combined = [...savedImages, ...savedPdfs, ...savedOthers];
    setAttachments((prev) => [...prev, ...combined]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const canSave = content.trim().length > 0 || attachments.length > 0;

  return (
    <div className="py-1 max-h-[600px] overflow-y-auto">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative h-16 w-24 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0 bg-neutral-50 dark:bg-neutral-800"
            >
              {att.type === "image" ? (
                <ImageViewer
                  image={att.previewUrl}
                  alt={att.name || "image"}
                  className="object-cover w-full h-full"
                />
              ) : (
                <a
                  href={att.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-full flex items-center justify-center text-[10px] text-neutral-700 dark:text-neutral-300 px-2 text-center hover:underline"
                  title={att.name || (att.type === "pdf" ? "PDF" : "File")}
                >
                  {att.name || (att.type === "pdf" ? "PDF" : "File")}
                </a>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="absolute top-1 right-1 bg-neutral-900 text-white rounded-full p-1 hover:bg-neutral-700 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Files Button */}
      <div className="mb-3">
        <button
          type="button"
          onClick={handleUploadClick}
          className="py-1 px-2 text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Add files
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,text/plain,.txt,.md,.markdown,.srt,.csv,application/json"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Text Input Area */}
      <div className="relative">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          defaultValue={content}
          placeholder={placeholder}
          onChange={handleTextareaInput}
          className={cn(
            "w-full resize-none focus:outline-none text-sm leading-relaxed px-2",
            "placeholder-neutral-500 dark:placeholder-neutral-400",
            "min-h-[120px] max-h-[300px]",
            "custom-scrollbar",
          )}
          rows={4}
        />
      </div>

      {/* Action Buttons */}
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
          disabled={!canSave}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full",
            canSave
              ? "bg-neutral-900 text-white dark:text-black hover:opacity-80 dark:bg-white"
              : "bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed",
          )}
        >
          Save
        </button>
      </div>
    </div>
  );
}
