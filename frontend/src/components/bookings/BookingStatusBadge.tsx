import type { BookingStatus } from '../../types'
import { useLanguage } from '../../context/LanguageContext'
import { statusLabel } from '../../i18n/translations'

const map: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-900/40 text-amber-200 border-amber-700/40',
  ACCEPTED: 'bg-sky-900/40 text-sky-200 border-sky-700/40',
  CONFIRMED: 'bg-forest/40 text-mint border-sage/40',
  ACTIVE: 'bg-emerald-900/40 text-emerald-200 border-emerald-700/40',
  COMPLETED: 'bg-panel-2 text-mist border-line',
  EXPIRED: 'bg-red-900/40 text-red-200 border-red-800/40',
  DECLINED: 'bg-red-900/40 text-red-200 border-red-800/40',
  CANCELLED: 'bg-panel-2 text-mist border-line',
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { lang } = useLanguage()
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>
      {statusLabel(lang, status)}
    </span>
  )
}
