import { useEffect, useRef, useState } from 'react'
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
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { notificationText } from '../../i18n/translations'
import type { Notification } from '../../types'

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

export function NotificationBell() {
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const unread = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: fetchUnreadNotificationCount,
    enabled: !!user,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })

  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ page_size: 10 }),
    enabled: !!user && open,
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

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const unreadCount = unread.data?.count ?? 0

  function onSelect(n: Notification) {
    if (!n.is_read) readMut.mutate(n.id)
    setOpen(false)
    if (n.type === 'NEW_MESSAGE') navigate(`/dashboard/messages?booking=${n.booking_id}`)
    else navigate(`/dashboard/bookings/${n.booking_id}`)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('notifTitle')}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-cream transition hover:border-sage/40"
      >
        <Bell size={16} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sage px-1 text-[10px] font-bold text-ink">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_20px_44px_-20px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
            <p className="text-sm font-semibold text-cream">{t('notifTitle')}</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => readAllMut.mutate()}
                className="text-xs font-semibold text-sage hover:text-mint"
              >
                {t('notifMarkAllRead')}
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {(list.data?.items ?? []).map((n) => {
              const Icon = ICONS[n.type]
              const listingTitle = n.booking?.listing?.title ?? ''
              const { title, body } = notificationText(lang, n.type, listingTitle)
              return (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => onSelect(n)}
                  className={`flex w-full items-start gap-2.5 border-b border-line/60 px-3 py-3 text-left transition hover:bg-panel-2 ${
                    n.is_read ? '' : 'bg-forest/10'
                  }`}
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2 text-sage">
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-cream">{title}</span>
                      {!n.is_read ? (
                        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-mist">{body}</span>
                    <span className="mt-0.5 block text-[11px] text-mist/70">
                      {new Date(n.created_at).toLocaleString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </button>
              )
            })}
            {!list.isLoading && !list.data?.items?.length ? (
              <p className="px-3 py-6 text-center text-sm text-mist">{t('notifEmpty')}</p>
            ) : null}
          </div>

          <div className="border-t border-line px-3 py-2 text-center">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/dashboard/notifications')
              }}
              className="text-xs font-semibold text-sage hover:text-mint"
            >
              {t('notifViewAll')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
