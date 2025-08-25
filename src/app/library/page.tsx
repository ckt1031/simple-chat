"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import {
  deleteAssetById,
  listImageAssets,
  revokeObjectURL,
  getAssetObjectURL,
} from "@/lib/stores/utils/asset-db";
import { Trash2, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { SettingsModal } from "@/components/Settings/Modal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useConversationStore } from "@/lib/stores/conversation";
import { useUIStore } from "@/lib/stores/ui";

type LibraryItem = {
  id: string;
  name?: string;
  mimeType: string;
  createdAt: number;
  size?: number;
  url: string;
};

function LibraryPageContent() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openDeleteConfirmation = useUIStore((s) => s.openDeleteConfirmation);

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { removeAssetReferences } = useConversationStore();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const records = await listImageAssets();
      const urls = await Promise.all(
        records.map((r) => getAssetObjectURL(r.id)),
      );
      if (!mounted) return;
      const mapped: LibraryItem[] = records
        .map((r, i) => ({
          id: r.id,
          name: r.name,
          mimeType: r.mimeType,
          createdAt: r.createdAt,
          size: r.size,
          url: urls[i] || "",
        }))
        .filter((i) => Boolean(i.url));
      setItems(mapped);
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
      // Cleanup URLs
      setItems((prev) => {
        prev.forEach((it) => revokeObjectURL(it.url));
        return prev;
      });
    };
  }, []);

  const totalSizeMB = useMemo(() => {
    const bytes = items.reduce((acc, it) => acc + (it.size || 0), 0);
    return (bytes / (1024 * 1024)).toFixed(2);
  }, [items]);

  const handleDelete = async (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (target) revokeObjectURL(target.url);
    await deleteAssetById(id);
    removeAssetReferences(id);
  };

  const handleDeleteWithConfirmation = (id: string) => {
    const target = items.find((i) => i.id === id);
    openDeleteConfirmation(
      "Delete Image",
      `Are you sure you want to delete "${target?.name || "this image"}"? This action cannot be undone.`,
      () => handleDelete(id),
    );
  };

  return (
    <div className="h-screen flex bg-white dark:bg-neutral-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 w-full h-full">
        <div className="flex items-center p-3 flex-row gap-2 flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-medium">Library</h1>
          <div className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
            {items.length} images · {totalSizeMB} MB
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <div className="mx-auto max-w-6xl px-4 py-4">
            {loading ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Loading images…
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                No images yet. Attach images in chat to see them here.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((item) => (
                  <figure
                    key={item.id}
                    className="group relative overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                  >
                    <img
                      src={item.url}
                      alt={item.name || item.id}
                      loading="lazy"
                      className="h-36 w-full object-cover"
                    />
                    <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {item.name || item.mimeType}
                    </figcaption>
                    <button
                      aria-label="Delete image"
                      title="Delete image"
                      onClick={() => handleDeleteWithConfirmation(item.id)}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <SettingsModal />
      <DeleteConfirmationModal />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryPageContent />
    </Suspense>
  );
}
