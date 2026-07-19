import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import type { TranslationKey } from '../../i18n/translations'

type FooterLink = { key: TranslationKey; to: string }

const columns: { heading: TranslationKey; links: FooterLink[] }[] = [
  {
    heading: 'footerExplore',
    links: [
      { key: 'footerBrowse', to: '/browse' },
      { key: 'navMap', to: '/map' },
      { key: 'footerHow', to: '/#how-it-works' },
      { key: 'footerFaq', to: '/faq' },
    ],
  },
  {
    heading: 'footerCompany',
    links: [
      { key: 'footerAbout', to: '/#about' },
      { key: 'footerListItem', to: '/listings/new' },
      { key: 'footerLegal', to: '/terms' },
    ],
  },
]

export function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-16 w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16 lg:px-8 lg:py-14">
        <div className="max-w-sm shrink-0 lg:max-w-xs">
          <Link to="/" className="inline-flex items-center gap-2.5 text-cream">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-2xl tracking-tight">{t('brand')}</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-mist">{t('footerTagline')}</p>
          <a href="mailto:support@rentora.demo" className="site-footer-chip mt-5">
            <Mail size={15} />
            <span>{t('footerEmail')}</span>
          </a>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 sm:gap-12 lg:max-w-md lg:justify-items-start">
          {columns.map((col) => (
            <nav key={col.heading} aria-label={t(col.heading)}>
              <p className="text-xs font-semibold uppercase tracking-wider text-cream">
                {t(col.heading)}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.key}>
                    <Link to={link.to} className="site-footer-link">
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="site-footer-bar">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-mist sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {t('brand')}. {t('footerRights')}
          </p>
          <p>{t('footerTaglineShort')}</p>
        </div>
      </div>
    </footer>
  )
}
