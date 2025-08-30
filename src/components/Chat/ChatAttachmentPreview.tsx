import { MessageAsset } from "@/lib/stores/conversation";
import { getAssetObjectURL } from "@/lib/stores/utils/asset-db";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ImageViewer from "../ImageViewer";

interface ChatAttachmentPreviewProps {
  asset: MessageAsset;
}

export default function ChatAttachmentPreview({
  asset,
}: ChatAttachmentPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const loadImage = useCallback(async () => {
    const url = await getAssetObjectURL(asset.id);
    setImageUrl(url ?? null);
  }, [asset.id]);

  const loadFile = useCallback(async () => {
    const url = await getAssetObjectURL(asset.id);
    setFileUrl(url ?? null);
  }, [asset.id]);

  useEffect(() => {
    if (asset.type === "image") void loadImage();
  }, [asset.id, loadImage]);

  const boxClass =
    "rounded-md bg-neutral-100 dark:bg-neutral-800 w-full border border-neutral-200 dark:border-neutral-700 max-w-50";

  if (asset.type === "image" && imageUrl) {
    return (
      <ImageViewer
        key={asset.id}
        image={imageUrl}
        alt="attachment"
        className="h-15 rounded-md"
      />
    );
  }

  if (asset.type === "pdf" || asset.type === "file") {
    return (
      <a
        key={asset.id}
        href={fileUrl ?? undefined}
        target="_blank"
        rel="noreferrer"
        className={cn(boxClass, "flex items-center gap-2 px-2 h-15")}
        title={asset.name || "File"}
      >
        <FileIcon className="w-4 h-4" />
        <span className="truncate">{asset.name || "File"}</span>
      </a>
    );
  }

  return null;
}
