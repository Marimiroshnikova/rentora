export type UserRole = 'USER' | 'ADMIN'
export type Category =
  | 'BALLOONS'
  | 'BACKDROPS'
  | 'TABLEWARE'
  | 'LIGHTING'
  | 'PROPS'
  | 'FLORAL'
  | 'KIDS'
  | 'PHOTOSHOOT'
  | 'OTHER'
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'HIDDEN'
export type Condition = 'NEW' | 'GOOD' | 'FAIR'
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'DECLINED'
  | 'CANCELLED'
export type NotificationType =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_DECLINED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'NEW_MESSAGE'

export interface User {
  id: number
  email: string
  full_name: string
  city?: string | null
  phone?: string | null
  bio?: string | null
  avatar_url?: string | null
  role: UserRole
  is_owner: boolean
  created_at: string
}

export interface ListingImage {
  id: number
  url: string
  sort_order: number
}

export interface Listing {
  id: number
  owner_id: number
  title: string
  description: string
  category: Category
  price_per_day: string
  deposit: string
  city: string
  condition: Condition
  status: ListingStatus
  created_at: string
  images: ListingImage[]
  owner?: {
    id: number
    full_name: string
    city?: string | null
    avatar_url?: string | null
    avg_rating?: number | null
    review_count?: number
  } | null
  latitude?: number | null
  longitude?: number | null
  avg_rating?: number | null
  review_count: number
  times_rented?: number
  is_favorited: boolean
  distance_km?: number | null
}

export interface ListingListResponse {
  items: Listing[]
  total: number
  page: number
  page_size: number
}

export interface Booking {
  id: number
  listing_id: number
  renter_id: number
  start_date: string
  end_date: string
  total_price: string
  deposit: string
  status: BookingStatus
  paid_at?: string | null
  created_at: string
  listing?: {
    id: number
    title: string
    city: string
    category: Category
    price_per_day: string
    images: ListingImage[]
  } | null
  renter?: User | null
  effective_status?: BookingStatus | null
}

export interface Message {
  id: number
  booking_id: number
  sender_id: number
  body: string
  is_system?: boolean
  created_at: string
  sender?: User | null
}

export interface Notification {
  id: number
  user_id: number
  booking_id: number
  type: NotificationType
  is_read: boolean
  created_at: string
  booking?: Booking | null
}

export interface NotificationListResponse {
  items: Notification[]
  total: number
  page: number
  page_size: number
}

export interface Review {
  id: number
  booking_id: number
  author_id: number
  rating: number
  comment?: string | null
  created_at: string
  author?: User | null
}

export interface AdminStats {
  users: number
  listings: number
  active_listings: number
  bookings: number
  bookings_this_month: number
}

export interface AdminBooking {
  id: number
  listing_id: number
  listing_title: string
  listing_city: string
  renter_name: string
  renter_email: string
  owner_name: string
  start_date: string
  end_date: string
  total_price: string
  status: BookingStatus
  created_at: string
}

export interface AvailabilityBlock {
  id: number
  date: string
  reason: 'BOOKED' | 'MANUAL'
}

export const CATEGORIES: Category[] = [
  'BALLOONS',
  'BACKDROPS',
  'TABLEWARE',
  'LIGHTING',
  'PROPS',
  'FLORAL',
  'KIDS',
  'PHOTOSHOOT',
  'OTHER',
]
