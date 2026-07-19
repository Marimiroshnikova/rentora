import { useLanguage } from '../../context/LanguageContext'
import { Button } from '../ui/Button'
import type { Listing } from '../../types'

export function ListingsPanel({
  listings,
  onHide,
  onRestore,
}: {
  listings: Listing[]
  onHide: (id: number) => void
  onRestore: (id: number) => void
}) {
  const { t } = useLanguage()

  if (!listings.length) {
    return <p className="text-mist">{t('adminEmpty')}</p>
  }

  return (
    <div className="space-y-3">
      {listings.map((l) => (
        <div
          key={l.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/50 px-4 py-3"
        >
          <div>
            <p className="text-cream">{l.title}</p>
            <p className="text-sm text-mist">
              {l.city} · {l.owner?.full_name} · {l.status}
            </p>
          </div>
          <div className="flex gap-2">
            {l.status !== 'HIDDEN' ? (
              <Button variant="danger" onClick={() => onHide(l.id)}>
                {t('adminHide')}
              </Button>
            ) : (
              <Button onClick={() => onRestore(l.id)}>{t('adminRestore')}</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
