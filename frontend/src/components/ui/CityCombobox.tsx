import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { cityLabel, filterCities, GEORGIAN_CITIES } from '../../lib/georgianCities'
import { Input } from '../ui/Input'

type CityComboboxProps = {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  placeholder?: string
  'data-field'?: string
}

export function CityCombobox({
  value,
  onChange,
  invalid,
  placeholder,
  'data-field': dataField,
}: CityComboboxProps) {
  const { lang, t } = useLanguage()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const exactMatch = GEORGIAN_CITIES.some(
    (city) => cityLabel(lang, city).toLowerCase() === query.trim().toLowerCase(),
  )
  const matches = filterCities(exactMatch ? '' : query, lang)

  return (
    <div ref={rootRef} className="city-combobox">
      <Input
        data-field={dataField}
        value={query}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        invalid={invalid}
        placeholder={placeholder ?? t('registerCityPlaceholder')}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && matches.length > 0 ? (
        <ul id={listId} className="city-combobox-list" role="listbox">
          {matches.map((city) => {
            const label = cityLabel(lang, city)
            return (
              <li key={city.en}>
                <button
                  type="button"
                  role="option"
                  className="city-combobox-option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery(label)
                    onChange(label)
                    setOpen(false)
                  }}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
