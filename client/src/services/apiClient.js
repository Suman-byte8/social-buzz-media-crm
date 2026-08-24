const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {}, ...customConfig } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
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
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Call Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};
