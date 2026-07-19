import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import {
  deleteListingImage,
  fetchAvailability,
  fetchListing,
  setAvailability,
  updateListing,
  uploadListingImages,
} from '../api/listings'
import { ApiError, mediaUrl } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AvailabilityCalendar } from '../components/ui/AvailabilityCalendar'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'
import { categoryLabel, conditionLabel } from '../i18n/translations'
import { CATEGORIES, type Category, type Condition, type ListingStatus } from '../types'

export function EditListingPage() {
  const { id } = useParams()
  const listingId = Number(id)
  const { user } = useAuth()
  const { lang, t } = useLanguage()
  const qc = useQueryClient()

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => fetchListing(listingId),
    enabled: Number.isFinite(listingId),
  })

  const { data: availability } = useQuery({
    queryKey: ['availability', listingId],
    queryFn: () => fetchAvailability(listingId),
    enabled: Number.isFinite(listingId),
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('BALLOONS')
  const [price, setPrice] = useState('')
  const [deposit, setDeposit] = useState('')
  const [city, setCity] = useState('')
  const [condition, setCondition] = useState<Condition>('GOOD')
  const [listingStatus, setListingStatus] = useState<ListingStatus>('ACTIVE')
  const [files, setFiles] = useState<FileList | null>(null)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!listing) return
    setTitle(listing.title)
    setDescription(listing.description)
    setCategory(listing.category)
    setPrice(String(listing.price_per_day))
    setDeposit(String(listing.deposit))
    setCity(listing.city)
    setCondition(listing.condition)
    setListingStatus(listing.status)
  }, [listing])

  useEffect(() => {
    if (!availability) return
    setBlockedDates(availability.filter((b) => b.reason === 'MANUAL').map((b) => b.date))
  }, [availability])

  const bookedDates = new Set(
    (availability ?? []).filter((b) => b.reason === 'BOOKED').map((b) => b.date),
  )

  const deleteImageMut = useMutation({
    mutationFn: (imageId: number) => deleteListingImage(listingId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing', listingId] }),
  })

  if (!Number.isFinite(listingId)) return null

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    )
  }

  if (!listing) return null

  if (user && listing.owner_id !== user.id && user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-red-300">{t('editListingNotOwner')}</p>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await updateListing(listingId, {
        title,
        description,
        category,
        price_per_day: Number(price),
        deposit: Number(deposit),
        city,
        condition,
        status: listingStatus,
      })
      if (files && files.length > 0) {
        await uploadListingImages(listingId, files)
        setFiles(null)
      }
      await setAvailability(listingId, blockedDates)
      setMessage(t('editListingSuccess'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('editListingError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl text-cream">{t('editListingTitle')}</h1>
      <p className="mt-2 text-mist">{t('editListingLead')}</p>
      <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-line bg-panel/60 p-6">
        <Field label={t('addTitle')}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        </Field>
        <Field label={t('addDescription')}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
          />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={t('browseCategory')}>
            <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((k) => (
                <option key={k} value={k}>
                  {categoryLabel(lang, k)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('conditionLabel')}>
            <Select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
              <option value="NEW">{conditionLabel(lang, 'NEW')}</option>
              <option value="GOOD">{conditionLabel(lang, 'GOOD')}</option>
              <option value="FAIR">{conditionLabel(lang, 'FAIR')}</option>
            </Select>
          </Field>
          <Field label={t('addPricePerDay')}>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </Field>
          <Field label={t('addDeposit')}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('registerCity')}>
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </Field>
        <label className="mb-4 flex items-center gap-2.5 text-sm text-mist">
          <input
            type="checkbox"
            checked={listingStatus === 'ACTIVE'}
            onChange={(e) => setListingStatus(e.target.checked ? 'ACTIVE' : 'PAUSED')}
            className="accent-sage"
          />
          <span>{t('listingStatusActive')}</span>
        </label>

        {listing.images.length > 0 ? (
          <Field label={t('editListingCurrentPhotos')}>
            <div className="flex flex-wrap gap-2">
              {listing.images.map((img) => (
                <div key={img.id} className="group relative h-20 w-24 shrink-0">
                  <img
                    src={mediaUrl(img.url)}
                    alt=""
                    className="h-full w-full rounded-xl border border-line object-cover"
                  />
                  <button
                    type="button"
                    disabled={deleteImageMut.isPending}
                    onClick={() => deleteImageMut.mutate(img.id)}
                    title={t('photoRemove')}
                    aria-label={t('photoRemove')}
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-panel/90 text-mist transition hover:text-red-300 disabled:opacity-50"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </Field>
        ) : null}

        <Field label={t('editListingAddPhotos')}>
          <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
        </Field>

        <Field label={t('availabilityLabel')} hint={t('availabilityHint')}>
          <AvailabilityCalendar
            value={blockedDates}
            onChange={setBlockedDates}
            min={today}
            bookedDates={bookedDates}
          />
        </Field>

        {message ? <p className="mb-3 text-sm text-mint">{message}</p> : null}
        {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading} loading={loading}>
            {loading ? t('editListingSaving') : t('save')}
          </Button>
          <Link to={`/items/${listingId}`}>
            <Button variant="ghost" type="button">
              {t('listingView')}
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
