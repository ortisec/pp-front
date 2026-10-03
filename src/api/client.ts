const TOKEN_KEY = 'pp_token'

// En produccion se define VITE_API_URL (ej: https://tudominio.com/api/v1).
// En desarrollo se deja vacio para usar el proxy de Vite.
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : 'Error de solicitud')
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const detail = data && typeof data === 'object' && 'detail' in data ? data.detail : data
    throw new ApiError(res.status, detail)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function openResultsSocket(): WebSocket {
  // Si API_BASE es absoluto (https://dominio/api/v1) derivamos el host real.
  if (/^https?:\/\//.test(API_BASE)) {
    const url = new URL(API_BASE)
    const proto = url.protocol === 'https:' ? 'wss' : 'ws'
    return new WebSocket(`${proto}://${url.host}${url.pathname}/ws/results`)
  }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return new WebSocket(`${proto}://${location.host}${API_BASE}/ws/results`)
}
