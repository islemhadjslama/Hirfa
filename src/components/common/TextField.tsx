import { useId, type ComponentProps } from 'react'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TextFieldProps = ComponentProps<typeof Input> & {
  label: string
  error?: string
  description?: string
}

/** Champ texte accessible : label, aide, message d'erreur reliés à l'input. */
export function TextField({ label, error, description, id, className, ...props }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn('h-10', className)}
        {...props}
      />
      {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
