import { Star } from 'lucide-react'

export function StarRating({
  value,
  size = 14,
  showValue = false,
}: {
  value: number
  size?: number
  showValue?: boolean
}) {
  const rounded = Math.round(value)
  return (
    <span className="star-row" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= rounded ? 'currentColor' : 'none'}
          className={n <= rounded ? '' : 'opacity-35'}
        />
      ))}
      {showValue ? <span className="ml-1 text-sm text-gold">{value.toFixed(1)}</span> : null}
    </span>
  )
}
