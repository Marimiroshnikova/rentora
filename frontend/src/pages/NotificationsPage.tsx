import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  CreditCard,
  Inbox,
  MessageCircle,
  PartyPopper,
  XCircle,
} from 'lucide-react'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ListingCardSkeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'
import { notificationText } from '../i18n/translations'
import type { Notification } from '../types'

const ICONS: Record<Notification['type'], React.ComponentType<{ size?: number }>> = {
  BOOKING_REQUESTED: Inbox,
  BOOKING_ACCEPTED: CheckCircle2,
  BOOKING_DECLINED: XCircle,
  PAYMENT_SUCCEEDED: CreditCard,
  PAYMENT_FAILED: AlertTriangle,
  BOOKING_CANCELLED: Ban,
  BOOKING_COMPLETED: PartyPopper,
  NEW_MESSAGE: MessageCircle,
}

const PAGE_SIZE = 20

export function NotificationsPage() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'all', page],
    queryFn: () => fetchNotifications({ page, page_size: PAGE_SIZE }),
  })

  const readMut = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const readAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const hasUnread = (data?.items ?? []).some((n) => !n.is_read)

  function onSelect(n: Notification) {
    if (!n.is_read) readMut.mutate(n.id)
    if (n.type === 'NEW_MESSAGE') navigate(`/dashboard/messages?booking=${n.booking_id}`)
    else navigate(`/dashboard/bookings/${n.booking_id}`)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-cream">{t('notifTitle')}</h1>
        {hasUnread ? (
          <Button variant="secondary" onClick={() => readAllMut.mutate()}>
            {t('notifMarkAllRead')}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          <ListingCardSkeleton />
          <ListingCardSkeleton />
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        {(data?.items ?? []).map((n) => {
          const Icon = ICONS[n.type]
          const listingTitle = n.booking?.listing?.title ?? ''
          const { title, body } = notificationText(lang, n.type, listingTitle)
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n)}
              className={`flex w-full items-start gap-3 rounded-2xl border border-line px-4 py-3.5 text-left transition hover:border-sage/40 ${
                n.is_read ? 'bg-panel/50' : 'bg-forest/10'
              }`}
            >
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-2 text-sage">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-cream">{title}</span>
                  {!n.is_read ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-sage" /> : null}
                </span>
                <span className="mt-1 block text-sm text-mist">{body}</span>
                <span className="mt-1 block text-xs text-mist/70">
                  {new Date(n.created_at).toLocaleString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </span>
            </button>
          )
        })}
        {!isLoading && !data?.items?.length ? (
          <EmptyState icon={<Bell size={28} />} title={t('notifEmpty')} />
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t('browsePrev')}
          </Button>
          <span className="text-sm text-mist">
            {page} / {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            {t('browseNext')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
