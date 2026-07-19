import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

type PhotoPickerProps = {
  files: File[]
  onChange: (files: File[]) => void
}

export function PhotoPicker({ files, onChange }: PhotoPickerProps) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [files])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files ? Array.from(e.target.files) : []
    e.target.value = ''
    if (picked.length) onChange([...files, ...picked])
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  function setMain(index: number) {
    const next = [...files]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {files.map((_, i) => (
          <div
            key={i}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line"
          >
            {previews[i] ? (
              <img src={previews[i]} alt="" className="h-full w-full object-cover" />
            ) : null}
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded-full bg-forest/90 px-1.5 py-0.5 text-[10px] font-semibold text-mint">
                {t('photoMain')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setMain(i)}
                title={t('photoSetMain')}
                aria-label={t('photoSetMain')}
                className="absolute bottom-1 left-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-panel/90 text-mist opacity-0 transition hover:text-sage group-hover:opacity-100"
              >
                <Star size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              title={t('photoRemove')}
              aria-label={t('photoRemove')}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-panel/90 text-mist transition hover:text-red-300"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-mist transition hover:border-sage/50 hover:text-sage"
        >
          <ImagePlus size={18} />
          <span className="text-[11px]">{t('photoAdd')}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
    </div>
  )
}
