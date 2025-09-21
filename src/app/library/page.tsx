"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import {
  deleteAssetById,
  listAllAssets,
  revokeObjectURL,
  getAssetObjectURL,
} from "@/lib/stores/utils/asset-db";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { SettingsModal } from "@/components/Settings/Modal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import FileText from "./FileText";
import FileImage from "./FileImage";
import { useConversationStore } from "@/lib/stores/conversation";
import { useUIStore } from "@/lib/stores/ui";

type LibraryItem = {
  id: string;
  name?: string;
  mimeType: string;
  createdAt: number;
  size?: number;
  url: string;
  type: "image" | "pdf" | "file";
};

function LibraryPageContent() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const openDeleteConfirmation = useUIStore((s) => s.openDeleteConfirmation);

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { removeAssetReferences, setCurrentConversation } =
    useConversationStore();

  // Clear current conversation when library page loads
  useEffect(() => {
    setCurrentConversation(null);
  }, [setCurrentConversation]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const records = await listAllAssets(["image", "pdf"]);
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
          type: r.type,
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
            {items.length} items · {totalSizeMB} MB
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <div className="mx-auto max-w-6xl px-4 py-4">
            {loading ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Loading assets…
              </div>
            ) : items.length === 0 ? (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                No assets yet. Attach images or PDFs in chat to see them here.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upper: text/PDF files */}
                <FileText
                  items={items.filter((i) => i.type !== "image")}
                  onDelete={handleDeleteWithConfirmation}
                />
                {/* Lower: images */}
                <FileImage
                  items={items.filter((i) => i.type === "image")}
                  onDelete={handleDeleteWithConfirmation}
                />
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
