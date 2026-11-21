import { useQuery } from '@tanstack/react-query'

import { profileQueryOptions } from '@/features/auth/api'
import { useAuth } from '@/hooks/useAuth'

/**
 * Profil (et boutique, pour un artisan) de l'utilisateur connecté.
 * `isLoading` couvre aussi la restauration initiale de la session.
 */
export function useProfile() {
  const { user, initialized } = useAuth()
  const query = useQuery(profileQueryOptions(user?.id))

  return {
    profile: user ? (query.data ?? null) : null,
    isLoading: !initialized || (Boolean(user) && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  }
}
