import { cn } from "@/lib/utils";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

interface ImageViewerProps {
  image: string;
  className?: string;
  alt?: string;
}

export default function ImageViewer({
  image,
  className,
  alt,
}: ImageViewerProps) {
  return (
    <PhotoProvider>
      <PhotoView src={image}>
        <img
          src={image}
          alt={alt}
          className={cn("cursor-zoom-in", className)}
        />
      </PhotoView>
    </PhotoProvider>
  );
}
