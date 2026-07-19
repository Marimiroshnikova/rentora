import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, Search } from 'lucide-react'
import { bookingAction, fetchBookings, payBooking, postReview } from '../api/bookings'
import { mediaUrl } from '../api/client'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { BookingTimeline } from '../components/bookings/BookingTimeline'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ListingCardSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useMemo, useState } from 'react'
import { DatePicker } from '../components/ui/DatePicker'
import { Field, Input, Textarea } from '../components/ui/Input'
import { useLanguage } from '../context/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

function rentalDays(start: string, end: string) {
  const a = new Date(start)
  const b = new Date(end)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

type StatusTab = 'ongoing' | 'completed' | 'declined'
type OngoingSubStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'ACTIVE'

const ONGOING_STATUSES = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ACTIVE']
const DECLINED_STATUSES = ['DECLINED', 'CANCELLED']

const ONGOING_SUB_FILTERS: { value: OngoingSubStatus; label: TranslationKey }[] = [
  { value: 'ALL', label: 'browseAll' },
  { value: 'PENDING', label: 'timelinePending' },
  { value: 'ACCEPTED', label: 'timelineAccepted' },
  { value: 'CONFIRMED', label: 'timelinePaid' },
  { value: 'ACTIVE', label: 'timelineActive' },
]

export function BookingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [params, setParams] = useSearchParams()
  const asOwner = params.get('as') === 'owner'
  const qc = useQueryClient()
  const [reviewBooking, setReviewBooking] = useState<number | null>(null)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [tab, setTab] = useState<StatusTab>('ongoing')
  const [ongoingSubFilter, setOngoingSubFilter] = useState<OngoingSubStatus>('ALL')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', asOwner ? 'owner' : 'renter'],
    queryFn: () => fetchBookings(asOwner ? 'owner' : 'renter'),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter((b) => {
      if (q) {
        const haystack = `${b.listing?.title ?? ''} ${b.renter?.full_name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (dateFrom && b.start_date < dateFrom) return false
      if (dateTo && b.start_date > dateTo) return false
      return true
    })
  }, [data, search, dateFrom, dateTo])

  const ongoing = filtered.filter((b) => ONGOING_STATUSES.includes(b.effective_status || b.status))
  const completed = filtered.filter((b) => (b.effective_status || b.status) === 'COMPLETED')
  const declined = filtered.filter((b) => DECLINED_STATUSES.includes(b.effective_status || b.status))
  const ongoingFiltered =
    ongoingSubFilter === 'ALL'
      ? ongoing
      : ongoing.filter((b) => (b.effective_status || b.status) === ongoingSubFilter)
  const tabbed = { ongoing: ongoingFiltered, completed, declined }[tab]

  const actionMut = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) => bookingAction(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  const payMut = useMutation({
    mutationFn: (id: number) => payBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })

  const reviewMut = useMutation({
    mutationFn: () =>
      postReview(reviewBooking!, { rating: Number(rating), comment: comment || undefined }),
    onSuccess: () => {
      setReviewBooking(null)
      setComment('')
      qc.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-cream">{t('bookingsTitle')}</h1>
          <p className="mt-2 text-mist">{t('bookingsLead')}</p>
        </div>
        <div className="flex gap-2" role="group" aria-label={t('bookingsTitle')}>
          <Button
            variant={!asOwner ? 'primary' : 'secondary'}
            onClick={() => setParams({})}
            aria-pressed={!asOwner}
          >
            {t('bookingsAsRenter')}
          </Button>
          {user?.is_owner ? (
            <Button
              variant={asOwner ? 'primary' : 'secondary'}
              onClick={() => setParams({ as: 'owner' })}
              aria-pressed={asOwner}
            >
              {t('bookingsAsOwner')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Field label={t('browseSearch')}>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('bookingsSearchPlaceholder')}
                className="pl-9"
              />
            </div>
          </Field>
        </div>
        <Field label={t('bookingsDateFrom')}>
          <DatePicker value={dateFrom} onChange={setDateFrom} />
        </Field>
        <Field label={t('bookingsDateTo')}>
          <DatePicker value={dateTo} onChange={setDateTo} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('bookingsTitle')}>
        <Button
          variant={tab === 'ongoing' ? 'primary' : 'secondary'}
          onClick={() => setTab('ongoing')}
          aria-pressed={tab === 'ongoing'}
        >
          {t('bookingsTabOngoing')} ({ongoing.length})
        </Button>
        <Button
          variant={tab === 'completed' ? 'primary' : 'secondary'}
          onClick={() => setTab('completed')}
          aria-pressed={tab === 'completed'}
        >
          {t('bookingsTabCompleted')} ({completed.length})
        </Button>
        <Button
          variant={tab === 'declined' ? 'primary' : 'secondary'}
          onClick={() => setTab('declined')}
          aria-pressed={tab === 'declined'}
        >
          {t('bookingsTabDeclined')} ({declined.length})
        </Button>
      </div>

      {tab === 'ongoing' ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ONGOING_SUB_FILTERS.map((f) => {
            const count =
              f.value === 'ALL'
                ? ongoing.length
                : ongoing.filter((b) => (b.effective_status || b.status) === f.value).length
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setOngoingSubFilter(f.value)}
                aria-pressed={ongoingSubFilter === f.value}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  ongoingSubFilter === f.value
                    ? 'border-sage/50 bg-forest/35 text-mint'
                    : 'border-line text-mist hover:border-sage/40 hover:text-cream'
                }`}
              >
                {t(f.label)} ({count})
              </button>
            )
          })}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 space-y-3">
          <ListingCardSkeleton />
          <ListingCardSkeleton />
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {tabbed.map((b) => {
          const status = b.effective_status || b.status
          const days = rentalDays(b.start_date, b.end_date)
          const rate = b.listing ? Number(b.listing.price_per_day) : 0
          const canCancel = !asOwner && ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(b.status)
          return (
            <div key={b.id} className="rounded-2xl border border-line bg-panel/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <img
                    src={b.listing?.images?.[0] ? mediaUrl(b.listing.images[0].url) : '/placeholder-decor.svg'}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded-xl object-cover"
                  />
                  <div>
                  <Link to={`/dashboard/bookings/${b.id}`} className="text-lg text-cream hover:text-mint">
                    {b.listing?.title ?? `${t('bookingLabel')} #${b.id}`}
                  </Link>
                  <p className="text-sm text-mist">
                    {b.start_date} → {b.end_date}
                  </p>
                  {asOwner && b.renter ? (
                    <p className="mt-1 text-sm text-mist">
                      {t('bookingRenter')}: {b.renter.full_name}
                      {b.renter.phone ? ` · ${t('bookingRenterPhone')}: ${b.renter.phone}` : ''}
                    </p>
                  ) : null}
                  </div>
                </div>
                <BookingStatusBadge status={status} />
              </div>

              <BookingTimeline status={status} />

              <div className="mt-3 rounded-xl border border-line bg-panel-2/70 px-3 py-3 text-sm">
                <div className="flex justify-between text-mist">
                  <span>
                    {days} {days === 1 ? t('detailDay') : t('detailDays')}
                    {rate ? ` × ${rate.toFixed(0)} ₾` : ''}
                  </span>
                  <span className="text-cream">{Number(b.total_price).toFixed(2)} ₾</span>
                </div>
                <div className="mt-1 flex justify-between text-mist">
                  <span>{t('detailDeposit')}</span>
                  <span className="text-cream">{Number(b.deposit).toFixed(2)} ₾</span>
                </div>
                <div className="mt-1 flex justify-between text-mist">
                  <span>{t('detailPlatformFee')}</span>
                  <span className="text-cream">0.00 ₾ ({t('detailDemoFee')})</span>
                </div>
              </div>

              {canCancel ? (
                <p className="mt-2 text-xs text-mist">{t('bookingCancelHint')}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {asOwner && b.status === 'PENDING' ? (
                  <>
                    <Button onClick={() => actionMut.mutate({ id: b.id, action: 'accept' })}>
                      {t('actionAccept')}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => actionMut.mutate({ id: b.id, action: 'decline' })}
                    >
                      {t('actionDecline')}
                    </Button>
                  </>
                ) : null}
                {!asOwner && b.status === 'ACCEPTED' ? (
                  <Button onClick={() => payMut.mutate(b.id)}>{t('actionDemoPay')}</Button>
                ) : null}
                {canCancel ? (
                  <Button
                    variant="secondary"
                    onClick={() => actionMut.mutate({ id: b.id, action: 'cancel' })}
                  >
                    {t('actionCancel')}
                  </Button>
                ) : null}
                {(status === 'COMPLETED' || b.status === 'COMPLETED') && !asOwner ? (
                  <Button variant="secondary" onClick={() => setReviewBooking(b.id)}>
                    {t('actionLeaveReview')}
                  </Button>
                ) : null}
                <Link to={`/dashboard/messages?booking=${b.id}`}>
                  <Button variant="ghost">{t('messagesTitle')}</Button>
                </Link>
              </div>

              {reviewBooking === b.id ? (
                <div className="mt-4 rounded-xl border border-line bg-panel-2 p-4">
                  <Field label={t('reviewRating')}>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                    />
                  </Field>
                  <Field label={t('reviewComment')}>
                    <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
                  </Field>
                  <Button onClick={() => reviewMut.mutate()} loading={reviewMut.isPending}>
                    {t('reviewSubmit')}
                  </Button>
                </div>
              ) : null}
            </div>
          )
        })}
        {!tabbed.length && !isLoading ? (
          <EmptyState
            icon={<CalendarDays size={28} />}
            title={t('bookingsEmpty')}
            description={t('bookingsEmptyHint')}
            actionLabel={t('homeBrowse')}
            onAction={() => {
              window.location.href = '/browse'
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
