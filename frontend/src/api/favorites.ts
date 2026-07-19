import { api } from './client'
import type { Listing } from '../types'

export function fetchFavorites() {
  return api<Listing[]>('/favorites')
}

export function toggleFavorite(listingId: number) {
  return api<{ favorited: boolean }>(`/favorites/${listingId}`, { method: 'POST' })
}
