/**
 * api.js – lightweight fetch wrapper.
 *
 * - Reads the API base URL from VITE_API_URL (falls back to http://localhost:8000).
 * - Automatically attaches the Authorization: Bearer <token> header when a token
 *   is stored in localStorage.
 * - On a 401 response it clears the stored token so the user is logged out.
 */

// Empty string = relative URLs → Vite proxy forwards to backend (no cross-origin CORS issues).
// Set VITE_API_URL in .env only for production absolute URLs.
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

/**
 * Core request helper.
 * @param {string} path  - Path relative to BASE_URL (e.g. '/api/auth/login')
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<any>} Parsed JSON body
 * @throws {Error} with message from the API on non-2xx responses
 */
export async function request(path, options = {}) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  // Automatically log out on 401
  if (res.status === 401) {
    clearToken()
    // Redirect to login; we can't use React Router here so we use the browser API
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Session expired. Please log in again.')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // FastAPI errors have a `detail` field
    const msg = data?.detail ?? `HTTP ${res.status}`
    throw new Error(msg)
  }

  return data
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function apiRegister({ full_name, email, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, password }),
  })
}

/**
 * Login uses x-www-form-urlencoded (OAuth2 password flow).
 */
export async function apiLogin({ email, password }) {
  const form = new URLSearchParams({ username: email, password })
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })


  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const err = new Error(data?.detail ?? `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  return data
}

export async function apiMe() {
  return request('/api/auth/me')
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function apiGetUsers(pendingOnly = false) {
  const qs = pendingOnly ? '?status=pending' : ''
  return request(`/api/admin/users${qs}`)
}

export async function apiGetRoles() {
  return request('/api/admin/roles')
}

export async function apiPatchUser(userId, body) {
  return request(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
