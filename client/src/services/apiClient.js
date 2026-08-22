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
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Call Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};
