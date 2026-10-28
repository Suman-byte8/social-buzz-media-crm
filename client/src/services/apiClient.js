import { getFromStorage, removeFromStorage } from "@/utils/storage";
import { clearAllCache } from "@/utils/cache";

// Primary + optional fallback API server (two Render deployments of the same
// server, pointed at the same database). If the active one is unreachable,
// requests retry on the other and the working one is remembered.
const normalizeBase = (url) => url.trim().replace(/\/+$/, "");
const API_BASE_URLS = [...new Set([process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_API_URL_FALLBACK].filter(Boolean).map(normalizeBase))];
if (API_BASE_URLS.length === 0) API_BASE_URLS.push("http://localhost:5000/api");

const ACTIVE_BASE_KEY = "active_api_base";
// Render answers 502/503/504 while a service is suspended, deploying, or crashed.
const FAILOVER_STATUSES = new Set([502, 503, 504]);

let activeBase = null;

export const getApiBaseUrl = () => {
  if (activeBase) return activeBase;
  let stored = null;
  try {
    stored = typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_BASE_KEY) : null;
  } catch {
    // storage blocked — fall back to the primary
  }
  activeBase = API_BASE_URLS.includes(stored) ? stored : API_BASE_URLS[0];
  return activeBase;
};

// Bare host without "/api" — what Socket.io and asset URLs need.
export const getApiHost = () => getApiBaseUrl().replace(/\/api\/?$/, "");

const setActiveBase = (base) => {
  if (base === activeBase) return;
  activeBase = base;
  try {
    window.localStorage.setItem(ACTIVE_BASE_KEY, base);
  } catch {
    // non-fatal: we just re-probe from the primary next page load
  }
  console.warn(`[api] Switched to API server ${base}`);
};

// fetch() against `${base}${path}`, trying the active server first and the
// other(s) only when it can't be reached. A 4xx/500 is a real answer from a
// live server and is returned as-is, never retried elsewhere.
export const fetchWithFailover = async (path, config) => {
  const current = getApiBaseUrl();
  const order = [current, ...API_BASE_URLS.filter((b) => b !== current)];
  let lastError = null;

  for (let i = 0; i < order.length; i++) {
    const isLast = i === order.length - 1;
    let response;
    try {
      response = await fetch(`${order[i]}${path}`, config);
    } catch (error) {
      // Network/CORS failure — a suspended Render service returns a page
      // without CORS headers, which surfaces here as a TypeError.
      lastError = error;
      continue;
    }
    if (FAILOVER_STATUSES.has(response.status) && !isLast) continue;
    setActiveBase(order[i]);
    return response;
  }
  throw lastError || new Error("All API servers are unreachable");
};

// Server-relative asset URLs (e.g. "/api/settings/logo-proxy/:fileId") need the
// API server's host prefixed before use in an <img src>, since the browser
// would otherwise resolve them against the Next.js app's own origin.
export const getAssetUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("/api")) {
    return `${getApiHost()}${url}`;
  }
  return url;
};

const parseErrorMessage = async (response) => {
  let errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
  try {
    const text = await response.text();
    if (text && text.trim()) {
      try {
        const data = JSON.parse(text);
        if (data && (data.message || data.error)) {
          errorMessage = data.message || data.error;
        }
      } catch {
        errorMessage = text;
      }
    }
  } catch {
    // Fallback to HTTP error message
  }
  return errorMessage;
};

// Single centralized HTTP client for the whole site. Handles plain JSON
// bodies, FormData uploads (file/image endpoints), and blob responses
// (CSV/PDF exports) through one consistent request/error path, so no
// service file needs its own base URL, headers, or error parsing.
export const apiClient = async (endpoint, options = {}) => {
  const { method = "GET", body, headers = {}, responseType, ...customConfig } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const token = getFromStorage("auth_token");

  const config = {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const response = await fetchWithFailover(path, config);

    if (response.status === 401) {
      removeFromStorage("auth_token");
      removeFromStorage("auth_user");
      clearAllCache();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error(await parseErrorMessage(response));
    }

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    if (responseType === "blob") {
      return response.blob();
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`API Call Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};
