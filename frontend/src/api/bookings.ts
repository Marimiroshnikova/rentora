import { api } from './client'
import type { Booking, Message, Review } from '../types'

export function createBooking(data: {
  listing_id: number
  start_date: string
  end_date: string
  message?: string
}) {
  return api<Booking>('/bookings', { method: 'POST', json: data })
}

export function fetchBookings(asRole: 'renter' | 'owner' = 'renter') {
  return api<Booking[]>(`/bookings?as=${asRole}`)
}

export function fetchBooking(id: number) {
  return api<Booking>(`/bookings/${id}`)
}

export function bookingAction(id: number, action: string) {
  return api<Booking>(`/bookings/${id}`, { method: 'PATCH', json: { action } })
}

export function payBooking(id: number) {
  return api<Booking>(`/bookings/${id}/pay`, { method: 'POST' })
}

export function fetchMessages(bookingId: number) {
  return api<Message[]>(`/bookings/${bookingId}/messages`)
}

export function sendMessage(bookingId: number, body: string) {
  return api<Message>(`/bookings/${bookingId}/messages`, { method: 'POST', json: { body } })
}

export interface UnreadSummary {
  total: number
  by_booking: Record<string, number>
}

export function fetchUnreadSummary() {
  return api<UnreadSummary>('/bookings/unread-summary')
}

export function markMessagesRead(bookingId: number) {
  return api<UnreadSummary>(`/bookings/${bookingId}/messages/read`, { method: 'POST' })
}

export function postReview(bookingId: number, data: { rating: number; comment?: string }) {
  return api<Review>(`/bookings/${bookingId}/reviews`, { method: 'POST', json: data })
}
