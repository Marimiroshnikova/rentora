import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Package, ShieldCheck, Star } from 'lucide-react'
import { fetchUserReviews } from '../api/users'
import { ApiError } from '../api/client'
import { StarRating } from '../components/reviews/StarRating'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { t, lang } = useLanguage()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [city, setCity] = useState(user?.city || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [isOwner, setIsOwner] = useState(user?.is_owner || false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name)
    setCity(user.city || '')
    setBio(user.bio || '')
    setIsOwner(user.is_owner)
  }, [user])

  const reviews = useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: () => fetchUserReviews(user!.id, { page_size: 20 }),
    enabled: !!user,
  })

  if (!user) return null

  const avgRating = reviews.data?.avg_rating ?? null
  const reviewCount = reviews.data?.total ?? 0
  const memberSince = new Date(user.created_at).toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await updateProfile({
        full_name: fullName,
        city: city || undefined,
        bio: bio || undefined,
        is_owner: isOwner,
      })
      setMessage(t('profileUpdated'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('profileUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-forest/40 text-2xl font-bold text-mint ring-1 ring-sage/30">
          {initials(user.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-wide text-sage">{t('profileTitle')}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight text-cream">{user.full_name}</h1>
          <p className="mt-1 truncate text-mist">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {user.city ? (
              <span className="inline-flex items-center gap-1 text-sm text-mist">
                <MapPin size={14} className="text-sage" />
                {user.city}
              </span>
            ) : null}
            {user.role === 'ADMIN' ? <Badge tone="gold">{t('profileRoleAdmin')}</Badge> : null}
            {user.is_owner ? <Badge tone="sage">{t('profileRoleOwner')}</Badge> : (
              <Badge>{t('profileRoleRenter')}</Badge>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {avgRating ? (
              <StarRating value={avgRating} size={16} showValue />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-mist">
                <Star size={14} className="text-gold opacity-50" />
                {t('profileNoRating')}
              </span>
            )}
            <span className="text-sm text-mist">
              {reviewCount} {t('reviewsCount')}
            </span>
            <span className="text-sm text-mist">
              {t('profileMemberSince')} {memberSince}
            </span>
          </div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-panel/40 px-3 py-4 text-center">
          <p className="font-display text-2xl text-cream">
            {avgRating ? avgRating.toFixed(1) : '-'}
          </p>
          <p className="mt-1 text-xs text-mist">{t('profileRating')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel/40 px-3 py-4 text-center">
          <p className="font-display text-2xl text-cream">{reviewCount}</p>
          <p className="mt-1 text-xs text-mist">{t('profileReviews')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-panel/40 px-3 py-4 text-center">
          <p className="font-display text-2xl text-cream">
            {user.is_owner ? <Package size={22} className="mx-auto text-sage" /> : <ShieldCheck size={22} className="mx-auto text-sage" />}
          </p>
          <p className="mt-1 text-xs text-mist">
            {user.is_owner ? t('profileRoleOwner') : t('profileRoleRenter')}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-cream">{t('profileEditTitle')}</h2>
        <p className="mt-1 text-sm text-mist">{t('profileEditLead')}</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-1 rounded-2xl border border-line bg-panel/50 p-5 md:p-6">
          <Field label={t('registerName')}>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label={t('registerCity')}>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label={t('profileBio')}>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          </Field>
          <label className="mb-4 flex items-start gap-2.5 text-sm text-mist">
            <input
              type="checkbox"
              checked={isOwner}
              onChange={(e) => setIsOwner(e.target.checked)}
              className="mt-0.5 accent-sage"
            />
            <span>{t('profileOwner')}</span>
          </label>
          {message ? <p className="mb-3 text-sm text-mint">{message}</p> : null}
          {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading} loading={loading}>
              {t('save')}
            </Button>
            {isOwner ? (
              <Link to="/listings/new">
                <Button variant="secondary" type="button">
                  {t('profileAddListing')}
                </Button>
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-cream">{t('profileReputation')}</h2>
            <p className="mt-1 text-sm text-mist">{t('profileReputationLead')}</p>
          </div>
          {avgRating ? <StarRating value={avgRating} size={18} showValue /> : null}
        </div>

        {reviews.isLoading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : reviewCount === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={t('reviewsEmpty')}
              description={t('profileNoRatingHint')}
              icon={<Star size={28} />}
            />
          </div>
        ) : (
          <div className="review-list mt-4">
            {(reviews.data?.items ?? []).map((review) => (
              <article key={review.id} className="review-item">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-cream">
                    {review.author?.full_name || t('reviewsAnonymous')}
                  </p>
                  <StarRating value={review.rating} size={13} />
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-mist">{review.comment}</p>
                ) : null}
                <p className="mt-2 text-xs text-mist/80">
                  {new Date(review.created_at).toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-GB')}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
