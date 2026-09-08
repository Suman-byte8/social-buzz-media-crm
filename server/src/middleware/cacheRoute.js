import { getCache, setCache } from "../utils/serverCache.js";

// Caches a GET route's JSON response, keyed by its full URL (path + query
// string) plus the requester's role, so different filter/pagination combos
// don't collide. Only successful (2xx) responses are cached. Add this as
// middleware before a route handler:
//
//   router.get("/clients", cacheRoute("clients", 60), async (req, res) => {...});
//
// Pair with invalidateCache(keyPrefix) (from ../utils/serverCache.js)
// inside the corresponding create/update/delete routes.
//
// The role is *always* part of the key, never opt-in: several of these
// routes redact fields by role (e.g. GET /clients strips `invoices` for
// non-admins, GET /documents hides agreement/proposal rows entirely). A
// role-blind cache key would risk serving one role's response to another —
// caching an admin's unredacted payload and handing it to the next
// non-admin who happens to hit the same URL, or the reverse.
export const cacheRoute = (keyPrefix, ttlSeconds) => {
  return async (req, res, next) => {
    const role = req.user?.role || "anonymous";
    const cacheKey = `${keyPrefix}:${role}:${req.originalUrl}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached !== null) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }
    } catch {
      // Cache read failed — fall through to the real handler rather than
      // failing the request over a caching problem.
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.setHeader("X-Cache", "MISS");
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};
