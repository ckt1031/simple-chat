import { createIdGenerator } from 'ai';
import { createStore, get, set } from 'idb-keyval';

const assetsStore = createStore('simple-chat-assets', 'assets');

export type AssetType = 'image';

export interface AssetRecord {
    id: string;
    type: AssetType;
    mimeType: string;
    name?: string;
    size?: number;
    createdAt: number;
    blob: Blob;
}

export interface AssetRef {
    id: string;
    type: AssetType;
    mimeType?: string;
    name?: string;
}

export async function saveImageAsset(file: File): Promise<AssetRecord> {
    const id = createIdGenerator({ prefix: 'asset', size: 16 })();
    const record: AssetRecord = {
        id,
        type: 'image',
        mimeType: file.type || 'image/*',
        name: file.name,
        size: file.size,
        createdAt: Date.now(),
        blob: file,
    };
    await set(id, record, assetsStore);
    return record;
}

export async function getAssetRecord(id: string): Promise<AssetRecord | undefined> {
    const rec = (await get(id, assetsStore)) as AssetRecord | undefined;
    return rec;
}

export async function getAssetObjectURL(id: string): Promise<string | undefined> {
    const rec = await getAssetRecord(id);
    if (!rec) return undefined;
    return URL.createObjectURL(rec.blob);
}

export async function getAssetDataURL(id: string): Promise<string | undefined> {
    const rec = await getAssetRecord(id);
    if (!rec) return undefined;
    return blobToDataURL(rec.blob);
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
