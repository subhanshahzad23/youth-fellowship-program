"use client";

import { clear, createStore, del, get, set } from "idb-keyval";

/**
 * Small-file strategy for user-added bytes.
 *
 * Structured records live in localStorage (via the Zustand store); the bytes of
 * files people add live in IndexedDB under a stable key. We never persist
 * temporary object URLs — a fresh URL is created only at the moment a
 * permitted viewer opens the file, and revoked afterwards.
 */

let store: ReturnType<typeof createStore> | null = null;
function fileStore() {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  store ??= createStore("launchpad-demo-files", "files");
  return store;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
export const ACCEPTED_DOC_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export function validateUpload(file: File, accepted = ACCEPTED_DOC_TYPES): string | null {
  if (!accepted.includes(file.type)) return `“${file.name}” isn't a supported file type. Upload a PDF, PNG, JPG or WebP.`;
  if (file.size > MAX_UPLOAD_BYTES) return `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 8 MB.`;
  if (file.size === 0) return `“${file.name}” is empty.`;
  return null;
}

export async function saveFileBytes(key: string, blob: Blob) {
  await set(key, blob, fileStore());
}

export async function readFileBytes(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, fileStore());
}

export async function deleteFileBytes(key: string) {
  try {
    await del(key, fileStore());
  } catch {
    /* ignore */
  }
}

export async function clearAllFiles() {
  await clear(fileStore());
}

/** Resolve a viewable URL for a file record. Caller must revoke blob URLs. */
export async function resolveFileUrl(rec: { sampleUrl?: string; blobKey?: string }): Promise<{ url: string; revoke: () => void } | null> {
  if (rec.sampleUrl) return { url: rec.sampleUrl, revoke: () => {} };
  if (rec.blobKey) {
    const blob = await readFileBytes(rec.blobKey);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  }
  return null;
}

/** Trigger a real browser download for a string or blob. */
export function downloadBlob(data: Blob | string, fileName: string, mime = "text/plain") {
  const blob = typeof data === "string" ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function downloadFileRecord(rec: { sampleUrl?: string; blobKey?: string; name: string; mime: string }) {
  if (rec.sampleUrl) {
    const res = await fetch(rec.sampleUrl);
    if (!res.ok) throw new Error("File missing");
    downloadBlob(await res.blob(), rec.name, rec.mime);
    return;
  }
  if (rec.blobKey) {
    const blob = await readFileBytes(rec.blobKey);
    if (!blob) throw new Error("File bytes missing");
    downloadBlob(blob, rec.name, rec.mime);
    return;
  }
  throw new Error("No file content");
}
