import { Navigate, Outlet, useLocation } from 'react-router'

import { ErrorState } from '@/components/common/ErrorState'
import { PageLoader } from '@/components/common/PageLoader'
import { homePathFor } from '@/features/auth/redirects'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import type { UserRole } from '@/lib/labels'

type RequireRoleProps = {
  roles: UserRole[]
  /** Artisan : exige en plus une boutique approuvée (sinon → /artisan/en-attente). */
  requireApproved?: boolean
}

/**
 * Garde de routes (AUTH-7). Confort d'UI uniquement : la sécurité réelle est
 * assurée par la RLS côté base.
 */
export function RequireRole({ roles, requireApproved = false }: RequireRoleProps) {
  const location = useLocation()
  const { session } = useAuth()
  const { profile, isLoading, isError, refetch } = useProfile()

  if (isLoading) return <PageLoader />

  if (!session) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />
  }

  if (isError || !profile) return <ErrorState onRetry={() => void refetch()} />

  // Compte désactivé : AccountStatusWatcher se charge de la déconnexion.
  if (!profile.is_active) return <PageLoader />

  if (!roles.includes(profile.role)) return <Navigate to={homePathFor(profile)} replace />

  if (requireApproved && profile.artisan_profiles?.status !== 'approved') {
    return <Navigate to="/artisan/en-attente" replace />
  }

  return <Outlet />
}
