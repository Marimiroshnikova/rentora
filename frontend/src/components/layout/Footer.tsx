import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Mail, Phone, Send } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'

type FooterLink = { key: TranslationKey; to: string }

const companyLinks: FooterLink[] = [
  { key: 'footerAbout', to: '/#about' },
  { key: 'footerHow', to: '/#how-it-works' },
  { key: 'footerFaq', to: '/faq' },
]

const ownerLinks: FooterLink[] = [
  { key: 'footerListItem', to: '/listings/new' },
  { key: 'footerPricing', to: '/pricing' },
  { key: 'footerOwnerGuide', to: '/faq' },
]

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function onSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="site-footer mt-16 w-full">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr] lg:gap-8 lg:px-8 lg:py-14">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2.5 text-cream">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-2xl tracking-tight">{t('brand')}</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-mist">{t('footerTagline')}</p>
          <div className="mt-5 flex items-center gap-2.5">
            <Link
              to="/"
              aria-label={t('brand')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist transition hover:border-sage/50 hover:text-sage"
            >
              <Globe size={15} />
            </Link>
            <a
              href="mailto:support@rentora.demo"
              aria-label={t('footerEmail')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist transition hover:border-sage/50 hover:text-sage"
            >
              <Mail size={15} />
            </a>
            <a
              href={`tel:${t('footerPhone').replace(/\s+/g, '')}`}
              aria-label={t('footerPhone')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-mist transition hover:border-sage/50 hover:text-sage"
            >
              <Phone size={15} />
            </a>
          </div>
        </div>

        <nav aria-label={t('footerCompany')}>
          <p className="text-xs font-semibold uppercase tracking-wider text-cream">{t('footerCompany')}</p>
          <ul className="mt-4 space-y-2.5">
            {companyLinks.map((link) => (
              <li key={link.key}>
                <Link to={link.to} className="site-footer-link">
                  {t(link.key)}
                </Link>
              </li>
            ))}
            <li>
              <a href="mailto:support@rentora.demo" className="site-footer-link">
                {t('footerContact')}
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label={t('footerForOwners')}>
          <p className="text-xs font-semibold uppercase tracking-wider text-cream">{t('footerForOwners')}</p>
          <ul className="mt-4 space-y-2.5">
            {ownerLinks.map((link) => (
              <li key={link.key}>
                <Link to={link.to} className="site-footer-link">
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cream">
            {t('footerNewsletterTitle')}
          </p>
          <p className="mt-4 text-sm text-mist">{t('footerNewsletterLead')}</p>
          {subscribed ? (
            <p className="mt-3 text-sm text-mint">{t('footerNewsletterThanks')}</p>
          ) : (
            <form onSubmit={onSubscribe} className="mt-3 flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footerNewsletterPlaceholder')}
                className="w-full min-w-0 rounded-xl border border-line bg-panel-2/60 px-3 py-2.5 text-sm text-cream placeholder:text-mist/60 outline-none transition focus:border-sage/70 focus:ring-2 focus:ring-sage/20"
              />
              <button
                type="submit"
                aria-label={t('footerNewsletterSubmit')}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-mint transition hover:bg-sage hover:text-ink"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="site-footer-bar">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-mist sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {t('brand')}. {t('footerRights')}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="site-footer-link">
              {t('footerTerms')}
            </Link>
            <Link to="/privacy" className="site-footer-link">
              {t('footerPrivacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
