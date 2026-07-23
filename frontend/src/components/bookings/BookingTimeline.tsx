import { useLanguage } from '../../context/LanguageContext'
import type { BookingStatus } from '../../types'
import type { TranslationKey } from '../../i18n/translations'

const STEPS: { status: BookingStatus; label: TranslationKey }[] = [
  { status: 'PENDING', label: 'timelinePending' },
  { status: 'ACCEPTED', label: 'timelineAccepted' },
  { status: 'CONFIRMED', label: 'timelinePaid' },
  { status: 'ACTIVE', label: 'timelineActive' },
  { status: 'COMPLETED', label: 'timelineDone' },
]

const ORDER: BookingStatus[] = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ACTIVE', 'COMPLETED']

function stepIndex(status: BookingStatus): number {
  if (status === 'DECLINED' || status === 'CANCELLED' || status === 'EXPIRED') return -1
  return ORDER.indexOf(status)
}

export function BookingTimeline({ status }: { status: BookingStatus }) {
  const { t } = useLanguage()
  const current = stepIndex(status)
  const failed = status === 'DECLINED' || status === 'CANCELLED' || status === 'EXPIRED'

  if (failed) {
    return (
      <p className="mt-3 text-xs font-semibold text-red-300">
        {status === 'DECLINED'
          ? t('timelineDeclined')
          : status === 'CANCELLED'
            ? t('timelineCancelled')
            : t('timelineExpired')}
      </p>
    )
  }

  return (
    <ol className="mt-3 flex flex-wrap gap-1.5" aria-label={t('timelineLabel')}>
      {STEPS.map((step, i) => {
        const done = current >= i
        const active = current === i
        return (
          <li
            key={step.status}
            className={`rounded-lg border px-2 py-1 text-[11px] font-semibold ${
              active
                ? 'border-sage/50 bg-forest/35 text-mint'
                : done
                  ? 'border-line bg-panel-2 text-cream'
                  : 'border-line/60 text-mist/70'
            }`}
          >
            {t(step.label)}
          </li>
        )
      })}
    </ol>
  )
}
