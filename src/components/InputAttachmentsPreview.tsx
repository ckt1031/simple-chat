import { X } from "lucide-react";

interface InputAttachmentsPreviewProps {
    attachments: { id: string; type: "image"; mimeType?: string; name?: string; previewUrl: string }[];
    onRemove: (id: string) => void;
}

export default function InputAttachmentsPreview({ attachments, onRemove }: InputAttachmentsPreviewProps) {
    if (attachments.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto custom-scrollbar mb-2">
            {attachments.map((att) => (
                <div
                    key={att.id}
                    className="relative h-16 w-20 sm:max-w-[20%] rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                >
                    <img
                        src={att.previewUrl}
                        alt={att.name || "image"}
                        className="object-cover w-full h-full"
                    />
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