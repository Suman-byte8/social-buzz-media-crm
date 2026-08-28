// Small in-process LRU-ish cache for Drive-backed file bytes. The
// logo-proxy and document-stream endpoints re-fetch from Google Drive on
// every request — logo-proxy in particular is public and embedded via
// plain <img> tags everywhere, so it's hit constantly. Caching the bytes
// here means only the first request per file (per process) pays for the
// Drive round-trip; everything else is served from memory.
//
// This is intentionally simple (Map insertion order = LRU order, evict
// oldest when over budget) rather than a proper LRU library — the app's
// file counts are small enough that this doesn't need to be clever.
const MAX_CACHE_BYTES = 100 * 1024 * 1024; // 100MB total across all cached files
const MAX_ENTRIES = 200;

const cache = new Map(); // fileId -> { buffer, contentType, size }
let totalBytes = 0;

const evictIfNeeded = () => {
  while ((cache.size > MAX_ENTRIES || totalBytes > MAX_CACHE_BYTES) && cache.size > 0) {
    const oldestKey = cache.keys().next().value;
    const entry = cache.get(oldestKey);
    totalBytes -= entry.size;
    cache.delete(oldestKey);
  }
};

export const getCachedFile = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  // Touch it so it moves to the back of the Map's iteration order (most
  // recently used), which is what evictIfNeeded treats as "keep longest".
  cache.delete(key);
  cache.set(key, entry);
  return entry;
};

export const setCachedFile = (key, buffer, contentType) => {
  const size = buffer.length;
  if (size > MAX_CACHE_BYTES) return; // a single file bigger than the whole budget isn't worth caching
  cache.set(key, { buffer, contentType, size });
  totalBytes += size;
  evictIfNeeded();
};
