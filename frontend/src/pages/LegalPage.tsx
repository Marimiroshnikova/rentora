import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

const termRules: TranslationKey[] = [
  'termsPoint1',
  'termsPoint2',
  'termsPoint3',
  'termsPoint4',
]

const privacyRules: TranslationKey[] = ['privacyPoint1', 'privacyPoint2', 'privacyPoint3']

function RuleList({ title, rules }: { title: string; rules: TranslationKey[] }) {
  const { t } = useLanguage()

  return (
    <section>
      <h2 className="font-display text-2xl text-cream md:text-3xl">{title}</h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel/50">
        {rules.map((key) => (
          <li key={key} className="flex items-start gap-4 px-6 py-5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" aria-hidden />
            <p className="flex-1 leading-relaxed text-mist">{t(key)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function TermsPrivacyPage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-sage">{t('brand')}</p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-cream md:text-5xl">
          {t('footerLegal')}
        </h1>
        <p className="mt-3 max-w-xl text-mist">{t('legalLead')}</p>
      </header>

      <div className="mt-10 space-y-10">
        <RuleList title={t('termsTitle')} rules={termRules} />
        <RuleList title={t('privacyTitle')} rules={privacyRules} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6 text-sm text-mist">
        <span>{t('legalMore')}</span>
        <Link to="/faq" className="font-semibold text-sage hover:text-mint">
          {t('faqTitle')}
        </Link>
        <a href="mailto:support@rentora.demo" className="font-semibold text-sage hover:text-mint">
          {t('footerEmail')}
        </a>
      </div>
    </div>
  )
}

export function LegalPage({
  titleKey,
  bodyKey,
}: {
  titleKey: TranslationKey
  bodyKey: TranslationKey
}) {
  const { t } = useLanguage()

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-display text-4xl text-cream md:text-5xl">{t(titleKey)}</h1>
      <p className="mt-4 leading-relaxed text-mist">{t(bodyKey)}</p>
    </div>
  )
}
