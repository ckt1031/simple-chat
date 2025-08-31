"use client";

import ImageViewer from "@/components/ImageViewer";
import { Trash2 } from "lucide-react";

type LibraryItem = {
  id: string;
  name?: string;
  mimeType: string;
  createdAt: number;
  size?: number;
  url: string;
  type: "image" | "pdf" | "file";
};

interface FileImageProps {
  items: LibraryItem[];
  onDelete: (id: string) => void;
}

export default function FileImage({ items, onDelete }: FileImageProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
        Images
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <figure
            key={item.id}
            className="group relative overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
          >
            <ImageViewer
              image={item.url}
              alt={item.name || item.id}
              className="h-36 w-full object-cover"
            />
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {item.name || item.mimeType}
            </figcaption>
            <button
              aria-label="Delete asset"
              title="Delete asset"
              onClick={() => onDelete(item.id)}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </figure>
        ))}
      </div>
    </div>
  );
}
