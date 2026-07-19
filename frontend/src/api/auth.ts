import { api } from './client'
import type { User } from '../types'

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export function register(data: {
  email: string
  password: string
  full_name: string
  city?: string
  is_owner?: boolean
}) {
  return api<TokenResponse>('/auth/register', { method: 'POST', json: data })
}

export function login(data: { email: string; password: string }) {
  return api<TokenResponse>('/auth/login', { method: 'POST', json: data })
}

export function me() {
  return api<User>('/auth/me')
}

export function updateMe(data: Partial<User> & { is_owner?: boolean }) {
  return api<User>('/users/me', { method: 'PATCH', json: data })
}
