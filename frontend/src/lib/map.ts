import L from 'leaflet'
import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Camera,
  Flower2,
  Frame,
  Lightbulb,
  Package,
  PartyPopper,
  Sparkles,
  Utensils,
} from 'lucide-react'
import type { Category } from '../types'

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  BALLOONS: PartyPopper,
  BACKDROPS: Frame,
  TABLEWARE: Utensils,
  LIGHTING: Lightbulb,
  PROPS: Sparkles,
  FLORAL: Flower2,
  KIDS: Baby,
  PHOTOSHOOT: Camera,
  OTHER: Package,
}

/** Approximate bounding box for Georgia (country). */
export const GEORGIA_BOUNDS = L.latLngBounds(
  L.latLng(41.05, 39.95),
  L.latLng(43.55, 46.75),
)

export const GEORGIA_CENTER: [number, number] = [42.0, 43.5]
export const GEORGIA_DEFAULT_ZOOM = 8
export const GEORGIA_MIN_ZOOM = 7

export const STREET_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

export const SATELLITE_TILE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri - Source: Esri, Maxar, Earthstar Geographics',
}

export const CATEGORY_PIN_COLORS: Record<Category, string> = {
  BALLOONS: '#e86a8a',
  BACKDROPS: '#6b8cff',
  TABLEWARE: '#d4b483',
  LIGHTING: '#f0c14b',
  PROPS: '#c084fc',
  FLORAL: '#5ecf8a',
  KIDS: '#ff8a5b',
  PHOTOSHOOT: '#4ecdc4',
  OTHER: '#8fbc9a',
}

export function categoryPinColor(category: Category): string {
  return CATEGORY_PIN_COLORS[category] ?? CATEGORY_PIN_COLORS.OTHER
}

function pinSvg(fill: string, className = ''): string {
  return `<svg class="rentora-pin-svg ${className}" viewBox="0 0 28 40" width="28" height="40" aria-hidden="true" focusable="false">
  <path d="M14 1.5C7.1 1.5 1.5 7.1 1.5 14c0 9.2 10.4 22.4 12.1 24.5a.7.7 0 0 0 1.1 0C16.4 36.4 26.5 23.2 26.5 14 26.5 7.1 20.9 1.5 14 1.5z" fill="${fill}" stroke="rgba(12,18,16,0.28)" stroke-width="1"/>
  <circle cx="14" cy="14" r="4.4" fill="#fff" fill-opacity="0.95"/>
</svg>`
}

export function categoryMarkerIcon(category: Category): L.DivIcon {
  const color = categoryPinColor(category)
  return L.divIcon({
    className: 'rentora-pin',
    html: pinSvg(color),
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

export function userMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'rentora-pin',
    html: pinSvg('#3d6b4f', 'rentora-pin-user'),
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  })
}

/** Clamp a point into Georgia bounds for map centering. */
export function clampToGeorgia(lat: number, lng: number): [number, number] {
  const sw = GEORGIA_BOUNDS.getSouthWest()
  const ne = GEORGIA_BOUNDS.getNorthEast()
  return [
    Math.min(ne.lat, Math.max(sw.lat, lat)),
    Math.min(ne.lng, Math.max(sw.lng, lng)),
  ]
}
