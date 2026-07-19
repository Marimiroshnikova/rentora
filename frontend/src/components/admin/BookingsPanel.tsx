import { useLanguage } from '../../context/LanguageContext'
import type { AdminBooking } from '../../types'

export function BookingsPanel({ bookings }: { bookings: AdminBooking[] }) {
  const { t } = useLanguage()

  if (!bookings.length) {
    return <p className="text-mist">{t('adminEmpty')}</p>
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="rounded-2xl border border-line bg-panel/50 px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-cream">{b.listing_title}</p>
              <p className="mt-1 text-sm text-mist">
                {b.listing_city} · {b.start_date} - {b.end_date}
              </p>
            </div>
            <span className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-sage">
              {b.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-mist">
            {b.renter_name} ({b.renter_email}) · {t('adminOwner')}: {b.owner_name}
          </p>
          <p className="mt-1 text-sm text-cream">${Number(b.total_price).toFixed(0)}</p>
        </div>
      ))}
    </div>
  )
}
