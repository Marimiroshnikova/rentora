import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
  'data-field'?: string
  disabledDates?: Set<string>
}

export function toISO(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseISO(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export const WEEKDAYS = {
  ka: ['ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა', 'კვ'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
}

export const MONTHS = {
  ka: [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
}

export function DatePicker({
  value,
  onChange,
  min,
  placeholder,
  'data-field': dataField,
  disabledDates,
}: DatePickerProps) {
  const { lang } = useLanguage()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => parseISO(value), [value])
  const minDate = useMemo(() => parseISO(min || ''), [min])
  const [view, setView] = useState(() => selected || new Date())

  useEffect(() => {
    if (selected) setView(selected)
  }, [selected])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

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

  function disabled(d: Date) {
    if (minDate && startOfDay(d) < startOfDay(minDate)) return true
    return disabledDates?.has(toISO(d)) ?? false
  }

  const label = selected
    ? selected.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : placeholder || (lang === 'ka' ? 'აირჩიე თარიღი' : 'Pick a date')

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-field={dataField}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl border border-line bg-panel-2/60 px-3 py-2.5 text-left text-sm transition hover:border-sage/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
      >
        <Calendar size={16} className="shrink-0 text-sage" />
        <span className={selected ? 'text-cream' : 'text-mist'}>{label}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          className="absolute left-0 z-30 mt-2 w-[17.5rem] rounded-2xl border border-line bg-panel p-3 shadow-[0_20px_44px_-20px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
              }
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
              onClick={() =>
                setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
              }
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
            {cells.map((d, i) =>
              d ? (
                <button
                  key={i}
                  type="button"
                  disabled={disabled(d)}
                  onClick={() => {
                    onChange(toISO(d))
                    setOpen(false)
                  }}
                  className={`h-9 rounded-lg text-sm transition ${
                    selected && toISO(d) === toISO(selected)
                      ? 'bg-forest font-semibold text-mint'
                      : 'text-cream hover:bg-panel-2'
                  } disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent`}
                >
                  {d.getDate()}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>

          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-sage transition hover:bg-panel-2 hover:text-mint"
            >
              {lang === 'ka' ? 'გასუფთავება' : 'Clear'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
