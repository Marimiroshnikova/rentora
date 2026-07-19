import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Map as MapIcon, Satellite } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { fetchListings } from '../api/listings'
import { mediaUrl } from '../api/client'
import { Button } from '../components/ui/Button'
import { SelectMenu } from '../components/ui/SelectMenu'
import { useLanguage } from '../context/LanguageContext'
import { categoryLabel, type TranslationKey } from '../i18n/translations'
import {
  CATEGORY_ICONS,
  CATEGORY_PIN_COLORS,
  GEORGIA_BOUNDS,
  GEORGIA_CENTER,
  GEORGIA_DEFAULT_ZOOM,
  GEORGIA_MIN_ZOOM,
  SATELLITE_TILE,
  STREET_TILE,
  categoryMarkerIcon,
  clampToGeorgia,
  userMarkerIcon,
} from '../lib/map'
import { CATEGORIES, type Category } from '../types'

type TileMode = 'street' | 'satellite'

const PRICE_OPTIONS = ['', '30', '50', '100'] as const

function MapViewSync({
  center,
  zoom,
}: {
  center: [number, number]
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
    map.setMaxBounds(GEORGIA_BOUNDS)
    map.setMinZoom(GEORGIA_MIN_ZOOM)
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export function MapPage() {
  const { t, lang } = useLanguage()
  const [params] = useSearchParams()
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [tileMode, setTileMode] = useState<TileMode>('street')
  const [category, setCategory] = useState<Category | ''>('')
  const [maxPrice, setMaxPrice] = useState('')

  const filters = useMemo(
    () => ({
      page_size: 100,
      category: category || undefined,
      max_price: maxPrice || undefined,
      ...(userPos
        ? {
            lat: userPos.lat,
            lng: userPos.lng,
            radius_km: 50,
            sort: 'distance' as const,
          }
        : {}),
    }),
    [userPos, category, maxPrice],
  )

  const categoryOptions = useMemo(
    () => [
      { value: '', label: `${t('browseCategory')}: ${t('browseAll')}` },
      ...CATEGORIES.map((cat) => ({
        value: cat,
        label: t(`mapCat${cat}` as TranslationKey),
      })),
    ],
    [t],
  )

  const priceOptions = useMemo(
    () =>
      PRICE_OPTIONS.map((value) => ({
        value,
        label:
          value === '30'
            ? t('mapPriceUnder30')
            : value === '50'
              ? t('mapPriceUnder50')
              : value === '100'
                ? t('mapPriceUnder100')
                : t('mapPriceAny'),
      })),
    [t],
  )

  const { data, isLoading } = useQuery({
    queryKey: ['listings', 'map', filters],
    queryFn: () => fetchListings(filters),
  })

  function findNearMe() {
    setLocError('')
    if (!navigator.geolocation) {
      setLocError(t('mapLocError'))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocError(t('mapLocError'))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  useEffect(() => {
    if (params.get('near') === '1') findNearMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const items = data?.items ?? []
  const mapCenter: [number, number] = userPos
    ? clampToGeorgia(userPos.lat, userPos.lng)
    : GEORGIA_CENTER
  const zoom = userPos ? 11 : GEORGIA_DEFAULT_ZOOM
  const tile = tileMode === 'street' ? STREET_TILE : SATELLITE_TILE

  function toggleCategory(cat: Category) {
    setCategory((prev) => (prev === cat ? '' : cat))
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-cream">{t('mapTitle')}</h1>
          <p className="mt-1 text-sm text-mist">
            {isLoading
              ? t('browseLoading')
              : userPos
                ? `${data?.total ?? 0} ${t('mapResults')}`
                : `${data?.total ?? 0} ${t('browseItems')}`}
          </p>
        </div>
        <div className="map-toolbar">
          <SelectMenu
            value={category}
            ariaLabel={t('browseCategory')}
            options={categoryOptions}
            onChange={(v) => setCategory((v as Category) || '')}
          />
          <SelectMenu
            value={maxPrice}
            ariaLabel={t('mapMaxPrice')}
            options={priceOptions}
            onChange={setMaxPrice}
          />
          <Button onClick={findNearMe} disabled={locating}>
            {locating ? t('mapLocating') : t('mapNearMe')}
          </Button>
        </div>
      </div>

      {locError ? <p className="mb-3 text-sm text-red-300">{locError}</p> : null}

      <div className="map-shell relative overflow-hidden rounded-2xl border border-line">
        <div className="map-layer-toggle map-layer-toggle-overlay" role="group" aria-label={t('mapTitle')}>
          <button
            type="button"
            className={tileMode === 'street' ? 'active' : ''}
            onClick={() => setTileMode('street')}
            aria-label={t('mapStreet')}
            title={t('mapStreet')}
          >
            <MapIcon size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={tileMode === 'satellite' ? 'active' : ''}
            onClick={() => setTileMode('satellite')}
            aria-label={t('mapSatellite')}
            title={t('mapSatellite')}
          >
            <Satellite size={16} aria-hidden />
          </button>
        </div>
        <MapContainer
          center={GEORGIA_CENTER}
          zoom={GEORGIA_DEFAULT_ZOOM}
          minZoom={GEORGIA_MIN_ZOOM}
          maxBounds={GEORGIA_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className="h-[420px] w-full md:h-[520px]"
        >
          <MapViewSync center={mapCenter} zoom={zoom} />
          <TileLayer key={tileMode} attribution={tile.attribution} url={tile.url} />
          {userPos ? (
            <Marker
              position={clampToGeorgia(userPos.lat, userPos.lng)}
              icon={userMarkerIcon()}
            >
              <Popup>{t('mapYou')}</Popup>
            </Marker>
          ) : null}
          {items
            .filter((item) => item.latitude != null && item.longitude != null)
            .map((item) => (
              <Marker
                key={item.id}
                position={[item.latitude!, item.longitude!]}
                icon={categoryMarkerIcon(item.category)}
              >
                <Popup>
                  <div className="min-w-[160px]">
                    {item.images[0] ? (
                      <img
                        src={mediaUrl(item.images[0].url)}
                        alt=""
                        className="mb-2 h-20 w-full rounded object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = '/placeholder-decor.svg'
                        }}
                      />
                    ) : null}
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-600">
                      {categoryLabel(lang, item.category)} · {item.city}
                      {item.distance_km != null ? ` · ${item.distance_km} ${t('mapKm')}` : ''}
                    </p>
                    <p className="text-sm">
                      {Number(item.price_per_day).toFixed(0)} ₾ / {t('detailPerDay')}
                    </p>
                    <Link to={`/items/${item.id}`} className="text-sm font-semibold text-emerald-700">
                      {t('mapOpen')}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      <div className="map-legend mt-4">
        <p className="map-legend-title">{t('mapLegend')}</p>
        <div className="map-legend-grid">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat]
            const color = CATEGORY_PIN_COLORS[cat]
            const shortKey = `mapCat${cat}` as TranslationKey
            const active = category === cat
            return (
              <button
                key={cat}
                type="button"
                className={`map-legend-chip ${active ? 'is-active' : ''}`}
                style={{ '--pin': color } as CSSProperties}
                onClick={() => toggleCategory(cat)}
                aria-pressed={active}
              >
                <span className="map-legend-pin" aria-hidden>
                  <svg viewBox="0 0 28 40" width="10" height="13">
                    <path
                      d="M14 1.5C7.1 1.5 1.5 7.1 1.5 14c0 9.2 10.4 22.4 12.1 24.5a.7.7 0 0 0 1.1 0C16.4 36.4 26.5 23.2 26.5 14 26.5 7.1 20.9 1.5 14 1.5z"
                      fill="currentColor"
                    />
                    <circle cx="14" cy="14" r="4" fill="#fff" fillOpacity="0.95" />
                  </svg>
                </span>
                <span className="map-legend-icon" aria-hidden>
                  <Icon size={11} />
                </span>
                <span className="map-legend-label">{t(shortKey)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {!isLoading && !items.length ? (
        <p className="mt-4 text-mist">{t('mapEmpty')}</p>
      ) : null}

      {userPos && items.length ? (
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/items/${item.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 hover:border-sage/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-cream">{item.title}</span>
                  <span className="text-sm text-mist">{item.city}</span>
                </span>
                <span className="shrink-0 text-sm text-mist">
                  {item.distance_km != null ? `${item.distance_km} ${t('mapKm')}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
