import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpDown, ChevronDown, MapPin, PackageSearch, Search, X } from 'lucide-react'
import { fetchListings } from '../api/listings'
import { ListingCard } from '../components/listings/ListingCard'
import { EmptyState } from '../components/ui/EmptyState'
import { ListingCardSkeleton } from '../components/ui/Skeleton'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { DatePicker } from '../components/ui/DatePicker'
import { CityCombobox } from '../components/ui/CityCombobox'
import { SelectMenu } from '../components/ui/SelectMenu'
import { useLanguage } from '../context/LanguageContext'
import { categoryLabel, type TranslationKey } from '../i18n/translations'
import { cityLabel, cityValueForSubmit, GEORGIAN_CITIES } from '../lib/georgianCities'
import { CATEGORIES, type Category } from '../types'

function localizedCityLabel(rawCity: string, lang: 'en' | 'ka') {
  const match = GEORGIAN_CITIES.find(
    (c) => c.en.toLowerCase() === rawCity.toLowerCase() || c.ka === rawCity,
  )
  return match ? cityLabel(lang, match) : rawCity
}

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'distance'

const SORT_OPTIONS: { value: SortKey; label: TranslationKey }[] = [
  { value: 'newest', label: 'browseSortNewest' },
  { value: 'price_asc', label: 'browseSortPriceAsc' },
  { value: 'price_desc', label: 'browseSortPriceDesc' },
  { value: 'rating', label: 'browseSortRating' },
]

const PAGE_SIZE = 12

