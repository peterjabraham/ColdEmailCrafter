/**
 * API base URL configuration
 * In development, uses relative URLs (proxied by Vite)
 * In production on Cloudflare Pages, uses VITE_API_URL environment variable
 */
const getApiBaseUrl = (): string => {
  // In production, use the environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use relative URLs (Vite proxy handles this)
  // In production without VITE_API_URL, fallback to relative (for testing)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper function to build API endpoint URLs
 */
export const apiUrl = (endpoint: string): string => {
  const base = API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

