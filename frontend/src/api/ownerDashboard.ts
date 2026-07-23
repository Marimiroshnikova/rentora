import { api } from './client'

export interface OwnerDashboardMonth {
  month: string
  total_bookings: number
  revenue: string
  pending: number
  accepted: number
  completed: number
  cancelled: number
  expired: number
}

export interface OwnerDashboardSummary {
  total_bookings: number
  revenue: string
  pending: number
  accepted: number
  completed: number
  cancelled: number
  expired: number
}

export interface OwnerDashboardStats {
  period: 'monthly'
  from_date?: string | null
  to_date?: string | null
  summary: OwnerDashboardSummary
  months: OwnerDashboardMonth[]
}

export function fetchOwnerDashboardStats(params: { from?: string; to?: string } = {}) {
  const search = new URLSearchParams()
  search.set('period', 'monthly')
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  const query = search.toString()
  return api<OwnerDashboardStats>(`/owner/stats${query ? `?${query}` : ''}`)
}