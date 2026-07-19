import { api } from './client'
import type { ReviewListResponse } from './listings'
import type { User } from '../types'

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  const token = localStorage.getItem('rentora_token')
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/users/me/avatar`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<User>
}

export function fetchUserReviews(
  userId: number,
  opts: { page?: number; page_size?: number } = {},
) {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.page_size) params.set('page_size', String(opts.page_size))
  const qs = params.toString()
  return api<ReviewListResponse>(`/users/${userId}/reviews${qs ? `?${qs}` : ''}`)
}
