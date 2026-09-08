// Shared response cache for the heaviest-read GET endpoints (clients, team
// members, tasks, documents), so every browser hitting this server shares
// one cache instead of each browser only benefiting from its own
// localStorage cache (see client/src/utils/cache.js for that layer).
//
// Uses Redis when REDIS_URL is configured (e.g. Upstash's free tier — see
// https://upstash.com), and transparently falls back to an in-process
// Map with the same TTL/invalidation semantics when it isn't. That means
// this works out of the box with zero setup, and upgrades to a real
// shared cache (surviving restarts, shared across multiple server
// instances) the moment REDIS_URL is set — no code changes needed either
// way.
import Redis from "ioredis";
import { broadcast } from "./realtime.js";

const CACHE_PREFIX = "crm:cache:v1:";

let redisClient = null;
let redisReady = false;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    // Never block server startup/requests waiting on Redis — a cache is
    // an optimization, not a dependency the app should fail without.
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });

  redisClient.on("ready", () => {
    redisReady = true;
    console.log("[serverCache] Redis connected — using shared cache");
  });
  redisClient.on("error", (err) => {
    if (redisReady) console.error("[serverCache] Redis error:", err.message);
    redisReady = false;
  });

  redisClient.connect().catch((err) => {
    console.warn(
      `[serverCache] Redis unreachable (${err.message}) — falling back to in-process cache. ` +
        "Set REDIS_URL (e.g. from Upstash's free tier) to share this cache across instances."
    );
  });
} else {
  console.log("[serverCache] REDIS_URL not set — using in-process cache (fine for a single server instance).");
}

// ── In-process fallback ─────────────────────────────────────────────────
const memoryCache = new Map(); // key -> { value, expiresAt }
const MEMORY_MAX_ENTRIES = 500;

const memoryGet = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const memorySet = (key, value, ttlSeconds) => {
  if (memoryCache.size >= MEMORY_MAX_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

const memoryInvalidate = (prefix) => {
  const target = CACHE_PREFIX + prefix;
  for (const key of memoryCache.keys()) {
    if (key.startsWith(target)) memoryCache.delete(key);
  }
};

// ── Public API ───────────────────────────────────────────────────────────

export const getCache = async (key) => {
  const fullKey = CACHE_PREFIX + key;
  if (redisReady) {
    try {
      const raw = await redisClient.get(fullKey);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error("[serverCache] get failed, falling back to memory:", err.message);
    }
  }
  return memoryGet(fullKey);
};

export const setCache = async (key, value, ttlSeconds) => {
  const fullKey = CACHE_PREFIX + key;
  if (redisReady) {
    try {
      await redisClient.set(fullKey, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (err) {
      console.error("[serverCache] set failed, falling back to memory:", err.message);
    }
  }
  memorySet(fullKey, value, ttlSeconds);
};

// Deletes every cached entry whose key starts with `prefix` (e.g. the
// route path "clients") — call after a mutation so the next read is
// forced fresh instead of serving stale cached data. Also pushes a live
// "this changed" event to every connected browser (see realtime.js) —
// every one of this function's many call sites across the route files
// gets a live-update push for free, with no per-route socket code needed.
export const invalidateCache = async (prefix) => {
  const target = CACHE_PREFIX + prefix;
  if (redisReady) {
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", `${target}*`, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) await redisClient.del(...keys);
      } while (cursor !== "0");
    } catch (err) {
      console.error("[serverCache] invalidate failed:", err.message);
    }
  }
  // Always also clear the in-process cache — if Redis was down when an
  // earlier read fell back to memory, that stale memory entry needs
  // clearing too even once Redis is the primary store again.
  memoryInvalidate(prefix);

  broadcast("data:changed", { resource: prefix });
};
