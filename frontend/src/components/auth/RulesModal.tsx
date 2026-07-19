import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { Button } from '../ui/Button'

export function RulesModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useLanguage()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-header">
          <h2 id="rules-title" className="font-display text-xl text-cream">
            {t('registerRulesTitle')}
          </h2>
          <button type="button" className="auth-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <ul className="auth-modal-rules">
          <li>{t('registerRules1')}</li>
          <li>{t('registerRules2')}</li>
          <li>{t('registerRules3')}</li>
          <li>{t('registerRules4')}</li>
        </ul>
        <Button type="button" className="w-full" onClick={onClose}>
          {t('registerRulesClose')}
        </Button>
      </div>
    </div>
  )
}
