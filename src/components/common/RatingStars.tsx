import { StarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const ratingFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

type RatingStarsProps = {
  rating: number
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

/** Note sur 5 (étoiles pleines arrondies à la demi-étoile près) + nombre d'avis. */
export function RatingStars({ rating, count, size = 'sm', className }: RatingStarsProps) {
  const rounded = Math.round(rating * 2) / 2
  const label =
    count === 0
      ? 'Aucun avis'
      : `Note : ${ratingFormatter.format(rating)} sur 5${count !== undefined ? `, ${count} avis` : ''}`

  return (
    <span className={cn('inline-flex items-center gap-1', className)} role="img" aria-label={label}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="relative">
            <StarIcon className={cn('text-border', size === 'sm' ? 'size-3.5' : 'size-5')} />
            {rounded >= star - 0.5 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: rounded >= star ? '100%' : '50%' }}
              >
                <StarIcon
                  className={cn(
                    'fill-amber-500 text-amber-500',
                    size === 'sm' ? 'size-3.5' : 'size-5',
                  )}
                />
              </span>
            )}
          </span>
        ))}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground" aria-hidden="true">
          {count === 0 ? 'Aucun avis' : `${ratingFormatter.format(rating)} (${count})`}
        </span>
      )}
    </span>
  )
}
