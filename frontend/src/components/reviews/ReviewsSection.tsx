import { useQuery } from '@tanstack/react-query'
import { fetchListingReviews } from '../../api/listings'
import { useLanguage } from '../../context/LanguageContext'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'
import { StarRating } from './StarRating'

function cleanReviewText(text: string) {
  return text.replace(/\u2014|\u2013/g, '.').replace(/\s+\./g, '.')
}

export function ReviewsSection({
  listingId,
  avgRating,
  reviewCount,
}: {
  listingId: number
  avgRating?: number | null
  reviewCount: number
}) {
  const { t } = useLanguage()
  const { data, isLoading } = useQuery({
    queryKey: ['listing-reviews', listingId],
    queryFn: () => fetchListingReviews(listingId, { page_size: 20 }),
    enabled: Number.isFinite(listingId),
  })

  const items = data?.items ?? []

  return (
    <section className="mt-10 border-t border-line pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-cream">{t('reviewsTitle')}</h2>
          <p className="mt-1 text-sm text-mist">
            {reviewCount > 0
              ? `${reviewCount} ${t('reviewsCount')} · ${t('detailItemRating')}`
              : t('reviewsEmpty')}
          </p>
        </div>
        {avgRating ? <StarRating value={avgRating} size={18} showValue /> : null}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={t('reviewsEmpty')} description={t('reviewsEmptyHint')} />
        </div>
      ) : (
        <div className="review-list">
          {items.map((review) => (
            <article key={review.id} className="review-item">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-cream">
                  {review.author?.full_name || t('reviewsAnonymous')}
                </p>
                <StarRating value={review.rating} size={13} />
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  {cleanReviewText(review.comment)}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-mist/80">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
