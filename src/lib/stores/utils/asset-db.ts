import { createStore, get, set, del, keys } from "idb-keyval";

const assetsStore = createStore("assets-db", "assets");

export type AssetType = "image" | "pdf" | "file";

export interface AssetRecord {
  id: string;
  type: AssetType;
  mimeType: string;
  name?: string;
  size?: number;
  createdAt: number;
  blob: Blob;
  driveFileId?: string; // Google Drive file ID for remote access
}

export interface AssetRef {
  id: string;
  type: AssetType;
  mimeType?: string;
  name?: string;
}

export async function saveImageAsset(file: File): Promise<AssetRecord> {
  const arrayBuffer = await file.arrayBuffer();
  const hash = await sha256Hex(arrayBuffer);

  const existing = await get(hash, assetsStore);

  if (existing) return existing;

  const record: AssetRecord = {
    id: hash,
    type: "image",
    mimeType: file.type || "image/*",
    name: file.name,
    size: file.size,
    createdAt: Date.now(),
    blob: file,
  };

  await set(hash, record, assetsStore);

  return record;
}

export async function savePdfAsset(file: File): Promise<AssetRecord> {
  const arrayBuffer = await file.arrayBuffer();
  const hash = await sha256Hex(arrayBuffer);

  const existing = await get(hash, assetsStore);
  if (existing) return existing as AssetRecord;

  const record: AssetRecord = {
    id: hash,
    type: "pdf",
    mimeType: file.type || "application/pdf",
    name: file.name,
    size: file.size,
    createdAt: Date.now(),
    blob: file,
  };

  await set(hash, record, assetsStore);
  return record;
}

export async function saveFileAsset(file: File): Promise<AssetRecord> {
  const arrayBuffer = await file.arrayBuffer();
  const hash = await sha256Hex(arrayBuffer);

  const existing = await get(hash, assetsStore);
  if (existing) return existing as AssetRecord;

  const record: AssetRecord = {
    id: hash,
    type: "file",
    mimeType: file.type || "text/plain",
    name: file.name,
    size: file.size,
    createdAt: Date.now(),
    blob: file,
  };

  await set(hash, record, assetsStore);
  return record;
}

export async function getAssetRecord(
  id: string,
): Promise<AssetRecord | undefined> {
  return await get(id, assetsStore);
}

export async function getAssetObjectURL(
  id: string,
): Promise<string | undefined> {
  const rec = await getAssetRecord(id);
  if (!rec) return undefined;
  return URL.createObjectURL(rec.blob);
}

export async function getAssetDataURL(id: string): Promise<string | undefined> {
  const rec = await getAssetRecord(id);
  if (!rec) return undefined;
  return blobToDataURL(rec.blob);
}

export async function getAssetArrayBuffer(
  id: string,
): Promise<ArrayBuffer | undefined> {
  const rec = await getAssetRecord(id);
  if (!rec) return undefined;
  return await rec.blob.arrayBuffer();
}

export function revokeObjectURL(url?: string) {
  if (url) URL.revokeObjectURL(url);
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function listImageAssets(): Promise<AssetRecord[]> {
  const allKeys = await keys(assetsStore);
  const assetKeys = allKeys.filter(
    (k) => typeof k === "string" && !String(k).startsWith("hash:"),
  ) as string[];
  const records: AssetRecord[] = [];
  for (const key of assetKeys) {
    const rec = (await get(key, assetsStore)) as AssetRecord | undefined;
    if (rec && rec.type === "image") records.push(rec);
  }
  records.sort((a, b) => b.createdAt - a.createdAt);
  return records;
}

export async function listPdfAssets(): Promise<AssetRecord[]> {
  const allKeys = await keys(assetsStore);
  const assetKeys = allKeys.filter(
    (k) => typeof k === "string" && !String(k).startsWith("hash:"),
  ) as string[];
  const records: AssetRecord[] = [];
  for (const key of assetKeys) {
    const rec = (await get(key, assetsStore)) as AssetRecord | undefined;
    if (rec && rec.type === "pdf") records.push(rec);
  }
  records.sort((a, b) => b.createdAt - a.createdAt);
  return records;
}

export async function listAllAssets(
  types?: AssetType[],
): Promise<AssetRecord[]> {
  const allKeys = await keys(assetsStore);
  const assetKeys = allKeys.filter(
    (k) => typeof k === "string" && !String(k).startsWith("hash:"),
  ) as string[];
  const records: AssetRecord[] = [];
  for (const key of assetKeys) {
    const rec = (await get(key, assetsStore)) as AssetRecord | undefined;
    if (!rec) continue;
    if (types && types.length > 0) {
      if (types.includes(rec.type)) records.push(rec);
    } else {
      records.push(rec);
    }
  }
  records.sort((a, b) => b.createdAt - a.createdAt);
  return records;
}

export async function deleteAssetById(id: string): Promise<void> {
  await del(id, assetsStore);
}

export async function importAsset(asset: AssetRecord): Promise<void> {
  await set(asset.id, asset, assetsStore);
}

export async function importAssets(assets: AssetRecord[]): Promise<void> {
  for (const asset of assets) {
    await importAsset(asset);
  }
}

export async function getAsset(assetId: string): Promise<AssetRecord | null> {
  // First, try to get the asset from local storage
  const localAsset = (await get(assetId, assetsStore)) as
    | AssetRecord
    | undefined;

  if (localAsset?.blob) {
    return localAsset;
  }

  // If not available locally but we have a Google Drive file ID, try to download it
  if (localAsset?.driveFileId) {
    try {
      console.log(
        `Asset ${assetId} not available locally, downloading from Google Drive...`,
      );
      const downloadedAsset = await downloadAssetFromDrive(
        localAsset.driveFileId,
        localAsset,
      );
      if (downloadedAsset) {
        // Update the local asset with the downloaded blob
        const updatedAsset = { ...localAsset, blob: downloadedAsset.blob };
        await set(assetId, updatedAsset, assetsStore);
        console.log(`Asset ${assetId} downloaded and cached locally`);
        return updatedAsset;
      }
    } catch (error) {
      console.error(
        `Failed to download asset ${assetId} from Google Drive:`,
        error,
      );
    }
  }

  return localAsset || null;
}

async function downloadAssetFromDrive(
  driveFileId: string,
  assetMetadata: Omit<AssetRecord, "blob">,
): Promise<AssetRecord | null> {
  try {
    // Import Google Drive sync dynamically to avoid circular dependencies
    const { googleDriveSync } = await import("../../utils/google-drive");

    // Check if user is authenticated
    const isAuthenticated = await googleDriveSync.isAuthenticated();
    if (!isAuthenticated) {
      console.log(
        "User not authenticated, cannot download asset from Google Drive",
      );
      return null;
    }

    // Download the file content
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      },
    );

    if (!response.ok) {
      console.error(
        `Failed to download asset from Google Drive: ${response.status}`,
      );
      return null;
    }

    const blob = await response.blob();

    return {
      ...assetMetadata,
      blob,
    };
  } catch (error) {
    console.error("Error downloading asset from Google Drive:", error);
    return null;
  }
}

async function getAccessToken(): Promise<string> {
  // Get access token from localStorage (same logic as in google-drive.ts)
  try {
    const stored = localStorage.getItem("google_drive_tokens");
    if (stored) {
      const tokens = JSON.parse(stored);
      if (tokens?.access_token) {
        return tokens.access_token;
      }
    }
  } catch (error) {
    console.error("Error getting access token:", error);
  }
  throw new Error("No access token available");
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
