// Stockage des photos des cases.
// Les photos sont réduites puis rangées dans IndexedDB (stockage du navigateur
// bien plus grand que localStorage). La configuration ne garde qu'un identifiant
// (imageId), ce qui la laisse légère.

const DB_NAME = "qcm-personnalisable-images";
const STORE = "images";

/** Côté le plus long d'une photo après réduction, en pixels. */
const MAX_SIDE = 900;
const JPEG_QUALITY = 0.82;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Cache en mémoire : identifiant -> adresse affichable (object URL)
const urlCache = new Map<string, string>();
// Photos ajoutées ou importées récemment : jamais supprimées par le nettoyage,
// le temps que la configuration qui les utilise soit enregistrée.
const recentlyAdded = new Map<string, number>();
const PROTECT_MS = 60_000;
const listeners = new Set<() => void>();

export function subscribeImages(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function newImageId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Réduit une photo choisie sur l'ordinateur et la convertit en JPEG. */
export async function resizeImage(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  // Fond blanc pour les images avec transparence (PNG)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("conversion impossible"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** Réduit et enregistre une photo, renvoie son identifiant. */
export async function addPhoto(file: File): Promise<string> {
  const blob = await resizeImage(file);
  const id = newImageId();
  recentlyAdded.set(id, Date.now());
  await withStore("readwrite", (store) => store.put(blob, id));
  urlCache.set(id, URL.createObjectURL(blob));
  notify();
  return id;
}

/** Adresse affichable d'une photo déjà en cache (sinon null). */
export function getCachedImageUrl(id: string): string | null {
  return urlCache.get(id) ?? null;
}

/** Charge une photo depuis le stockage et renvoie son adresse affichable. */
export async function loadImageUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const blob = await withStore<Blob>("readonly", (store) => store.get(id) as IDBRequest<Blob>);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/** Récupère les photos demandées sous forme de texte (pour l'export). */
export async function exportImages(ids: Iterable<string>): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const id of new Set(ids)) {
    const blob = await withStore<Blob>("readonly", (store) => store.get(id) as IDBRequest<Blob>);
    if (blob) result[id] = await blobToDataUrl(blob);
  }
  return result;
}

/** Enregistre des photos venant d'un fichier importé. */
export async function importImages(images: Record<string, string>): Promise<void> {
  for (const [id, dataUrl] of Object.entries(images)) {
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) continue;
    recentlyAdded.set(id, Date.now());
    const blob = await dataUrlToBlob(dataUrl);
    await withStore("readwrite", (store) => store.put(blob, id));
    const old = urlCache.get(id);
    if (old) URL.revokeObjectURL(old);
    urlCache.set(id, URL.createObjectURL(blob));
  }
  notify();
}

/** Supprime les photos qui ne sont plus utilisées par aucun QCM. */
export async function deleteUnusedImages(usedIds: Set<string>): Promise<void> {
  const allIds = (await withStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys())) ?? [];
  const now = Date.now();
  const unused = allIds.map(String).filter((id) => {
    if (usedIds.has(id)) return false;
    const addedAt = recentlyAdded.get(id);
    return addedAt === undefined || now - addedAt > PROTECT_MS;
  });
  if (unused.length === 0) return;
  await withStore("readwrite", (store) => {
    unused.forEach((id) => store.delete(id));
  });
  unused.forEach((id) => {
    const url = urlCache.get(id);
    if (url) URL.revokeObjectURL(url);
    urlCache.delete(id);
  });
}
