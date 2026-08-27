export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Server-relative asset URLs (e.g. "/api/settings/logo-proxy/:fileId") need the
// API server's host prefixed before use in an <img src>, since the browser
// would otherwise resolve them against the Next.js app's own origin.
export const getAssetUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("/api")) {
    const host = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${host}${url}`;
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

  const config = {
    method,
    headers: isFormData ? { ...headers } : { "Content-Type": "application/json", ...headers },
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);

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
