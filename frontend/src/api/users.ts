import { api } from './client'
import type { ReviewListResponse } from './listings'

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
