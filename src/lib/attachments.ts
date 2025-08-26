import {
  saveImageAsset,
  savePdfAsset,
  saveFileAsset,
  getAssetDataURL,
  getAssetArrayBuffer,
  AssetType,
} from "@/lib/stores/utils/asset-db";
import type { FilePart, ImagePart, TextPart } from "ai";

export type UIAttachment = {
  id: string;
  type: AssetType;
  mimeType?: string;
  name?: string;
  previewUrl: string; // For images we use a blob URL; for files we still keep a linkable blob URL
};

export async function createImageAttachment(file: File): Promise<UIAttachment> {
  const record = await saveImageAsset(file);
  const previewUrl = URL.createObjectURL(file);
  return {
    id: record.id,
    type: "image",
    mimeType: record.mimeType,
    name: record.name,
    previewUrl,
  };
}

export async function createPdfAttachment(file: File): Promise<UIAttachment> {
  const record = await savePdfAsset(file);
  const previewUrl = URL.createObjectURL(file);
  return {
    id: record.id,
    type: "pdf",
    mimeType: record.mimeType,
    name: record.name,
    previewUrl,
  };
}

export async function createGenericFileAttachment(
  file: File,
): Promise<UIAttachment> {
  const record = await saveFileAsset(file);
  const previewUrl = URL.createObjectURL(file);
  return {
    id: record.id,
    type: "file",
    mimeType: record.mimeType,
    name: record.name,
    previewUrl,
  };
}

export type PreparedParts = Array<TextPart | ImagePart | FilePart>;

export async function partsFromImage(id: string): Promise<PreparedParts> {
  const dataUrl = await getAssetDataURL(id);
  return dataUrl ? [{ type: "image", image: dataUrl }] : [];
}

export async function partsFromPdf(
  id: string,
  name?: string,
): Promise<PreparedParts> {
  const buf = await getAssetArrayBuffer(id);
  if (!buf) return [];
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  const header = name ? `PDF (${name})` : "PDF";
  return [{ type: "text", text: `${header} contents:\n${text}` }];
}

export async function partsFromGenericFile(
  id: string,
  name?: string,
): Promise<PreparedParts> {
  const buf = await getAssetArrayBuffer(id);
  if (!buf) return [];
  try {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const text = decoder.decode(new Uint8Array(buf));
    const header = name ? `File (${name})` : "File";
    return [{ type: "text", text: `${header} contents:\n${text}` }];
  } catch {
    const dataUrl = await getAssetDataURL(id);
    if (!dataUrl) return [];
    const mediaType =
      dataUrl.split(";")[0].replace("data:", "") || "application/octet-stream";
    return [{ type: "file", data: dataUrl, mediaType } as FilePart];
  }
}

export async function attachmentToParts(
  attachments: { id: string; type: AssetType; name?: string }[] | undefined,
): Promise<PreparedParts> {
  if (!attachments || attachments.length === 0) return [];
  const parts: PreparedParts = [];
  for (const a of attachments) {
    if (a.type === "image") {
      parts.push(...(await partsFromImage(a.id)));
    } else if (a.type === "pdf") {
      parts.push(...(await partsFromPdf(a.id, a.name)));
    } else {
      parts.push(...(await partsFromGenericFile(a.id, a.name)));
    }
  }
  return parts;
}
