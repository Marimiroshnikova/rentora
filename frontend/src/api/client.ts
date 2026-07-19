const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
export const UPLOAD_ORIGIN = import.meta.env.VITE_UPLOAD_ORIGIN || 'http://localhost:8000'

const TOKEN_KEY = 'rentora_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function mediaUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${UPLOAD_ORIGIN}${url}`
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg)
        }
        return JSON.stringify(item)
      })
      .filter(Boolean)
      .join('. ')
  }
  if (detail != null) return JSON.stringify(detail)
  return 'Request failed'
}

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options.body
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  const timeoutMs = options.timeoutMs ?? 15000
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body,
      signal: controller.signal,
    })
    if (!res.ok) {
      let detail = res.statusText || 'Request failed'
      try {
        const data = await res.json()
        detail = formatDetail(data.detail) || detail
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, detail)
    }
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'NETWORK_TIMEOUT')
    }
    throw new ApiError(0, 'NETWORK_ERROR')
  } finally {
    window.clearTimeout(timer)
  }
}
