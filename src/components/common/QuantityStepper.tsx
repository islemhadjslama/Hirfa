import { MinusIcon, PlusIcon } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type QuantityStepperProps = {
  value: number
  max: number
  onChange: (value: number) => void
  /** Nom du produit, pour des libellés accessibles explicites. */
  label?: string
  size?: 'sm' | 'default'
  disabled?: boolean
}

/** Sélecteur de quantité de 1 à `max` (boutons − / + et saisie directe). */
export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = 'default',
  disabled,
}: QuantityStepperProps) {
  const inputId = useId()
  const suffix = label ? ` de « ${label} »` : ''
  const buttonSize = size === 'sm' ? 'icon-sm' : 'icon'

  return (
    <div className="inline-flex items-center rounded-lg border bg-card">
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        aria-label={`Diminuer la quantité${suffix}`}
      >
        <MinusIcon />
      </Button>
      <label htmlFor={inputId} className="sr-only">
        Quantité{suffix}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Math.trunc(Number(event.target.value))
          if (Number.isFinite(next) && next > 0) onChange(Math.min(max, next))
        }}
        className={cn(
          '[appearance:textfield] bg-transparent text-center font-medium outline-none [&::-webkit-inner-spin-button]:appearance-none',
          size === 'sm' ? 'w-9 text-sm' : 'w-12',
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Augmenter la quantité${suffix}`}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
