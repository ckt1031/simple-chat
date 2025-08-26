import { X } from "lucide-react";

interface InputAttachmentsPreviewProps {
  attachments: {
    id: string;
    type: "image" | "pdf" | "file";
    mimeType?: string;
    name?: string;
    previewUrl: string;
  }[];
  onRemove: (id: string) => void;
}

export default function InputAttachmentsPreview({
  attachments,
  onRemove,
}: InputAttachmentsPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto mb-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="relative h-16 w-24 sm:max-w-[24%] rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0 bg-neutral-50 dark:bg-neutral-800"
        >
          {att.type === "image" ? (
            <img
              src={att.previewUrl}
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
            onClick={() => onRemove(att.id)}
            className="absolute top-1 right-1 bg-neutral-900 text-white rounded-full p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
