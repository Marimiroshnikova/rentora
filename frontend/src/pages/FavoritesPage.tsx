import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { fetchFavorites } from '../api/favorites'
import { ListingCard } from '../components/listings/ListingCard'
import { EmptyState } from '../components/ui/EmptyState'
import { ListingCardSkeleton } from '../components/ui/Skeleton'
import { useLanguage } from '../context/LanguageContext'

export function FavoritesPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['favorites'], queryFn: fetchFavorites })

  return (
    <div>
      <h1 className="font-display text-4xl text-cream">{t('favoritesTitle')}</h1>
      <p className="mt-2 text-mist">{t('favoritesLead')}</p>
      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : null}
      {!isLoading && data?.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
      {!isLoading && !data?.length ? (
        <div className="mt-8">
          <EmptyState
            icon={<Heart size={28} />}
            title={t('favoritesEmpty')}
            description={t('favoritesEmptyHint')}
            actionLabel={t('homeBrowse')}
            onAction={() => navigate('/browse')}
          />
        </div>
      ) : null}
    </div>
  )
}
