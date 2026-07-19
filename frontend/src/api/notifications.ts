import { api } from './client'
import type { Notification, NotificationListResponse } from '../types'

export function fetchNotifications(opts: { page?: number; page_size?: number } = {}) {
  const params = new URLSearchParams()
  if (opts.page) params.set('page', String(opts.page))
  if (opts.page_size) params.set('page_size', String(opts.page_size))
  const qs = params.toString()
  return api<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`)
}

export function fetchUnreadNotificationCount() {
  return api<{ count: number }>('/notifications/unread-count')
}

export function markNotificationRead(id: number) {
  return api<Notification>(`/notifications/${id}/read`, { method: 'POST' })
}

export function markAllNotificationsRead() {
  return api<{ ok: boolean }>('/notifications/read-all', { method: 'POST' })
}
