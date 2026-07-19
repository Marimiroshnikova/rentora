import { useEffect, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  MessageSquare,
  Package,
  Search,
  Star,
  Wallet,
} from 'lucide-react'
import { fetchListings } from '../api/listings'
import { ListingCard } from '../components/listings/ListingCard'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { type TranslationKey } from '../i18n/translations'

const howSteps: {
  title: TranslationKey
  body: TranslationKey
  icon: typeof Search
}[] = [
  { title: 'how1Title', body: 'how1Body', icon: Search },
  { title: 'how2Title', body: 'how2Body', icon: MessageSquare },
  { title: 'how3Title', body: 'how3Body', icon: CalendarCheck },
  { title: 'how4Title', body: 'how4Body', icon: Wallet },
]

const aboutPoints: {
  title: TranslationKey
  body: TranslationKey
  icon: typeof Search
}[] = [
  { title: 'aboutPoint1Title', body: 'aboutPoint1Body', icon: Search },
  { title: 'aboutPoint2Title', body: 'aboutPoint2Body', icon: Package },
]

const whyPoints: {
  title: TranslationKey
  body: TranslationKey
  icon: typeof Search
  color: string
}[] = [
  { title: 'homeWhy1Title', body: 'homeWhy1Body', icon: Wallet, color: 'text-sage' },
  { title: 'homeWhy2Title', body: 'homeWhy2Body', icon: Package, color: 'text-mint' },
  { title: 'homeWhy3Title', body: 'homeWhy3Body', icon: MapPin, color: 'text-sage' },
  { title: 'homeWhy4Title', body: 'homeWhy4Body', icon: Star, color: 'text-sage' },
]

type PartyTone = 'balloon-a' | 'balloon-b' | 'balloon-c' | 'balloon-d'
type PartyKind = 'bow' | 'gift'

const partyTones: PartyTone[] = ['balloon-a', 'balloon-b', 'balloon-c', 'balloon-d']

const partyStrip = Array.from({ length: 18 }, (_, i) => {
  const kind: PartyKind = i % 3 === 2 ? 'gift' : 'bow'
  return {
    kind,
    tone: partyTones[(i + (kind === 'gift' ? 1 : 0)) % partyTones.length],
    delay: `${(i % 9) * 0.22}s`,
    lift: `${((i % 5) - 2) * 3}px`,
  }
})

function BowIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 36" aria-hidden>
      <path
        d="M24 18 C18 8 8 8 6 16 C4 24 14 26 24 20 C34 26 44 24 42 16 C40 8 30 8 24 18 Z"
        fill="currentColor"
      />
      <circle cx="24" cy="18" r="3.2" fill="currentColor" opacity="0.95" />
      <path
        d="M21 20 Q18 30 15 33 M27 20 Q30 30 33 33"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}

function GiftBoxIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 44" aria-hidden>
      <rect x="6" y="16" width="28" height="22" rx="3" fill="currentColor" opacity="0.88" />
      <rect x="4" y="12" width="32" height="8" rx="2.5" fill="currentColor" />
      <rect x="18" y="12" width="4" height="26" fill="currentColor" opacity="0.55" />
      <path
        d="M20 12 C16 4 10 5 10 9 C10 12 15 13 20 12 C25 13 30 12 30 9 C30 5 24 4 20 12 Z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  )
}

