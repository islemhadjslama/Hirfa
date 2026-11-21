import { SearchIcon } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useUpdateParams } from '@/features/catalog/useUpdateParams'

/** Recherche texte (paramètre `q`), appliquée à la validation. */
export function AdminSearch({ value, placeholder }: { value: string; placeholder: string }) {
  const update = useUpdateParams()
  const [draft, setDraft] = useState(value)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    update({ q: draft.trim() || null })
  }

  return (
    <form role="search" onSubmit={submit} className="relative min-w-56 flex-1">
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id="admin-search"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="h-10 pl-9"
      />
    </form>
  )
}

/** Liste déroulante de filtre liée à un paramètre d'URL. */
export function AdminFilter({
  id,
  label,
  param,
  value,
  allLabel,
  options,
}: {
  id: string
  label: string
  param: string
  value: string
  allLabel: string
  options: { value: string; label: string }[]
}) {
  const update = useUpdateParams()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <NativeSelect
        id={id}
        className="w-full sm:w-52"
        value={value}
        onChange={(event) => update({ [param]: event.target.value })}
      >
        <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}

/** Rangée de filtres au-dessus des tableaux. */
export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  )
}
