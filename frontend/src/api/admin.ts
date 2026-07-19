import { api } from './client'
import type { AdminBooking, AdminStats, Listing, ListingStatus, User } from '../types'

export function fetchStats() {
  return api<AdminStats>('/admin/stats')
}

export function fetchAdminUsers() {
  return api<{ items: User[] }>('/admin/users')
}

export function fetchAdminListings() {
  return api<{ items: Listing[] }>('/admin/listings')
}

export function fetchAdminBookings() {
  return api<{ items: AdminBooking[] }>('/admin/bookings')
}

export function patchAdminListing(id: number, status: ListingStatus) {
  return api<Listing>(`/admin/listings/${id}`, { method: 'PATCH', json: { status } })
}
