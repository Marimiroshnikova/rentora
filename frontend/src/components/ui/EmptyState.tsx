import type { ReactNode } from 'react'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel/40 px-6 py-14 text-center">
      {icon ? <div className="mb-4 text-sage">{icon}</div> : null}
      <h3 className="font-display text-xl text-cream">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-mist">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button type="button" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
