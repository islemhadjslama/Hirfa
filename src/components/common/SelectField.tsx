import { useId, type ComponentProps } from 'react'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

type SelectFieldProps = ComponentProps<typeof NativeSelect> & {
  label: string
  error?: string
  placeholder?: string
  options: { value: string; label: string }[]
}

/** Liste déroulante native (pratique sur mobile) avec label et erreur. */
export function SelectField({
  label,
  error,
  placeholder,
  options,
  id,
  ...props
}: SelectFieldProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = error ? `${selectId}-error` : undefined

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={selectId}>{label}</FieldLabel>
      <NativeSelect
        id={selectId}
        className="w-full"
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder !== undefined && (
          <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        )}
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}
