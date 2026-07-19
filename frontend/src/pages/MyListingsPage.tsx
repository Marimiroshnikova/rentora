import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Search } from 'lucide-react'
import { deleteListing, fetchListings, updateListing } from '../api/listings'
import { mediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import type { Listing } from '../types'

type StatusFilter = 'all' | 'active' | 'paused'

export function MyListingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const listings = useQuery({
    queryKey: ['listings', 'mine'],
    queryFn: () => fetchListings({ mine: true, page_size: 50 }),
    enabled: !!user?.is_owner,
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'PAUSED' }) =>
      updateListing(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listings', 'mine'] }),
  })

  function toggleListing(listing: Listing) {
    const next = listing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    statusMut.mutate({ id: listing.id, status: next })
  }

  function removeListing(listing: Listing) {
    if (window.confirm(t('listingDeleteConfirm'))) {
      deleteMut.mutate(listing.id)
    }
  }

  const visibleListings = (listings.data?.items ?? []).filter((listing) => listing.status !== 'HIDDEN')
  const activeCount = visibleListings.filter((l) => l.status === 'ACTIVE').length
  const pausedCount = visibleListings.filter((l) => l.status === 'PAUSED').length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visibleListings.filter((l) => {
      if (statusFilter === 'active' && l.status !== 'ACTIVE') return false
      if (statusFilter === 'paused' && l.status !== 'PAUSED') return false
      if (q && !`${l.title} ${l.city}`.toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleListings, search, statusFilter])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-cream">{t('dashboardMyListings')}</h1>
          <p className="mt-2 text-mist">{t('dashboardListingsLead')}</p>
        </div>
        <Link to="/listings/new">
          <Button>{t('dashboardNewListing')}</Button>
        </Link>
      </div>

      <div className="mt-6">
        <Field label={t('browseSearch')}>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('listingsSearchPlaceholder')}
              className="pl-9"
            />
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setStatusFilter('all')}
          aria-pressed={statusFilter === 'all'}
        >
          {t('browseAll')} ({visibleListings.length})
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'primary' : 'secondary'}
          onClick={() => setStatusFilter('active')}
          aria-pressed={statusFilter === 'active'}
        >
          {t('listingStatusActive')} ({activeCount})
        </Button>
        <Button
          variant={statusFilter === 'paused' ? 'primary' : 'secondary'}
          onClick={() => setStatusFilter('paused')}
          aria-pressed={statusFilter === 'paused'}
        >
          {t('listingStatusPaused')} ({pausedCount})
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {listings.isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : null}

        {!listings.isLoading &&
          filtered.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel/50 px-4 py-3"
            >
              <img
                src={listing.images?.[0] ? mediaUrl(listing.images[0].url) : '/placeholder-decor.svg'}
                alt=""
                className="h-16 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
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
                <Link to={`/listings/${listing.id}/edit`}>
                  <Button variant="secondary">{t('listingEdit')}</Button>
                </Link>
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
                <Button
                  variant="danger"
                  disabled={deleteMut.isPending}
                  onClick={() => removeListing(listing)}
                >
                  {t('listingDelete')}
                </Button>
              </div>
            </div>
          ))}

        {!listings.isLoading && !filtered.length ? (
          <EmptyState
            icon={<Package size={24} />}
            title={t('dashboardNoListings')}
            description={t('dashboardNoListingsHint')}
            actionLabel={t('dashboardNewListing')}
            onAction={() => {
              window.location.href = '/listings/new'
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
