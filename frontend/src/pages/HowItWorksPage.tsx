import { useLanguage } from '../context/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

const steps: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'how1Title', body: 'how1Body' },
  { title: 'how2Title', body: 'how2Body' },
  { title: 'how3Title', body: 'how3Body' },
  { title: 'how4Title', body: 'how4Body' },
]

export function HowItWorksPage() {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-cream">{t('howTitle')}</h1>
      <p className="mt-2 text-mist">{t('howLead')}</p>
      <ol className="mt-10 space-y-6">
        {steps.map((step, i) => (
          <li key={step.title} className="rounded-2xl border border-line bg-panel/50 p-5">
            <p className="text-sm uppercase tracking-wide text-sage">
              {t('howStep')} {i + 1}
            </p>
            <h2 className="mt-2 font-display text-2xl text-cream">{t(step.title)}</h2>
            <p className="mt-2 text-mist">{t(step.body)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
