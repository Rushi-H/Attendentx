import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const cleanUrl = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = cleanUrl.endsWith('/api/v1') 
  ? cleanUrl 
  : `${cleanUrl}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// In-memory CSRF token store for cross-origin deployments
let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  inMemoryCsrfToken = token;
  if (token) {
    try {
      sessionStorage.setItem('csrftoken', token);
    } catch {}
  } else {
    try {
      sessionStorage.removeItem('csrftoken');
    } catch {}
  }
}

export function getStoredCsrfToken(): string | null {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  try {
    const stored = sessionStorage.getItem('csrftoken');
    if (stored) return stored;
  } catch {}
  return getCsrfTokenFromCookie();
}

// Helper to get CSRF cookie (same-origin fallback)
export function getCsrfTokenFromCookie(): string | null {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Request interceptor to attach CSRF token for unsafe methods
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getStoredCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Response interceptor to capture updated CSRF tokens from headers
api.interceptors.response.use(
  (response) => {
    const csrfHeader = response.headers?.['x-csrftoken'] || response.headers?.['X-CSRFToken'];
    if (csrfHeader) {
      setCsrfToken(csrfHeader);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Initialize CSRF token from server
export async function initializeCsrf(): Promise<string | null> {
  try {
    const res = await api.get('/auth/csrf/');
    const token = res.data?.data?.csrfToken || null;
    if (token) {
      setCsrfToken(token);
    }
    return token;
  } catch (e) {
    console.warn('Failed to pre-fetch CSRF token:', e);
    return null;
  }
}
