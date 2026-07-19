import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

const faqs: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'faq1Q', a: 'faq1A' },
  { q: 'faq2Q', a: 'faq2A' },
  { q: 'faq3Q', a: 'faq3A' },
  { q: 'faq4Q', a: 'faq4A' },
  { q: 'faq5Q', a: 'faq5A' },
]

export function FaqPage() {
  const { t } = useLanguage()
  const [open, setOpen] = useState<string | null>('faq1Q')

  return (
    <div className="faq-page mx-auto max-w-3xl">
      <header className="faq-page-header">
        <h1 className="font-display text-4xl text-cream md:text-5xl">{t('faqTitle')}</h1>
        <p className="mt-3 max-w-xl text-mist">{t('faqLead')}</p>
      </header>

      <div className="mt-10 space-y-3">
        {faqs.map((item) => {
          const isOpen = open === item.q
          return (
            <div
              key={item.q}
              className={`faq-item ${isOpen ? 'is-open' : ''}`}
            >
              <button
                type="button"
                className="faq-item-trigger"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : item.q)}
              >
                <span>{t(item.q)}</span>
                <ChevronDown
                  size={18}
                  className={`faq-item-chevron ${isOpen ? 'is-open' : ''}`}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <p className="faq-item-answer">{t(item.a)}</p>
              ) : null}
            </div>
          )
        })}
      </div>

      <p className="mt-10 text-sm text-mist">
        {t('faqMore')}{' '}
        <Link to="/#how-it-works" className="font-medium text-sage hover:text-mint">
          {t('footerHow')}
        </Link>
        {' · '}
        <a href="mailto:support@rentora.demo" className="font-medium text-sage hover:text-mint">
          {t('footerEmail')}
        </a>
      </p>
    </div>
  )
}
