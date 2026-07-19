import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, MapPin } from 'lucide-react'
import { fetchAvailability, fetchListing } from '../api/listings'
import { createBooking } from '../api/bookings'
import { toggleFavorite } from '../api/favorites'
import { mediaUrl, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ReviewsSection } from '../components/reviews/ReviewsSection'
import { StarRating } from '../components/reviews/StarRating'
import { Button } from '../components/ui/Button'
import { Field, Select, Textarea } from '../components/ui/Input'
import { DatePicker } from '../components/ui/DatePicker'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'
import { categoryLabel, conditionLabel } from '../i18n/translations'
import { cityLabel, cityValueForSubmit, GEORGIAN_CITIES } from '../lib/georgianCities'

function daysBetween(start: string, end: string) {
  const a = new Date(start)
  const b = new Date(end)
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

function eachDay(start: string, end: string): string[] {
  const out: string[] = []
  const cur = new Date(start + 'T00:00:00')
  const last = new Date(end + 'T00:00:00')
  while (cur < last) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function ListingDetailPage() {
  const { id } = useParams()
  const listingId = Number(id)
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [rentCity, setRentCity] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [imgBroken, setImgBroken] = useState(false)
  const thumbScrollerRef = useRef<HTMLDivElement>(null)

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => fetchListing(listingId),
    enabled: Number.isFinite(listingId),
  })

  useEffect(() => {
    if (!listing?.city || rentCity) return
    const match = GEORGIAN_CITIES.find(
      (c) =>
        c.en.toLowerCase() === listing.city.toLowerCase() || c.ka === listing.city,
    )
    setRentCity(match ? cityLabel(lang, match) : listing.city)
  }, [listing?.city, lang, rentCity])

  const { data: blocks } = useQuery({
    queryKey: ['availability', listingId],
    queryFn: () => fetchAvailability(listingId),
    enabled: Number.isFinite(listingId),
  })

  const blockedSet = useMemo(
    () => new Set((blocks ?? []).map((b) => b.date)),
    [blocks],
  )

  const dateConflict = useMemo(() => {
    if (!start || !end) return false
    if (end <= start) return true
    return eachDay(start, end).some((d) => blockedSet.has(d))
  }, [start, end, blockedSet])

  const today = new Date().toISOString().slice(0, 10)

  const favMutation = useMutation({
    mutationFn: () => toggleFavorite(listingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing', listingId] }),
  })

  const bookMutation = useMutation({
    mutationFn: (payload: {
      listing_id: number
      start_date: string
      end_date: string
      message?: string
    }) => createBooking(payload),
    onSuccess: () => navigate('/dashboard/bookings'),
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : t('detailBookingError'))
    },
  })

  function requestBooking() {
    setError('')
    if (!rentCity) {
      setError(t('detailLocationRequired'))
      return
    }
    if (!start || !end) {
      setError(t('detailDatesRequired'))
      return
    }
    if (end <= start) {
      setError(t('detailDatesInvalid'))
      return
    }
    if (start < today) {
      setError(t('detailDatesPast'))
      return
    }
    if (dateConflict) {
      setError(t('detailDatesBlocked'))
      return
    }
    const cityForMessage = cityValueForSubmit(rentCity) || rentCity.trim()
    const locationLine = `${t('detailRentLocation')}: ${cityForMessage}`
    const fullMessage = message.trim()
      ? `${locationLine}\n\n${message.trim()}`
      : locationLine
    bookMutation.mutate({
      listing_id: listingId,
      start_date: start,
      end_date: end,
      message: fullMessage,
    })
  }

  if (isLoading || !listing) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 w-full rounded-3xl sm:h-96 lg:h-[28rem]" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    )
  }

  const days = start && end && end > start ? daysBetween(start, end) : 0
  const total = days * Number(listing.price_per_day)
  const images = listing.images
  const timesRented = listing.times_rented ?? 0
  const ownerRating = listing.owner?.avg_rating
  const ownerReviewCount = listing.owner?.review_count ?? 0

  function goToImg(next: number) {
    if (!images.length) return
    setActiveImg((next + images.length) % images.length)
    setImgBroken(false)
  }

  function scrollThumbs(dir: number) {
    thumbScrollerRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-3xl border border-line bg-panel sm:h-96 lg:h-[28rem]">
          {images[activeImg] && !imgBroken ? (
            <img
              src={mediaUrl(images[activeImg].url)}
              alt={listing.title}
              onError={() => setImgBroken(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            <img src="/placeholder-decor.svg" alt="" className="h-full w-full object-contain" />
          )}
          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label={t('detailPrevPhoto')}
                onClick={() => goToImg(activeImg - 1)}
                className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel/80 text-cream backdrop-blur transition hover:bg-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label={t('detailNextPhoto')}
                onClick={() => goToImg(activeImg + 1)}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel/80 text-cream backdrop-blur transition hover:bg-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                <ChevronRight size={18} />
              </button>
              <span className="absolute bottom-3 right-3 rounded-full bg-panel/80 px-2.5 py-1 text-xs text-cream backdrop-blur">
                {activeImg + 1} / {images.length}
              </span>
            </>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="relative mt-3">
            <button
              type="button"
              aria-label={t('detailPrevPhoto')}
              onClick={() => scrollThumbs(-1)}
              className="absolute -left-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel text-cream shadow transition hover:bg-panel-2"
            >
              <ChevronLeft size={16} />
            </button>
            <div ref={thumbScrollerRef} className="flex gap-2 overflow-x-auto scroll-smooth px-1">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`${listing.title} ${i + 1}`}
                  aria-pressed={i === activeImg}
                  onClick={() => {
                    setActiveImg(i)
                    setImgBroken(false)
                  }}
                  className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border ${
                    i === activeImg ? 'border-sage' : 'border-line'
                  }`}
                >
                  <img
                    src={mediaUrl(img.url)}
                    alt=""
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/placeholder-decor.svg'
                    }}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label={t('detailNextPhoto')}
              onClick={() => scrollThumbs(1)}
              className="absolute -right-3 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-panel text-cream shadow transition hover:bg-panel-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}

        <div className="mt-8">
          <p className="text-sm uppercase tracking-wide text-sage">
            {categoryLabel(lang, listing.category)}
          </p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="font-display text-4xl text-cream">{listing.title}</h1>
            {user ? (
              <button
                type="button"
                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-panel/70 text-mist transition hover:border-sage/50 hover:text-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
                aria-label={listing.is_favorited ? t('savedFavorite') : t('saveFavorite')}
                aria-pressed={!!listing.is_favorited}
                disabled={favMutation.isPending}
                onClick={() => favMutation.mutate()}
              >
                <Heart
                  size={18}
                  className={listing.is_favorited ? 'fill-sage text-sage' : ''}
                />
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-mist">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {listing.city}
            </span>
            <span>
              {t('conditionLabel')}: {conditionLabel(lang, listing.condition)}
            </span>
            {timesRented > 0 ? (
              <span>
                {timesRented}{' '}
                {timesRented === 1 ? t('detailTimesRentedOne') : t('detailTimesRented')}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {listing.avg_rating ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1.5 text-sm">
                <span className="text-mist">{t('detailItemRating')}</span>
                <StarRating value={listing.avg_rating} showValue />
                <span className="text-mist">({listing.review_count})</span>
              </div>
            ) : null}
            {ownerRating ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1.5 text-sm">
                <span className="text-mist">{t('detailLenderRating')}</span>
                <StarRating value={ownerRating} showValue />
                <span className="text-mist">({ownerReviewCount})</span>
              </div>
            ) : null}
          </div>
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-mist">{listing.description}</p>
          {listing.owner ? (
            <p className="mt-6 text-sm text-mist">
              {t('detailListedBy')} <span className="text-cream">{listing.owner.full_name}</span>
            </p>
          ) : null}

          <ReviewsSection
            listingId={listing.id}
            avgRating={listing.avg_rating}
            reviewCount={listing.review_count}
          />
        </div>
      </div>

      <aside className="h-fit rounded-3xl border border-line bg-panel/70 p-6 lg:sticky lg:top-24">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line pb-4">
          <p className="font-display text-3xl text-cream">
            {Number(listing.price_per_day).toFixed(0)} ₾
            <span className="text-base font-sans text-mist"> / {t('detailPerDay')}</span>
          </p>
          <p className="text-sm text-mist">
            {t('detailDeposit')} {Number(listing.deposit).toFixed(0)} ₾
          </p>
        </div>

        <div className="mt-5">
          <Field label={t('detailRentLocation')}>
            <Select
              value={rentCity}
              onChange={(e) => {
                setRentCity(e.target.value)
                setError('')
              }}
            >
              <option value="">{t('registerCityPlaceholder')}</option>
              {GEORGIAN_CITIES.map((c) => (
                <option key={c.en} value={cityLabel(lang, c)}>
                  {cityLabel(lang, c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('detailStartDate')}>
            <DatePicker
              value={start}
              min={today}
              disabledDates={blockedSet}
              onChange={(v) => {
                setStart(v)
                setError('')
              }}
            />
          </Field>
          <Field label={t('detailEndDate')}>
            <DatePicker
              value={end}
              min={start || today}
              disabledDates={blockedSet}
              onChange={(v) => {
                setEnd(v)
                setError('')
              }}
            />
          </Field>
          <Field label={t('detailMessageOwner')}>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
        </div>

        {days > 0 ? (
          <div className="mb-4 rounded-xl border border-line bg-panel-2 px-3 py-3 text-sm">
            <div className="flex justify-between text-mist">
              <span>
                {days} {days > 1 ? t('detailDays') : t('detailDay')} ×{' '}
                {Number(listing.price_per_day).toFixed(0)} ₾
              </span>
              <span className="text-cream">{total.toFixed(2)} ₾</span>
            </div>
            <div className="mt-1 flex justify-between text-mist">
              <span>{t('detailDeposit')}</span>
              <span className="text-cream">{Number(listing.deposit).toFixed(2)} ₾</span>
            </div>
            <div className="mt-1 flex justify-between text-mist">
              <span>{t('detailPlatformFee')}</span>
              <span className="text-cream">0.00 ₾ ({t('detailDemoFee')})</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold text-cream">
              <span>{t('detailDueNow')}</span>
              <span>{(total + Number(listing.deposit)).toFixed(2)} ₾</span>
            </div>
          </div>
        ) : null}

        {dateConflict && start && end ? (
          <p className="mb-3 text-sm text-red-300" role="alert">
            {t('detailDatesBlocked')}
          </p>
        ) : null}
        {error ? (
          <p className="mb-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        {user ? (
          <Button
            className="w-full"
            disabled={
              !rentCity ||
              !start ||
              !end ||
              dateConflict ||
              bookMutation.isPending ||
              user.id === listing.owner_id
            }
            loading={bookMutation.isPending}
            onClick={requestBooking}
          >
            {user.id === listing.owner_id ? t('yourListing') : t('requestRent')}
          </Button>
        ) : (
          <Link to="/login" state={{ from: `/items/${listing.id}` }}>
            <Button className="w-full">{t('loginToRequest')}</Button>
          </Link>
        )}
      </aside>
    </div>
  )
}
