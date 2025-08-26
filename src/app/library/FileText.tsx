"use client";

import { FileText as FileTextIcon, Trash2 } from "lucide-react";

type LibraryItem = {
  id: string;
  name?: string;
  mimeType: string;
  createdAt: number;
  size?: number;
  url: string;
  type: "image" | "pdf" | "file";
};

interface FileTextProps {
  items: LibraryItem[];
  onDelete: (id: string) => void;
}

export default function FileText({ items, onDelete }: FileTextProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
        Text & PDFs
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group items-center relative overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full py-3 items-center justify-start gap-2 px-3 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
            >
              <FileTextIcon className="h-4 w-4" />
              <span className="truncate">{item.name || "Document"}</span>
            </a>
            <button
              aria-label="Delete asset"
              title="Delete asset"
              onClick={() => onDelete(item.id)}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
