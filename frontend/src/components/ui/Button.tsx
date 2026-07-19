import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const styles: Record<Variant, string> = {
  primary:
    'bg-sage text-ink hover:bg-mint disabled:opacity-50 shadow-[0_0_0_1px_rgba(184,224,194,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50',
  secondary:
    'bg-panel-2 text-cream border border-line hover:border-sage/50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40',
  ghost:
    'bg-transparent text-cream hover:bg-panel-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/30',
  danger:
    'bg-red-900/40 text-red-200 border border-red-800/50 hover:bg-red-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40',
}

export function Button({
  variant = 'primary',
  className = '',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="btn-spinner" aria-hidden /> : null}
      {children}
    </button>
  )
}
