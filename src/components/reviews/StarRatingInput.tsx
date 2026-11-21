import { StarIcon } from 'lucide-react'
import { useId, useState } from 'react'

import { cn } from '@/lib/utils'

const LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent']

type StarRatingInputProps = {
  value: number
  onChange: (value: number) => void
  invalid?: boolean
  describedBy?: string
}

/**
 * Note de 1 à 5 étoiles : groupe de boutons radio (flèches du clavier, lecteurs
 * d'écran), présenté sous forme d'étoiles.
 */
export function StarRatingInput({ value, onChange, invalid, describedBy }: StarRatingInputProps) {
  const name = useId()
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <fieldset aria-describedby={describedBy} aria-invalid={invalid}>
      <legend className="mb-1.5 text-sm font-medium">Votre note</legend>
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className="cursor-pointer rounded-md p-0.5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
              onMouseEnter={() => setHover(star)}
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
              />
              <StarIcon
                className={cn(
                  'size-7 transition',
                  star <= shown ? 'fill-amber-500 text-amber-500' : 'text-border',
                )}
                aria-hidden="true"
              />
              <span className="sr-only">
                {star} étoile{star > 1 ? 's' : ''} sur 5 ({LABELS[star]})
              </span>
            </label>
          ))}
        </div>
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          {shown ? LABELS[shown] : 'Choisissez une note'}
        </span>
      </div>
    </fieldset>
  )
}
