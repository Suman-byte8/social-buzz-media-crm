import { createAsyncThunk } from "@reduxjs/toolkit";
import { readCache, writeCache } from "@/utils/cache";

// Drop-in replacement for createAsyncThunk on GET-list endpoints: within
// `ttlMs` of the last successful call for the same arguments, `apiFn` is
// never invoked at all — the previous response is returned as-is from
// localStorage. Because the resolved value has the exact same shape
// whether it came from cache or the network, every existing `.fulfilled`
// reducer built for a plain createAsyncThunk keeps working unmodified.
//
// Pair this with invalidateCache(typePrefix) (see @/utils/cache) inside
// the corresponding create/update/delete thunks, so a mutation forces the
// next read to go to the network instead of serving stale cached data.
export function createCachedThunk(typePrefix, apiFn, { ttlMs = 5 * 60 * 1000, getCacheKey } = {}) {
  return createAsyncThunk(typePrefix, async (arg, { rejectWithValue }) => {
    const cacheKey = `${typePrefix}:${getCacheKey ? getCacheKey(arg) : JSON.stringify(arg ?? null)}`;

    const cached = readCache(cacheKey, ttlMs);
    if (cached !== null) return cached;

    try {
      const response = await apiFn(arg);
      writeCache(cacheKey, response);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Request failed");
    }
  });
}
