import { useLanguage } from '../../context/LanguageContext'
import type { AdminStats } from '../../types'

export function StatsPanel({ stats }: { stats?: AdminStats }) {
  const { t } = useLanguage()
  const cards: [string, number | undefined][] = [
    [t('adminUsers'), stats?.users],
    [t('adminListings'), stats?.listings],
    [t('adminActive'), stats?.active_listings],
    [t('adminBookings'), stats?.bookings],
    [t('adminThisMonth'), stats?.bookings_this_month],
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-line bg-panel/60 p-4">
          <p className="text-sm text-mist">{label}</p>
          <p className="mt-2 font-display text-3xl text-cream">{value ?? '-'}</p>
        </div>
      ))}
    </div>
  )
}
