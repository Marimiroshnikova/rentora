import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { fetchUnreadSummary } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export function FloatingMessages() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  const unread = useQuery({
    queryKey: ['unread-summary'],
    queryFn: fetchUnreadSummary,
    enabled: !!user,
    refetchInterval: 15_000,
  })
  const unreadTotal = unread.data?.total ?? 0

  if (!user) return null
  if (location.pathname.startsWith('/dashboard/messages')) return null

  return (
    <Link
      to="/dashboard/messages"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-line bg-forest text-mint shadow-lg transition hover:bg-sage hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      aria-label={t('navMessages')}
      title={t('navMessages')}
    >
      <MessageCircle size={22} />
      {unreadTotal > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sage px-1 text-[11px] font-bold text-ink">
          {unreadTotal > 9 ? '9+' : unreadTotal}
        </span>
      ) : null}
    </Link>
  )
}
