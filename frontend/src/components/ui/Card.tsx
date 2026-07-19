import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

export function Card({ padded = true, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-line bg-panel/70 ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
