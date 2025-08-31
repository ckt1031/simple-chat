"use client";

import { X, AlertTriangle } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui";
import Button from "@/components/ui/Button";
import { useHotkeys } from "react-hotkeys-hook";
import { useClickAway } from "react-use";
import { useRef } from "react";

export default function DeleteConfirmationModal() {
  const deleteConfirmation = useUIStore((s) => s.deleteConfirmation);
  const closeDeleteConfirmation = useUIStore((s) => s.closeDeleteConfirmation);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (deleteConfirmation.onConfirm) {
      deleteConfirmation.onConfirm();
    }
    closeDeleteConfirmation();
  };

  const handleCancel = () => {
    closeDeleteConfirmation();
  };

  // Close on Escape key
  useHotkeys("esc", () => closeDeleteConfirmation());

  useClickAway(modalRef, handleCancel);

  if (!deleteConfirmation.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div
        ref={modalRef}
        className="bg-white dark:bg-neutral-900 shadow-xl rounded-2xl max-w-md w-full mx-4 border border-neutral-200 dark:border-neutral-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {deleteConfirmation.title}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-neutral-700 dark:text-neutral-300 mb-6">
            {deleteConfirmation.message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              className="min-w-[80px]"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
