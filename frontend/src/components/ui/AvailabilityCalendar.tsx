import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { MONTHS, WEEKDAYS, parseISO, startOfDay, toISO } from './DatePicker'

type AvailabilityCalendarProps = {
  value: string[]
  onChange: (dates: string[]) => void
  min?: string
  bookedDates?: Set<string>
}

export function AvailabilityCalendar({ value, onChange, min, bookedDates }: AvailabilityCalendarProps) {
  const { lang, t } = useLanguage()
  const minDate = useMemo(() => parseISO(min || ''), [min])
  const [view, setView] = useState(() => minDate || new Date())

  const selectedSet = useMemo(() => new Set(value), [value])
  const weekdays = WEEKDAYS[lang]
  const months = MONTHS[lang]

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
    const out: (Date | null)[] = []
    for (let i = 0; i < offset; i++) out.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(view.getFullYear(), view.getMonth(), d))
    }
    return out
  }, [view])

  function isPast(d: Date) {
    return minDate ? startOfDay(d) < startOfDay(minDate) : false
  }

  function toggle(d: Date) {
    const iso = toISO(d)
    if (bookedDates?.has(iso)) return
    const next = selectedSet.has(iso) ? value.filter((v) => v !== iso) : [...value, iso]
    onChange(next.sort())
  }

  return (
    <div>
      <div className="rounded-2xl border border-line bg-panel-2/60 p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mist transition hover:bg-panel-2 hover:text-cream"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-display text-sm text-cream">
            {months[view.getMonth()]} {view.getFullYear()}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mist transition hover:bg-panel-2 hover:text-cream"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-mist">
          {weekdays.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />
            const iso = toISO(d)
            const booked = bookedDates?.has(iso) ?? false
            const selected = selectedSet.has(iso)
            const disabled = isPast(d) || booked
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => toggle(d)}
                title={booked ? t('availabilityBooked') : undefined}
                className={`h-9 rounded-lg text-sm transition ${
                  selected ? 'bg-forest font-semibold text-mint' : 'text-cream hover:bg-panel-2'
                } disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent`}
              >
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      {value.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {value.map((iso) => (
            <span
              key={iso}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2.5 py-1 text-xs text-mist"
            >
              {iso}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== iso))}
                aria-label={t('availabilityRemove')}
                className="text-mist transition hover:text-cream"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-semibold text-sage transition hover:text-mint"
          >
            {t('availabilityClear')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
