import { useId, type ComponentProps } from 'react'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

type TextareaFieldProps = ComponentProps<typeof Textarea> & {
  label: string
  error?: string
  description?: string
}

export function TextareaField({ label, error, description, id, ...props }: TextareaFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
