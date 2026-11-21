import { Navigate, Outlet, useSearchParams } from 'react-router'

import { PageLoader } from '@/components/common/PageLoader'
import { postLoginPath } from '@/features/auth/redirects'
import { useProfile } from '@/hooks/useProfile'

/**
 * Pages réservées aux visiteurs (connexion, inscription…). Un utilisateur
 * connecté est redirigé vers son espace : c'est aussi ce qui effectue la
 * redirection juste après une connexion ou une inscription réussie (AUTH-3).
 */
export function GuestOnlyRoute() {
  const [searchParams] = useSearchParams()
  const { profile, isLoading } = useProfile()

  if (isLoading) return <PageLoader />

  if (profile?.is_active) {
    return <Navigate to={postLoginPath(profile, searchParams.get('redirect'))} replace />
  }

  return <Outlet />
}