export function HomePage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const location = useLocation()
  const firstName = user?.full_name.trim().split(/\s+/)[0] || ''
  const { data } = useQuery({
    queryKey: ['listings', 'home'],
    queryFn: () => fetchListings({ page_size: 6, sort: 'rating' }),
  })

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div>
      <section className="home-hero relative flex w-full min-h-[78dvh] flex-col overflow-hidden md:min-h-[82dvh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=2400&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/70 to-ink" />
        <div className="relative z-[1] mx-auto flex flex-1 w-full max-w-3xl flex-col items-center justify-center px-4 py-14 text-center md:py-16">
          <h1 className="animate-fade-up font-display text-6xl leading-[0.95] tracking-tight text-cream md:text-7xl">
            {t('brand')}
          </h1>
          <p className="home-hero-lead animate-fade-up animate-delay-1 mx-auto mt-5 max-w-lg text-lg font-medium leading-relaxed text-cream">
            {user
              ? `${t('homeWelcomeBack')}${firstName ? `, ${firstName}` : ''}. ${t('homeLeadLoggedIn')}`
              : t('homeLead')}
          </p>
          <div className="animate-fade-up animate-delay-2 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/browse">
              <Button className="px-6 py-3">
                {t('homeBrowse')} <ArrowRight size={16} />
              </Button>
            </Link>
            {user ? (
              <Link to={user.is_owner ? '/listings/new' : '/dashboard'}>
                <Button variant="secondary" className="px-6 py-3">
                  {user.is_owner ? t('homeStartListing') : t('navDashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="secondary" className="px-6 py-3">
                  {t('homeStartListing')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="home-balloon-band" aria-hidden>
        <div className="home-balloon-strip">
          <div className="home-balloon-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="home-balloon-row">
                {partyStrip.map((item, i) => (
                  <span
                    key={`${copy}-${i}`}
                    className={`home-party-item home-${item.kind} ${item.tone}`}
                    style={
                      {
                        animationDelay: item.delay,
                        '--party-lift': item.lift,
                      } as CSSProperties
                    }
                  >
                    {item.kind === 'gift' ? <GiftBoxIcon /> : <BowIcon />}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-12 md:gap-10 md:px-6 lg:px-8">
      <section id="about" className="scroll-mt-24">
        <div className="home-story-card home-about-card animate-fade-up">
          <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-start md:gap-12">
            <div>
              <h2 className="font-display text-3xl leading-tight text-cream md:text-4xl">
                {t('aboutTitle')}
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-mist">{t('aboutBody')}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/browse" className="about-link">
                  <Search size={16} />
                  {t('aboutSearch')}
                </Link>
                <Link to="/map" className="about-link">
                  <MapPin size={16} />
                  {t('aboutMap')}
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {aboutPoints.map(({ title, body, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-line bg-panel-2/40 p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="how-step-icon">
                      <Icon size={20} />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wide text-sage">
                      {t(title)}
                    </p>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-mist">{t(body)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24">
        <div className="home-story-card animate-fade-up">
          <h2 className="font-display text-3xl text-cream md:text-4xl">{t('howTitle')}</h2>
          <p className="mt-2 max-w-lg text-mist">{t('howLead')}</p>
          <ol className="how-grid mt-8">
            {howSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <li
                  key={step.title}
                  className="how-step"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className="how-step-icon">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-sage">
                      {t('howStep')} {i + 1}
                    </p>
                    <h3 className="mt-1 font-display text-xl text-cream">{t(step.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{t(step.body)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl text-cream">{t('homePopular')}</h2>
          <Link to="/browse" className="shrink-0">
            <Button className="px-4 py-2.5">
              {t('homeViewAll')} <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.items ?? []).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section id="earn" className="scroll-mt-24">
        <div className="home-story-card animate-fade-up flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <div className="how-step-icon shrink-0">
                <Package size={22} />
              </div>
              <h2 className="font-display text-3xl leading-tight text-cream">{t('homeEarnTitle')}</h2>
            </div>
            <p className="mt-3 text-mist leading-relaxed">{t('homeEarnBody')}</p>
          </div>
          <Link
            to={user ? (user.is_owner ? '/listings/new' : '/profile') : '/login'}
            className="shrink-0"
          >
            <Button className="px-6 py-3">
              {user?.is_owner ? t('homeStartListing') : t('homeEarnCta')} <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-cream md:text-4xl">{t('homeWhyTitle')}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyPoints.map(({ title, body, icon: Icon, color }) => (
            <div key={title} className="trust-item">
              <div className="flex items-center gap-3">
                <div className="how-step-icon shrink-0">
                  <Icon className={color} size={20} />
                </div>
                <p className="whitespace-pre-line text-sm font-semibold leading-snug text-cream">
                  {t(title)}
                </p>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-mist">{t(body)}</p>
            </div>
          ))}
        </div>
      </section>

      {!user ? (
        <section className="mb-2">
          <div className="animate-fade-up rounded-3xl border border-sage/25 bg-forest/15 px-6 py-12 text-center md:py-14">
            <h2 className="font-display text-3xl text-cream md:text-4xl">{t('homeCtaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-lg text-mist">{t('homeCtaBody')}</p>
            <Link to="/register" className="mt-6 inline-block">
              <Button className="px-6 py-3">{t('homeCtaRegister')}</Button>
            </Link>
          </div>
        </section>
      ) : null}
      </div>
    </div>
  )
}
