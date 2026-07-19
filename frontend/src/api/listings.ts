import { api } from './client'
import type {
  AvailabilityBlock,
  Category,
  Listing,
  ListingListResponse,
  Review,
} from '../types'

export interface ListingFilters {
  q?: string
  category?: Category | ''
  city?: string
  min_price?: string
  max_price?: string
  start?: string
  end?: string
  page?: number
  page_size?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'distance'
  mine?: boolean
  lat?: number
  lng?: number
  radius_km?: number
}

export interface ReviewListResponse {
  items: Review[]
  total: number
  page: number
  page_size: number
  avg_rating?: number | null
}

export function fetchListings(filters: ListingFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== false) params.set(k, String(v))
  })
  const qs = params.toString()
  return api<ListingListResponse>(`/listings${qs ? `?${qs}` : ''}`)
}

export function fetchListing(id: number) {
  return api<Listing>(`/listings/${id}`)
}

export function fetchListingReviews(
  id: number,
  opts: { page?: number; page_size?: number } = {},
) {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.page_size) params.set('page_size', String(opts.page_size))
  const qs = params.toString()
  return api<ReviewListResponse>(`/listings/${id}/reviews${qs ? `?${qs}` : ''}`)
}

export function createListing(data: Record<string, unknown>) {
  return api<Listing>('/listings', { method: 'POST', json: data })
}

export function updateListing(id: number, data: Record<string, unknown>) {
  return api<Listing>(`/listings/${id}`, { method: 'PATCH', json: data })
}

export function deleteListing(id: number) {
  return api<Listing>(`/listings/${id}`, { method: 'DELETE' })
}

export function fetchAvailability(id: number) {
  return api<AvailabilityBlock[]>(`/listings/${id}/availability`)
}

export function setAvailability(id: number, dates: string[]) {
  return api<AvailabilityBlock[]>(`/listings/${id}/availability`, { method: 'PUT', json: { dates } })
}

export function deleteListingImage(listingId: number, imageId: number) {
  return api<Listing>(`/listings/${listingId}/images/${imageId}`, { method: 'DELETE' })
}

export async function uploadListingImages(id: number, files: FileList | File[]) {
  const form = new FormData()
  Array.from(files).forEach((f) => form.append('files', f))
  const token = localStorage.getItem('rentora_token')
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/listings/${id}/images`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    },
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<Listing>
}
