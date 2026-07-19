import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingAction, fetchBooking, fetchMessages, payBooking, postReview } from '../api/bookings'
import { mediaUrl } from '../api/client'
import { BookingStatusBadge } from '../components/bookings/BookingStatusBadge'
import { BookingTimeline } from '../components/bookings/BookingTimeline'
import { Button } from '../components/ui/Button'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function rentalDays(start: string, end: string) {
  const a = new Date(start)
  const b = new Date(end)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

export function BookingDetailPage() {
  const { id } = useParams()
  const bookingId = Number(id)
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId),
    enabled: Number.isFinite(bookingId),
  })

  const { data: messages } = useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => fetchMessages(bookingId),
    enabled: Number.isFinite(bookingId),
  })

  const actionMut = useMutation({
    mutationFn: (action: string) => bookingAction(bookingId, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', bookingId] }),
  })

  const payMut = useMutation({
    mutationFn: () => payBooking(bookingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', bookingId] }),
  })

  const reviewMut = useMutation({
    mutationFn: () => postReview(bookingId, { rating: Number(rating), comment: comment || undefined }),
    onSuccess: () => {
      setReviewOpen(false)
      setComment('')
      qc.invalidateQueries({ queryKey: ['booking', bookingId] })
    },
  })

  if (!Number.isFinite(bookingId)) return null

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-mist">{t('bookingDetailNotFound')}</p>
      </div>
    )
  }

  const status = booking.effective_status || booking.status
  const days = rentalDays(booking.start_date, booking.end_date)
  const rate = booking.listing ? Number(booking.listing.price_per_day) : 0
  const asOwner = user?.id !== booking.renter_id
  const canCancel = !asOwner && ['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(booking.status)
  const customerNote = (messages ?? []).find((m) => !m.is_system && m.sender_id === booking.renter_id)
  const coverImage = booking.listing?.images?.[0]

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sage transition hover:text-mint"
      >
        <ArrowLeft size={16} />
        {t('bookingDetailBack')}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-4xl text-cream">{t('bookingDetailTitle')}</h1>
        <BookingStatusBadge status={status} />
      </div>

      <BookingTimeline status={status} />

      <section className="mt-6 rounded-2xl border border-line bg-panel/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-sage">
          {t('bookingDetailListing')}
        </p>
        <div className="mt-3 flex gap-3">
          <img
            src={coverImage ? mediaUrl(coverImage.url) : '/placeholder-decor.svg'}
            alt=""
            className="h-20 w-24 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0">
            <Link
              to={`/items/${booking.listing_id}`}
              className="font-medium text-cream hover:text-mint"
            >
              {booking.listing?.title ?? `${t('bookingLabel')} #${booking.id}`}
            </Link>
            {booking.listing ? (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-mist">
                <MapPin size={13} /> {booking.listing.city}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {asOwner && booking.renter ? (
        <section className="mt-4 rounded-2xl border border-line bg-panel/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sage">
            {t('bookingDetailCustomer')}
          </p>
          <p className="mt-3 text-cream">{booking.renter.full_name}</p>
          <p className="mt-1 text-sm text-mist">{booking.renter.email}</p>
          {booking.renter.phone ? (
            <p className="mt-1 text-sm text-mist">
              {t('bookingRenterPhone')}: {booking.renter.phone}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-4 rounded-2xl border border-line bg-panel/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-sage">
          {t('bookingDetailPeriod')}
        </p>
        <p className="mt-3 text-cream">
          {booking.start_date} → {booking.end_date}
        </p>

        <div className="mt-4 rounded-xl border border-line bg-panel-2/70 px-3 py-3 text-sm">
          <div className="flex justify-between text-mist">
            <span>
              {days} {days === 1 ? t('detailDay') : t('detailDays')}
              {rate ? ` × ${rate.toFixed(0)} ₾` : ''}
            </span>
            <span className="text-cream">{Number(booking.total_price).toFixed(2)} ₾</span>
          </div>
          <div className="mt-1 flex justify-between text-mist">
            <span>{t('detailDeposit')}</span>
            <span className="text-cream">{Number(booking.deposit).toFixed(2)} ₾</span>
          </div>
          <div className="mt-1 flex justify-between text-mist">
            <span>{t('detailPlatformFee')}</span>
            <span className="text-cream">0.00 ₾ ({t('detailDemoFee')})</span>
          </div>
        </div>
      </section>

      {customerNote ? (
        <section className="mt-4 rounded-2xl border border-line bg-panel/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sage">
            {t('bookingDetailComment')}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-mist">{customerNote.body}</p>
        </section>
      ) : null}

      {canCancel ? <p className="mt-3 text-xs text-mist">{t('bookingCancelHint')}</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {asOwner && booking.status === 'PENDING' ? (
          <>
            <Button onClick={() => actionMut.mutate('accept')} loading={actionMut.isPending}>
              {t('actionAccept')}
            </Button>
            <Button variant="danger" onClick={() => actionMut.mutate('decline')}>
              {t('actionDecline')}
            </Button>
          </>
        ) : null}
        {!asOwner && booking.status === 'ACCEPTED' ? (
          <Button onClick={() => payMut.mutate()} loading={payMut.isPending}>
            {t('actionDemoPay')}
          </Button>
        ) : null}
        {canCancel ? (
          <Button variant="secondary" onClick={() => actionMut.mutate('cancel')}>
            {t('actionCancel')}
          </Button>
        ) : null}
        {status === 'ACTIVE' || status === 'CONFIRMED' ? (
          <Button variant="secondary" onClick={() => actionMut.mutate('complete')}>
            {t('actionComplete')}
          </Button>
        ) : null}
        {status === 'COMPLETED' && !asOwner ? (
          <Button variant="secondary" onClick={() => setReviewOpen((v) => !v)}>
            {t('actionLeaveReview')}
          </Button>
        ) : null}
        <Link to={`/dashboard/messages?booking=${booking.id}`}>
          <Button variant="ghost">{t('messagesTitle')}</Button>
        </Link>
      </div>

      {reviewOpen ? (
        <div className="mt-4 rounded-xl border border-line bg-panel-2 p-4">
          <Field label={t('reviewRating')}>
            <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(e.target.value)} />
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
}
