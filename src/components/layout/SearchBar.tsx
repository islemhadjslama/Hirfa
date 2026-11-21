import { SearchIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  id: string
  className?: string
}

/**
 * Barre de recherche du header (CAT-3) : redirige vers `/catalogue?q=…`.
 * Tant que l'utilisateur n'a rien tapé, le champ reflète le `q` de l'URL.
 */
export function SearchBar({ id, className }: SearchBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const urlQuery = location.pathname === '/catalogue' ? (searchParams.get('q') ?? '') : ''
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? urlQuery

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = value.trim()
    // Nouvelle recherche : on garde les autres filtres du catalogue, on revient en page 1
    const params = new URLSearchParams(location.pathname === '/catalogue' ? searchParams : '')
    params.delete('page')
    if (q) params.set('q', q)
    else params.delete('q')
    const query = params.toString()
    navigate(`/catalogue${query ? `?${query}` : ''}`)
    setDraft(null)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        Rechercher un produit
      </label>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== null && draft.trim() === urlQuery) setDraft(null)
        }}
        placeholder="Rechercher un produit artisanal…"
        className="h-10 rounded-full bg-card pl-9"
      />
    </form>
  )
}
