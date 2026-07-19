import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react'
import { mediaUrl } from '../../api/client'
import { useLanguage } from '../../context/LanguageContext'
import type { Listing } from '../../types'

const PLACEHOLDER = '/placeholder-decor.svg'

export function ListingCard({ listing }: { listing: Listing }) {
  const { t } = useLanguage()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [broken, setBroken] = useState<Record<number, boolean>>({})

  const images = useMemo(() => {
    const sorted = [...listing.images].sort((a, b) => a.sort_order - b.sort_order)
    return sorted.length ? sorted : [{ id: 0, url: PLACEHOLDER, sort_order: 0 }]
  }, [listing.images])

  const multi = images.length > 1
  const ownerName = listing.owner?.full_name?.trim() || null
  const ownerRating = listing.owner?.avg_rating ?? listing.avg_rating ?? null

  function goTo(next: number) {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(images.length - 1, next))
    const width = el.clientWidth
    el.scrollTo({ left: clamped * width, behavior: 'smooth' })
    setIndex(clamped)
  }

  function onScroll() {
    const el = scrollerRef.current
    if (!el || !el.clientWidth) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== index) setIndex(next)
  }

  return (
    <Link to={`/items/${listing.id}`} className="listing-card group">
      <div className="listing-card-media">
        <div
          ref={scrollerRef}
          className="listing-card-scroller"
          onScroll={onScroll}
        >
          {images.map((img, i) => (
            <div key={img.id || i} className="listing-card-slide">
              <img
                src={broken[img.id] ? PLACEHOLDER : img.url === PLACEHOLDER ? PLACEHOLDER : mediaUrl(img.url)}
                alt={`${listing.title} ${i + 1}`}
                onError={() => setBroken((prev) => ({ ...prev, [img.id]: true }))}
                className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {multi ? (
          <>
            <button
              type="button"
              className="listing-card-nav listing-card-nav-prev"
              aria-label="Previous photo"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goTo(index - 1)
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="listing-card-nav listing-card-nav-next"
              aria-label="Next photo"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goTo(index + 1)
              }}
            >
              <ChevronRight size={16} />
            </button>
            <div className="listing-card-dots" aria-hidden>
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  type="button"
                  className={`listing-card-dot ${i === index ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    goTo(i)
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="listing-card-body">
        <h3 className="font-display text-[1.05rem] leading-snug text-cream">{listing.title}</h3>

        {ownerName ? (
          <p className="mt-2 flex items-center gap-2 text-sm">
            <span className="truncate font-medium text-cream">{ownerName}</span>
            {ownerRating != null ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-gold">
                <Star size={13} fill="currentColor" />
                {ownerRating.toFixed(1)}
              </span>
            ) : null}
          </p>
        ) : ownerRating != null ? (
          <p className="mt-2 inline-flex items-center gap-1 text-sm text-gold">
            <Star size={13} fill="currentColor" />
            {ownerRating.toFixed(1)}
          </p>
        ) : null}

        <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-mist">
          <MapPin size={13} />
          {listing.city}
          {listing.distance_km != null ? ` · ${listing.distance_km} ${t('mapKm')}` : ''}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-cream">
            <span className="text-base font-semibold">
              {Number(listing.price_per_day).toFixed(0)} ₾
            </span>
            <span className="text-mist"> / {t('detailPerDay')}</span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest/40 px-3 py-1.5 text-xs font-semibold text-mint transition group-hover:bg-forest/60">
            {t('mapOpen')}
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}
