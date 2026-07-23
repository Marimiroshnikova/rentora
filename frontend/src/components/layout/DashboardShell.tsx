import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Button } from '../ui/Button'

export function DashboardShell() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { pathname } = useLocation()

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/dashboard/bookings"
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${
            pathname.startsWith('/dashboard/bookings')
              ? 'bg-sage text-ink hover:bg-mint shadow-[0_0_0_1px_rgba(184,224,194,0.2)]'
              : 'bg-forest/30 text-mint hover:bg-forest/45'
          }`}
        >
          {t('dashboardBookings')}
        </Link>
        {!user?.is_owner ? (
          <Link to="/profile">
            <Button variant="secondary">{t('dashboardEnableOwner')}</Button>
          </Link>
        ) : null}
        <Link to="/dashboard/notifications">
          <Button variant={pathname === '/dashboard/notifications' ? 'secondary' : 'ghost'}>
            {t('notifTitle')}
          </Button>
        </Link>
        <Link to="/dashboard/favorites">
          <Button variant={pathname === '/dashboard/favorites' ? 'secondary' : 'ghost'}>
            {t('dashboardFavorites')}
          </Button>
        </Link>
        {user?.is_owner ? (
          <Link to="/dashboard/reports">
            <Button variant={pathname === '/dashboard/reports' ? 'secondary' : 'ghost'}>
              {t('dashboardReports')}
            </Button>
          </Link>
        ) : null}
        {user?.is_owner ? (
          <Link to="/dashboard/listings">
            <Button variant={pathname === '/dashboard/listings' ? 'secondary' : 'ghost'}>
              {t('dashboardMyListings')}
            </Button>
          </Link>
        ) : null}
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}
