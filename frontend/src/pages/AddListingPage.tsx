import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing, setAvailability, uploadListingImages } from '../api/listings'
import { ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AvailabilityCalendar } from '../components/ui/AvailabilityCalendar'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Input'
import { PhotoPicker } from '../components/ui/PhotoPicker'
import { useLanguage } from '../context/LanguageContext'
import { categoryLabel, conditionLabel } from '../i18n/translations'
import { CATEGORIES, type Category, type Condition } from '../types'

export function AddListingPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const { lang, t } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('BALLOONS')
  const [price, setPrice] = useState('40')
  const [deposit, setDeposit] = useState('20')
  const [city, setCity] = useState('Tbilisi')
  const [condition, setCondition] = useState<Condition>('GOOD')
  const [imageUrl, setImageUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  function onPriceChange(v: string) {
    setPrice(v)
    if (Number(v) > 0 && Number(deposit) > Number(v)) setDeposit(v)
  }

  function onDepositChange(v: string) {
    const p = Number(price)
    setDeposit(p > 0 && Number(v) > p ? price : v)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const urls = imageUrl.trim() ? [imageUrl.trim()] : []
      const listing = await createListing({
        title,
        description,
        category,
        price_per_day: Number(price),
        deposit: Number(deposit),
        city,
        condition,
        status: 'ACTIVE',
        image_urls: urls,
      })
      if (files.length > 0) {
        await uploadListingImages(listing.id, files)
      }
      if (blockedDates.length > 0) {
        await setAvailability(listing.id, blockedDates)
      }
      await refresh()
      navigate(`/items/${listing.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('addListingError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-4xl text-cream">{t('addListingTitle')}</h1>
      <p className="mt-2 text-mist">{t('addListingLead')}</p>
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
              onChange={(e) => onPriceChange(e.target.value)}
              required
            />
          </Field>
          <Field label={t('addDeposit')} hint={t('addDepositHint')}>
            <Input
              type="number"
              min="0"
              max={price || undefined}
              step="0.01"
              value={deposit}
              onChange={(e) => onDepositChange(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('registerCity')}>
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </Field>
        <Field label={t('addImageUrl')}>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/…"
          />
        </Field>
        <Field label={t('addUploadPhotos')} hint={files.length > 1 ? t('photoOrderHint') : undefined}>
          <PhotoPicker files={files} onChange={setFiles} />
        </Field>
        <Field label={t('availabilityLabel')} hint={t('availabilityHint')}>
          <AvailabilityCalendar value={blockedDates} onChange={setBlockedDates} min={today} />
        </Field>
        {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? t('addListingPublishing') : t('addListingPublish')}
        </Button>
      </form>
    </div>
  )
}
