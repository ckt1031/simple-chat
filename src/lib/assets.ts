import { createIdGenerator } from 'ai';
import { createStore, get, set, del, keys } from 'idb-keyval';

const assetsStore = createStore('simple-chat-assets', 'assets');

export type AssetType = 'image';

export interface AssetRecord {
    id: string;
    type: AssetType;
    mimeType: string;
    name?: string;
    size?: number;
    createdAt: number;
    hash?: string;
    blob: Blob;
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

    const existingId = (await get(`hash:${hash}`, assetsStore)) as string | undefined;
    if (existingId) {
        const existing = (await get(existingId, assetsStore)) as AssetRecord | undefined;
        if (existing) return existing;
    }

    const id = createIdGenerator({ prefix: 'asset', size: 16 })();
    const record: AssetRecord = {
        id,
        type: 'image',
        mimeType: file.type || 'image/*',
        name: file.name,
        size: file.size,
        createdAt: Date.now(),
        hash,
        blob: file,
    };
    await set(id, record, assetsStore);
    await set(`hash:${hash}`, id, assetsStore);
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

export async function listImageAssets(): Promise<AssetRecord[]> {
    const allKeys = await keys(assetsStore);
    const assetKeys = allKeys.filter((k) => typeof k === 'string' && !String(k).startsWith('hash:')) as string[];
    const records: AssetRecord[] = [];
    for (const key of assetKeys) {
        const rec = (await get(key, assetsStore)) as AssetRecord | undefined;
        if (rec && rec.type === 'image') records.push(rec);
    }
    records.sort((a, b) => b.createdAt - a.createdAt);
    return records;
}

export async function deleteAssetById(id: string): Promise<void> {
    const rec = (await get(id, assetsStore)) as AssetRecord | undefined;
    if (rec?.hash) {
        const mappedId = (await get(`hash:${rec.hash}`, assetsStore)) as string | undefined;
        if (mappedId === id) {
            await del(`hash:${rec.hash}`, assetsStore);
        }
    }
    await del(id, assetsStore);
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