export function BrowsePage() {
  const { t, lang } = useLanguage()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [city, setCity] = useState(() => localizedCityLabel(params.get('city') || '', lang))
  const category = params.get('category') || ''
  const sort = (params.get('sort') as SortKey) || 'newest'
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [minPrice, setMinPrice] = useState(params.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') || '')
  const [start, setStart] = useState(params.get('start') || '')
  const [end, setEnd] = useState(params.get('end') || '')
  const [moreOpen, setMoreOpen] = useState(
    Boolean(params.get('min_price') || params.get('max_price') || params.get('start') || params.get('end')),
  )

  const filters = useMemo(
    () => ({
      q: params.get('q') || undefined,
      city: params.get('city') || undefined,
      category: (params.get('category') as Category) || undefined,
      min_price: params.get('min_price') || undefined,
      max_price: params.get('max_price') || undefined,
      start: params.get('start') || undefined,
      end: params.get('end') || undefined,
      sort: ((params.get('sort') as SortKey) || 'newest') as SortKey,
      page: Math.max(1, Number(params.get('page') || '1') || 1),
      page_size: PAGE_SIZE,
    }),
    [params],
  )

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => fetchListings(filters),
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    const paramCity = params.get('city')
    if (paramCity) setCity(localizedCityLabel(paramCity, lang))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  function commit(overrides: Record<string, string> = {}, resetPage = true) {
    const next = new URLSearchParams()
    const values = {
      q,
      city: cityValueForSubmit(city) || city,
      category,
      min_price: minPrice,
      max_price: maxPrice,
      start,
      end,
      sort,
      page: String(page),
      ...overrides,
    }
    if (resetPage && !('page' in overrides)) values.page = '1'
    Object.entries(values).forEach(([key, value]) => {
      if (value && !(key === 'sort' && value === 'newest') && !(key === 'page' && value === '1')) {
        next.set(key, value)
      }
    })
    setParams(next)
  }

  function apply(e: React.FormEvent) {
    e.preventDefault()
    commit()
  }

  function pickCategory(value: string) {
    commit({ category: value })
  }

  function clearAll() {
    setQ('')
    setCity('')
    setMinPrice('')
    setMaxPrice('')
    setStart('')
    setEnd('')
    setMoreOpen(false)
    setParams(new URLSearchParams())
  }

  const activeTags: { key: string; label: string }[] = []
  if (filters.q) activeTags.push({ key: 'q', label: filters.q })
  if (filters.city) activeTags.push({ key: 'city', label: localizedCityLabel(filters.city, lang) })
  if (filters.category) {
    activeTags.push({ key: 'category', label: categoryLabel(lang, filters.category) })
  }
  if (filters.min_price) activeTags.push({ key: 'min_price', label: `≥ ${filters.min_price} ₾` })
  if (filters.max_price) activeTags.push({ key: 'max_price', label: `≤ ${filters.max_price} ₾` })
  if (filters.start) activeTags.push({ key: 'start', label: filters.start })
  if (filters.end) activeTags.push({ key: 'end', label: filters.end })
  if (filters.sort && filters.sort !== 'newest') {
    const opt = SORT_OPTIONS.find((o) => o.value === filters.sort)
    if (opt) activeTags.push({ key: 'sort', label: t(opt.label) })
  }

  function removeTag(key: string) {
    if (key === 'q') setQ('')
    if (key === 'city') setCity('')
    if (key === 'min_price') setMinPrice('')
    if (key === 'max_price') setMaxPrice('')
    if (key === 'start') setStart('')
    if (key === 'end') setEnd('')
    const overrides: Record<string, string> = { [key]: '' }
    if (key === 'sort') overrides.sort = 'newest'
    commit(overrides)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl text-cream">{t('browseTitle')}</h1>
        <Link
          to="/map?near=1"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-sage hover:text-mint"
        >
          <MapPin size={15} />
          {t('browseNearMe')}
        </Link>
      </div>

      <form onSubmit={apply} className="search-bar">
        <div className="search-bar-fields search-bar-fields-2">
          <label className="search-field">
            <span>{t('browseSearch')}</span>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('browseSearchPlaceholder')}
            />
          </label>
          <label className="search-field">
            <span>{t('browseCity')}</span>
            <CityCombobox value={city} onChange={setCity} placeholder={t('registerCityPlaceholder')} />
          </label>
        </div>
        <Button type="submit" className="search-submit">
          <Search size={16} />
          {t('browseApply')}
        </Button>
      </form>

      <div className="chip-row">
        <button
          type="button"
          className={`chip ${!category ? 'chip-active' : ''}`}
          onClick={() => pickCategory('')}
        >
          {t('browseAll')}
        </button>
        {CATEGORIES.map((k) => (
          <button
            key={k}
            type="button"
            className={`chip ${category === k ? 'chip-active' : ''}`}
            onClick={() => pickCategory(k)}
          >
            {categoryLabel(lang, k)}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-mist">
          <span>{t('browseSort')}</span>
          <SelectMenu
            value={sort}
            ariaLabel={t('browseSort')}
            icon={<ArrowUpDown size={15} />}
            options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.label) }))}
            onChange={(v) => commit({ sort: v })}
          />
        </div>
        <button
          type="button"
          className="more-filters-btn"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          {t('browseMoreFilters')}
          <ChevronDown size={16} className={`transition ${moreOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {moreOpen ? (
        <div className="more-filters-panel">
          <label className="search-field">
            <span>{t('browseMin')}</span>
            <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          </label>
          <label className="search-field">
            <span>{t('browseMax')}</span>
            <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </label>
          <div className="search-field">
            <span>{t('browseFrom')}</span>
            <DatePicker value={start} onChange={setStart} />
          </div>
          <div className="search-field">
            <span>{t('browseUntil')}</span>
            <DatePicker value={end} onChange={setEnd} min={start} />
          </div>
          <Button type="button" onClick={() => commit()} className="self-end">
            {t('browseApplyFilters')}
          </Button>
        </div>
      ) : null}

      {activeTags.length ? (
        <div className="filter-tags">
          {activeTags.map((tag) => (
            <span key={tag.key} className="filter-tag">
              {tag.label}
              <button type="button" onClick={() => removeTag(tag.key)} aria-label="Remove filter">
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-sage hover:text-mint"
            onClick={clearAll}
          >
            {t('browseClearAll')}
          </button>
        </div>
      ) : null}

      <p className="mt-5 text-sm text-mist">
        {isLoading
          ? t('browseLoading')
          : data
            ? `${data.total} ${t('browseItems')}`
            : ''}
      </p>

      {isLoading ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<PackageSearch size={28} />}
            title={t('browseEmpty')}
            description={t('browseEmptyHint')}
            actionLabel={t('browseClearAll')}
            onAction={clearAll}
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.items ?? []).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {!isLoading && data && data.total > PAGE_SIZE ? (
        <div className="pager">
          <button
            type="button"
            className="pager-btn"
            disabled={page <= 1}
            onClick={() => commit({ page: String(page - 1) }, false)}
          >
            {t('browsePrev')}
          </button>
          <span className="text-sm text-mist">
            {t('browsePageOf')} {page} / {totalPages}
          </span>
          <button
            type="button"
            className="pager-btn"
            disabled={page >= totalPages}
            onClick={() => commit({ page: String(page + 1) }, false)}
          >
            {t('browseNext')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
