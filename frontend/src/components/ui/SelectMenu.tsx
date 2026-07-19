import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

type Option = { value: string; label: string }

export function SelectMenu({
  value,
  options,
  onChange,
  icon,
  ariaLabel,
}: {
  value: string
  options: Option[]
  onChange: (value: string) => void
  icon?: ReactNode
  ariaLabel?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-panel-2/60 px-4 py-2 text-sm text-cream transition hover:border-sage/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
      >
        {icon ? <span className="text-sage">{icon}</span> : null}
        <span className="font-medium">{current?.label}</span>
        <ChevronDown
          size={16}
          className={`text-mist transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 z-[1200] mt-2 min-w-[13rem] overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-[0_20px_44px_-20px_rgba(0,0,0,0.6)]"
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-forest/40 font-medium text-mint' : 'text-cream hover:bg-panel-2'
                  }`}
                >
                  <span>{opt.label}</span>
                  {active ? <Check size={16} className="shrink-0" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
