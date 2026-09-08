// Generic TTL-based localStorage cache for API GET responses, used by
// createCachedThunk (see @/redux/cachedThunk). Goal: repeat navigations to
// the same page/filter combo within the TTL window serve instantly from
// localStorage instead of re-hitting the DB, without changing the shape of
// what any thunk resolves with — every existing `.fulfilled` reducer keeps
// working unmodified.
//
// This intentionally does NOT go through `@/utils/storage` (which mirrors
// into cookies too) — cookies cap out around 4KB, far too small for cached
// list responses, and mixing a large TTL cache into that helper would risk
// silently truncating auth token/user storage that shares its key space.

const CACHE_PREFIX = "crm_cache_v1_";

const isBrowser = () => typeof window !== "undefined";

const fullKey = (key) => `${CACHE_PREFIX}${key}`;

export const readCache = (key, ttlMs) => {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(fullKey(key));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.ts !== "number") return null;
    if (Date.now() - entry.ts > ttlMs) return null;
    return entry.data;
  } catch {
    return null;
  }
};

export const writeCache = (key, data) => {
  if (!isBrowser()) return;
  const write = () => localStorage.setItem(fullKey(key), JSON.stringify({ ts: Date.now(), data }));
  try {
    write();
  } catch {
    // Quota exceeded, or `data` isn't serializable — caching is a pure
    // optimization and must never break the calling thunk. Best effort:
    // drop the oldest quarter of our own entries and try once more.
    try {
      pruneOldEntries();
      write();
    } catch {
      // Give up silently; the app still works without a cache hit here.
    }
  }
};

// Removes every cache entry whose key starts with `prefix` — call with a
// thunk's type-prefix (e.g. "clients/fetchClients") after a mutation so the
// next read is forced fresh, regardless of which params/filters were used
// to populate the cached entries.
export const invalidateCache = (prefix) => {
  if (!isBrowser()) return;
  try {
    const target = fullKey(prefix);
    Object.keys(localStorage)
      .filter((k) => k.startsWith(target))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

// Wipes every cache entry this module owns — call on logout so cached data
// doesn't linger into a different login on a shared machine.
export const clearAllCache = () => {
  if (!isBrowser()) return;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

const pruneOldEntries = () => {
  try {
    const entries = Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .map((k) => {
        try {
          const { ts } = JSON.parse(localStorage.getItem(k));
          return { k, ts: ts || 0 };
        } catch {
          return { k, ts: 0 };
        }
      })
      .sort((a, b) => a.ts - b.ts);
    const dropCount = Math.max(1, Math.ceil(entries.length / 4));
    entries.slice(0, dropCount).forEach(({ k }) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};
