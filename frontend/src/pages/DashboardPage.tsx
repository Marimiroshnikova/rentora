import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, Heart, Inbox, Package } from 'lucide-react'
import { fetchBookings } from '../api/bookings'
import { fetchListings, updateListing } from '../api/listings'
import { fetchFavorites } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import type { Listing } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const qc = useQueryClient()
  const firstName = user?.full_name.trim().split(/\s+/)[0] || ''

  const rentals = useQuery({ queryKey: ['bookings', 'renter'], queryFn: () => fetchBookings('renter') })
  const incoming = useQuery({
    queryKey: ['bookings', 'owner'],
    queryFn: () => fetchBookings('owner'),
    enabled: !!user?.is_owner,
  })
  const listings = useQuery({
    queryKey: ['listings', 'mine'],
    queryFn: () => fetchListings({ mine: true, page_size: 50 }),
    enabled: !!user?.is_owner,
  })
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: fetchFavorites })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'PAUSED' }) =>
      updateListing(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  })

  function toggleListing(listing: Listing) {
    const next = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    statusMut.mutate({ id: listing.id, status: next })
  }

  const pendingIncoming = (incoming.data ?? []).filter((b) => b.status === 'PENDING')

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-cream">
            {t('dashboardHi')}
            {firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.is_owner ? (
            <Link to="/listings/new">
              <Button>{t('dashboardNewListing')}</Button>
            </Link>
          ) : (
            <Link to="/profile">
              <Button>{t('dashboardEnableOwner')}</Button>
            </Link>
          )}
          <Link to="/dashboard/bookings">
            <Button variant="ghost">{t('dashboardBookings')}</Button>
          </Link>
          <Link to="/dashboard/favorites">
            <Button variant="ghost">{t('dashboardFavorites')}</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatLink
          to="/dashboard/bookings"
          icon={<CalendarDays size={18} />}
          label={t('dashboardMyRentals')}
          value={rentals.data?.length ?? 0}
        />
        <StatLink
          to="/dashboard/favorites"
          icon={<Heart size={18} />}
          label={t('dashboardFavorites')}
          value={favorites.data?.length ?? 0}
        />
        <StatLink
          to={user?.is_owner ? '/dashboard' : '/browse'}
          icon={<Package size={18} />}
          label={t('dashboardMyListings')}
          value={listings.data?.total ?? 0}
        />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-cream">{t('dashboardRecent')}</h2>
        <div className="mt-3 space-y-2">
          {(rentals.data ?? []).slice(0, 5).map((b) => (
            <Link
              key={b.id}
              to={`/dashboard/messages?booking=${b.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/50 px-4 py-3 hover:border-sage/40"
            >
              <div>
                <p className="text-cream">{b.listing?.title ?? `Booking #${b.id}`}</p>
                <p className="text-sm text-mist">
                  {b.start_date} → {b.end_date}
                </p>
              </div>
              <BookingStatusBadge status={b.effective_status || b.status} />
            </Link>
          ))}
          {!rentals.data?.length ? (
            <EmptyState
              icon={<CalendarDays size={24} />}
              title={t('dashboardNoRentals')}
              actionLabel={t('homeBrowse')}
              onAction={() => {
                window.location.href = '/browse'
              }}
            />
          ) : null}
        </div>
      </section>

      {user?.is_owner ? (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-cream">{t('dashboardMyListings')}</h2>
            <Link to="/listings/new" className="text-sm font-semibold text-sage hover:text-mint">
              {t('dashboardNewListing')}
            </Link>
          </div>
          <div className="space-y-2">
            {(listings.data?.items ?? []).map((listing) => (
              <div
                key={listing.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/items/${listing.id}`} className="font-medium text-cream hover:text-mint">
                      {listing.title}
                    </Link>
                    <Badge tone={listing.status === 'ACTIVE' ? 'sage' : 'neutral'}>
                      {listing.status === 'ACTIVE' ? t('listingStatusActive') : t('listingStatusPaused')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-mist">
                    {listing.city} · {Number(listing.price_per_day).toFixed(0)} ₾ / {t('detailPerDay')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/items/${listing.id}`}>
                    <Button variant="ghost">{t('listingView')}</Button>
                  </Link>
                  <Button
                    variant="secondary"
                    disabled={statusMut.isPending}
                    onClick={() => toggleListing(listing)}
                  >
                    {listing.status === 'ACTIVE' ? t('listingPause') : t('listingActivate')}
                  </Button>
                </div>
              </div>
            ))}
            {!listings.data?.items?.length ? (
              <EmptyState
                title={t('dashboardNoListings')}
                description={t('dashboardNoListingsHint')}
                actionLabel={t('dashboardNewListing')}
                onAction={() => {
                  window.location.href = '/listings/new'
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {user?.is_owner ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl text-cream">{t('dashboardIncoming')}</h2>
          <div className="mt-3 space-y-2">
            {pendingIncoming.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                to="/dashboard/bookings?as=owner"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/50 px-4 py-3 hover:border-sage/40"
              >
                <div>
                  <p className="text-cream">{b.listing?.title}</p>
                  <p className="text-sm text-mist">
                    {b.renter?.full_name} · {b.start_date} → {b.end_date}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </Link>
            ))}
            {!pendingIncoming.length ? (
              <EmptyState icon={<Inbox size={24} />} title={t('dashboardNoPending')} />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function StatLink({
  to,
  icon,
  label,
  value,
}: {
  to: string
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-line bg-panel/60 px-4 py-3 transition hover:border-sage/40"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-forest/30 text-mint">
        {icon}
      </span>
      <span>
        <span className="block text-xs text-mist">{label}</span>
        <span className="font-display text-2xl text-cream">{value}</span>
      </span>
    </Link>
  )
}
