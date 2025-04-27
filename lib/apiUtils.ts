import nodeFetch from 'node-fetch';

/**
 * Utility function to get the appropriate fetch implementation
 * @returns The fetch implementation to use (browser fetch or node-fetch)
 */
export const getFetch = (): typeof fetch => {
  // Use global fetch in browser environments, node-fetch in Node.js
  return typeof window !== 'undefined' ? window.fetch.bind(window) : nodeFetch as unknown as typeof fetch;
};

/**
 * Get the base URL for API calls
 * @returns The base URL to use for API calls
 */
export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : '';
};

/**
 * Make a server-to-server API call without waiting for the result
 * @param endpoint The API endpoint path (e.g., "/api/batch-processing/setup")
 * @param method The HTTP method
 * @param body The request body
 */
export const fireAndForgetApiCall = (
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: Record<string, any>
): void => {
  const fetch = getFetch();
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  // Log the request
  console.log(`[API] Making ${method} request to ${url}`);

  // Fire the request but don't wait for it
  fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  .then((response: Response) => {
    if (!response.ok) {
      console.error(`[API] Request to ${endpoint} failed with status ${response.status}`);
    } else {
      console.log(`[API] Successfully called ${endpoint}`);
    }
  })
  .catch((error: Error) => {
    console.error(`[API] Failed to call ${endpoint}:`, error);
  });
}; 