import { useSearchParams } from 'react-router'

/** Met à jour des paramètres d'URL (valeur vide = suppression) et revient en page 1. */
export function useUpdateParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  return (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete('page')
    setSearchParams(next)
  }
}
