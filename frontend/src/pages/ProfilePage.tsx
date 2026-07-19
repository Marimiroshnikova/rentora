import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Camera, MapPin, Package, Pencil, ShieldCheck, Star } from 'lucide-react'
import { fetchUserReviews } from '../api/users'
import { fetchListings } from '../api/listings'
import { ApiError, mediaUrl } from '../api/client'
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
  const { user, updateProfile, uploadAvatar } = useAuth()
  const { t, lang } = useLanguage()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [city, setCity] = useState(user?.city || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [isOwner, setIsOwner] = useState(user?.is_owner || false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name)
    setCity(user.city || '')
    setPhone(user.phone || '')
    setBio(user.bio || '')
    setIsOwner(user.is_owner)
  }, [user])

  const reviews = useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: () => fetchUserReviews(user!.id, { page_size: 20 }),
    enabled: !!user,
  })

  const myListings = useQuery({
    queryKey: ['listings', 'mine', 'count'],
    queryFn: () => fetchListings({ mine: true, page_size: 1 }),
    enabled: !!user?.is_owner,
  })

  if (!user) return null

  const avgRating = reviews.data?.avg_rating ?? null
  const reviewCount = reviews.data?.total ?? 0
  const memberSince = new Date(user.created_at).toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  })

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarUploading(true)
    setAvatarError('')
    try {
      await uploadAvatar(file)
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : t('profileAvatarError'))
    } finally {
      setAvatarUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await updateProfile({
        full_name: fullName,
        city: city || undefined,
        phone: phone || undefined,
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
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label={t('profileAvatarUpload')}
              className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-forest/40 text-2xl font-bold text-mint ring-1 ring-sage/30 transition hover:ring-sage/60 disabled:opacity-60"
            >
              {user.avatar_url ? (
                <img src={mediaUrl(user.avatar_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user.full_name)
              )}
            </button>
            <span className="pointer-events-none absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-line bg-panel-2 text-cream">
              <Camera size={13} />
            </span>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
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
          {avatarError ? <p className="mt-2 text-xs text-red-300">{avatarError}</p> : null}
          </div>
        </div>
        <Button
          variant="secondary"
          type="button"
          onClick={() => setEditOpen((v) => !v)}
          className="shrink-0"
        >
          <Pencil size={16} className="mr-1.5" />
          {t('profileEditTitle')}
        </Button>
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

      {user.is_owner ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-cream">{t('profileMyListingsTitle')}</h2>
              <p className="mt-1 text-sm text-mist">{t('profileMyListingsLead')}</p>
            </div>
            <Link to="/dashboard/listings">
              <Button variant="secondary" type="button">
                <Package size={16} className="mr-1.5" />
                {t('profileMyListingsLink')}
                {myListings.data?.total ? ` (${myListings.data.total})` : ''}
              </Button>
            </Link>
          </div>
        </section>
      ) : null}

      {editOpen ? (
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
            <Field label={t('profilePhone')} hint={t('profilePhoneHint')}>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+995 5XX XX XX XX"
              />
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
              <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
                {t('profileEditClose')}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

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
