import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { bookingAction, fetchBookings, payBooking, postReview } from '../api/bookings'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { BookingTimeline } from '../components/bookings/BookingTimeline'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ListingCardSkeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { Field, Input, Textarea } from '../components/ui/Input'
import { useLanguage } from '../context/LanguageContext'

function rentalDays(start: string, end: string) {
  const a = new Date(start)
  const b = new Date(end)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

export function BookingsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [params, setParams] = useSearchParams()
  const asOwner = params.get('as') === 'owner'
  const qc = useQueryClient()
  const [reviewBooking, setReviewBooking] = useState<number | null>(null)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', asOwner ? 'owner' : 'renter'],
    queryFn: () => fetchBookings(asOwner ? 'owner' : 'renter'),
  })

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

      {isLoading ? (
        <div className="mt-8 space-y-3">
          <ListingCardSkeleton />
          <ListingCardSkeleton />
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {(data ?? []).map((b) => {
          const status = b.effective_status || b.status
          const days = rentalDays(b.start_date, b.end_date)
          const rate = b.listing ? Number(b.listing.price_per_day) : 0
          const canCancel = !asOwner && ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(b.status)
          return (
            <div key={b.id} className="rounded-2xl border border-line bg-panel/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg text-cream">
                    {b.listing?.title ?? `${t('bookingLabel')} #${b.id}`}
                  </p>
                  <p className="text-sm text-mist">
                    {b.start_date} → {b.end_date}
                  </p>
                  {asOwner && b.renter ? (
                    <p className="mt-1 text-sm text-mist">
                      {t('bookingRenter')}: {b.renter.full_name}
                    </p>
                  ) : null}
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
        {!data?.length && !isLoading ? (
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
