import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminBookings,
  fetchAdminListings,
  fetchAdminUsers,
  fetchStats,
  patchAdminListing,
} from '../api/admin'
import { AdminTabs, type AdminTab } from '../components/admin/AdminTabs'
import { BookingsPanel } from '../components/admin/BookingsPanel'
import { ListingsPanel } from '../components/admin/ListingsPanel'
import { StatsPanel } from '../components/admin/StatsPanel'
import { UsersPanel } from '../components/admin/UsersPanel'
import { useLanguage } from '../context/LanguageContext'

export function AdminPage() {
  const { t } = useLanguage()
  const qc = useQueryClient()
  const [tab, setTab] = useState<AdminTab>('overview')

  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchStats })
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchAdminUsers,
    enabled: tab === 'users' || tab === 'overview',
  })
  const listings = useQuery({
    queryKey: ['admin', 'listings'],
    queryFn: fetchAdminListings,
    enabled: tab === 'listings',
  })
  const bookings = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: fetchAdminBookings,
    enabled: tab === 'bookings',
  })

  const patchMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'HIDDEN' | 'ACTIVE' }) =>
      patchAdminListing(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })

  return (
    <div>
      <h1 className="font-display text-4xl text-cream">{t('adminTitle')}</h1>
      <p className="mt-2 text-mist">{t('adminLead')}</p>

      <div className="mt-6">
        <AdminTabs active={tab} onChange={setTab} />
      </div>

      <div className="mt-8">
        {tab === 'overview' ? <StatsPanel stats={stats.data} /> : null}

        {tab === 'listings' ? (
          listings.isLoading ? (
            <p className="text-mist">{t('loading')}</p>
          ) : (
            <ListingsPanel
              listings={listings.data?.items ?? []}
              onHide={(id) => patchMut.mutate({ id, status: 'HIDDEN' })}
              onRestore={(id) => patchMut.mutate({ id, status: 'ACTIVE' })}
            />
          )
        ) : null}

        {tab === 'users' ? (
          users.isLoading ? (
            <p className="text-mist">{t('loading')}</p>
          ) : (
            <UsersPanel users={users.data?.items ?? []} />
          )
        ) : null}

        {tab === 'bookings' ? (
          bookings.isLoading ? (
            <p className="text-mist">{t('loading')}</p>
          ) : (
            <BookingsPanel bookings={bookings.data?.items ?? []} />
          )
        ) : null}
      </div>
    </div>
  )
}
