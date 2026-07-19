import type { HTMLAttributes } from 'react'

type Tone = 'neutral' | 'sage' | 'gold' | 'danger'

const tones: Record<Tone, string> = {
  neutral: 'bg-panel-2 text-mist border-line',
  sage: 'bg-forest/30 text-mint border-sage/30',
  gold: 'bg-gold/15 text-gold border-gold/30',
  danger: 'bg-red-900/30 text-red-200 border-red-800/40',
}

export function Badge({
  tone = 'neutral',
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
