import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.defellix.com';

/**
 * API client with credentials so the browser sends httpOnly cookies.
 * Backend should set access token in an httpOnly cookie on login/signup/verify
 * and accept Cookie header for auth (no Bearer token needed when using cookies).
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Set Bearer token for this session only (e.g. OAuth callback or when API still returns token in body). Not persisted. */
export function setSessionToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export { API_BASE };
