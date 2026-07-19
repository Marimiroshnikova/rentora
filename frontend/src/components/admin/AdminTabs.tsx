import type { TranslationKey } from '../../i18n/translations'
import { useLanguage } from '../../context/LanguageContext'

export type AdminTab = 'overview' | 'listings' | 'users' | 'bookings'

const TABS: { id: AdminTab; label: TranslationKey }[] = [
  { id: 'overview', label: 'adminTabOverview' },
  { id: 'listings', label: 'adminTabListings' },
  { id: 'users', label: 'adminTabUsers' },
  { id: 'bookings', label: 'adminTabBookings' },
]

export function AdminTabs({
  active,
  onChange,
}: {
  active: AdminTab
  onChange: (tab: AdminTab) => void
}) {
  const { t } = useLanguage()
  return (
    <div className="admin-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          {t(tab.label)}
        </button>
      ))}
    </div>
  )
}
